# SKILL.md — Project Conventions & Shared Practices

> คู่มือนี้ใช้ร่วมกันทั้งโปรเจค ทุกคนต้องปฏิบัติตามเพื่อให้โค้ดสอดคล้องกัน

> สำหรับ pattern การสร้าง UI (Card, Button, Table, Tab, Badge, etc.) ดูที่ **[DESIGN.md](./DESIGN.md)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC) |
| UI | React 19 + shadcn/ui (style: base-nova) |
| Styling | Tailwind CSS v4 + CSS Variables |
| Forms | React Hook Form + Zod v4 |
| State | Zustand v5 |
| 3D / Animation | Three.js, @react-three/fiber, Framer Motion, GSAP |
| Icons | Lucide React |
| Real-time | Socket.io Client |
| Auth | Custom JWT (API: `process.env.API_URL`) |
| Language | TypeScript 5 (strict) |

---

## 1. shadcn/ui

### การติดตั้ง Component ใหม่
```bash
npx shadcn@latest add <component-name>
```
Components จะถูกเพิ่มใน `components/ui/` อัตโนมัติ — ห้ามคัดลอกโค้ด shadcn ด้วยมือ

### Config (components.json)
- **style**: `base-nova`
- **baseColor**: `neutral`
- **cssVariables**: `true`
- **iconLibrary**: `lucide`
- **aliases**: `@/components`, `@/lib`, `@/components/ui`, `@/hooks`

### การใช้งาน
```tsx
// ถูก — import จาก @/components/ui/
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ผิด — ห้าม import จาก radix-ui โดยตรงถ้ามี shadcn wrapper แล้ว
import { Root } from "@radix-ui/react-dialog"
```

### ปรับแต่ง Component
แก้ไขได้ในไฟล์ `components/ui/<component>.tsx` โดยตรง — shadcn components เป็น source ของโปรเจค ไม่ใช่ package

### Variants ด้วย CVA (class-variance-authority)
```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "...",
      destructive: "...",
    },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
})
```

---

## 2. Styling — Tailwind CSS v4

### กฎสำคัญ
- ใช้ **CSS Variables** เสมอสำหรับสี — ห้าม hardcode สีพื้นฐาน
- Tailwind v4 ไม่มี `tailwind.config.ts` — config ทำใน `app/globals.css` ด้วย `@theme`
- ใช้ `cn()` จาก `@/lib/utils` ทุกครั้งที่ต้องผสม class

```tsx
import { cn } from "@/lib/utils"

// ถูก
<div className={cn("base-class", isActive && "active-class", className)} />

// ผิด
<div className={`base-class ${isActive ? "active-class" : ""}`} />
```

### Dark Mode
- ใช้ `dark:` prefix — next-themes จัดการ class `dark` บน `<html>` อัตโนมัติ
- ห้าม detect dark mode ด้วย `useEffect` / `matchMedia` — ใช้ CSS แทน

### Custom Theme Presets
- Theme presets อยู่ใน `lib/management/themes.ts`
- ใช้ `ThemePresetProvider` + `useThemePreset()` สำหรับ switch theme

---

## 3. Forms — React Hook Form + Zod

### Pattern มาตรฐาน
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
})

type FormValues = z.infer<typeof schema>

export function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: FormValues) { /* ... */ }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>อีเมล</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### Server Actions + useActionState
```tsx
// ใช้ Server Actions กับ useActionState สำหรับ form ที่ต้องการ server-side
import { useActionState } from "react"
import { loginAction } from "@/lib/auth/actions"

const [state, action, isPending] = useActionState(loginAction, initialState)
```

---

## 4. State Management — Zustand v5

### โครงสร้าง Store
```
lib/stores/
  auth-store.ts       — Authentication state
  menu-store.ts       — Navigation menus
  menu-badges-store.ts — Badge counts
  sidebar-ui-store.ts — Sidebar collapse state
  chat-ui-store.ts    — Chat UI state
  notification-store.ts
  theme-preset-store.ts
  login-ui-store.ts
```

### Pattern มาตรฐาน
```ts
// lib/stores/my-store.ts
import { create } from "zustand"

interface MyState {
  count: number
  increment: () => void
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

### Re-export
```ts
// lib/store.ts — barrel export ทุก store ที่นี่
export { useMyStore } from "./stores/my-store"
```

### กฎการใช้ Zustand
- ใช้ **selector** เสมอเพื่อหลีกเลี่ยง re-render ที่ไม่จำเป็น
```tsx
// ถูก
const count = useMyStore((s) => s.count)

// ผิด (subscribe ทั้ง store)
const { count } = useMyStore()
```
- Store เก็บเฉพาะ **client state** — server data ใช้ Server Components / Server Actions
- ถ้า state ต้อง persist ให้ใช้ `zustand/middleware` persist พร้อม localStorage

---

## 5. Authentication

### Auth Flow
1. Login → `loginAction` (Server Action) → set `a_dxc_rt` cookie (refresh token)
2. Access token อยู่ใน memory (Zustand `auth-store`) เท่านั้น — ไม่เก็บใน localStorage
3. API calls ผ่าน `apiFetch<T>()` จาก `lib/auth/client.ts` — auto-refresh เมื่อได้รับ 401

### การดึงข้อมูล User
```tsx
// Server Component — ใช้ meAction
import { meAction } from "@/lib/auth/actions"

// Client Component — ใช้ store
import { useAuthStore } from "@/lib/store"
const user = useAuthStore((s) => s.user)
```

### ตรวจสอบ Role
```tsx
const user = useAuthStore((s) => s.user)
if (user?.role === "ADMIN") { /* ... */ }
```

### Protected Routes
Middleware (`middleware.ts`) จัดการ redirect อัตโนมัติ:
- Unauthenticated → `/login`
- Authenticated เข้า public → `/dashboard`

---

## 6. API Calls

### Client-side (ใน Client Components)
```tsx
import { apiFetch } from "@/lib/auth/client"

const data = await apiFetch<MyType>("/api/endpoint", {
  method: "POST",
  body: JSON.stringify(payload),
})
```

### Server-side (ใน Server Actions / Server Components)
```ts
import { AUTH_CONFIG } from "@/lib/auth/config"

const res = await fetch(`${AUTH_CONFIG.apiBaseUrl}/endpoint`, {
  headers: { Authorization: `Bearer ${accessToken}` },
})
```

### Environment Variables
```
API_URL=http://localhost:3001   # ใน .env.local
```
Access ใน server: `process.env.API_URL`
ห้าม expose ไปยัง client โดยไม่มี `NEXT_PUBLIC_` prefix

---

## 7. File & Folder Structure

```
app/
  (management)/       — Route group สำหรับหน้า dashboard ทั้งหมด
    dashboard/
    account/
    admin/
    security/
  login/
  layout.tsx          — Root layout (providers)
  page.tsx            — Landing page
  globals.css         — Global styles + Tailwind theme

components/
  ui/                 — shadcn components (อย่าเพิ่มโค้ด logic ที่นี่)
  management/         — Layout components สำหรับ management area
  <feature>.tsx       — Shared feature components

lib/
  auth/               — Auth logic ทั้งหมด (api, actions, config, types)
  api/                — API modules แยกตาม feature
  stores/             — Zustand stores
  management/         — Management UI config (nav, themes)
  utils.ts            — Shared utilities (cn, etc.)

hooks/                — Custom React hooks (use-*.ts)
```

---

## 8. TypeScript

### กฎสำคัญ
- **strict mode เปิดอยู่** — ห้ามใช้ `any` ถ้าไม่จำเป็น ใช้ `unknown` แทน
- Type definitions ที่ใช้ร่วมกันใน `lib/<feature>/types.ts`
- ใช้ `type` แทน `interface` สำหรับ union types และ mapped types
- ใช้ `interface` สำหรับ object shapes ที่อาจมีการ extend

```ts
// ถูก
type Role = "ADMIN" | "USER" | "MANAGER"
interface AuthUser {
  id: string
  email: string
  role: Role
}

// ผิด
const user: any = getUser()
```

### Path Aliases
```ts
import { cn } from "@/lib/utils"        // @/ = root
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store"
```

---

## 9. Icons

ใช้ **Lucide React** เท่านั้น — ห้ามใช้ icon library อื่น

```tsx
import { User, Settings, LogOut, ChevronRight } from "lucide-react"

// ขนาดมาตรฐาน: size-4 (16px), size-5 (20px), size-6 (24px)
<User className="size-4" />
<Settings className="size-5 text-muted-foreground" />
```

---

## 10. Animation

### ลำดับการเลือก (ใช้อันที่เบาที่สุดก่อน)
1. **CSS / Tailwind** — transition, animate-* (ไม่มี JS overhead)
2. **Framer Motion** — component-level animations, enter/exit
3. **GSAP** — timeline animations, scroll-triggered, complex sequences
4. **@react-three/fiber + drei** — 3D scenes เท่านั้น

```tsx
// Framer Motion — pattern มาตรฐาน
import { motion, AnimatePresence } from "framer-motion"

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
```

---

## 11. Fonts

ฟอนต์กำหนดใน `app/fonts.ts`:
- **Anuphan** — ภาษาไทย
- **Geist** — ภาษาอังกฤษ / code

ทั้งสองฟอนต์ถูก inject ผ่าน CSS variables บน `<body>` แล้ว — ใช้ `font-sans` ใน Tailwind ได้เลย

---

## 12. Real-time (Socket.io)

```tsx
import { useSocket } from "@/components/socket/socket-provider"

function MyComponent() {
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return
    socket.on("event-name", handler)
    return () => socket.off("event-name", handler)
  }, [socket])
}
```

Event types อยู่ใน `lib/socket/types.ts`

---

## 13. Toast Notifications

```tsx
import { useToast } from "@/components/ui/toast"

const { toast } = useToast()

toast({ title: "สำเร็จ", description: "บันทึกข้อมูลแล้ว", variant: "success" })
toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
```

---

## 14. Naming Conventions

| สิ่งที่ตั้งชื่อ | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Component | PascalCase | `UserAvatar`, `AccountForm` |
| Hook | camelCase + `use` prefix | `useLogout`, `useMediaQuery` |
| Store | camelCase + `use` + `Store` | `useAuthStore` |
| File (component) | kebab-case | `user-avatar.tsx` |
| File (util/hook) | kebab-case | `use-logout.ts` |
| Server Action | camelCase + `Action` | `loginAction`, `meAction` |
| Zod Schema | camelCase + `Schema` | `loginSchema` |
| Type / Interface | PascalCase | `AuthUser`, `MenuNode` |

---

## 15. Server vs Client Components

```tsx
// Server Component (default) — ไม่มี "use client"
// - ดึงข้อมูลจาก server ได้โดยตรง
// - ลด bundle size
// - ใช้ async/await ได้

// Client Component — ต้องใส่ "use client" บรรทัดแรก
"use client"
// - ใช้ useState, useEffect, event handlers
// - ใช้ browser APIs
// - ใช้ Zustand stores
```

**กฎ**: ให้เป็น Server Component ก่อนเสมอ เพิ่ม `"use client"` เมื่อจำเป็นเท่านั้น

---

## 16. Do's and Don'ts

### Do
- ใช้ `cn()` ทุกครั้งที่ผสม class
- ใช้ Server Actions สำหรับ mutation แทน API routes ถ้าทำได้
- ใช้ Zod validate input ทุก form และทุก Server Action
- ใช้ `size-*` class แทน `w-* h-*` สำหรับ square elements
- Export types ร่วมกันใน `lib/<feature>/types.ts`

### Don't
- ห้าม hardcode สี (`text-blue-500`) — ใช้ semantic colors (`text-primary`, `text-muted-foreground`)
- ห้าม `console.log` ใน production code
- ห้าม `any` type ถ้าไม่จำเป็น
- ห้ามสร้าง component ใน `components/ui/` ด้วยมือ — ใช้ shadcn CLI
- ห้าม fetch ข้อมูลใน Client Component โดยตรงถ้าสามารถใช้ Server Component ได้
