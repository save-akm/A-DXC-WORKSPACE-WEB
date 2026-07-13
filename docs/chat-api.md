# Chat API Reference (User ↔ User)

เอกสารสำหรับ Frontend — **ไม่รวม** AI chat (`POST /api/chat`)

---

## ทั่วไป

| รายการ | ค่า |
|--------|-----|
| **Base URL** | `{API_BASE}` เช่น `http://localhost:3000` |
| **Auth ทุก route** | `Authorization: Bearer <accessToken>` |
| **Content-Type (JSON)** | `application/json` |
| **วันที่ใน response** | แปลงเป็น **UTC+7** แล้ว (ISO string) |
| **Media URL** | path `/media/...` → ต่อ `{API_BASE}` |

### Response wrapper (สำเร็จ)

```json
{
  "status": "OK",
  "message": "Success",
  "data": { },
  "timestamp": "2026-06-30T14:30:00.000+07:00"
}
```

| HTTP | ความหมาย |
|------|----------|
| `200` | อ่าน/แก้ไขสำเร็จ |
| `201` | สร้างสำเร็จ (ข้อความใหม่, ห้องใหม่, upload) |

### Response error (จาก Chat API)

```json
{
  "status": "ERROR",
  "message": "You are not a member of this conversation",
  "code": "FORBIDDEN",
  "timestamp": "2026-06-30T14:30:00.000+07:00"
}
```

| HTTP | code ตัวอย่าง |
|------|----------------|
| 400 | `INVALID_INPUT`, `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_EXHAUSTED` |
| 401 | `{ "error": "Token expired", "code": "TOKEN_EXPIRED" }` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND`, `USER_NOT_FOUND` |

---

## Shared Types

### UserMini

```json
{
  "id": "clxuser001",
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "nickname": "ชาย",
  "email": "somchai@example.com",
  "avatarUrl": "/media/users/avatars/abc.jpg"
}
```

### Conversation

```json
{
  "id": "clxconv001",
  "type": "DIRECT",
  "name": null,
  "avatarUrl": null,
  "description": null,
  "displayName": "สมชาย ใจดี",
  "displayAvatar": "/media/users/avatars/abc.jpg",
  "lastMessageId": "clxmsg001",
  "lastMessagePreview": "สวัสดีครับ",
  "lastMessageAt": "2026-06-30T14:25:00.000+07:00",
  "isArchived": false,
  "unreadCount": 3,
  "members": [
    {
      "id": "clxmem001",
      "userId": "clxuser001",
      "role": "MEMBER",
      "nickname": null,
      "joinedAt": "2026-06-01T09:00:00.000+07:00",
      "user": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null }
    }
  ],
  "myRole": "MEMBER",
  "createdAt": "2026-06-01T09:00:00.000+07:00",
  "updatedAt": "2026-06-30T14:25:00.000+07:00"
}
```

| ฟิลด์ | หมายเหตุ |
|-------|----------|
| `type` | `DIRECT` = 1:1, `GROUP` = กลุ่ม |
| `displayName` / `displayAvatar` | **ใช้ใน UI list** — DIRECT = คู่สนทนา, GROUP = ชื่อ/รูปกลุ่ม |
| `myRole` | `OWNER` \| `ADMIN` \| `MEMBER` \| `null` |
| `unreadCount` | ข้อความจากคนอื่นที่ยังไม่อ่าน |

### Message

```json
{
  "id": "clxmsg001",
  "conversationId": "clxconv001",
  "type": "TEXT",
  "content": "สวัสดีครับ",
  "isEdited": false,
  "editedAt": null,
  "deletedAt": null,
  "isPinned": false,
  "pinnedAt": null,
  "replyToId": null,
  "replyTo": null,
  "sender": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null },
  "mentions": [{ "userId": "...", "user": { } }],
  "attachments": [],
  "reactions": [
    {
      "id": "clxreact001",
      "emoji": "👍",
      "userId": "clxuser002",
      "user": { },
      "createdAt": "2026-06-30T14:25:00.000+07:00"
    }
  ],
  "createdAt": "2026-06-30T14:25:00.000+07:00",
  "updatedAt": "2026-06-30T14:25:00.000+07:00"
}
```

| `type` | ความหมาย |
|--------|----------|
| `TEXT` | ข้อความธรรมดา |
| `IMAGE` | รูป (ต้องมี attachments) |
| `FILE` | ไฟล์ |
| `VOICE` | เสียง |
| `STICKER` | สติกเกอร์ (ใส่ `content`) |
| `SYSTEM` | ข้อความระบบ (join/leave ฯลฯ) |

### Attachment

```json
{
  "id": "clxatt001",
  "fileName": "photo.jpg",
  "fileUrl": "/media/chat/attachments/uuid.jpg",
  "fileType": "image/jpeg",
  "fileSizeBytes": 102400,
  "width": 800,
  "height": 600,
  "duration": null,
  "sortOrder": 0,
  "createdAt": "2026-06-30T14:25:00.000+07:00"
}
```

---

## 1. รายการห้อง (Sidebar)

### `GET /conversations/unread-count`

ดึง **จำนวนข้อความที่ยังไม่อ่านรวมทั้งหมด** สำหรับ badge ที่เมนู Inbox ใน sidebar

**Query**

| Param | Default | ความหมาย |
|-------|---------|----------|
| `includeArchived` | `false` | `true` = รวมห้องที่ archive ด้วย |

**Body:** ไม่มี

**Response `data`:**

```json
{
  "totalUnread": 12
}
```

**Socket realtime:** `chat:unread-total` → `{ totalUnread: 12 }` (ส่งไปที่ room `user:{userId}`)

- อัปเดตเมื่อมีคนส่งข้อความให้เรา (`chat:message` → recalc ฝั่ง server)
- อัปเดตเมื่อเรา mark read (`POST .../read`)

---

### `GET /conversations`

ดึงรายการแชททั้ง 1:1 และกลุ่ม เรียงใหม่สุดก่อน

**Query**

| Param | ค่า | ความหมาย |
|-------|-----|----------|
| `archived` | ไม่ส่ง / `false` | ห้องปกติ (default) |
| `archived` | `true` | เฉพาะที่ archive |
| `archived` | `all` | ทุกห้อง |

**Body:** ไม่มี

**Response `data`:** `Conversation[]`

```json
{
  "status": "OK",
  "message": "Success",
  "data": [{ "id": "clxconv001", "type": "DIRECT", "displayName": "สมชาย ใจดี", "unreadCount": 3 }]
}
```

---

### `GET /conversations/:id`

ดึงรายละเอียดห้องเดียว (เปิดห้องแชท / header)

**Body:** ไม่มี

**Response `data`:** `Conversation`

---

## 2. สร้างห้อง

### `POST /conversations/direct`

เปิดหรือคืนหาแชท 1:1 — ถ้ามีอยู่แล้วจะคืนห้องเดิม

**Body**

```json
{
  "userId": "clxuser_peer_id"
}
```

**Response `201` `data`:** `Conversation`

---

### `POST /conversations/group`

สร้างห้องกลุ่ม — คนสร้างเป็น `OWNER`

**Body**

```json
{
  "name": "ทีม Dev",
  "description": "ห้องประสานงาน",
  "memberIds": ["clxuser002", "clxuser003"]
}
```

| Field | Required |
|-------|----------|
| `name` | ✅ |
| `description` | ❌ |
| `memberIds` | ❌ |

**Response `201` `data`:** `Conversation`

---

## 3. ข้อความ

### `GET /conversations/:id/messages`

โหลดประวัติข้อความ (scroll ขึ้นดูเก่า)

**Query**

| Param | Default | ความหมาย |
|-------|---------|----------|
| `limit` | `50` | จำนวนต่อหน้า (max 100) |
| `before` | — | message id — โหลดข้อความที่ **เก่ากว่า** cursor นี้ |

**Body:** ไม่มี

**Response `data`:**

```json
{
  "messages": [{ "id": "clxmsg001", "type": "TEXT", "content": "สวัสดีครับ" }],
  "nextCursor": "clxmsg_oldest_in_page",
  "hasMore": true,
  "limit": 50
}
```

- ครั้งแรก: `GET /conversations/:id/messages?limit=50`
- โหลดเพิ่ม: `GET /conversations/:id/messages?before={nextCursor}&limit=50`

---

### `POST /conversations/:id/messages`

ส่งข้อความ — broadcast ผ่าน Socket `chat:message`

**Body — ข้อความธรรมดา**

```json
{
  "type": "TEXT",
  "content": "สวัสดี @ทีม",
  "replyToId": "clxmsg_optional",
  "mentionUserIds": ["clxuser002"]
}
```

**Body — รูป/ไฟล์**

```json
{
  "type": "IMAGE",
  "content": "optional caption",
  "attachments": [
    {
      "fileName": "photo.jpg",
      "fileUrl": "/media/chat/attachments/uuid.jpg",
      "fileType": "image/jpeg",
      "fileSizeBytes": 102400,
      "width": 800,
      "height": 600
    }
  ]
}
```

| Field | หมายเหตุ |
|-------|----------|
| `type` | default `TEXT` |
| `content` | TEXT ต้องมี content หรือ attachments |
| `attachments` | `fileUrl` ต้องขึ้นต้น `/media/chat/attachments/` |

**Response `201` `data`:** `Message`

---

### `POST /conversations/:id/uploads`

อัปโหลดไฟล์ก่อนส่งข้อความ

**Body:** `multipart/form-data` — field **`file`**

**Response `201` `data`:**

```json
{
  "fileName": "photo.jpg",
  "fileUrl": "/media/chat/attachments/uuid.jpg",
  "fileType": "image/jpeg",
  "fileSizeBytes": 102400
}
```

---

### `PATCH /messages/:messageId`

แก้ข้อความ — เจ้าของ + `TEXT` เท่านั้น

**Body**

```json
{
  "content": "ข้อความที่แก้แล้ว",
  "mentionUserIds": ["clxuser002"]
}
```

**Response `200` `data`:** `Message` (`isEdited: true`)

**Socket:** `chat:edited`

---

### `DELETE /messages/:messageId`

ลบแบบ soft — เจ้าของลบได้; ใน GROUP admin/owner ลบของคนอื่นได้

**Body:** ไม่มี

**Response `200` `data`:** `Message` (`content: null`, `deletedAt` มีค่า)

**Socket:** `chat:deleted`

---

### `POST /messages/:messageId/reactions`

React ข้อความ — **1 emoji ต่อคนต่อข้อความ** (toggle / เปลี่ยน emoji)

**Body**

```json
{ "emoji": "👍" }
```

**พฤติกรรม**

| สถานะปัจจุบัน | กด emoji | ผลลัพธ์ `action` |
|--------------|----------|------------------|
| ยังไม่ react | 👍 | `added` |
| มี 👍 อยู่ | 👍 | `removed` (toggle off) |
| มี 👍 อยู่ | ❤️ | `changed` (แทนที่เป็น ❤️) |

**Response `200` `data`:**

```json
{
  "action": "added",
  "emoji": "👍",
  "previousEmoji": null,
  "reaction": {
    "id": "clxreact001",
    "emoji": "👍",
    "userId": "clxuser_me",
    "user": { },
    "createdAt": "2026-06-30T14:25:00.000+07:00"
  }
}
```

เมื่อ toggle off:

```json
{
  "action": "removed",
  "emoji": null,
  "previousEmoji": "👍",
  "reaction": null
}
```

**Socket:** `chat:reaction` — `action`: `added` | `removed` | `changed` (+ `previousEmoji` เมื่อ changed/removed)

---

### `DELETE /messages/:messageId/reactions`

ลบ reaction ของตัวเอง (ยกเลิก react)

**Body**

```json
{ "emoji": "👍" }
```

`emoji` ต้องตรงกับ reaction ปัจจุบัน (หรือใช้ `POST .../reactions` กด emoji เดิมเพื่อ toggle แทน)

**Response `200` `data`:**

```json
{
  "action": "removed",
  "emoji": null,
  "previousEmoji": "👍",
  "removed": true
}
```

**Socket:** `chat:reaction` (`action: "removed"`)

---

### `POST /messages/:messageId/pin`

ปักหมุด — GROUP: OWNER/ADMIN; DIRECT: สมาชิกทั้งคู่

**Body:** ไม่มี

**Response `200` `data`:** `Message` (`isPinned: true`)

**Socket:** `chat:pinned`

---

### `DELETE /messages/:messageId/pin`

ยกเลิกปักหมุด

**Body:** ไม่มี

**Response `200` `data`:** `Message` (`isPinned: false`)

---

### `GET /conversations/:id/pinned`

รายการข้อความที่ปักหมุดในห้อง

**Body:** ไม่มี

**Response `data`:** `Message[]`

---

### `POST /conversations/:id/read`

Mark as read — รีเซ็ต `unreadCount`

**Body:** ไม่มี

**Response `data`:**

```json
{
  "conversationId": "clxconv001",
  "lastReadAt": "2026-06-30T14:30:00.000+07:00"
}
```

**Socket:** `chat:read`

---

### `GET /conversations/mentions`

ข้อความที่ @mention ฉัน

**Query:** `limit` (default 50), `before` (mention row id)

**Response `data`:**

```json
{
  "mentions": [
    {
      "id": "clxmention001",
      "mentionCreatedAt": "2026-06-30T14:25:00.000+07:00",
      "conversationId": "clxconv001",
      "message": { }
    }
  ],
  "nextCursor": "clxmention001",
  "hasMore": false
}
```

---

## 4. จัดการห้อง (GROUP)

### `PATCH /conversations/:id`

แก้ชื่อ/คำอธิบาย/avatar URL — OWNER หรือ ADMIN

**Body** (ส่งอย่างน้อย 1 field)

```json
{
  "name": "ทีม Dev (New)",
  "description": "อัปเดตแล้ว",
  "avatarUrl": "/media/chat/groups/xyz.webp"
}
```

**Response `200` `data`:** `Conversation`

**Socket:** `chat:conversation-updated`

---

### `POST /conversations/:id/avatar`

อัปโหลดรูป avatar กลุ่ม

**Body:** `multipart/form-data` — field **`avatar`**

**Response `200` `data`:** `Conversation`

---

### `DELETE /conversations/:id/avatar`

ลบ avatar กลุ่ม

**Body:** ไม่มี

**Response `200` `data`:** `Conversation`

---

### `POST /conversations/:id/members`

เพิ่มสมาชิก — OWNER/ADMIN

**Body**

```json
{ "userId": "clxuser_new" }
```

**Response `201` `data`:** member object

**Socket:** `chat:member` (`action: "added"`)

---

### `DELETE /conversations/:id/members/:userId`

ลบสมาชิก — OWNER/ADMIN; ถ้า `userId` เป็นตัวเอง = leave

**Body:** ไม่มี

**Response `200` `data`:**

```json
{ "conversationId": "clxconv001", "userId": "clxuser002", "removed": true }
```

---

### `PATCH /conversations/:id/members/:userId/role`

เปลี่ยน role — **OWNER เท่านั้น**

**Body**

```json
{ "role": "ADMIN" }
```

ค่า: `ADMIN` | `MEMBER`

**Response `200` `data`:** member object

---

### `POST /conversations/:id/transfer-ownership`

โอน ownership — OWNER เท่านั้น

**Body**

```json
{ "userId": "clxuser_new_owner" }
```

**Response `200` `data`:** `Conversation`

---

### `POST /conversations/:id/leave`

ออกจากกลุ่ม — ไม่ใช่ OWNER

**Body:** ไม่มี

**Response `200` `data`:**

```json
{ "conversationId": "clxconv001", "left": true }
```

**Socket:** `chat:member` (`action: "left"`)

---

### `PATCH /conversations/:id/members/me`

ตั้งค่าส่วนตัวในห้อง

**Body**

```json
{
  "isMuted": true,
  "mutedUntil": "2026-07-01T00:00:00.000Z",
  "nickname": "ชื่อเล่นในกลุ่ม"
}
```

| Field | หมายเหตุ |
|-------|----------|
| `nickname` | GROUP เท่านั้น |
| `mutedUntil` | `null` = ไม่จำกัดเวลา mute |

**Response `200` `data`:**

```json
{
  "id": "clxmem001",
  "conversationId": "clxconv001",
  "userId": "clxuser001",
  "isMuted": true,
  "mutedUntil": "2026-07-01T07:00:00.000+07:00",
  "nickname": "ชื่อเล่นในกลุ่ม"
}
```

---

### `POST /conversations/:id/archive`

Archive ห้อง (ซ่อนจาก list ปกติ)

**Body:** ไม่มี

**Response `200` `data`:**

```json
{ "conversationId": "clxconv001", "archived": true }
```

---

### `POST /conversations/:id/unarchive`

กู้คืนห้องจาก archive

**Body:** ไม่มี

**Response `200` `data`:**

```json
{
  "conversationId": "clxconv001",
  "archived": false,
  "conversation": { }
}
```

---

### `DELETE /conversations/:id`

ลบกลุ่มถาวร — **OWNER เท่านั้น**, GROUP เท่านั้น

**Body:** ไม่มี

**Response `200` `data`:**

```json
{ "conversationId": "clxconv001", "deleted": true }
```

**Socket:** `chat:conversation-deleted` → ทุกสมาชิก

---

## 5. Invite (GROUP)

### `POST /conversations/:id/invites`

สร้างลิงก์เชิญ — OWNER/ADMIN

**Body**

```json
{
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "maxUses": 10
}
```

**Response `201` `data`:**

```json
{
  "id": "clxinvite001",
  "conversationId": "clxconv001",
  "inviteCode": "xK9mP2ab",
  "createdById": "clxuser001",
  "expiresAt": "2026-12-31T23:59:59.000+07:00",
  "maxUses": 10,
  "useCount": 0,
  "isActive": true,
  "createdAt": "2026-06-30T14:25:00.000+07:00"
}
```

Frontend route ตัวอย่าง: `/chat/join/xK9mP2ab`

---

### `GET /conversations/:id/invites`

ดูรายการ invite ของห้อง — OWNER/ADMIN

**Response `data`:** invite array

---

### `DELETE /conversations/invites/:inviteId`

ยกเลิก invite — OWNER/ADMIN

**Response `200` `data`:** invite (`isActive: false`)

---

### `POST /conversations/join/:code`

เข้ากลุ่มด้วย invite code

**Body:** ไม่มี — code อยู่ใน URL

**Response `200` `data`:** `Conversation`

---

## 6. Socket.IO (Realtime)

### Connect

```javascript
import { io } from 'socket.io-client';

const socket = io(API_BASE, {
  path: '/socket.io',
  auth: { token: accessToken },
});
```

หลัง connect ส่ง `online` (ระบบเดิม) แล้วใช้ chat events ด้านล่าง

### Client → Server

| Event | Payload | ใช้ทำอะไร |
|-------|---------|-----------|
| `chat:join` | `{ conversationId: string }` | เข้า room รับข้อความ realtime |
| `chat:leave` | `{ conversationId: string }` | ออก room |
| `chat:typing` | `{ conversationId: string, isTyping?: boolean }` | แจ้งกำลังพิมพ์ |

### Server → Client

| Event | Payload หลัก | เมื่อไหร่ |
|-------|--------------|----------|
| `chat:joined` | `{ conversationId }` | join สำเร็จ |
| `chat:left` | `{ conversationId }` | leave สำเร็จ |
| `chat:error` | `{ code, message }` | join ล้มเหลว |
| `chat:message` | `{ conversationId, message }` | มีข้อความใหม่ |
| `chat:edited` | `{ conversationId, message }` | แก้ข้อความ |
| `chat:deleted` | `{ conversationId, message }` | ลบข้อความ |
| `chat:reaction` | `{ conversationId, messageId, emoji, previousEmoji?, userId, action, reaction }` | react / toggle / เปลี่ยน emoji |
| `chat:pinned` | `{ conversationId, message }` | pin/unpin |
| `chat:read` | `{ conversationId, userId, lastReadAt }` | มีคนอ่านแล้ว |
| `chat:typing` | `{ conversationId, userId, isTyping }` | กำลังพิมพ์ |
| `chat:member` | `{ conversationId, userId, action, member? }` | join/leave/add/remove |
| `chat:conversation-updated` | `{ conversationId, conversation? }` | แก้ข้อมูลกลุ่ม |
| `chat:conversation-deleted` | `{ conversationId }` | กลุ่มถูกลบ |
| `chat:unread-total` | `{ totalUnread: number }` | badge Inbox รวมทุกห้อง |
| `notification:new` | (ระบบ notification) | offline push `CHAT_MESSAGE` |

---

## 7. Flow แนะนำสำหรับ Frontend

```
[เปิดแอป]
  GET /conversations/unread-count  → badge sidebar "12"
  GET /conversations
  Socket connect + emit online
  listen chat:unread-total

[เปิดห้อง]
  chat:join { conversationId }
  GET /conversations/:id/messages?limit=50
  POST /conversations/:id/read

[ส่งข้อความ]
  POST /conversations/:id/messages
  → รับ chat:message จาก socket (ทุกคนในห้อง)

[ส่งรูป]
  POST /conversations/:id/uploads  (multipart file)
  POST /conversations/:id/messages { type: IMAGE, attachments: [...] }

[Sidebar อัปเดต]
  chat:message → อัปเดต lastMessagePreview + ย้ายห้องขึ้นบน
  chat:read → ลด unread badge
  notification:new (type CHAT_MESSAGE) → actionUrl /chat/:conversationId
```

---

## 8. TypeScript Interfaces

```typescript
export interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  message: string;
  data?: T;
  code?: string;
  timestamp: string;
}

export interface ChatUserMini {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface ChatConversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  description: string | null;
  displayName: string | null;
  displayAvatar: string | null;
  lastMessageId: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  isArchived: boolean;
  unreadCount: number;
  members: ChatMember[];
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  nickname: string | null;
  joinedAt: string;
  user: ChatUserMini;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'STICKER' | 'SYSTEM';
  content: string | null;
  isEdited: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  replyToId: string | null;
  replyTo: Pick<ChatMessage, 'id' | 'type' | 'content'> & { sender: ChatUserMini } | null;
  sender: ChatUserMini;
  mentions: { userId: string; user: ChatUserMini }[];
  attachments: ChatAttachment[];
  reactions: ChatReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface ChatReaction {
  id: string;
  emoji: string;
  userId: string;
  user: ChatUserMini;
  createdAt: string;
}

export interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface MentionPage {
  mentions: {
    id: string;
    mentionCreatedAt: string;
    conversationId: string;
    message: ChatMessage;
  }[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ChatAttachmentUpload {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
}

export interface ConversationInvite {
  id: string;
  conversationId: string;
  inviteCode: string;
  createdById: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
}
```

---

## 9. Endpoint Summary

| Method | Path | ใช้ทำอะไร |
|--------|------|-----------|
| GET | `/conversations/unread-count` | badge Inbox รวม unread |
| GET | `/conversations` | รายการห้อง (sidebar) |
| GET | `/conversations/:id` | รายละเอียดห้อง |
| POST | `/conversations/direct` | เปิดแชท 1:1 |
| POST | `/conversations/group` | สร้างกลุ่ม |
| GET | `/conversations/:id/messages` | โหลดข้อความ |
| POST | `/conversations/:id/messages` | ส่งข้อความ |
| POST | `/conversations/:id/uploads` | อัปโหลดไฟล์แนบ |
| POST | `/conversations/:id/read` | mark as read |
| GET | `/conversations/:id/pinned` | ข้อความปักหมุด |
| GET | `/conversations/mentions` | ข้อความที่ mention ฉัน |
| PATCH | `/messages/:messageId` | แก้ข้อความ |
| DELETE | `/messages/:messageId` | ลบข้อความ |
| POST | `/messages/:messageId/reactions` | เพิ่ม reaction |
| DELETE | `/messages/:messageId/reactions` | ลบ reaction |
| POST | `/messages/:messageId/pin` | ปักหมุด |
| DELETE | `/messages/:messageId/pin` | ยกเลิกปักหมุด |
| PATCH | `/conversations/:id` | แก้ข้อมูลกลุ่ม |
| POST | `/conversations/:id/avatar` | อัปโหลด avatar กลุ่ม |
| DELETE | `/conversations/:id/avatar` | ลบ avatar กลุ่ม |
| POST | `/conversations/:id/members` | เพิ่มสมาชิก |
| DELETE | `/conversations/:id/members/:userId` | ลบสมาชิก |
| PATCH | `/conversations/:id/members/:userId/role` | เปลี่ยน role |
| PATCH | `/conversations/:id/members/me` | mute / nickname |
| POST | `/conversations/:id/leave` | ออกจากกลุ่ม |
| POST | `/conversations/:id/archive` | archive |
| POST | `/conversations/:id/unarchive` | unarchive |
| DELETE | `/conversations/:id` | ลบกลุ่ม |
| POST | `/conversations/:id/transfer-ownership` | โอน ownership |
| POST | `/conversations/:id/invites` | สร้าง invite |
| GET | `/conversations/:id/invites` | รายการ invite |
| DELETE | `/conversations/invites/:inviteId` | ยกเลิก invite |
| POST | `/conversations/join/:code` | เข้ากลุ่มด้วย code |
