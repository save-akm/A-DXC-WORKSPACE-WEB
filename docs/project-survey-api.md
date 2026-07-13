# Project Survey API — Frontend Reference

> **Base:** `/api/project-surveys`  
> **Auth:** Cookie session / Bearer JWT (`authenticate`)  
> **Permission menu:** `project_survey` (`VIEW` | `CREATE` | `UPDATE` | `DELETE`)  
> **Business rules (workflow):** [project-survey.md](./project-survey.md)

---

## Envelope

ทุก response ใช้รูปแบบเดียวกัน:

```json
{
  "status": "OK",
  "message": "Success",
  "data": {},
  "timestamp": "2026-07-13T09:00:00.000Z"
}
```

| HTTP | เมื่อไหร่ |
|------|----------|
| `200` | สำเร็จ |
| `201` | สร้างใหม่ (create / comment / upload) |
| `400` | `INVALID_STATUS` / `INVALID_INPUT` / `INVALID_FILE` |
| `401` | ไม่ได้ login |
| `403` | `FORBIDDEN` |
| `404` | `NOT_FOUND` |
| `409` | `CONFLICT` |

Error:

```json
{
  "status": "ERROR",
  "message": "Cannot edit while under review",
  "code": "INVALID_STATUS",
  "timestamp": "2026-07-13T09:00:00.000Z"
}
```

---

## Status workflow

```text
USER สร้าง ──► SEND ──► (requestTo เปิดหน้า / start-review) ──► REVIEW ──► (approve) ──► APPROVE
```

| Status | ความหมาย |
|--------|----------|
| `SEND` | USER ส่งแล้ว — รอ Super Admin (`requestToId`) เปิดดู |
| `REVIEW` | Super Admin เปิดแล้ว / กำลัง estimate |
| `APPROVE` | อนุมัติแล้ว — **lock ทุกอย่าง** |

**Auto start review:** `GET /:id` ถ้า login เป็น `requestToId` และ status = `SEND` → backend เปลี่ยนเป็น `REVIEW` ทันที (ไม่ต้องเรียก `start-review` แยกก็ได้)

---

## Route summary (24 endpoints)

| # | Method | Path | Perm | ใครใช้ |
|---|--------|------|------|--------|
| 1 | GET | `/request-to-users` | CREATE | USER — dropdown Super Admin |
| 2 | GET | `/inbox/review` | UPDATE | A-DXC inbox |
| 3 | GET | `/` | VIEW | รายการ |
| 4 | POST | `/` | CREATE | USER สร้าง |
| 5 | GET | `/:id` | VIEW | รายละเอียด (+ auto REVIEW) |
| 6 | PUT | `/:id` | UPDATE | USER แก้ (SEND) |
| 7 | DELETE | `/:id` | UPDATE/DELETE | USER ลบ (SEND) |
| 8 | POST | `/:id/start-review` | VIEW | `requestToId` เท่านั้น |
| 9 | PUT | `/:id/review` | UPDATE | A-DXC บันทึก review |
| 10 | POST | `/:id/approve` | UPDATE | A-DXC อนุมัติ |
| 11 | GET | `/:id/comments` | VIEW | แสดง comment |
| 12 | POST | `/:id/comments` | UPDATE | เพิ่ม comment |
| 13 | DELETE | `/:id/comments/:commentId` | UPDATE | ลบ comment ตัวเอง |
| 14 | POST | `/:id/content-images` | UPDATE | รูป inline Markdown |
| 15 | GET | `/:id/attachments` | VIEW | ไฟล์แนบ |
| 16 | POST | `/:id/attachments` | UPDATE | อัปโหลด PDF/Excel |
| 17 | DELETE | `/:id/attachments/:attachmentId` | UPDATE | ลบไฟล์ |
| 18 | PUT | `/:id/costs` | UPDATE | A-DXC replace costs |
| 19 | PUT | `/:id/schedules` | UPDATE | A-DXC replace schedules |
| 20 | GET | `/:id/history` | VIEW | status history |
| 21 | GET | `/:id/actions` | VIEW | action log |
| 22 | GET | `/:id/audit-logs` | VIEW | audit (admin/reviewer) |
| 23 | GET | `/:id/notifications` | VIEW | notifications |
| 24 | PATCH | `/notifications/:notificationId/read` | VIEW | mark read |

---

## Shared types

### UserMini

```ts
{
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  avatarUrl: string | null
  email?: string   // มีใน detail / request-to-users
}
```

### Cost (request body)

```ts
{ category: "HARDWARE" | "SOFTWARE" | "OUTSOURCE" | "IN_HOUSE", amount: number }
```

Response cost row: `{ id, surveyId, category, amount: string, createdAt }` — `amount` เป็น Decimal string

### Schedule

`source` ถูกตั้งโดยระบบ — **ไม่ส่งใน request body**

| source | ใคร save | endpoint | process ที่ใช้ได้ |
|--------|----------|----------|------------------|
| `USER` | USER | `POST /`, `PUT /:id` (status `SEND`) | `U0`, `J3`, `J5` |
| `A_DXC` | A-DXC | `PUT /:id/review`, `PUT /:id/schedules` (status `REVIEW`) | `J0_J2`, `J3`, `J4`, `J5` |

Replace schedules = **เฉพาะแถวของ source นั้น** — แผน USER ไม่ถูกลบเมื่อ admin save

```ts
// Request (ไม่มี source)
{
  job: "REQUIREMENT" | "DEVELOP" | "START_USE"
  process: string          // ตามตารางด้านบน
  planType: "ORIGINAL_PLAN" | "REVISE_PLAN" | "FORECAST_PLAN" | "ACTUAL"
  planStart?: string | null   // "YYYY-MM-DD"
  planEnd?: string | null
  estimateCost?: number | null
  remark?: string | null
}

// Response แต่ละแถว
{
  id, surveyId,
  source: "USER" | "A_DXC",
  job, process, planType,
  planStart, planEnd, estimateCost, remark,
  createdAt, updatedAt
}
```

### Enums

| Name | Values |
|------|--------|
| Status | `SEND` `REVIEW` `APPROVE` |
| TypeSystem | `AS400` `NON_AS400` |
| BudgetType (code) | `ORIGINAL` `OUT` `LOWERING` |
| CostCategory | `HARDWARE` `SOFTWARE` `OUTSOURCE` `IN_HOUSE` |
| ScheduleJob | `REQUIREMENT` `DEVELOP` `START_USE` |
| ScheduleSource | `USER` `A_DXC` (response only) |
| ScheduleProcess (USER) | `U0` `J3` `J5` |
| ScheduleProcess (A-DXC) | `J0_J2` `J3` `J4` `J5` |
| SchedulePlanType | `ORIGINAL_PLAN` `REVISE_PLAN` `FORECAST_PLAN` `ACTUAL` |
| ActorRole | `USER` `A_DXC` |
| NotificationType (active) | `SEND` `REVIEW` `APPROVE` |
| FileType | `PDF` `XLSX` `CSV` `DOCX` `TXT` |
| DocStatus | `PENDING` `PROCESSING` `READY` `FAILED` |

### SurveyDetail

`data` ของ create / get / update / workflow actions

```json
{
  "id": "clx_survey_id",
  "docNo": "PS-2026-00001",
  "projectName": "ระบบจองห้องประชุม",
  "requesterId": "clx_user",
  "requesterName": "สมหญิง ใจดี",
  "requestToId": "clx_super_admin",
  "branchId": "clx_branch",
  "departmentId": "clx_dept",
  "kiId": "clx_ki",
  "typeSystem": "NON_AS400",
  "budgetTypeId": "clx_budget",
  "request": "## Request\n\nMarkdown...",
  "changePoint": "Markdown...",
  "detail": "Markdown...",
  "reason": null,
  "status": "SEND",
  "currentStep": "SEND",
  "revision": 0,
  "resubmitCount": 0,
  "createdById": "clx_user",
  "updatedById": "clx_user",
  "createdAt": "2026-07-13T08:00:00.000Z",
  "updatedAt": "2026-07-13T08:00:00.000Z",

  "branch": { "id": "...", "code": "HO", "name": "Head Office" },
  "department": { "id": "...", "code": "IT", "name": "IT" },
  "kiYear": { "id": "...", "code": 104, "name": "KI 104" },
  "budgetType": { "id": "...", "code": "ORIGINAL", "name": "Original Budget" },
  "requester": {
    "id": "...",
    "firstName": "สมหญิง",
    "lastName": "ใจดี",
    "nickname": null,
    "avatarUrl": null,
    "email": "user@example.com"
  },
  "requestTo": {
    "id": "...",
    "firstName": "Admin",
    "lastName": "DXC",
    "nickname": null,
    "avatarUrl": null,
    "email": "admin@example.com"
  },
  "updatedBy": {
    "id": "...",
    "firstName": "สมหญิง",
    "lastName": "ใจดี",
    "nickname": null,
    "avatarUrl": null
  },
  "collection": { "id": "col_..." },

  "costs": [
    {
      "id": "clx_cost",
      "surveyId": "clx_survey_id",
      "category": "SOFTWARE",
      "amount": "50000.00",
      "createdAt": "2026-07-13T08:00:00.000Z"
    }
  ],

  "schedules": [
    {
      "id": "clx_sched",
      "surveyId": "clx_survey_id",
      "source": "USER",
      "job": "REQUIREMENT",
      "process": "U0",
      "planType": "ORIGINAL_PLAN",
      "planStart": "2026-08-01T00:00:00.000Z",
      "planEnd": "2026-08-15T00:00:00.000Z",
      "estimateCost": "10000.00",
      "remark": null,
      "createdAt": "2026-07-13T08:00:00.000Z",
      "updatedAt": "2026-07-13T08:00:00.000Z"
    }
  ],

  "review": {
    "id": "clx_review",
    "surveyId": "clx_survey_id",
    "estimateCost": "120000.00",
    "estimateSchedule": "3 เดือน",
    "responsibleId": "clx_admin",
    "comment": "ขอรายละเอียดเพิ่ม",
    "recommendation": "อนุมัติหลังปรับ scope",
    "replyDate": null,
    "reviewerId": "clx_super_admin",
    "createdAt": "2026-07-13T09:00:00.000Z",
    "updatedAt": "2026-07-13T09:00:00.000Z",
    "reviewer": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null },
    "responsible": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null }
  },

  "attachments": [
    {
      "id": "doc_id",
      "fileName": "spec.pdf",
      "filePath": "/media/project-surveys/attachments/uuid.pdf",
      "fileType": "PDF",
      "fileSizeBytes": 123456,
      "status": "READY",
      "chunkCount": 12,
      "errorMessage": null,
      "uploadedAt": "2026-07-13T08:00:00.000Z",
      "processedAt": "2026-07-13T08:01:00.000Z",
      "uploadedBy": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null },
      "collectionId": "col_..."
    }
  ]
}
```

> `review` = `null` ถ้ายังไม่มี review record  
> `amount` / `estimateCost` เป็น **string** (Decimal)

### SurveyListItem (list / inbox)

```json
{
  "id": "clx_survey_id",
  "docNo": "PS-2026-00001",
  "projectName": "ระบบจองห้องประชุม",
  "requesterId": "clx_user",
  "requesterName": "สมหญิง ใจดี",
  "branchId": "clx_branch",
  "departmentId": "clx_dept",
  "kiId": "clx_ki",
  "typeSystem": "NON_AS400",
  "budgetTypeId": "clx_budget",
  "status": "SEND",
  "currentStep": "SEND",
  "revision": 0,
  "resubmitCount": 0,
  "createdById": "clx_user",
  "updatedById": "clx_user",
  "createdAt": "2026-07-13T08:00:00.000Z",
  "updatedAt": "2026-07-13T08:00:00.000Z",
  "branch": { "id": "...", "code": "HO", "name": "Head Office" },
  "department": { "id": "...", "code": "IT", "name": "IT" },
  "kiYear": { "id": "...", "code": 104, "name": "KI 104" },
  "budgetType": { "id": "...", "code": "ORIGINAL", "name": "Original Budget" },
  "requester": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null }
}
```

> List **ไม่ include** `requestToId` / `requestTo` — ดูจาก detail (`GET /:id`)

---

## Roles & UI guide

### Roles

| Role | เงื่อนไข | หน้าที่ |
|------|----------|---------|
| **Requester (USER)** | `requesterId` / `createdById` | สร้าง / แก้ / ลบ (SEND) / comment |
| **Request To (Super Admin)** | `requestToId` | รับคำร้อง → auto REVIEW → estimate → approve |
| **Reviewer (A-DXC)** | `project_survey:UPDATE` | inbox / review / costs / schedules / approve |

### ปุ่มตาม status

| Status | USER (เจ้าของ) | requestTo / A-DXC |
|--------|----------------|-------------------|
| `SEND` | Edit, Delete, Upload, content-images, Comment | เปิดดู → auto REVIEW |
| `REVIEW` | อ่าน + Comment | Edit review, Costs, Schedules, Approve, Upload |
| `APPROVE` | อ่านอย่างเดียว | อ่านอย่างเดียว |

### แสดง schedules บน UI

```ts
const userPlans = schedules.filter(s => s.source === 'USER')
const adminPlans = schedules.filter(s => s.source === 'A_DXC')
```

### Markdown (Request / Change point / Detail)

1. `POST /:id/content-images` (multipart `file`) → `{ url, fileSizeBytes }`
2. ใส่ใน Markdown: `![คำอธิบาย](url)`
3. บันทึกผ่าน `PUT /:id`

PDF / Excel ใช้ `/attachments` แยก — ไม่ embed ใน Markdown

### Master data (dropdown)

| Field | API ใน module นี้ | หมายเหตุ |
|-------|-------------------|----------|
| `requestToId` | `GET /request-to-users` | Super Admin เท่านั้น |
| `branchId`, `departmentId` | API org ที่มีอยู่แล้ว | |
| `kiId`, `budgetTypeId` | **ยังไม่มี endpoint แยก** | ดึงจาก seed/DB หรือ relation ใน response |

| ตาราง | ค่า seed |
|-------|----------|
| `ki_years` | code `103`, `104`, `105` |
| `budget_types` | `ORIGINAL`, `OUT`, `LOWERING` |

### Request To flow

1. USER สร้างพร้อม `requestToId` (Super Admin) → status `SEND`
2. ระบบส่ง in-app notification + **อีเมล** ลิงก์ `{APP_PUBLIC_URL}/project-survey/{id}` ไปหา `requestToId`
3. `requestToId` เปิดหน้า (`GET /:id`) หรือ `POST /:id/start-review` → status `REVIEW`
4. แจ้ง requester ว่าเริ่ม review แล้ว
5. เปลี่ยน `requestToId` ขณะ SEND → ส่ง email ใหม่ไปคนใหม่

---

## Endpoints

### 1. `GET /api/project-surveys/request-to-users`

**Perm:** `CREATE` → `200`

**Response `data`:**

```json
[
  {
    "id": "clx_super_admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "DXC",
    "nickname": null,
    "avatarUrl": null
  }
]
```

เฉพาะ user role **SUPER_ADMIN** + status `ACTIVE`

---

### 2. `POST /api/project-surveys` — สร้าง & ส่ง

**Perm:** `CREATE` → `201`  
**Logic:** สร้างทันที status = `SEND` + notify/email ไป `requestToId`

**Body (required):** `projectName`, `branchId`, `departmentId`, `kiId`, `typeSystem`, `budgetTypeId`, `requestToId`

```json
{
  "projectName": "ระบบจองห้องประชุม",
  "branchId": "clx_branch",
  "departmentId": "clx_dept",
  "kiId": "clx_ki",
  "typeSystem": "NON_AS400",
  "budgetTypeId": "clx_budget",
  "requestToId": "clx_super_admin",
  "request": "## ปัญหาปัจจุบัน\n\nMarkdown...",
  "changePoint": "เปลี่ยนเป็นจองออนไลน์",
  "detail": "ลดเวลาประสานงาน 30%",
  "costs": [
    { "category": "SOFTWARE", "amount": 50000 },
    { "category": "IN_HOUSE", "amount": 20000 }
  ],
  "schedules": [
    {
      "job": "REQUIREMENT",
      "process": "U0",
      "planType": "ORIGINAL_PLAN",
      "planStart": "2026-08-01",
      "planEnd": "2026-08-15",
      "estimateCost": 10000,
      "remark": null
    }
  ]
}
```

**Response `data`:** `SurveyDetail` (`status: "SEND"`)

---

### 3. `GET /api/project-surveys` — รายการ

**Perm:** `VIEW` → `200`

| Query | Type | หมายเหตุ |
|-------|------|----------|
| `page` | number | default 1 |
| `limit` | number | 1–100, default 20 |
| `status` | Status | |
| `requesterId` | string | |
| `branchId` | string | |
| `departmentId` | string | |
| `keyword` | string | ค้น `docNo` / `projectName` |
| `mine` | boolean | ของฉัน |
| `inbox` | `"review"` | คิว A-DXC — ต้องมี UPDATE |

USER ไม่มี `UPDATE` → เห็นเฉพาะเอกสารตัวเองอัตโนมัติ

**Response `data`:**

```json
{
  "items": [ /* SurveyListItem[] */ ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### 4. `GET /api/project-surveys/inbox/review`

**Perm:** `UPDATE` → `200`  
Query เหมือน list  
Filter status `SEND` | `REVIEW` เท่านั้น  
**Response:** เหมือน list (paginated)

---

### 5. `GET /api/project-surveys/:id` — รายละเอียด

**Perm:** `VIEW` → `200`

**Logic:** ถ้า viewer = `requestToId` + status `SEND` → auto เปลี่ยนเป็น `REVIEW` ก่อน return

**Response `data`:** `SurveyDetail` (status อาจเป็น `REVIEW` หลัง auto-start)

**ใครดูได้:** requester, createdBy, requestTo, reviewer (UPDATE), admin

---

### 6. `PUT /api/project-surveys/:id` — แก้ไข

**Perm:** `UPDATE` + ต้องเป็น **เจ้าของเอกสาร** (หรือ admin)  
**เมื่อไหร่:** status = `SEND` เท่านั้น

**Body:** partial ของ create (อย่างน้อย 1 field)

- `costs` / `schedules` → replace ชุด USER (`source = USER`)
- เปลี่ยน `requestToId` → ส่ง email ใหม่

**Response `data`:** `SurveyDetail`

---

### 7. `DELETE /api/project-surveys/:id`

**Perm:** `UPDATE` หรือ `DELETE`  
**เมื่อไหร่:** status = `SEND` + เจ้าของ (หรือ admin)

**Response `data`:**

```json
{ "ok": true }
```

---

### 8. `POST /api/project-surveys/:id/start-review`

**Perm:** `VIEW`  
**ใคร:** เฉพาะ `requestToId`  
**เมื่อไหร่:** status = `SEND`

**Body:** ไม่มี

**Response `data`:** `SurveyDetail` (`status: "REVIEW"`)

> Frontend: เรียก `GET /:id` อย่างเดียวก็พอ

---

### 9. `PUT /api/project-surveys/:id/review`

**Perm:** `UPDATE` (A-DXC)  
**เมื่อไหร่:** status = `REVIEW`

**Body (ทุก field optional):**

```json
{
  "estimateCost": 120000,
  "estimateSchedule": "3 เดือน",
  "responsibleId": "clx_admin_user",
  "comment": "ขอรายละเอียดเพิ่ม",
  "recommendation": "อนุมัติหลังปรับ scope",
  "costs": [{ "category": "OUTSOURCE", "amount": 80000 }],
  "schedules": [{
    "job": "DEVELOP",
    "process": "J3",
    "planType": "ORIGINAL_PLAN",
    "planStart": "2026-09-01",
    "planEnd": "2026-11-30"
  }]
}
```

- upsert `review` record
- `costs` → replace ทั้งชุด
- `schedules` → replace เฉพาะ `source = A_DXC`

**Response `data`:** `SurveyDetail`

---

### 10. `POST /api/project-surveys/:id/approve`

**Perm:** `UPDATE`  
**เมื่อไหร่:** status = `REVIEW`

**Body (optional):**

```json
{ "remark": "อนุมัติตาม scope ที่ปรับ" }
```

**Response `data`:** `SurveyDetail` (`status: "APPROVE"`)  
แจ้ง requester ทาง notification + email

---

### 11–13. Comments

#### `GET /:id/comments` → `200`

**Response `data`:**

```json
[
  {
    "id": "clx_comment",
    "surveyId": "clx_survey",
    "comment": "ขอตัวอย่างหน้าจอ",
    "commentById": "clx_user",
    "role": "USER",
    "createdAt": "2026-07-13T08:00:00.000Z",
    "commentBy": {
      "id": "clx_user",
      "firstName": "สมหญิง",
      "lastName": "ใจดี",
      "nickname": null,
      "avatarUrl": null
    }
  }
]
```

#### `POST /:id/comments` → `201`

```json
{ "comment": "อัปเดตไฟล์แนบแล้ว" }
```

**Response `data`:** comment row (มี `commentBy`)  
ห้าม comment เมื่อ status = `APPROVE`  
`role` ตั้งโดย server (`USER` / `A_DXC`)

#### `DELETE /:id/comments/:commentId` → `200`

**Response `data`:** `{ "ok": true }` — ลบได้เฉพาะ comment ของตัวเอง

---

### 14. `POST /:id/content-images` — รูป Markdown

**Perm:** `UPDATE`  
**เมื่อไหร่:** status = `SEND` + เจ้าของเอกสาร  
**Content-Type:** `multipart/form-data` field **`file`**  
**ไฟล์:** `.jpg` `.jpeg` `.png` `.webp` `.gif`

**Response `data` (201):**

```json
{
  "url": "/media/project-surveys/content/uuid.png",
  "fileSizeBytes": 45678
}
```

---

### 15–17. Attachments (Document)

**ไฟล์:** `.pdf` `.docx` `.xlsx` `.csv` `.txt`  
`attachmentId` = Document id

#### `GET /:id/attachments` → `200`

**Response `data`:** `Attachment[]` (ดู SurveyDetail)

#### `POST /:id/attachments` → `201`

**multipart** field **`file`**  
**อนุญาต:** USER ที่ SEND | A-DXC ที่ REVIEW

**Response `data`:**

```json
{
  "id": "doc_id",
  "fileName": "spec.pdf",
  "filePath": "/media/project-surveys/attachments/uuid.pdf",
  "fileType": "PDF",
  "fileSizeBytes": 123456,
  "status": "READY",
  "chunkCount": 12,
  "uploadedAt": "2026-07-13T08:00:00.000Z",
  "processedAt": "2026-07-13T08:01:00.000Z",
  "collectionId": "col_..."
}
```

ดาวน์โหลด: `{API_ORIGIN}{filePath}`

#### `DELETE /:id/attachments/:attachmentId` → `200`

**Response `data`:** `{ "ok": true }`

---

### 18. `PUT /:id/costs`

**Perm:** `UPDATE` | status = `REVIEW`

```json
{
  "costs": [
    { "category": "HARDWARE", "amount": 10000 },
    { "category": "SOFTWARE", "amount": 50000 }
  ]
}
```

**Response `data`:** cost rows array (replace ทั้งชุด)

---

### 19. `PUT /:id/schedules`

**Perm:** `UPDATE` | status = `REVIEW`

```json
{
  "schedules": [{
    "job": "DEVELOP",
    "process": "J4",
    "planType": "FORECAST_PLAN",
    "planStart": "2026-10-01",
    "planEnd": "2026-10-15",
    "estimateCost": 5000,
    "remark": null
  }]
}
```

**Response `data`:** schedule rows **ทั้ง survey** (USER + A_DXC)  
Replace เฉพาะแถว `source = A_DXC`

---

### 20. `GET /:id/history`

**Response `data`:**

```json
[
  {
    "id": "...",
    "surveyId": "...",
    "fromStatus": null,
    "toStatus": "SEND",
    "action": "CREATE",
    "remark": null,
    "actorId": "...",
    "actorRole": "USER",
    "createdAt": "...",
    "actor": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null }
  }
]
```

---

### 21. `GET /:id/actions`

**Response `data`:**

```json
[
  {
    "id": "...",
    "surveyId": "...",
    "actionType": "SEND",
    "actionById": "...",
    "actionRole": "USER",
    "description": "Submitted for review",
    "metadata": null,
    "createdAt": "...",
    "actionBy": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null }
  }
]
```

---

### 22. `GET /:id/audit-logs`

**Perm:** admin หรือ reviewer (`UPDATE`) เท่านั้น

**Response `data`:**

```json
[
  {
    "id": "...",
    "surveyId": "...",
    "action": "UPDATE",
    "tableName": "project_surveys",
    "recordId": "...",
    "oldValue": { "projectName": "..." },
    "newValue": { "projectName": "..." },
    "createdById": "...",
    "createdAt": "...",
    "createdBy": { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null }
  }
]
```

---

### 23. `GET /:id/notifications`

**Response `data`:**

```json
[
  {
    "id": "...",
    "surveyId": "...",
    "receiverId": "...",
    "receiverEmail": "admin@example.com",
    "type": "SEND",
    "subject": "[Project Survey] PS-2026-00001 — คำร้องใหม่รอ Review",
    "message": "...",
    "isRead": false,
    "sentAt": "2026-07-13T08:00:00.000Z"
  }
]
```

USER เห็นเฉพาะ notification ของตัวเอง — reviewer/admin เห็นทั้งหมด

---

### 24. `PATCH /api/project-surveys/notifications/:notificationId/read`

**Perm:** `VIEW` → `200`

**Response `data`:** notification row ที่ `isRead: true`

---

## หน้าจอแนะนำ → API

| หน้า | API |
|------|-----|
| Dropdown Request To | `GET /request-to-users` |
| สร้างคำร้อง | `POST /` |
| รายการของฉัน | `GET /?mine=true` |
| Inbox A-DXC | `GET /inbox/review` |
| รายละเอียด | `GET /:id` |
| แก้ไข (SEND) | `PUT /:id` |
| Review form | `PUT /:id/review` (+ optional `PUT /costs`, `PUT /schedules`) |
| อนุมัติ | `POST /:id/approve` |
| Tab Comments | `GET/POST /:id/comments` |
| Tab Attachments | `GET/POST/DELETE /:id/attachments` |
| Tab History | `GET /:id/history`, `GET /:id/actions` |
| Markdown editor | `POST /:id/content-images` → embed url → `PUT /:id` |

---

## Review vs Schedule summary

| | `review.estimateSchedule` | `schedules[]` |
|--|----------------------------|---------------|
| ระดับ | สรุปทั้งโครงการ (ข้อความ) | รายละเอียดทีละ phase |
| ตัวอย่าง | `"3 เดือน"` | job + process + planType + วันที่ |
| ใครกรอก | A-DXC ตอน REVIEW | USER + A-DXC (แยก `source`) |
