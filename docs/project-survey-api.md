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
USER สร้าง ──► DRAFT ──► (submit) ──► SEND ──► (requestTo เปิดหน้า / start-review) ──► REVIEW ──► (approve) ──► APPROVE
                                        │                                              │
                                        └──────────── (A-DXC reject) ─────────────────┴──► REJECT
                                                                                             │
                                          ◄── (USER แก้ + resubmit → SEND) ──────────────────┘

แก้ไข + ลบ (USER เจ้าของ): เฉพาะ DRAFT และ REJECT — REJECT แก้แล้ว submit ใหม่ได้ (resubmit)
```

| Status | ความหมาย |
|--------|----------|
| `DRAFT` | USER บันทึกร่าง — **ยังไม่แจ้ง requestTo** — **แก้/ลบได้** |
| `SEND` | USER ส่งแล้ว (เมลถึง `requestTo` แล้ว) — **แก้/ลบไม่ได้** รอ Super Admin เปิดดู |
| `REVIEW` | Super Admin เปิดแล้ว / กำลัง estimate — **แก้/ลบไม่ได้** |
| `APPROVE` | อนุมัติแล้ว — **lock ทุกอย่าง** |
| `REJECT` | A-DXC ปฏิเสธแล้ว (เหตุผลใน `reason`) — เจ้าของ **แก้/ลบได้** (แก้เพื่อส่งใหม่), comment ไม่ได้ |

**ลบ vs ปฏิเสธ vs ส่ง**

| การกระทำ | ใคร | เมื่อไหร่ | ผล |
|----------|-----|----------|-----|
| **บันทึกร่าง** | USER | สร้าง/แก้ `asDraft: true` | status = `DRAFT` — ไม่แจ้ง requestTo |
| **ส่งคำร้อง** | USER | `POST /:id/submit` หรือสร้างโดยไม่ใส่ `asDraft` | `DRAFT → SEND` + แจ้ง requestTo |
| **ส่งใหม่ (resubmit)** | USER (เจ้าของ) | `POST /:id/submit` ขณะ `REJECT` | `REJECT → SEND` + `resubmitCount++` + แจ้ง requestTo |
| **Delete** | USER (เจ้าของ) | `DRAFT` หรือ `REJECT` | ลบถาวร |
| **Reject** | A-DXC | `SEND` / `REVIEW` | `REJECT` + แจ้ง requester |

**Auto start review:** `GET /:id` ถ้า login เป็น `requestToId` และ status = `SEND` → backend เปลี่ยนเป็น `REVIEW` ทันที (ไม่ต้องเรียก `start-review` แยกก็ได้)

---

## Route summary (28 endpoints)

| # | Method | Path | Perm | ใครใช้ |
|---|--------|------|------|--------|
| 1 | GET | `/request-to-users` | CREATE | USER — dropdown Super Admin |
| 2 | GET | `/inbox/review` | UPDATE | A-DXC inbox |
| 3 | GET | `/` | VIEW | รายการ |
| 4 | POST | `/` | CREATE | USER สร้าง / บันทึกร่าง |
| 5 | GET | `/:id` | VIEW | รายละเอียด (+ auto REVIEW) |
| 6 | PUT | `/:id` | UPDATE | USER แก้ (DRAFT / REJECT) |
| 7 | DELETE | `/:id` | UPDATE/DELETE | **USER ลบ** (DRAFT / REJECT) |
| 8 | POST | `/:id/submit` | UPDATE | USER ส่งร่าง → SEND |
| 9 | POST | `/:id/start-review` | VIEW | `requestToId` เท่านั้น |
| 10 | PUT | `/:id/review` | UPDATE | A-DXC บันทึก review |
| 11 | POST | `/:id/approve` | UPDATE | A-DXC อนุมัติ (REVIEW) |
| 12 | POST | `/:id/reject` | UPDATE | **A-DXC ปฏิเสธ** (SEND / REVIEW) |
| 13 | GET | `/:id/comments` | VIEW | แสดง comment |
| 14 | POST | `/:id/comments` | UPDATE | เพิ่ม comment |
| 15 | DELETE | `/:id/comments/:commentId` | UPDATE | ลบ comment ตัวเอง |
| 16 | POST | `/:id/content-images` | UPDATE | รูป inline Markdown |
| 17 | GET | `/:id/attachments` | VIEW | ไฟล์แนบ |
| 18 | POST | `/:id/attachments` | UPDATE | อัปโหลด PDF/Excel |
| 19 | DELETE | `/:id/attachments/:attachmentId` | UPDATE | ลบไฟล์ |
| 20 | PUT | `/:id/costs` | UPDATE | A-DXC replace costs |
| 21 | PUT | `/:id/schedules` | UPDATE | A-DXC replace schedules |
| 22 | GET | `/:id/history` | VIEW | status history |
| 23 | GET | `/:id/actions` | VIEW | action log |
| 24 | GET | `/:id/audit-logs` | VIEW | audit (admin/reviewer) |
| 25 | GET | `/:id/notifications` | VIEW | notifications |
| 26 | PATCH | `/notifications/:notificationId/read` | VIEW | mark read |
| 27 | GET | `/ki-years` | VIEW/CREATE | dropdown ปี KI |
| 28 | GET | `/budget-types` | VIEW/CREATE | dropdown ประเภทงบประมาณ |

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
| Status | `DRAFT` `SEND` `REVIEW` `APPROVE` `REJECT` |
| TypeSystem | `AS400` `NON_AS400` |
| BudgetType (code) | `ORIGINAL` `OUT` `LOWERING` |
| CostCategory | `HARDWARE` `SOFTWARE` `OUTSOURCE` `IN_HOUSE` |
| ScheduleJob | `REQUIREMENT` `DEVELOP` `START_USE` |
| ScheduleSource | `USER` `A_DXC` (response only) |
| ScheduleProcess (USER) | `U0` `J3` `J5` |
| ScheduleProcess (A-DXC) | `J0_J2` `J3` `J4` `J5` |
| SchedulePlanType | `ORIGINAL_PLAN` `REVISE_PLAN` `FORECAST_PLAN` `ACTUAL` |
| ActorRole | `USER` `A_DXC` |
| NotificationType (active) | `SEND` `REVIEW` `APPROVE` `REJECT` |
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
| **Requester (USER)** | `requesterId` / `createdById` | สร้าง / **แก้ (DRAFT, REJECT)** / **ลบ (DRAFT, REJECT)** / submit / comment |
| **Request To Primary** | `requestToId` | รับคำร้อง → auto REVIEW → estimate → approve / reject |
| **Request To CC** *(แผน)* | `requestToCcIds[]` | แจ้ง + ดูอย่างเดียว |
| **Responsible** *(แผน)* | `responsibleIds[]` | ถูกมอบหมาย parallel ตอน REVIEW |
| **Reviewer (A-DXC)** | `project_survey:UPDATE` | inbox / review / costs / schedules / **reject** |

### ปุ่มตาม status

| Status | USER (เจ้าของ) | Primary requestTo | CC *(แผน)* | A-DXC อื่น |
|--------|----------------|-----------------|------------|------------|
| `DRAFT` | Edit, Delete, Upload, Submit | ไม่เห็น | ไม่เห็น | ไม่เห็น |
| `SEND` | Comment (แก้/ลบไม่ได้) | เปิดดู → auto REVIEW, **Reject** | ดูอย่างเดียว | Inbox, **Reject** |
| `REVIEW` | อ่าน + Comment | Edit review, Approve, **Reject**, ตั้ง responsibles | ดู + Comment | Edit review*, **Reject** |
| `APPROVE` | อ่านอย่างเดียว | อ่านอย่างเดียว | อ่านอย่างเดียว | อ่านอย่างเดียว |
| `REJECT` | อ่าน (ดู `reason`) + **Edit, Delete** | อ่านอย่างเดียว | อ่านอย่างเดียว | อ่านอย่างเดียว |

\* ปัจจุบัน reviewer ที่มี UPDATE แก้ review ได้ — แผน: tighten approve ให้ primary เท่านั้น

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
| `kiId` | `GET /ki-years` | master data ทั้งหมด |
| `budgetTypeId` | `GET /budget-types` | master data ทั้งหมด |

| ตาราง | ค่า seed |
|-------|----------|
| `ki_years` | code `103`, `104`, `105` |
| `budget_types` | `ORIGINAL`, `OUT`, `LOWERING` |

### Request To flow (ปัจจุบัน — implement แล้ว)

> **ตอนนี้:** ต่อ 1 survey มี **`requestToId` คนเดียว** + `review.responsibleId` คนเดียว  
> **แผนถัดไป:** Primary + CC + Responsibles หลายคน — ดู [หลายทีม (แผนพัฒนา)](#request-to--หลายทีม-แผนพัฒนา)

1. USER สร้างพร้อม `requestToId` (Super Admin) → status `SEND`
2. ระบบส่ง in-app notification + **อีเมล** ลิงก์ `{APP_PUBLIC_URL}/project-survey/{id}` ไปหา `requestToId`
3. `requestToId` เปิดหน้า (`GET /:id`) หรือ `POST /:id/start-review` → status `REVIEW`
4. แจ้ง requester ว่าเริ่ม review แล้ว
5. เปลี่ยน `requestToId` ขณะ SEND → ส่ง email ใหม่ไปคนใหม่

---

## Request To — หลายทีม (แผนพัฒนา)

> **สถานะ:** ยัง **ไม่ implement** ใน API — เอกสารนี้กำหนด spec ให้ frontend/backend ออกแบบร่วมกัน  
> **Use case:** งานข้ามหลายทีม — มีหัวหน้าทีมหลายคน (CC) และผู้รับผิดชอบหลายคน (ทำงานพร้อมกัน)

### Business rules (ยืนยันแล้ว)

| # | Rule |
|---|------|
| 1 | หัวหน้าทีมเพิ่มเติม = **CC เท่านั้น** — แจ้ง + ดูเอกสารได้ **ไม่** รับเรื่องหลัก / **ไม่** ต้อง acknowledge |
| 2 | **Primary `requestToId` คนเดียว** — เปิดหน้า / start-review → `SEND → REVIEW` (เหมือนปัจจุบัน) |
| 3 | **ผู้รับผิดชอบหลายคน** — มอบหมายตอน REVIEW, **ทำงาน parallel** (พร้อมกัน ไม่รอลำดับ) |
| 4 | **Approve** ได้เฉพาะ **Primary `requestToId`** — CC และ responsible กด approve ไม่ได้ |

### โมเดลข้อมูล (แผน)

```text
project_surveys
├── requestToId              ← Primary Super Admin (มีแล้ว) — รับเรื่อง, start REVIEW, approve
└── ...

project_survey_request_to_cc   ← ใหม่ (M:N)
├── surveyId
└── userId                   Super Admin — แจ้งอย่างเดียว (CC)

project_survey_responsibles    ← ใหม่ (M:N)
├── surveyId
├── userId
└── (optional) sortOrder

project_survey_reviews
└── responsibleId            ← อาจ deprecate หรือเก็บเป็น lead ย่อย — ใช้ responsibles[] เป็นหลัก
```

### บทบาทหลัง implement

| Role | จำนวน | สิ่งที่ทำได้ |
|------|--------|-------------|
| **Primary `requestToId`** | 1 | Email + notification, inbox, เปิด → REVIEW, แก้ review/costs/schedules, ตั้ง responsibles, **approve** |
| **CC `requestToCcIds[]`** | 0..N | Email + notification, **VIEW** — **ไม่** start REVIEW, **ไม่** approve, **ไม่** แก้ review |
| **Responsible `responsibleIds[]`** | 0..N | ถูกมอบหมายโดย Primary ตอน REVIEW — ทำงาน parallel, comment/upload (ตาม rule), **ไม่** approve |
| **Requester (USER)** | 1 | สร้าง/แก้-ลบ (DRAFT, REJECT), submit, ดู REVIEW/APPROVE |

### API ที่วางแผน (ยังไม่มี)

#### Create / Update (SEND)

```json
{
  "projectName": "...",
  "requestToId": "clx_primary_super_admin",
  "requestToCcIds": ["clx_super_admin_2", "clx_super_admin_3"],
  "...": "..."
}
```

| Field | Required | หมายเหตุ |
|-------|----------|----------|
| `requestToId` | ใช่ | Primary — Super Admin |
| `requestToCcIds` | ไม่ | array user id — Super Admin, **ห้ามซ้ำ primary** |

#### SurveyDetail (response เพิ่ม)

```json
{
  "requestToId": "clx_primary",
  "requestTo": { /* UserMini */ },
  "requestToCc": [
    { "id": "...", "firstName": "...", "lastName": "...", "nickname": null, "avatarUrl": null, "email": "..." }
  ],
  "responsibles": [
    { "id": "...", "userId": "...", "user": { /* UserMini */ }, "sortOrder": 0 }
  ],
  "review": { "responsibleId": "...", "...": "..." }
}
```

> `review.responsibleId` (เดิม) อาจคงไว้ช่วง transition — frontend ใช้ `responsibles[]` เป็นหลักเมื่อ implement แล้ว

#### Review body (`PUT /:id/review`)

```json
{
  "estimateCost": 120000,
  "estimateSchedule": "3 เดือน",
  "responsibleIds": ["clx_admin_a", "clx_admin_b", "clx_admin_c"],
  "comment": "...",
  "costs": [],
  "schedules": []
}
```

- `responsibleIds` — replace ทั้งชุด, ตั้งได้เฉพาะ Primary (`requestToId`) ตอน REVIEW
- แต่ละ responsible ทำงาน **parallel** — ไม่มี state ลำดับ per person

#### Notifications / Email

| ผู้รับ | เมื่อไหร่ | เนื้อหา |
|--------|----------|---------|
| Primary | สร้าง / เปลี่ยน primary | ลิงก์เปิด review (เหมือนปัจจุบัน) |
| CC | สร้าง / เปลี่ยน CC list | แจ้งว่าถูก CC — ลิงก์ **ดูอย่างเดียว** (ไม่ trigger REVIEW) |
| Responsible | Primary มอบหมายตอน REVIEW | แจ้งว่าได้รับมอบหมาย |
| Requester | Primary start REVIEW / approve | เหมือนปัจจุบัน |

#### Approve (`POST /:id/approve`) — rule ใหม่

| ปัจจุบัน | แผน |
|----------|-----|
| ใครมี `project_survey:UPDATE` กดได้ | **เฉพาะ** `ctx.userId === survey.requestToId` |

**403** ถ้า CC หรือ responsible พยายาม approve:

```json
{
  "status": "ERROR",
  "message": "Only the primary request-to user can approve",
  "code": "FORBIDDEN"
}
```

#### Access control (แผน)

| Action | Primary | CC | Responsible | Requester |
|--------|---------|-----|-------------|-------------|
| VIEW detail | ✓ | ✓ | ✓ | ✓ (owner) |
| Start REVIEW | ✓ | ✗ | ✗ | ✗ |
| Edit review / costs / schedules | ✓ | ✗ | ✗* | ✗ |
| Set responsibles | ✓ | ✗ | ✗ | ✗ |
| Approve | ✓ | ✗ | ✗ | ✗ |
| Comment | ✓ | ✓ | ✓ | ✓ |

\* responsible อาจ comment/upload ตาม rule ที่กำหนดเพิ่ม — ยังไม่ lock scope

### UI แนะนำ (หลายทีม)

```
[ สร้างคำร้อง ]
  Request To (Primary)*     [ single-select Super Admin ]
  CC หัวหน้าทีมอื่น         [ multi-select Super Admin — ไม่รวม primary ]

[ หน้า Detail — ฝั่ง Admin ]
  ┌─ Primary ─────────────────────────────┐
  │ สมชาย (IT Lead)    [ Approve ]        │  ← ปุ่ม approve เฉพาะ primary
  └───────────────────────────────────────┘
  ┌─ CC (อ่านอย่างเดียว) ─────────────────┐
  │ สมหญิง, สมศักดิ์                       │
  └───────────────────────────────────────┘
  ┌─ Responsible (parallel) ──────────────┐
  │ คน A · คน B · คน C                     │  ← ตั้งโดย primary ตอน REVIEW
  └───────────────────────────────────────┘
```

### สิ่งที่ไม่ทำ (ตาม business rules)

- ไม่ให้ CC start REVIEW หรือ approve
- ไม่รอ CC acknowledge ครบก่อน REVIEW
- ไม่ใช้ workflow ลำดับ responsible (คนที่ 2 เริ่มหลังคนที่ 1 จบ)
- ไม่ขยาย `requestToId` เป็น array — แยก **Primary** กับ **CC** ชัดเจน

### เปรียบเทียบ ปัจจุบัน vs แผน

| หัวข้อ | ปัจจุบัน | แผน |
|--------|----------|-----|
| หัวหน้ารับเรื่อง | `requestToId` ×1 | Primary ×1 + CC ×N |
| ผู้รับผิดชอบ | `review.responsibleId` ×1 | `responsibleIds[]` ×N (parallel) |
| Approve | reviewer ที่มี UPDATE | **Primary เท่านั้น** |
| CC notification | ไม่มี | email + in-app |

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

### 2. `POST /api/project-surveys` — สร้าง / บันทึกร่าง / ส่ง

**Perm:** `CREATE` → `201`

| โหมด | Body | ผล |
|------|------|-----|
| **ส่งทันที** (default) | ไม่ใส่ `asDraft` + ต้องมี `requestToId` | status = `SEND` + notify/email ไป requestTo |
| **บันทึกร่าง** | `"asDraft": true` | status = `DRAFT` — **ไม่แจ้ง requestTo** (`requestToId` ใส่หรือไม่ใส่ก็ได้) |

**Body (required):** `projectName`, `branchId`, `departmentId`, `kiId`, `typeSystem`, `budgetTypeId`

**Body (optional):** `requestToId`, `asDraft`, `request`, `changePoint`, `detail`, `costs`, `schedules`

```json
{
  "projectName": "ระบบจองห้องประชุม",
  "branchId": "clx_branch",
  "departmentId": "clx_dept",
  "kiId": "clx_ki",
  "typeSystem": "NON_AS400",
  "budgetTypeId": "clx_budget",
  "asDraft": true,
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

**Response `data`:** `SurveyDetail` (`status: "DRAFT"` หรือ `"SEND"`)

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
**เมื่อไหร่:** status = **`DRAFT` หรือ `REJECT`** เท่านั้น — `SEND` / `REVIEW` / `APPROVE` แก้ไม่ได้ (เมลถึง requestTo แล้ว)

**Body:** partial ของ create (อย่างน้อย 1 field)

- `costs` / `schedules` → replace ชุด USER (`source = USER`)
- แก้ REJECT = แก้เพื่อส่งใหม่ (resubmit) — ดู flow การส่งใหม่ที่ `POST /:id/submit`
- **INVALID_STATUS** ถ้า status = `SEND` / `REVIEW` / `APPROVE`

**Response `data`:** `SurveyDetail`

---

### 7. `DELETE /api/project-surveys/:id` — USER ลบคำร้อง

**Perm:** `UPDATE` หรือ `DELETE`  
**ใคร:** **เจ้าของ** (`requesterId` / `createdById`) หรือ admin  
**เมื่อไหร่:** status = **`DRAFT` หรือ `REJECT`** เท่านั้น

> ลบร่างที่ยังไม่ได้ส่ง หรือเก็บกวาดคำร้องที่ถูกปฏิเสธ — **`SEND` / `REVIEW` / `APPROVE` ลบไม่ได้**  
> ไม่ใช่ reject — ลบถาวรจากระบบ  
> A-DXC ปฏิเสธใช้ `POST /:id/reject` แทน  
> **INVALID_STATUS** ถ้า status = `SEND` / `REVIEW` / `APPROVE`

**สิ่งที่ถูกลบ (hard delete):**

- คำร้อง + costs / schedules / reviews / comments / history / actions / notifications
- ไฟล์แนบ (Document + ไฟล์ใน `media/project-surveys/attachments/`)
- รูป inline Markdown (`media/project-surveys/content/`)

**สิ่งที่เก็บไว้ (compliance):**

- **`project_survey_audit_logs`** — ยังอยู่ใน DB หลังลบ (`surveyId` → `null`, ค้นหาด้วย `docNo` / `recordId`)
- ก่อนลบจะเขียน audit แถว `DELETE` พร้อม snapshot (`docNo`, `projectName`, `status`, …)

> หลังลบแล้ว `GET /:id/audit-logs` ใช้ไม่ได้ (survey ไม่มีแล้ว) — admin ค้นจาก audit table โดย `docNo`

**Response `data`:**

```json
{ "ok": true }
```

---

### 8. `POST /api/project-surveys/:id/submit` — USER ส่งร่าง / ส่งใหม่

**Perm:** `UPDATE` + **เจ้าของเอกสาร**  
**เมื่อไหร่:** status = **`DRAFT` หรือ `REJECT`**

**Body (optional):**

```json
{ "requestToId": "clx_super_admin" }
```

- ต้องมี `requestToId` — ส่งใน body หรือบันทึกไว้บน survey แล้ว
- **`DRAFT → SEND`** = ส่งครั้งแรก
- **`REJECT → SEND`** = ส่งใหม่หลังแก้ (resubmit) → `resubmitCount++`, เคลียร์ `reason`
- ทั้งสองกรณี notify/email ไป requestTo
- **INVALID_STATUS** ถ้า status = `SEND` / `REVIEW` / `APPROVE`

**Response `data`:** `SurveyDetail` (`status: "SEND"`)

---

### 9. `POST /api/project-surveys/:id/start-review`

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

> **ปัจจุบัน:** reviewer ที่มี `UPDATE` กด approve ได้  
> **แผน:** เฉพาะ **Primary `requestToId`** — ดู [Approve rule](#approve-post-idapprove--rule-ใหม่)

**Body (optional):**

```json
{ "remark": "อนุมัติตาม scope ที่ปรับ" }
```

**Response `data`:** `SurveyDetail` (`status: "APPROVE"`)  
แจ้ง requester ทาง notification + email

---

### 11. `POST /api/project-surveys/:id/reject` — A-DXC ปฏิเสธ

**Perm:** `UPDATE`  
**ใคร:** reviewer ที่มี `project_survey:UPDATE`  
**เมื่อไหร่:** status = `SEND` หรือ `REVIEW`

**Body (required):**

```json
{ "reason": "scope ไม่ชัด / ไม่อยู่ในแผน KI ปีนี้" }
```

**Response `data`:** `SurveyDetail` (`status: "REJECT"`, `reason` ตาม body)  
แจ้ง requester ทาง notification + email

**Errors**

| Code | เมื่อไหร่ |
|------|----------|
| `INVALID_INPUT` | ไม่ส่ง `reason` |
| `INVALID_STATUS` | status = `APPROVE` หรือ `REJECT` แล้ว |

---

### 12–14. Comments

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
ห้าม comment เมื่อ status = `APPROVE` หรือ `REJECT`
`role` ตั้งโดย server (`USER` / `A_DXC`)

#### `DELETE /:id/comments/:commentId` → `200`

**Response `data`:** `{ "ok": true }` — ลบได้เฉพาะ comment ของตัวเอง

---

### 14. `POST /:id/content-images` — รูป Markdown

**Perm:** `UPDATE`  
**เมื่อไหร่:** status = **`DRAFT` หรือ `REJECT`** + เจ้าของเอกสาร (ตรงกับหน้าต่างที่แก้ไขได้)  
**Content-Type:** `multipart/form-data` field **`file`**  
**ไฟล์:** `.jpg` `.jpeg` `.png` `.webp` `.gif`

> ⚠️ **ต้องแก้:** ปัจจุบัน backend ยังยอมเฉพาะ `SEND` → ตอบ `403 FORBIDDEN`
> ("Cannot upload content image in current status") เมื่ออัปโหลดตอน DRAFT/REJECT
> ซึ่งทำให้แทรกรูปไม่ได้เลย เพราะ SEND แก้ไขไม่ได้แล้ว

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
**อนุญาต:** USER (เจ้าของ) ที่ **`DRAFT` / `REJECT`** | A-DXC ที่ `REVIEW`

> ⚠️ **ต้องแก้:** ปัจจุบัน backend ยอมฝั่ง USER เฉพาะ `SEND` — ต้องเปลี่ยนเป็น `DRAFT` / `REJECT`
> ให้ตรงกับหน้าต่างที่แก้ไขได้ (เหมือน `DELETE /:id/attachments/:attachmentId`)

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
    "readAt": null,
    "sentAt": "2026-07-13T08:00:00.000Z"
  }
]
```

USER เห็นเฉพาะ notification ของตัวเอง — reviewer/admin เห็นทั้งหมด

---

### 24. `PATCH /api/project-surveys/notifications/:notificationId/read`

**Perm:** `VIEW` → `200`

**Response `data`:** notification row ที่ `isRead: true` + `readAt` เป็นเวลาที่กดอ่านครั้งแรก (เรียกซ้ำไม่ทับค่าเดิม)

---

### 25. `GET /api/project-surveys/ki-years`

**Perm:** `VIEW` หรือ `CREATE` → `200`

**Response `data`:**

```json
[
  { "id": "clx_...", "code": 104, "name": "Ki 104" }
]
```

---

### 26. `GET /api/project-surveys/budget-types`

**Perm:** `VIEW` หรือ `CREATE` → `200`

**Response `data`:**

```json
[
  { "id": "clx_...", "code": "ORIGINAL", "name": "Original" }
]
```

---

## หน้าจอแนะนำ → API

| หน้า | API |
|------|-----|
| Dropdown Request To (Primary) | `GET /request-to-users` |
| CC / Responsibles *(แผน)* | `requestToCcIds[]`, `responsibleIds[]` — ดู [หลายทีม](#request-to--หลายทีม-แผนพัฒนา) |
| Dropdown ปี KI / งบประมาณ | `GET /ki-years`, `GET /budget-types` |
| สร้างคำร้อง (ส่งทันที) | `POST /` |
| บันทึกร่าง | `POST /` + `"asDraft": true` |
| ส่งร่าง | `POST /:id/submit` |
| รายการของฉัน (รวม draft) | `GET /?mine=true` |
| Inbox A-DXC | `GET /inbox/review` |
| รายละเอียด | `GET /:id` |
| แก้ไข (DRAFT / REJECT) | `PUT /:id` |
| Review form | `PUT /:id/review` (+ optional `PUT /costs`, `PUT /schedules`) |
| อนุมัติ | `POST /:id/approve` |
| ปฏิเสธ (A-DXC) | `POST /:id/reject` |
| ลบ (USER, DRAFT / REJECT) | `DELETE /:id` |
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
