# Blog / คลังความรู้ — Backend Handoff

> ## ✅ ส่งมอบครบแล้ว — 3 รอบ (2026-07-08)
> Backend ทำครบ 6 ข้อ (รอบ 1) + 2 ข้อที่เจอตอนต่อของจริง (รอบ 2) + reaction aggregation (รอบ 3)
> Frontend ต่อเรียบร้อย ถอด workaround ออกหมดแล้ว
> เอกสารนี้เก็บไว้เป็น **historical reference** ของ contract — ไม่ต้องส่งซ้ำ
>
> **ข้อควรรู้ที่ยังใช้อยู่:** `POST …/publish` **ยังปฏิเสธ `ARCHIVED`** ตามเดิม
> เส้นทางกู้บทความที่เก็บถาวรคือ **unarchive → แก้ไข → publish ใหม่**

> สเปกสำหรับทีม **backend (คนละ repo)** เพื่อปิดช่องว่าง UX ของฟีเจอร์ `/blog` (knowledge base)
> Frontend ที่เกี่ยวข้อง: `lib/api/blog.ts`, `lib/blog/types.ts`, `app/(management)/blog/**`
> วันที่ร่าง: 2026-07-07 · ส่งมอบรอบ 1 + รอบ 2: 2026-07-08

---

## ภาพรวม

Response envelope ทุก endpoint ใช้รูปแบบเดิม:

```jsonc
{ "status": "OK", "data": <T>, "message"?: "...", "code"?: "..." }
```

| # | หัวข้อ | Priority | สถานะ | frontend ที่ต่อไว้ |
|---|---|---|---|---|
| 1 | `isBookmarked` ใน post payload | P1 | ✅ | `PostBookmarkButton` (prop `initialBookmarked`), ปุ่ม bookmark บน card/row |
| 2 | `GET /knowledge/stats` | P1 | ✅ | `fetchBlogStats()` แทน 3× `limit:1` |
| 3 | Resolve DRAFT ด้วย slug (owner/admin) | P1 | ✅ | `fetchPostResolvable()` เหลือ wrapper บาง ๆ |
| 4 | `readTimeMinutes` รองรับภาษาไทย | P1 | ✅ | ตรงกับสูตร `Intl.Segmenter` ฝั่ง editor |
| 5 | Archive / Unpublish endpoint | P2 | ✅ | `archivePost()` / `unpublishPost()` ใน ActionMenu + overflow หน้าอ่าน |
| 6 | Socket events (comment / reaction) | P2 | ✅ | ใช้ `notification:new` เดิม (payload มี `unreadCount`) |

### รอบ 2 — เจอตอนต่อของจริง

| # | หัวข้อ | Priority | สถานะ | frontend ที่ต่อไว้ |
|---|---|---|---|---|
| 7 | `POST /knowledge/posts/:id/unarchive` | P0 | ✅ | `unarchivePost()` — ปุ่ม "นำกลับมาแก้ไข" ใน ActionMenu + banner หน้าอ่าน |
| 8 | `GET /knowledge/bookmarks` คืน post shape เต็ม | P2 | ✅ | ลบ `bookmarkToPost()` ที่ปั้นข้อมูลปลอมออกจาก `bookmarks/page.tsx` |

**7 — ทำทำไม:** เดิม `ARCHIVED` เป็นสถานะปลายทาง (archive แล้วกู้ไม่ได้ ต้องแก้ DB เอง) ถือเป็นบั๊กข้อมูลหาย
`unarchive` รับเฉพาะ `ARCHIVED` → `DRAFT` (อื่น ๆ ได้ `INVALID_STATUS`), permission = `editPost`, มี audit log + แจ้ง author เมื่อ admin เป็นคนทำ

**8 — ทำทำไม:** `BookmarkPost` เดิมขาด `tags`, `isPinned`, `isFeatured`, `visibility`, `authorId`, `createdAt/updatedAt`, `_count.bookmarks`
ทำให้หน้า `/blog/bookmarks` ต้อง hardcode ค่าปลอม (`visibility: 'INTERNAL'`, `tags: []`) → tag chips และป้าย "ปักหมุด"/"แนะนำ" หายไป
ตอนนี้ใช้ `knowledgePostListSelect` เดียวกับ feed แล้ว `Bookmark.post` จึงเป็น `Post` เต็มรูป (`isBookmarked: true` เสมอ)

### รอบ 3 — reaction aggregation ✅

**9 — Reaction notification aggregation** (เลือกแนวทาง aggregate แทน cooldown เพราะ cooldown ทำให้แจ้งเตือนหายเงียบ ๆ)

`KNOWLEDGE_REACTION` = notification **ใบเดียวต่อ post ต่อ author** ตราบใดที่ยังไม่อ่าน + ไม่ dismiss
มีคน react 3 หรือ 300 คนก็ยังเป็นใบเดียว `unreadCount` ไม่เพิ่ม
รายละเอียด payload + กฎเต็ม → [`notifications-socket-handoff.md` §3.1.1](./notifications-socket-handoff.md)

frontend ที่ต่อไว้:

- เพิ่ม handler `notification:updated` ใน `notification-bell.tsx` และ `notifications/page.tsx` (patch แถวเดิมด้วย `recipientId`, ไม่ขยับ badge, ไม่ขึ้นป้าย "มีใหม่")
- `onNew` เดิม **hardcode `unreadCount + 1`** → เปลี่ยนไปเชื่อ `unreadCount` จาก payload (ไม่งั้น aggregation จะดัน badge ผิด)
- เพิ่ม `KNOWLEDGE_COMMENT` / `KNOWLEDGE_REACTION` เข้า `NotificationType` + สไตล์ (เดิมตกไปแสดงเป็น "ระบบ" เพราะไม่รู้จัก type)
- แยก `COMPOSABLE_NOTIFICATION_TYPES` ออกจาก `NOTIFICATION_TYPES` — admin composer จะได้ไม่เลือก type ที่ระบบสร้างเอง (chat / knowledge)

---

## 1. `isBookmarked` ใน post payload — **P1**

**ปัญหา:** ไม่มีวิธีถามว่า "โพสต์นี้ผู้ใช้ปัจจุบันบันทึกไว้ไหม" — ปุ่ม bookmark ในหน้าอ่าน
(`post-bookmark-button.tsx`) ต้องดึง `/knowledge/bookmarks` มาไล่หาทีละหน้าจนเจอ ทั้งเปลืองและช้า
และเป็นเหตุผลเดียวที่ยัง**เพิ่มปุ่ม bookmark บน card/row ในหน้า feed ไม่ได้** (จะต้อง probe ทุกใบ)

**ขอ:** ใส่ฟิลด์ `isBookmarked: boolean` (คำนวณจาก user ใน JWT) ลงใน `Post` ทั้ง:
- `GET /knowledge/posts` (list — ทุกใบในหน้า)
- `GET /knowledge/posts/slug/:slug` และ `GET /knowledge/posts/:id` (detail)

```jsonc
// Post (เพิ่มฟิลด์)
{
  "id": "...",
  "title": "...",
  // ...ฟิลด์เดิมทั้งหมด...
  "isBookmarked": true        // ← ใหม่ — อิง userId จาก JWT
}
```

> ทางเลือกที่เบากว่า (ถ้าไม่อยากแตะ list): `GET /knowledge/posts/:id/bookmark → { data: { bookmarked: boolean } }`
> แต่แบบใส่ใน payload ดีกว่าเพราะปลดล็อกปุ่ม bookmark บน card ได้ด้วย

---

## 2. Endpoint สถิติรวม — **P1**

**ปัญหา:** หน้า feed แสดง 4 การ์ดสถิติ (ทั้งหมด / เด่น / ของฉัน / แท็ก) — ปัจจุบัน
`page.tsx` ยิง `fetchPosts({ limit: 1 })` **3 ครั้งพร้อมกัน** เพื่อเอาแค่ค่า `total` ของแต่ละชุด

**ขอ:** endpoint เดียวคืนตัวเลขรวม (นับจาก scope/permission ของ user ปัจจุบัน)

```
GET /knowledge/stats
```

```jsonc
{
  "status": "OK",
  "data": {
    "total": 128,       // โพสต์ที่ผู้ใช้เห็นได้ทั้งหมด
    "featured": 6,      // isFeatured = true
    "mine": 14,         // authorId = ผู้ใช้ปัจจุบัน
    "tags": 22          // จำนวนแท็ก active (จะรวมหรือแยกก็ได้)
  }
}
```

> `tags` จะไม่ใส่ก็ได้ — frontend มี `tags.length` จาก `/knowledge/tags` อยู่แล้ว
> ขอแค่ `total` / `featured` / `mine` ใน request เดียวก็ลดจาก 3 → 1 round trip

---

## 3. Resolve DRAFT ด้วย slug (owner/admin) — **P1**

**ปัญหา:** `GET /knowledge/posts/slug/:slug` คืน 404 สำหรับโพสต์ที่ยังเป็น DRAFT
ทำให้เจ้าของ/แอดมินเปิดลิงก์ draft ตรง ๆ ไม่ได้ — `fetchPostResolvable()` ต้อง fallback
ไปไล่ page ทั้ง list (`mine` ก่อน แล้วทั้งหมด) เพื่อจับคู่ slug → id เอง ช้าและมีเพดาน

**ขอ:** ให้ `GET /knowledge/posts/slug/:slug` คืน DRAFT/ARCHIVED ได้ **ถ้า**ผู้ขอเป็น
เจ้าของ (`authorId === userId`) หรือ admin (`blog:UPDATE`) — เหมือน logic ที่ endpoint `/:id` ทำอยู่แล้ว
คนอื่นยังได้ 404 ตามเดิม (กันหลุด)

หลังแก้ frontend จะลบ fallback loop ทิ้งได้ (เหลือแค่ call ตรง)

---

## 4. `readTimeMinutes` รองรับภาษาไทย — **P1**

**ปัญหา:** ภาษาไทยเขียนติดกันไม่มีเว้นวรรค — ถ้า backend นับคำด้วย `split(whitespace)`
บทความไทยยาว ๆ จะได้ค่าใกล้ 1 นาทีเสมอ Frontend (editor) แก้แล้วโดยใช้
`Intl.Segmenter('th', { granularity: 'word' })` **แต่ค่าที่แสดงจริงมาจาก `readTimeMinutes` ของ backend**
ถ้า logic ไม่ตรงกัน ตัวเลขในหน้า preview (คำนวณ client) กับหน้าอ่าน (จาก server) จะไม่ตรง

**ขอ:** คำนวณ `readTimeMinutes` โดยแยกคำแบบรองรับ CJK/Thai เช่น
`Intl.Segmenter` (Node 18+) หรือ ICU word break — แล้วหาร ~200 คำ/นาที (min 1)

```ts
// อ้างอิงสูตรฝั่ง frontend (post-editor.tsx) เพื่อให้ตรงกัน
const seg = new Intl.Segmenter('th', { granularity: 'word' });
let words = 0;
for (const s of seg.segment(plainText)) if (s.isWordLike) words++;
const readTimeMinutes = Math.max(1, Math.round(words / 200));
```

> ควรนับจาก plain text (ตัด markdown/HTML ออกก่อน) เพื่อไม่ให้ syntax ปนเป็นคำ

---

## 5. Archive / Unpublish endpoint — **P2**

**ปัญหา:** enum `PostStatus` มี `ARCHIVED` และ UI มี filter สถานะครบ (ทุกสถานะ / ร่าง / เผยแพร่ / เก็บถาวร)
แต่**ไม่มี action ใดพาโพสต์ไปสถานะ `ARCHIVED` ได้** และ publish เป็นทางเดียว (DRAFT → PUBLISHED)
`UpdatePostInput` ก็ไม่มีฟิลด์ `status` — เก็บถาวร/ยกเลิกเผยแพร่จึงทำไม่ได้เลยจาก frontend

**ขอ:** endpoint เปลี่ยนสถานะ (owner/admin เท่านั้น)

```
POST /knowledge/posts/:id/archive      // → ARCHIVED
POST /knowledge/posts/:id/unpublish    // PUBLISHED → DRAFT (ถอนเผยแพร่)
```

ทั้งคู่คืน `Post` ที่อัปเดตแล้ว (เหมือน `/publish`) frontend จะเพิ่มปุ่มใน ActionMenu + toolbar หน้าอ่าน

> ทางเลือก: อนุญาต `status` ใน `PATCH /knowledge/posts/:id` แทน endpoint แยก
> แต่ endpoint แยกชัดเจนกว่าเรื่องสิทธิ์ + validation (เช่น archive แล้ว publish ไม่ได้)

---

## 6. Socket events (comment / reaction) — **P2**

**ปัญหา:** เมื่อมีคนคอมเมนต์หรือ react โพสต์ของเรา เจ้าของไม่รู้จนกว่าจะเปิดดูเอง
แอปมี Socket.io + `notification-store` อยู่แล้ว (ดู `docs/notifications-socket-handoff.md`)

**ขอ:** เมื่อมี comment/reaction ใหม่ ให้ trigger notification ถึง **เจ้าของโพสต์**
ผ่านกลไก notification เดิม (fan-out เข้า `notification:new` ห้อง `user:{authorId}`) — ไม่ต้องมี channel ใหม่
โดยเว้นกรณีเจ้าของทำเอง (ไม่แจ้งตัวเอง)

| Trigger | ผู้รับ | template payload (แนะนำ) |
|---|---|---|
| comment ใหม่บนโพสต์ | เจ้าของโพสต์ | `{ postSlug, actorName, snippet }` |
| reply บนคอมเมนต์ | เจ้าของคอมเมนต์แม่ | `{ postSlug, actorName, snippet }` |
| reaction ใหม่บนโพสต์ | เจ้าของโพสต์ | `{ postSlug, actorName, reactionType }` (อาจ throttle/รวม) |

> reaction เด้งบ่อย — แนะนำ debounce/รวม (เช่น "มี 5 คน react") หรือทำ P2 ทีหลังก็ได้

---

## หมายเหตุการทำงานร่วมกัน

- ทำได้ทีละข้อ ไม่ต้องรอกันครบ — frontend มี workaround ทุกข้อจึงไม่พังระหว่างรอ
- ข้อ 1–4 คุ้มสุด (กระทบทุกการโหลดหน้า) แนะนำทำก่อน
- เมื่อ backend พร้อมข้อไหน แจ้ง frontend เพื่อถอด workaround ออก (โดยเฉพาะข้อ 1 กับ 3 ที่มี loop เปลือง request)
