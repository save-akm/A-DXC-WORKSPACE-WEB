# Notifications — Socket Handoff (Backend)

> สเปกสำหรับทีม **backend (คนละ repo)** เพื่อให้ระบบแจ้งเตือนเรียลไทม์ทำงานกับ frontend ที่ต่อไว้แล้ว
> Frontend ที่เกี่ยวข้อง: `components/socket/SocketProvider.tsx`, `components/management/topbar/notification-bell.tsx`, `app/(management)/notifications/page.tsx`
> วันที่: 2026-06-30

---

## 1. ภาพรวม

- **ไม่มี socket ก็ใช้งานได้** — REST endpoint ทุกตัวคืน `unreadCount` กลับมา แท็บที่กดเองอัปเดตถูกต้องเสมอ
- **socket จำเป็นเมื่อ**:
  1. ให้แจ้งเตือนใหม่ (admin broadcast / system-triggered) เด้งเข้า bell + หน้า inbox แบบเรียลไทม์ โดยไม่ต้อง refresh
  2. ซิงก์สถานะ (อ่าน/ลบ) ข้ามแท็บและอุปกรณ์ของผู้ใช้คนเดียวกัน

Frontend เชื่อมต่อแบบ centralized ครั้งเดียวใน `SocketProvider` (ไม่ได้เชื่อมซ้ำในแต่ละหน้า) แล้วแจกผ่าน hook `useSocketEvent`.

---

## 2. การเชื่อมต่อ + Authentication

Frontend เปิด connection แบบนี้:

```ts
io(API_URL, {
  path: '/socket.io',
  auth: { token: accessToken },   // JWT access token
  transports: ['websocket'],
  autoConnect: false,
})
```

**Backend ต้อง:**

1. รับ socket ที่ path `/socket.io` รองรับ transport `websocket`
2. ตอน handshake อ่าน `socket.handshake.auth.token` → **verify JWT** → ดึง `userId`
3. ถ้า token ไม่ผ่าน → reject connection (frontend จะได้ event `connect_error`)
4. หลัง auth ผ่าน → **join socket เข้าห้อง `user:{userId}`** ทันที

```ts
// ตัวอย่าง (socket.io)
io.use((socket, next) => {
  try {
    const { userId } = verifyAccessToken(socket.handshake.auth.token);
    socket.data.userId = userId;
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.data.userId}`);
});
```

> ⚠️ **อย่าเชื่อ userId ที่ client ส่งมา** — frontend จะ emit event `online` พร้อม profile (รวม `id`) แต่ใช้สำหรับ presence เท่านั้น **การ join ห้องต้องอิงจาก userId ใน JWT ที่ verify แล้ว** ไม่ใช่ค่าจาก payload ของ client

---

## 3. Events ที่ต้อง emit (เข้าห้อง `user:{userId}`)

| Event | Emit เมื่อ | ปลายทาง (room) |
|---|---|---|
| `notification:new` | worker fan-out เสร็จ / `notifyFromTemplate()` ส่งถึงผู้รับ | ห้องของ **ผู้รับแต่ละคน** |
| `notification:updated` | เขียนทับ notification เดิมที่ยังไม่อ่าน (aggregation) | ห้องของ **ผู้รับ** |
| `notification:read` | user กด read / read-all | ห้องของ **ตัว user เอง** |
| `notification:dismissed` | user กด dismiss / dismiss-all | ห้องของ **ตัว user เอง** |

> **`unreadCount`**: `notification:new` และ `notification:updated` **ต้องมี `unreadCount`** เสมอ
> frontend ใช้ค่านี้ตรง ๆ แทนการ `+1` เอง — สำคัญกับ aggregation ที่ badge **ต้องไม่เพิ่ม**

### 3.1 `notification:new`

ส่งทีละผู้รับ หลัง fan-out สร้าง recipient record เสร็จ:

```jsonc
{
  "recipientId":   "recipient_cuid",   // = id ที่ frontend ใช้ mark read/dismiss
  "notificationId":"notif_cuid",
  "userId":        "user_cuid",
  "header":        "งานใหม่: ...",
  "detail":        "รายละเอียด ...",
  "icon":          "Bell",             // ชื่อ lucide หรือ null
  "type":          "WORKFLOW",         // WORKFLOW|SYSTEM|SECURITY|ANNOUNCEMENT|REMINDER|ALERT|CHAT_MESSAGE|KNOWLEDGE_COMMENT|KNOWLEDGE_REACTION
  "priority":      "NORMAL",           // LOW|NORMAL|HIGH|CRITICAL (schema). frontend ยอมรับ URGENT เป็น alias ของ CRITICAL ด้วย
  "sourceType":    "ProjectTask",      // หรือ null
  "sourceId":      "...",              // หรือ null
  "actionUrl":     "/projects/abc",    // หรือ null
  "isRead":        false,
  "createdAt":     "2026-06-30T08:00:00Z"
}
```

```ts
for (const r of recipients) {
  io.to(`user:${r.userId}`).emit('notification:new', {
    recipientId: r.id, notificationId: n.id, userId: r.userId,
    header: n.header, detail: n.detail, icon: n.icon, type: n.type,
    priority: n.priority, sourceType: n.sourceType, sourceId: n.sourceId,
    actionUrl: n.actionUrl, isRead: false, createdAt: r.createdAt,
  });
}
```

### 3.1.1 `notification:updated` — aggregation

Payload shape เหมือน `notification:new` ทุกประการ (บวก `metadata`) ต่างกันที่ **ไม่ใช่รายการใหม่**
frontend จะ patch แถวเดิมด้วย `recipientId` และ **ไม่ขยับ badge / ไม่ขึ้นป้าย "มีใหม่"**

กฎ aggregation ที่ใช้อยู่ (`KNOWLEDGE_REACTION`): **notification ใบเดียวต่อ post ต่อ author**
ตราบใดที่ยัง *ไม่อ่าน + ไม่ dismiss*

| สถานการณ์ | ทำอะไร |
|---|---|
| มี unread notification ของ post นี้อยู่แล้ว | อัปเดต header/detail → emit `notification:updated` |
| อ่าน/dismiss ไปแล้ว | สร้างใหม่ → emit `notification:new` |
| react 3 หรือ 300 คน | ยังเป็นใบเดียว, `unreadCount` ไม่เพิ่ม |

```jsonc
{
  // ...ทุกฟิลด์เหมือน notification:new...
  "header":      "มี 5 คนแสดงความรู้สึกในบทความของคุณ",
  "detail":      "ชื่อบทความ",
  "type":        "KNOWLEDGE_REACTION",
  "unreadCount": 5,
  "metadata": {
    "reactionCount":      5,     // นับจริงจาก DB ไม่รวม reaction ของ author
    "latestReactionType": "LIKE",
    "latestActorUserId":  "user_cuid"
  }
}
```

### 3.2 `notification:read`

หลัง `PATCH /notifications/:id/read` หรือ `PATCH /notifications/read-all`:

```jsonc
{
  "userId":       "user_cuid",
  "recipientIds": ["recipient_id_1", "recipient_id_2"],  // รายการที่เพิ่งถูกอ่าน
  "unreadCount":  4
}
```

```ts
io.to(`user:${userId}`).emit('notification:read', { userId, recipientIds, unreadCount });
```

> ส่งเข้าห้องตัวเองเพื่อให้ **แท็บ/อุปกรณ์อื่น** ของ user ซิงก์ (แท็บที่กดเองอัปเดตจาก REST response อยู่แล้ว แต่ก็รับ event นี้ได้ ไม่เกิดปัญหา)

### 3.3 `notification:dismissed`

หลัง `POST /notifications/dismiss` หรือ `POST /notifications/dismiss-all`:

```jsonc
{ "userId": "user_cuid", "unreadCount": 3 }
```

```ts
io.to(`user:${userId}`).emit('notification:dismissed', { userId, unreadCount });
```

---

## 4. จุดที่ต้องไปแทรกการ emit (checklist)

- [ ] **POST `/admin/notifications`** — หลัง worker กระจายผู้รับเสร็จ → emit `notification:new` ต่อผู้รับแต่ละคน
- [ ] **`notifyFromTemplate()`** (system-triggered) — emit `notification:new` เช่นกัน
- [ ] **PATCH `/notifications/:id/read`** — emit `notification:read` (recipientIds = [id ที่อ่าน])
- [ ] **PATCH `/notifications/read-all`** — emit `notification:read` (recipientIds = ทุกตัวที่เพิ่งถูก mark)
- [ ] **POST `/notifications/dismiss`** — emit `notification:dismissed`
- [ ] **POST `/notifications/dismiss-all`** — emit `notification:dismissed`
- [ ] **connection handler** — verify JWT + `socket.join('user:'+userId)`

---

## 5. หมายเหตุ / ข้อควรระวัง

- **`recipientId` ไม่ใช่ `notificationId`** — frontend ใช้ `recipientId` เป็น key ในทุก mutation (read/dismiss) และเป็น `id` ของแต่ละ item ใน inbox payload `notification:new` ต้องส่ง `recipientId` ให้ถูก ไม่งั้น mark read/dismiss ที่ตามมาจะ target ผิด
- **`unreadCount` เป็น source of truth** — frontend จะ optimistic update แล้ว reconcile ด้วย `unreadCount` ที่ได้จาก REST response และ socket event เสมอ ดังนั้นค่าที่ส่งต้องเป็นยอดจริง ณ ขณะนั้น
- **fan-out แบบ async** — ถ้า worker ใช้เวลา ค่อย emit `notification:new` เมื่อ recipient ถูกสร้างจริง (ไม่ใช่ตอนรับ request) เพื่อให้ payload มี `recipientId` ที่ใช้ได้จริง
- **scope SYSTEM** (ส่งทุก active user) อาจมีผู้รับจำนวนมาก — พิจารณา batch / queue การ emit เพื่อไม่ให้ block
- frontend บังคับ `transports: ['websocket']` — ให้แน่ใจว่า server รองรับ websocket upgrade (อยู่หลัง proxy/load balancer ต้องเปิด upgrade header)
- **priority**: schema ใช้ `CRITICAL` เป็นระดับสูงสุด — frontend รองรับทั้ง `CRITICAL` และ `URGENT` (เป็น alias สีเดียวกัน) ฝั่ง composer จะส่ง `CRITICAL` เป็นค่าหลัก

---

## 6. วิธีทดสอบ (frontend ฝั่งเราพร้อมแล้ว)

1. เปิด 2 แท็บด้วย user เดียวกัน
2. ยิง `POST /admin/notifications` (targetScope SYSTEM หรือ PERSONAL ที่รวม user นี้)
3. คาดหวัง: เลขบน 🔔 ของทั้ง 2 แท็บ +1 ทันที และรายการใหม่เด้งขึ้นหัว list ในหน้า `/notifications` (ผ่าน pill "มีการแจ้งเตือนใหม่")
4. กด "อ่านทั้งหมด" ในแท็บ A → แท็บ B เลข unread ต้องลดตาม (จาก event `notification:read`)
5. กดลบรายการ → ทั้ง 2 แท็บเลขตรงกัน
