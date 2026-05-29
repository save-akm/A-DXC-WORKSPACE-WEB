# DESIGN.md — UI Component Patterns

> Reference นี้สำหรับสร้าง UI ให้สอดคล้องกันทั้งโปรเจค  
> ก่อนสร้าง component ใดๆ ให้อ่านส่วนที่เกี่ยวข้องก่อนเสมอ

---

## สารบัญ

1. [Button](#1-button)
2. [Card](#2-card)
3. [Table](#3-table)
4. [Tab / Pill Filter](#4-tab--pill-filter)
5. [Input & Form Field](#5-input--form-field)
6. [Badge](#6-badge)
7. [StatCard](#7-statcard)
8. [ActionMenu](#8-actionmenu)
9. [Pagination](#9-pagination)
10. [Page Header](#10-page-header)
11. [Empty State](#11-empty-state)
12. [Animation Helpers](#12-animation-helpers)

---

## 1. Button

**Import:** `@/components/ui/button`

### Variants

| Variant | ใช้เมื่อ | ผล |
|---|---|---|
| `default` | Primary action ทั่วไป | Solid primary color |
| `outline` | Secondary action | Border + bg |
| `secondary` | ตัวเลือกรอง | Muted solid |
| `ghost` | Icon buttons, subtle actions | Transparent hover |
| `destructive` | ลบ/ยกเลิกที่อันตราย | Rose tint |
| `link` | Navigation inline | Underline |
| `save` | บันทึก / Submit | Emerald gradient |
| `cancel` | ยกเลิก / กลับ | Muted border |
| `delete` | ลบข้อมูล | Rose-Red gradient |
| `create` | สร้างใหม่ / Invite | Violet-Fuchsia gradient |

### Sizes

| Size | Height | ใช้เมื่อ |
|---|---|---|
| `xs` | h-6 | Dense UI, chip-like actions |
| `sm` | h-7 | Secondary toolbar |
| `default` | h-8 | **Standard — ใช้เป็นหลัก** |
| `lg` | h-9 | Primary CTA, header buttons |
| `icon` | 32×32 | Icon-only square |
| `icon-sm` | 28×28 | Dense icon button |
| `icon-xs` | 24×24 | Micro icon button |

### ตัวอย่างการใช้งาน

```tsx
import { Button } from "@/components/ui/button"
import { UserPlus, Save, Trash2, X } from "lucide-react"

// Primary CTA — สร้าง/เชิญ
<Button variant="create" size="lg">
  <UserPlus />
  Invite User
</Button>

// บันทึกฟอร์ม
<Button variant="save">
  <Save />
  บันทึก
</Button>

// ยกเลิก
<Button variant="cancel">
  <X />
  ยกเลิก
</Button>

// ลบ
<Button variant="delete">
  <Trash2 />
  ลบ
</Button>

// Icon-only
<Button variant="ghost" size="icon-sm">
  <MoreHorizontal size={14} />
</Button>
```

### กฎ
- ทุก Button ต้องมี `cursor-pointer` ถ้าเป็น interactive element ใน table/card
- Icon ใน Button ไม่ต้องกำหนด `className="size-*"` — CVA จัดการให้
- ปุ่มคู่ Cancel+Save เรียงตามลำดับ: Cancel ซ้าย, Save ขวาเสมอ

---

## 2. Card

**Import:** `@/components/ui/card`

### Anatomy

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "@/components/ui/card"

<Card>                         {/* bg-card, rounded-xl, ring-1 */}
  <CardHeader>                 {/* px-4, grid layout, รองรับ CardAction */}
    <CardTitle>หัวข้อ</CardTitle>
    <CardDescription>คำอธิบาย</CardDescription>
    <CardAction>               {/* col-start-2, align right */}
      <Button variant="ghost" size="icon-sm">...</Button>
    </CardAction>
  </CardHeader>
  <CardContent>                {/* px-4 */}
    ...
  </CardContent>
  <CardFooter>                 {/* border-t, bg-muted/50 */}
    ...
  </CardFooter>
</Card>
```

### Sizes

```tsx
<Card size="default">  {/* gap-4, py-4, px-4 */}
<Card size="sm">       {/* gap-3, py-3, px-3 — dense lists */}
```

### Pattern: Card ที่ครอบ Table

```tsx
<Card className="overflow-hidden">
  <CardContent className="p-0">
    <Table>...</Table>
    <Pagination ... />   {/* ต่อท้าย Table เสมอ */}
  </CardContent>
</Card>
```

### Pattern: Card ที่มี Gradient Banner (Grid View)

```tsx
<Card className="group overflow-hidden transition-shadow hover:shadow-md">
  <CardContent className="p-0">
    {/* Banner */}
    <div className={cn("h-20 bg-gradient-to-br to-transparent opacity-80", user.bannerGradient)} />
    {/* Content offset ขึ้นมาทับ banner */}
    <div className="-mt-10 px-4 pb-4">
      <UserAvatar className="ring-2 ring-card" />
      ...
    </div>
  </CardContent>
</Card>
```

### Pattern: StatCard (ดูหัวข้อ 7 สำหรับ full pattern)

```tsx
<Card className="overflow-hidden border-0 shadow-sm">
  <CardContent className="p-0">
    <div className="flex items-center gap-3 p-4">...</div>
    <div className={cn("h-0.5 w-full bg-gradient-to-r", gradient)} />  {/* gradient bar ล่างสุด */}
  </CardContent>
</Card>
```

### กฎ
- ใช้ `ring-1 ring-foreground/10` จาก base — ห้าม override ด้วย `border`
- ถ้าไม่มี `CardHeader` ให้ใส่ชื่อใน `CardContent` แทน
- Table ที่อยู่ใน Card ต้องใช้ `CardContent className="p-0"`

---

## 3. Table

**Import:** `@/components/ui/table`

### Anatomy

```tsx
import {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption
} from "@/components/ui/table"

<Card className="overflow-hidden">
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-10 pl-4 text-xs">#</TableHead>
          <TableHead className="text-xs">ชื่อ</TableHead>
          <TableHead className="hidden text-xs md:table-cell">แผนก</TableHead>
          <TableHead className="w-10 pr-4" />   {/* คอลัมน์ action */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, i) => (
          <TableRow key={item.id}>
            <TableCell className="pl-4 text-xs text-muted-foreground">{i + 1}</TableCell>
            <TableCell>...</TableCell>
            <TableCell className="hidden md:table-cell">...</TableCell>
            <TableCell className="pr-4">
              <ActionMenu actions={[...]} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Pagination ... />
  </CardContent>
</Card>
```

### Responsive Columns

```tsx
// แสดงทุก breakpoint
<TableHead className="text-xs">Member</TableHead>

// ซ่อนบน mobile
<TableHead className="hidden text-xs sm:table-cell">Last Login</TableHead>
<TableHead className="hidden text-xs md:table-cell">Department</TableHead>
<TableHead className="hidden text-xs lg:table-cell">Branch</TableHead>
```

### Column ลำดับ (#)

```tsx
<TableHead className="w-10 pl-4 text-xs">#</TableHead>
...
<TableCell className="pl-4 text-xs text-muted-foreground">
  {(page - 1) * PAGE_SIZE + i + 1}
</TableCell>
```

### Column Action (ขวาสุด)

```tsx
<TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />   {/* header ว่าง */}
<TableCell className="pr-3 sm:pr-4">
  <ActionMenu actions={[...]} />
</TableCell>
```

### Member Cell (Avatar + ชื่อ)

```tsx
<TableCell>
  <div className="flex items-center gap-2 sm:gap-3">
    <UserAvatar avatarUrl={...} initial="A" color="bg-violet-500" size="sm" />
    <div className="min-w-0">
      <p className="truncate text-sm font-medium leading-tight">{firstName} {lastName}</p>
      <p className="text-xs text-muted-foreground">{employeeId}</p>
    </div>
  </div>
</TableCell>
```

### Animated Table Rows (Framer Motion)

```tsx
const MotionTableRow = motion.create(TableRow)

// ใน render:
{rows.map((row, i) => (
  <MotionTableRow
    key={row.id}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
  >
    ...
  </MotionTableRow>
))}
```

### Animated tbody บน Page Change

```tsx
<AnimatePresence mode="wait" initial={false}>
  <motion.tbody
    key={page}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18 }}
  >
    {rows}
  </motion.tbody>
</AnimatePresence>
```

### Empty State ใน Table

```tsx
{rows.length === 0 && (
  <tr>
    <td colSpan={N} className="py-20 text-center text-sm text-muted-foreground">
      ไม่พบข้อมูล
    </td>
  </tr>
)}
```

---

## 4. Tab / Pill Filter

> ไม่มี shadcn Tabs component — ใช้ pattern นี้แทน (มาจาก users page)

### Pill Filter Bar

```tsx
const OPTIONS = ["All", "Admin", "User"]
const [active, setActive] = useState("All")

<div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
  {OPTIONS.map((opt) => (
    <button
      key={opt}
      onClick={() => setActive(opt)}
      className={cn(
        "relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active === opt ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* Animated background — ต้องมี layoutId ที่ unique ต่อ group */}
      {active === opt && (
        <motion.span
          layoutId="my-tab-bg"
          className="absolute inset-0 -z-10 rounded-md bg-accent/70"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {opt}
    </button>
  ))}
</div>
```

### View Toggle (Icon-based)

```tsx
const [view, setView] = useState<"table" | "grid">("table")

<div className="flex shrink-0 items-center rounded-lg border border-border/60 bg-card/40 p-0.5">
  {(["table", "grid"] as const).map((v) => (
    <button
      key={v}
      onClick={() => setView(v)}
      className={cn(
        "relative z-10 flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors",
        view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {view === v && (
        <motion.span
          layoutId="view-tab-bg"
          className="absolute inset-0 -z-10 rounded-md bg-accent/70"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {v === "table" ? <List size={14} /> : <LayoutGrid size={13} />}
    </button>
  ))}
</div>
```

### กฎ
- `layoutId` ต้องไม่ซ้ำกันระหว่าง filter groups ใน page เดียวกัน
- ห้าม hardcode `bg-white` บน active tab — ใช้ `bg-accent/70` เสมอ
- ถ้ามีหลาย filter group ให้วางเรียงกันด้วย `flex items-center gap-2`

---

## 5. Input & Form Field

**Import:** `@/components/ui/input`, `@/components/ui/form`

### Input พื้นฐาน

```tsx
import { Input } from "@/components/ui/input"

<Input placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} />
```

### Search Input (มี Icon นำ)

```tsx
<div className="relative w-full sm:max-w-72">
  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <Input className="pl-8" placeholder="Search name, ID, email…" />
</div>
```

### Form Field มาตรฐาน (React Hook Form)

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"

<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>ชื่อฟิลด์</FormLabel>
      <FormControl>
        <Input placeholder="..." {...field} />
      </FormControl>
      <FormMessage />  {/* error message — ซ่อนอัตโนมัติเมื่อไม่มี error */}
    </FormItem>
  )}
/>
```

### Form Field + Leading Icon (FieldShell pattern)

```tsx
// pattern จาก account-form.tsx
<FormItem>
  <FormLabel>ชื่อผู้ใช้</FormLabel>
  <FormControl>
    <div className="relative">
      <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-8" {...field} />
    </div>
  </FormControl>
  <FormMessage />
</FormItem>
```

### Zod Schema มาตรฐาน

```tsx
import { z } from "zod"

const mySchema = z.object({
  name:     z.string().min(1, "กรุณากรอกชื่อ"),
  email:    z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirm"],
})

type FormValues = z.infer<typeof mySchema>
```

### Sticky Footer Actions

```tsx
// ปุ่ม save/cancel ติดด้านล่าง form — ใช้เมื่อ form ยาว
<div className="sticky bottom-3 z-10 flex justify-end gap-2 rounded-xl border bg-card/80 p-3 shadow-lg backdrop-blur-sm">
  <Button variant="cancel" type="button" onClick={() => form.reset()}>
    ยกเลิก
  </Button>
  <Button variant="save" type="submit" disabled={!form.formState.isDirty || isPending}>
    บันทึก
  </Button>
</div>
```

---

## 6. Badge

> ยังไม่มี shadcn Badge ใน project — ใช้ inline span pattern

### Role Badge Pattern (จาก role-badge.tsx)

```tsx
// ตัวอย่าง pattern สำหรับ badge ที่มีหลาย variant
const ROLE_STYLES: Record<string, string> = {
  "System":     "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Super Admin": "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  "Admin":      "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "User":       "bg-muted text-muted-foreground",
}

<span className={cn(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  ROLE_STYLES[role] ?? ROLE_STYLES["User"],
)}>
  {role}
</span>
```

### Status Badge (Dot + Text)

```tsx
// pattern จาก status-dot.tsx
const STATUS_STYLES = {
  active:   { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Active" },
  inactive: { dot: "bg-muted-foreground/40", text: "text-muted-foreground", label: "Inactive" },
}

<span className="inline-flex items-center gap-1.5">
  <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot)} />
  <span className={cn("text-xs font-medium", STATUS_STYLES[status].text)}>
    {STATUS_STYLES[status].label}
  </span>
</span>
```

### Location Badge (Map Pin)

```tsx
<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
  <MapPin size={9} />
  {branch}
</span>
```

---

## 7. StatCard

**Import:** `@/components/management/stat-card`

```tsx
import { StatCard } from "@/components/management/stat-card"
import { Users, Activity, Shield, MapPin } from "lucide-react"

// ใช้ใน grid เสมอ
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <StatCard icon={Users}    label="Total Members" value={42}  gradient="from-violet-500 to-fuchsia-500" />
  <StatCard icon={Activity} label="Active Now"    value={38}  gradient="from-emerald-500 to-teal-500"   />
  <StatCard icon={Shield}   label="Admins"        value={5}   gradient="from-sky-500 to-blue-600"       />
  <StatCard icon={MapPin}   label="Branches"      value={8}   gradient="from-amber-500 to-orange-500"   />
</div>
```

### Props

| Prop | Type | คำอธิบาย |
|---|---|---|
| `icon` | `LucideIcon` | Icon component จาก lucide-react |
| `label` | `string` | ชื่อ metric |
| `value` | `number` | ค่าตัวเลข |
| `gradient` | `string` | Tailwind gradient classes เช่น `"from-violet-500 to-fuchsia-500"` |

### Gradient Palette แนะนำ

```
from-violet-500 to-fuchsia-500   — Users / General
from-emerald-500 to-teal-500     — Active / Success
from-sky-500 to-blue-600         — Admin / Security
from-amber-500 to-orange-500     — Warning / Branches
from-rose-500 to-red-500         — Error / Delete count
from-pink-500 to-rose-500        — Notifications
from-indigo-500 to-violet-500    — Settings / Config
```

---

## 8. ActionMenu

**Import:** `@/components/management/action-menu`

```tsx
import { ActionMenu, type ActionItem } from "@/components/management/action-menu"
import { Pencil, Trash2, Eye } from "lucide-react"

<ActionMenu actions={[
  { label: "ดูรายละเอียด", icon: Eye,    onClick: () => handleView(id) },
  { label: "แก้ไข",        icon: Pencil, onClick: () => handleEdit(id) },
  { label: "ลบ",           icon: Trash2, destructive: true, onClick: () => handleDelete(id) },
]} />
```

### ActionItem Interface

```ts
interface ActionItem {
  label:       string
  icon:        LucideIcon
  destructive?: boolean    // แสดงด้วยสี destructive (rose)
  disabled?:   boolean
  onClick:     () => void
}
```

### กฎ
- Action ที่ destructive ต้องอยู่**ล่างสุด**เสมอ
- ใช้ `ActionMenu` แทนการสร้าง dropdown เอง — มี portal + click-outside built-in
- ใน Table ให้วางไว้ที่ `TableCell` สุดท้าย (ขวาสุด)

---

## 9. Pagination

**Import:** `@/components/management/pagination`

```tsx
import { Pagination } from "@/components/management/pagination"

const PAGE_SIZE = 10
const [page, setPage] = useState(1)
const totalPages = Math.ceil(items.length / PAGE_SIZE)
const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

// ใต้ Table (ใน CardContent p-0)
<Pagination
  page={page}
  totalPages={totalPages}
  total={items.length}
  pageSize={PAGE_SIZE}
  onChange={setPage}
  layoutId="my-page-active-bg"   // unique ต่อ page
  itemLabel="รายการ"
/>
```

### Props

| Prop | Type | คำอธิบาย |
|---|---|---|
| `page` | `number` | หน้าปัจจุบัน (1-indexed) |
| `totalPages` | `number` | จำนวนหน้าทั้งหมด |
| `total` | `number` | จำนวนรายการทั้งหมด |
| `pageSize` | `number` | รายการต่อหน้า |
| `onChange` | `(p: number) => void` | Callback เมื่อเปลี่ยนหน้า |
| `layoutId` | `string` | **ต้อง unique** ต่อ Pagination instance |
| `itemLabel` | `string?` | ชื่อ item เช่น "สมาชิก", "รายการ" |

### Reset page เมื่อ filter เปลี่ยน

```tsx
useEffect(() => { setPage(1) }, [search, roleFilter, deptFilter])
```

---

## 10. Page Header

### Standard Header Pattern

```tsx
// ใช้ใน management pages ทุกหน้า
<motion.div
  initial={{ opacity: 0, x: -12 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  className="flex items-start justify-between gap-3"
>
  <div>
    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">ชื่อหน้า</h1>
    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
      คำอธิบายหน้า
    </p>
  </div>
  <Button variant="create" size="lg" className="shrink-0">
    <PlusIcon />
    <span className="hidden sm:inline">สร้างใหม่</span>
    <span className="sm:hidden">ใหม่</span>
  </Button>
</motion.div>
```

### Page Wrapper

```tsx
// wrapper ทุก management page
<div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
  {/* Header */}
  {/* Stats (ถ้ามี) */}
  {/* Toolbar */}
  {/* Content */}
</div>
```

---

## 11. Empty State

### ใน Table

```tsx
<tr>
  <td colSpan={NUM_COLS} className="py-20 text-center text-sm text-muted-foreground">
    ไม่พบข้อมูล
  </td>
</tr>
```

### ใน Grid

```tsx
<div className="col-span-full py-20 text-center text-muted-foreground">
  ไม่พบข้อมูล
</div>
```

### Empty State พร้อม Icon (สำหรับหน้า full empty)

```tsx
<div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
  <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
    <InboxIcon size={20} className="text-muted-foreground" />
  </div>
  <div>
    <p className="text-sm font-medium">ยังไม่มีข้อมูล</p>
    <p className="text-xs text-muted-foreground">เริ่มต้นด้วยการสร้างรายการแรก</p>
  </div>
  <Button variant="create" size="sm">
    <PlusIcon />
    สร้างใหม่
  </Button>
</div>
```

---

## 12. Animation Helpers

### Constants

```tsx
const EASE = [0.4, 0, 0.2, 1] as const  // Material Design easing
```

### fadeUp (element เข้าจากด้านล่าง)

```tsx
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
})

// ใช้งาน
<motion.div {...fadeUp(0.08)}>...</motion.div>
```

### fadeLeft (element เข้าจากซ้าย)

```tsx
const fadeLeft = (delay = 0) => ({
  initial:    { opacity: 0, x: -12 },
  animate:    { opacity: 1, x: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
})

// ใช้งานกับ Page Header เสมอ
<motion.div {...fadeLeft(0)}>
  <h1>ชื่อหน้า</h1>
</motion.div>
```

### Staggered Children (delays เพิ่มทีละ 0.06s)

```tsx
// Section ล่างๆ delay มากขึ้น
<motion.div {...fadeUp(0.08)}><StatCard .../></motion.div>   // stats row 1
<motion.div {...fadeUp(0.14)}><StatCard .../></motion.div>   // stats row 2
<motion.div {...fadeUp(0.32)}>toolbar</motion.div>
<motion.div {...fadeUp(0.40)}>content</motion.div>
```

### AnimatePresence — View Switch (table ↔ grid)

```tsx
<AnimatePresence mode="wait">
  {view === "table" ? (
    <motion.div
      key="table"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* table content */}
    </motion.div>
  ) : (
    <motion.div key="grid" ...>
      {/* grid content */}
    </motion.div>
  )}
</AnimatePresence>
```

### AnimatePresence — Grid Cards

```tsx
<AnimatePresence mode="popLayout">
  {items.map((item, i) => (
    <motion.div
      key={`${item.id}-p${page}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, delay: i * 0.05 }}
    >
      <Card>...</Card>
    </motion.div>
  ))}
</AnimatePresence>
```

### motion.create() — ใช้ motion กับ custom component

```tsx
const MotionTableRow = motion.create(TableRow)

// ใช้งานเหมือน motion.div แต่ render เป็น TableRow
<MotionTableRow
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25, delay: i * 0.04 }}
>
  ...
</MotionTableRow>
```

---

## Quick Reference

```
สร้างหน้า List/Table ใหม่:
  Page Wrapper → Header → Stats (optional) → Toolbar (Search + Filters + View Toggle) → Card > Table > Pagination

สร้าง Form ใหม่:
  Form > FormField > FormItem > FormLabel + FormControl > Input + FormMessage → Sticky Footer Actions

สร้าง Card ใหม่:
  Card > CardHeader (Title + Description + Action) > CardContent > CardFooter (optional)

Badge:
  Role → span rounded-full + color/10 bg + color text
  Status → dot + text span
  Location → MapPin + muted bg rounded-full
```
