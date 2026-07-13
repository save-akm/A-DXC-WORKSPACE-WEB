# Document & Collection API Reference

เอกสารสำหรับ Frontend — หน้า Document ทั้งหมด (เอกสารส่วนตัว, เอกสารโปรเจกต์, folder tree, SharePoint link, AI chat แบบ scope collection)

Design ฉบับเต็ม: [document-feature.md](document-feature.md)

---

## ทั่วไป

| รายการ | ค่า |
|--------|-----|
| **Base URL** | `{API_BASE}` เช่น `http://localhost:3001` |
| **Auth ทุก route** | `Authorization: Bearer <accessToken>` |
| **Content-Type** | `application/json` (ยกเว้น `POST /api/upload` = `multipart/form-data`) |

> ⚠️ กลุ่ม API นี้ตอบเป็น **raw object** (เช่น `{ "collection": {...} }`)
> **ไม่มี** wrapper `status/message/data` แบบ Chat API
> Error ตอบเป็น `{ "error": "ข้อความ" }` พร้อม HTTP status

### Concept หลัก

- **Document** = เอกสาร 1 ชิ้น เป็นได้ 2 แบบ (`sourceType`)
  - `UPLOAD` — ไฟล์ที่อัปโหลด (PDF/DOCX/XLSX/CSV/TXT) → ระบบ chunk + embed ให้ AI ค้นได้
  - `LINK` — ลิงก์ภายนอก (SharePoint ฯลฯ) → เก็บอ้างอิง/จัดหมวดได้ แต่ AI ไม่ค้นเนื้อหาข้างใน
- **Collection** = กล่องรวมเอกสาร มี 2 ชนิด (`type`)
  - `PERSONAL` — user สร้างเอง แชร์ให้คนอื่นเป็น EDITOR/VIEWER ได้
  - `PROJECT` — ระบบสร้างคู่กับ project อัตโนมัติ (1 project = 1 collection) **ห้าม** rename/delete/จัดการ member ตรง ๆ — สิทธิ์มาจากตัว project
- **Folder** = โฟลเดอร์ใน collection ซ้อนกันได้หลายชั้น (สูงสุด 10 ชั้น)
  เอกสารชิ้นเดียวกันอยู่คนละ folder ในคนละ collection ได้ (folder เป็นของ "การผูก" ไม่ใช่ของเอกสาร)

### accessLevel

| ค่า | ทำอะไรได้ |
|-----|-----------|
| `OWNER` | ทุกอย่าง (rename/delete collection, จัดการ member) |
| `EDITOR` | เพิ่ม/ลบ/ย้ายเอกสาร, จัดการ folder, ถาม AI |
| `VIEWER` | ดู + ถาม AI เท่านั้น |

ที่มาของสิทธิ์: PERSONAL → เจ้าของ = OWNER, member ตาม role ที่ถูกแชร์ /
PROJECT → owner + lead + contributors ของ project = EDITOR, หัวหน้าทีม (TeamMember role LEAD) = VIEWER, system ADMIN = OWNER

### DocumentStatus

| ค่า | ความหมาย | UI ควรแสดง |
|-----|----------|------------|
| `PENDING` | รอประมวลผล | spinner |
| `PROCESSING` | กำลัง chunk + embed | spinner |
| `READY` | ค้นได้แล้ว (LINK เป็น READY ทันที) | ปกติ |
| `FAILED` | ประมวลผลพัง | badge error |

### category (เฉพาะเอกสารใน PROJECT collection)

`U0_J5_APPROVE` | `J_FLOW` | `GITSP` | `GENERAL`

---

## Shared Types

### DocumentInCollection (รายการเอกสารข้างใน collection)

```json
{
  "documentId": "cmredcx7g0002...",
  "folderId": "cmredcwy60001...",      // null = อยู่ root ของ collection
  "category": "U0_J5_APPROVE",          // null ได้ (ใช้กับ PROJECT เป็นหลัก)
  "addedAt": "2026-07-10T10:21:37.564+07:00",
  "document": {
    "id": "cmredcx7g0002...",
    "title": "Verify Note",
    "sourceType": "UPLOAD",             // "UPLOAD" | "LINK"
    "url": null,                        // มีค่าเมื่อ sourceType = "LINK"
    "fileType": "TXT",                  // null เมื่อเป็น LINK
    "status": "READY",
    "chunkCount": 1,
    "uploadedAt": "2026-07-10T10:21:37.564+07:00"
  }
}
```

### Folder

```json
{ "id": "cmredcwy6...", "name": "Specs", "parentId": null, "createdAt": "..." }
```

> folder ส่งมาเป็น **flat list** — หน้าบ้าน build tree เองจาก `parentId`
> (`parentId: null` = อยู่ระดับบนสุด)

### CollectionDetail (ใช้ทั้ง `GET /api/collections/:id` และ `GET /api/projects/:projectId/collection`)

```json
{
  "collection": {
    "id": "cmredajr40007...",
    "name": "VERIFYDOC Project",
    "description": null,
    "type": "PROJECT",                  // "PERSONAL" | "PROJECT"
    "projectId": "cmred7xiv0003...",    // null เมื่อ PERSONAL
    "userId": "<owner user id>",
    "createdAt": "...",
    "updatedAt": "...",
    "folders": [ Folder, ... ],
    "documents": [ DocumentInCollection, ... ],
    "members": [
      {
        "userId": "...", "role": "EDITOR", "joinedAt": "...",
        "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "..." }
      }
    ]
  },
  "accessLevel": "EDITOR"               // สิทธิ์ของคนที่เรียก — ใช้ซ่อน/โชว์ปุ่ม
}
```

---

## 1. Documents (ของ user เอง)

### `GET /api/documents` — รายการเอกสารทั้งหมดของฉัน

ใช้ทำหน้า "เอกสารของฉัน" และเป็น picker ตอนกด "เพิ่มเอกสารเข้า collection"

**Response 200**
```json
{
  "documents": [
    {
      "id": "...", "title": "Quarterly Report",
      "sourceType": "UPLOAD", "url": null,
      "fileType": "PDF", "fileSizeBytes": 128000,
      "status": "READY", "chunkCount": 12,
      "uploadedAt": "...", "processedAt": "..."
    },
    {
      "id": "...", "title": "SharePoint Spec",
      "sourceType": "LINK", "url": "https://hlas.sharepoint.com/...",
      "fileType": null, "fileSizeBytes": null,
      "status": "READY", "chunkCount": 0,
      "uploadedAt": "...", "processedAt": "..."
    }
  ]
}
```

### `POST /api/upload` — อัปโหลดไฟล์ (`multipart/form-data`)

อัปโหลด + (ถ้าส่ง `collectionId`) ผูกเข้า collection/folder จบใน request เดียว
**Synchronous** — response กลับเมื่อ chunk/embed เสร็จ (ไฟล์ใหญ่อาจหลายวินาที ควรมี loading)

| form field | จำเป็น | ความหมาย |
|------------|--------|----------|
| `file` | ✅ | ไฟล์ `.pdf` `.docx` `.xlsx` `.csv` `.txt` |
| `title` | – | ชื่อที่แสดง (default = ชื่อไฟล์) |
| `collectionId` | – | ผูกเข้า collection นี้เลย (ต้องมีสิทธิ์ EDITOR) |
| `folderId` | – | วางใน folder นี้ (ต้องอยู่ใน collection ข้างบน) |
| `category` | – | category (ใช้กับ PROJECT collection) |

**Response 201**
```json
{
  "document": {
    "id": "...", "title": "Verify Note", "fileType": "TXT",
    "fileSizeBytes": 317, "status": "READY", "chunkCount": 1,
    "uploadedAt": "...", "processedAt": "..."
  }
}
```

**Errors:** `400` ไม่มีไฟล์/นามสกุลไม่รองรับ · `403` ไม่มีสิทธิ์ EDITOR / folder ไม่อยู่ใน collection / category ผิด · `500` ประมวลผลพัง `{ error, detail, documentId }` (Document ถูกสร้างแล้วสถานะ FAILED)

### `POST /api/documents/link` — แปะลิงก์ภายนอก (SharePoint ฯลฯ)

**Body**
```json
{
  "title": "TOR ฉบับอนุมัติ",                          // 1-255 ตัว, จำเป็น
  "url": "https://hlas.sharepoint.com/sites/dxc/tor.docx", // จำเป็น, http/https เท่านั้น
  "collectionId": "...",                                // optional
  "folderId": "...",                                    // optional (ต้องส่ง collectionId ด้วย)
  "category": "GENERAL"                                 // optional
}
```

**Response 201**
```json
{
  "document": {
    "id": "...", "title": "TOR ฉบับอนุมัติ",
    "sourceType": "LINK", "url": "https://hlas.sharepoint.com/sites/dxc/tor.docx",
    "status": "READY", "uploadedAt": "..."
  }
}
```

**Errors:** `400` URL ผิด format / ไม่ใช่ http-https / ส่ง folderId โดยไม่มี collectionId · `403` ไม่มีสิทธิ์ EDITOR

### `DELETE /api/documents/:docId` — ลบเอกสาร (ถาวร)

ลบได้เฉพาะเจ้าของ ลบแล้วหายจาก **ทุก** collection + chunks ทั้งหมด + ไฟล์ต้นฉบับบนดisk

**Response 200** `{ "documentId": "...", "removed": 1 }` · **404** ไม่ใช่ของคุณ

### `GET /api/documents/:docId/download` — ดาวน์โหลดไฟล์ต้นฉบับ

| `sourceType` | พฤติกรรม |
|--------------|----------|
| `UPLOAD` | stream ไฟล์กลับ (`Content-Disposition: attachment`) |
| `LINK` | redirect **302** ไป `url` ภายนอก |

**สิทธิ์:** เจ้าของเอกสาร หรือ user ที่มีสิทธิ์ **VIEWER+** ใน collection ใด ๆ ที่มีเอกสารนี้อยู่

**Errors:** **404** ไม่มีสิทธิ์/ไม่พบเอกสาร · **404** ไฟล์ถูกลบจาก disk แล้ว (เอกสารเก่าก่อนเก็บไฟล์ถาวร)

> ไฟล์ UPLOAD เก็บใต้ `UPLOAD_DIR/documents/` (ไม่ expose ผ่าน `/media` โดยตรง) — ต้องเรียก endpoint นี้เท่านั้น

---

## 2. Collections

### `POST /api/collections` — สร้าง collection ส่วนตัว

**Body** `{ "name": "งานปี 104", "description": "..." }` (name 1-100, description ≤500)

**Response 201** `{ "collection": { "id", "name", "description", "type": "PERSONAL", "createdAt" } }`
**409** ชื่อซ้ำ (ชื่อ unique ต่อ user เฉพาะ PERSONAL)

### `GET /api/collections?type=PERSONAL|PROJECT` — รายการ collection ที่ฉันเห็น

คืนเฉพาะที่เป็นเจ้าของหรือถูกแชร์ (PROJECT collection เข้าถึงผ่าน route ของ project แทน)

**Response 200**
```json
{
  "collections": [
    {
      "id": "...", "name": "งานปี 104", "description": null,
      "type": "PERSONAL", "projectId": null, "createdAt": "...",
      "role": "OWNER",            // "OWNER" | "EDITOR" | "VIEWER"
      "documentCount": 4, "memberCount": 2
    }
  ]
}
```

### `GET /api/collections/:id` — รายละเอียด + folders + documents + members

**Response 200:** [CollectionDetail](#collectiondetail-ใช้ทั้ง-get-apicollectionsid-และ-get-apiprojectsprojectidcollection) · **404** ไม่มีสิทธิ์/ไม่มีอยู่

### `PATCH /api/collections/:id` — แก้ชื่อ/คำอธิบาย

**Body** `{ "name"?, "description"? }` → **200** `{ "collection": {...} }`
**403** ไม่ใช่เจ้าของ · **409** เป็น PROJECT collection (ให้ไป rename ที่ project)

### `DELETE /api/collections/:id` — ลบ collection (soft delete)

เอกสารข้างใน**ไม่หาย** (แค่หลุดจากกล่อง) → **200** `{ "id", "deleted": true }`
**403** ไม่ใช่เจ้าของ · **409** เป็น PROJECT collection

---

## 3. Project collection

### `GET /api/projects/:projectId/collection` — collection เอกสารของโปรเจกต์

เรียกครั้งแรกระบบ**สร้างให้อัตโนมัติ** — หน้าบ้านไม่ต้องมี flow "สร้างกล่องเอกสาร project"
ใช้เป็น entry point เดียวของ tab เอกสารในหน้า project

**Response 200:** [CollectionDetail](#collectiondetail-ใช้ทั้ง-get-apicollectionsid-และ-get-apiprojectsprojectidcollection) (`type: "PROJECT"`, `name` = ชื่อ project)
**404** ไม่มี project นี้ หรือไม่มีสิทธิ์เห็น

หลังได้ `collection.id` แล้ว ใช้ route กลุ่ม `/api/collections/:id/...` ตามปกติทั้งหมด
(ยกเว้น PATCH/DELETE/members → 409)

---

## 4. เอกสารใน collection

### `POST /api/collections/:id/documents` — เพิ่มเอกสาร (ที่มีอยู่แล้ว) เข้า collection

เพิ่มได้เฉพาะเอกสารที่**ตัวเองเป็นเจ้าของ** ส่งได้ 2 แบบ (ผสมกันได้):

**Body**
```json
{
  "documentIds": ["docA", "docB"],
  "documents": [
    { "documentId": "docC", "folderId": "f1", "category": "J_FLOW" }
  ]
}
```

**Response 200** `{ "added": 3, "rejected": ["docX"] }`
(`rejected` = id ที่ไม่ใช่ของคุณ/ไม่พบ; เพิ่มซ้ำ = no-op)
**403** ไม่มีสิทธิ์ EDITOR · **400** folder ไม่อยู่ใน collection / ไม่มีเอกสารที่เพิ่มได้เลย

### `PATCH /api/collections/:id/documents/:docId` — ย้าย folder / เปลี่ยน category

**Body** `{ "folderId": "f2" }` หรือ `{ "folderId": null }` (= ย้ายไป root) หรือ `{ "category": "GITSP" }` — ส่งพร้อมกันได้

**Response 200** `{ "updated": true }`
**404** เอกสารไม่อยู่ใน collection / folder ไม่พบ · **403** ไม่มีสิทธิ์ EDITOR

### `DELETE /api/collections/:id/documents/:docId` — เอาออกจาก collection

เอาออกจากกล่องเท่านั้น **ตัวเอกสารไม่ถูกลบ** → **200** `{ "removed": 1 }`

---

## 5. Folders

### `POST /api/collections/:id/folders` — สร้าง folder

**Body** `{ "name": "Specs", "parentId": "f1" }` (`parentId` ไม่ส่ง = สร้างที่ root, ซ้อนได้สูงสุด 10 ชั้น)

**Response 201** `{ "folder": { "id", "name", "parentId", "createdAt" } }`
**400** เกินความลึก / parent อยู่คนละ collection · **404** parent ไม่พบ

### `PATCH /api/collections/:id/folders/:folderId` — rename / ย้าย

**Body** `{ "name"? , "parentId"?: "f2" | null }` (`parentId: null` = ย้ายขึ้น root)

**Response 200** `{ "folder": { "id", "name", "parentId", "updatedAt" } }`
**400** `"Cannot move a folder into itself or its own subtree."` — ย้ายเข้าตัวเอง/ลูกตัวเอง

### `DELETE /api/collections/:id/folders/:folderId` — ลบ folder

folder ลูกถูกลบตามทั้งสาย / **เอกสารข้างในไม่หาย** — ตกไปอยู่ root ของ collection (`folderId → null`)

**Response 200** `{ "id": "...", "deleted": true }`

---

## 6. Members (แชร์ collection — เฉพาะ PERSONAL)

ทุก route กลุ่มนี้: **403** ไม่ใช่เจ้าของ · **409** เป็น PROJECT collection

| Route | Body | Response |
|-------|------|----------|
| `POST /api/collections/:id/members` | `{ "userId", "role"?: "EDITOR"\|"VIEWER" }` (default VIEWER) | **201** `{ "member": { id, userId, role, joinedAt } }` · 404 user ไม่พบ · 409 เป็น member แล้ว |
| `PATCH /api/collections/:id/members/:userId` | `{ "role": "EDITOR"\|"VIEWER" }` | **200** `{ "updated": 1 }` |
| `DELETE /api/collections/:id/members/:userId` | – | **200** `{ "removed": 1 }` (member ลบตัวเองออกได้) |

---

## 7. AI Chat กับเอกสาร

### `POST /api/chat` — ถาม-ตอบ (รอคำตอบทีเดียว)

**Body**
```json
{
  "question": "สรุป TOR โปรเจกต์นี้ให้หน่อย",   // จำเป็น
  "collectionId": "<project collection id>",   // optional — จำกัดให้ AI ค้นเฉพาะ collection นี้
  "topK": 5,                                    // optional 1-20
  "threshold": 0.5                              // optional 0-1
}
```

- **ไม่ส่ง `collectionId`** → ค้นจากเอกสารของตัวเองทั้งหมด (พฤติกรรมเดิม)
- **ส่ง `collectionId`** → ค้นเฉพาะเอกสารใน collection นั้น (ต้องมีสิทธิ์อย่างน้อย VIEWER ไม่งั้น **404**)
- ใช้ทำ "ถาม AI เกี่ยวกับเอกสารโปรเจกต์" โดยส่ง id จาก `GET /api/projects/:projectId/collection`
- เอกสาร `LINK` ไม่ถูกค้น (ไม่มีเนื้อหาในระบบ)

**Response 200**
```json
{
  "answer": "...",
  "notFound": false,
  "sources": [
    { "documentId": "...", "source": "Verify Note", "chunkIndex": 0, "similarity": 0.7431 }
  ]
}
```

> `sources` เป็น `[]` เมื่อระบบจัดว่าเป็นแชตทั่วไป (similarity ต่ำกว่าเกณฑ์) — อย่า assume ว่ามีเสมอ

### `POST /api/chat/stream` — แบบ SSE streaming

Body เดียวกัน (รวม `collectionId`) — response เป็น `text/event-stream`:

| event | data |
|-------|------|
| `sources` | array แบบเดียวกับ `sources` ข้างบน (มาก่อน token แรก) |
| `token` | `{ "text": "..." }` ต่อเนื่องจนจบ |
| `done` | `{ "notFound": boolean }` |
| `error` | `{ "error", "name"?, "code"? }` |

ถ้าไม่มีสิทธิ์ใน `collectionId` → ได้ HTTP **404** ปกติก่อนเริ่ม stream

---

## Flow แนะนำสำหรับหน้า Document

1. **หน้าเอกสารส่วนตัว:** `GET /api/documents` (ทั้งหมด) + `GET /api/collections` (กล่อง) — คลิกกล่อง → `GET /api/collections/:id` → render folder tree จาก `folders[]` + วางเอกสารตาม `folderId`
2. **Tab เอกสารในหน้า project:** `GET /api/projects/:projectId/collection` อันเดียวจบ — ใช้ `accessLevel` ตัดสินใจโชว์ปุ่ม upload/จัด folder (ซ่อนเมื่อ VIEWER)
3. **ปุ่มเพิ่มเอกสาร** มี 2 ทาง: อัปโหลดใหม่ (`POST /api/upload` พร้อม collectionId/folderId) หรือแปะลิงก์ (`POST /api/documents/link`)
4. **ปุ่ม "ถาม AI"** ในหน้า collection/project → `POST /api/chat/stream` พร้อม `collectionId`
