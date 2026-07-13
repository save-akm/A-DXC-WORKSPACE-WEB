# Document & Collection — Backend Handoff

> สเปกเต็มของทุก endpoint อยู่ที่ [`document-api.md`](./document-api.md) — เอกสารนี้เป็น **checklist ยืนยันว่า
> backend implement ครบตามนั้นจริง** + จุดที่ frontend เจอปัญหาแล้วต้องแจ้งกลับ
> Frontend ที่เกี่ยวข้อง: `lib/api/documents.ts`, `app/(management)/documents/**`
> วันที่ร่าง: 2026-07-10

---

## ปัญหาที่เจอตอนต่อของจริง

หน้า `/documents/[id]` ขึ้น **"ไม่พบ collection นี้"** (404) ทันทีที่กดเข้าจากการ์ดในหน้ารวม

**สาเหตุ:** ไม่ใช่ endpoint ขาด — แต่ยังไม่มี collection จริงในฐานข้อมูลให้ทดสอบ
(id ที่โชว์ในหน้ารวมตอนนั้นมาจาก mock fallback ฝั่ง frontend เพราะ backend ยังต่อไม่ติด)

**ขอให้ backend:** เตรียมข้อมูลจริงอย่างน้อย 1 collection (สร้างผ่าน `POST /api/collections` เอง หรือ seed
ให้ user ทดสอบ) ก่อนส่งต่อให้ frontend QA — ไม่ต้องแก้โค้ดเพิ่มสำหรับเคสนี้

---

## Checklist endpoint ที่หน้านี้เรียกจริง

อ้างอิงสเปคเต็มใน `document-api.md` — เช็คให้ implement ครบและ path/verb ตรงตามนี้เป๊ะ:

### Documents
- [ ] `GET /api/documents`
- [ ] `POST /api/upload` (multipart/form-data)
- [ ] `POST /api/documents/link`
- [ ] `GET /api/documents/:docId/download` — stream ไฟล์ UPLOAD / redirect LINK
- [ ] `DELETE /api/documents/:docId`

### Collections
- [ ] `GET /api/collections?type=PERSONAL|PROJECT`
- [ ] `POST /api/collections`
- [ ] `GET /api/collections/:id`
- [ ] `PATCH /api/collections/:id`
- [ ] `DELETE /api/collections/:id`

### Project collection (ยังไม่ได้ต่อหน้า UI — เตรียม endpoint ไว้ก่อนได้)
- [ ] `GET /api/projects/:projectId/collection`

### เอกสารใน collection
- [ ] `POST /api/collections/:id/documents`
- [ ] `PATCH /api/collections/:id/documents/:docId`
- [ ] `DELETE /api/collections/:id/documents/:docId`

### Folders
- [ ] `POST /api/collections/:id/folders`
- [ ] `PATCH /api/collections/:id/folders/:folderId`
- [ ] `DELETE /api/collections/:id/folders/:folderId`

### Members (เฉพาะ PERSONAL)
- [ ] `POST /api/collections/:id/members`
- [ ] `PATCH /api/collections/:id/members/:userId`
- [ ] `DELETE /api/collections/:id/members/:userId`

### AI Chat
- [ ] `POST /api/chat`
- [ ] `POST /api/chat/stream` — **ต้อง flush ทีละ SSE event จริง ไม่ buffer รวมส่งทีเดียว**
      ไม่งั้นฝั่ง UI จะเห็นคำตอบโผล่มาทีเดียวทั้งก้อนแทนที่จะไหลทีละ token

---

## Dependency นอกสเปค document-api.md

หน้า "แชร์ collection" (member picker) เรียก **`GET /admin/users/options`** — endpoint เดิมของระบบ
ไม่ได้อยู่ใน `document-api.md` แต่ถ้า user ที่ login ไม่มีสิทธิ์ query endpoint นี้ ปุ่มแชร์จะใช้งานไม่ได้
เช็คว่า role ที่ใช้ทดสอบ (เจ้าของ PERSONAL collection) เรียก endpoint นี้ผ่านด้วย

---

## Error contract — ย้ำเพราะต่างจาก API กลุ่มอื่นในระบบ

กลุ่ม document/collection **ไม่มี envelope `status/data`** แบบ chat API อื่น ๆ ในระบบ

```jsonc
// สำเร็จ — raw object ตรง ๆ
{ "collection": { ... } }

// ผิดพลาด
{ "error": "ข้อความ" }   // พร้อม HTTP status ที่ถูกต้อง (400/403/404/409)
```

Frontend อ่าน `error` field นี้ไปแสดงใน toast ตรง ๆ — ถ้า backend ส่ง `message` แทน `error`
หรือไม่ส่ง HTTP status ที่ถูกต้อง ผู้ใช้จะเห็นข้อความ error ทั่วไปแทนสาเหตุจริง

---

## `POST /api/upload` ต้อง synchronous

ตามสเปค: response กลับ**หลัง** chunk + embed เสร็จแล้วเท่านั้น (ไฟล์ใหญ่รอหลายวินาทีได้)
frontend ไม่มี polling — ถ้า backend ตอบทันทีเป็น `PENDING`/`PROCESSING` แล้วอัปเดตสถานะทีหลัง
เอกสารจะค้างสถานะเดิมจนกว่า user จะ refresh เอง ต้องแจ้งกลับถ้า backend ทำ async

---

## เจอเพิ่ม: อัปโหลดพร้อม `collectionId` แล้วเอกสารไม่ถูกผูกเข้า collection

**อาการ:** อัปโหลดไฟล์จากหน้ารวมพร้อมเลือก collection ปลายทาง — request สำเร็จ (ได้ `document` กลับมา
ไม่มี error) แต่พอเปิดดู collection นั้นหรือ refresh หน้ารายการ เอกสารกลับไม่ปรากฏว่าถูกผูกไว้

**สิ่งที่ frontend แก้ไปแล้วฝั่งตัวเอง:** ย้ายลำดับฟิลด์ใน multipart form ให้ `title` / `collectionId` /
`folderId` / `category` ถูกส่ง**ก่อน** `file` เสมอ (`lib/api/documents.ts` → `uploadDocument()`)
เผื่อกรณี backend ใช้ multipart parser แบบ stream (เช่น busboy) ที่เริ่มประมวลผลไฟล์ทันทีที่เจอ field
`file` โดยไม่รอฟิลด์ที่ส่งตามหลัง ทำให้ `collectionId` มาไม่ทันตอนสร้าง record

**ถ้าย้ายลำดับแล้วยังไม่ผูก** — แปลว่าเป็นฝั่ง backend จริง ช่วยเช็ค:
1. Route handler อ่านค่า `collectionId`/`folderId`/`category` จาก `req.body` (หลัง multer/busboy parse
   เสร็จ) ไม่ใช่จาก raw stream ก่อน parse
2. เขียน binding ลง collection ใน**ธุรกรรมเดียวกัน**กับการสร้าง document (ไม่ใช่ fire-and-forget
   แล้วไม่ await จน response หลุดไปก่อน)
3. ถ้า `collectionId` ที่ส่งมาไม่มีสิทธิ์ EDITOR จริง ควรตอบ `403` ตามสเปค ไม่ใช่เงียบแล้วสร้างเอกสารลอย
   (ผู้ใช้จะเข้าใจผิดว่าเพิ่มสำเร็จ)

---

## ดาวน์โหลดไฟล์ต้นฉบับ — implement แล้ว

เดิมอัปโหลดแล้วลบไฟล์ทิ้งหลัง chunk/embed — frontend จึงไม่มีทางดึงไฟล์กลับ

**Backend ตอนนี้:**
- เก็บไฟล์ UPLOAD ถาวรใต้ `UPLOAD_DIR/documents/` (ไม่เปิด public ผ่าน `/media`)
- `GET /api/documents/:docId/download` — UPLOAD = stream attachment, LINK = redirect 302 ไป URL
- สิทธิ์: เจ้าของ หรือ VIEWER+ ใน collection ที่มีเอกสาร
- เอกสารที่อัปโหลดก่อน deploy นี้ → 404 พร้อมข้อความให้ re-upload
