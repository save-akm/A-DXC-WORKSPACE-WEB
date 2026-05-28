"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  LayoutGrid,
  List,
  Shield,
  Building2,
  MapPin,
  Mail,
  Phone,
  Activity,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { type User }   from "./types";
import { RoleBadge }   from "./components/role-badge";
import { StatusDot }   from "./components/status-dot";
import { UserDrawer }  from "./components/user-drawer";
import { StatCard }    from "@/components/management/stat-card";
import { ActionMenu }  from "@/components/management/action-menu";
import { Pagination }  from "@/components/management/pagination";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockUsers: User[] = [
  {
    id: "1", employeeId: "H-01-002936",
    firstName: "Akaraphon", lastName: "Monkhong",
    email: "akaraphon-mon@hlas.co.th", phone: "081-234-5678",
    department: "A-DXC", branch: "BKK", role: "System", position: "Senior Developer",
    status: "active", avatarUrl: null, color: "bg-violet-500",
    bannerGradient: "from-violet-500 via-fuchsia-500", lastLogin: "2026-02-12 15:03",
  },
  {
    id: "2", employeeId: "H-01-002577",
    firstName: "Sirinapa", lastName: "Pangkhon",
    email: "sirinapa-pan@hlas.co.th", phone: "082-345-6789",
    department: "A-DXC", branch: "BKK", role: "Super Admin", position: "IT Manager",
    status: "active", avatarUrl: null, color: "bg-fuchsia-500",
    bannerGradient: "from-fuchsia-500 via-pink-500", lastLogin: "2026-04-01 12:20",
  },
  {
    id: "3", employeeId: "H-01-002842",
    firstName: "Benjathip", lastName: "Srihattapadungkit",
    email: "benjathip-sri@hlas.co.th", phone: null,
    department: "CKD AYT", branch: "AYT", role: "Super Admin", position: "IT Specialist",
    status: "active", avatarUrl: null, color: "bg-pink-500",
    bannerGradient: "from-pink-500 via-rose-500", lastLogin: "2026-03-18 10:58",
  },
  {
    id: "4", employeeId: "S-A2-003170",
    firstName: "Pimontra", lastName: "Jantree",
    email: "pimontra-jan@hlas.co.th", phone: "083-456-7890",
    department: "CKD AYT", branch: "AYT", role: "Super Admin", position: "IT Coordinator",
    status: "active", avatarUrl: null, color: "bg-rose-500",
    bannerGradient: "from-rose-500 via-orange-500", lastLogin: "2026-04-10 11:20",
  },
  {
    id: "5", employeeId: "H-01-001603",
    firstName: "Soontorn", lastName: "Thaweekarn",
    email: "soontorn-tha@hlas.co.th", phone: "084-567-8901",
    department: "CKD AYT", branch: "PCB", role: "Super Admin", position: "IT Support",
    status: "inactive", avatarUrl: null, color: "bg-emerald-500",
    bannerGradient: "from-emerald-500 via-teal-500", lastLogin: "2026-03-10 16:26",
  },
  {
    id: "6", employeeId: "S-A4-002484",
    firstName: "Orasa", lastName: "Mailiang",
    email: "theerayuth-kae@hlas.co.th", phone: null,
    department: "CKD AYT", branch: "PCB", role: "Super Admin", position: "IT Analyst",
    status: "active", avatarUrl: null, color: "bg-sky-500",
    bannerGradient: "from-sky-500 via-blue-500", lastLogin: "2026-04-10 11:20",
  },
  {
    id: "7", employeeId: "S-A2-002622",
    firstName: "Sopida", lastName: "Jamnongnok",
    email: "sopida-jam@hlas.co.th", phone: "085-678-9012",
    department: "CKD AYT", branch: "BNN", role: "Admin", position: "Developer",
    status: "active", avatarUrl: null, color: "bg-amber-500",
    bannerGradient: "from-amber-500 via-orange-400", lastLogin: "2026-04-10 09:32",
  },
  {
    id: "8", employeeId: "H-00-000063",
    firstName: "Toru", lastName: "Kikuchi",
    email: "t-kikuchi@hlas.co.th", phone: null,
    department: "CKD AYT", branch: "LCB", role: "Admin", position: "IT Manager",
    status: "active", avatarUrl: null, color: "bg-indigo-500",
    bannerGradient: "from-indigo-500 via-blue-500", lastLogin: "2026-04-09 13:51",
  },
  {
    id: "9", employeeId: "H-01-000504",
    firstName: "Nuttapat", lastName: "Kaewwilai",
    email: "nuttapat-kae@hlas.co.th", phone: "086-789-0123",
    department: "CKD AYT", branch: "RKL", role: "Admin", position: "Support",
    status: "inactive", avatarUrl: null, color: "bg-violet-500",
    bannerGradient: "from-violet-500 via-indigo-500", lastLogin: "2026-04-10 09:32",
  },
];

const ROLES       = ["All", "System", "Super Admin", "Admin", "User"];
const DEPARTMENTS = ["All", "A-DXC", "CKD AYT"];
const PAGE_SIZE   = 10;

// ─── Animation helpers ────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;

const fadeUp   = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});
const fadeLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [view,       setView]       = useState<"table" | "grid">("table");
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [page,       setPage]       = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mockUsers.filter((u) => {
      const matchSearch =
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchSearch &&
        (roleFilter === "All" || u.role === roleFilter) &&
        (deptFilter === "All" || u.department === deptFilter);
    });
  }, [search, roleFilter, deptFilter]);

  useEffect(() => { setPage(1); }, [search, roleFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:    mockUsers.length,
    active:   mockUsers.filter((u) => u.status === "active").length,
    admins:   mockUsers.filter((u) => ["Super Admin", "System"].includes(u.role)).length,
    branches: new Set(mockUsers.map((u) => u.branch)).size,
  }), []);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">

      {/* ── Header ── */}
      <motion.div {...fadeLeft(0)} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">User Management</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Manage workspace members, roles &amp; permissions
          </p>
        </div>
        <Button variant="create" size="lg" onClick={() => setDrawerOpen(true)} className="shrink-0 cursor-pointer">
          <UserPlus size={14} />
          <span className="hidden sm:inline">Invite User</span>
          <span className="sm:hidden">Invite</span>
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}><StatCard icon={Users}    label="Total Members" value={stats.total}    gradient="from-violet-500 to-fuchsia-500" /></motion.div>
        <motion.div {...fadeUp(0.14)}><StatCard icon={Activity} label="Active Now"    value={stats.active}   gradient="from-emerald-500 to-teal-500"   /></motion.div>
        <motion.div {...fadeUp(0.20)}><StatCard icon={Shield}   label="Admins"        value={stats.admins}   gradient="from-sky-500 to-blue-600"        /></motion.div>
        <motion.div {...fadeUp(0.26)}><StatCard icon={MapPin}   label="Branches"      value={stats.branches} gradient="from-amber-500 to-orange-500"   /></motion.div>
      </div>

      {/* ── Toolbar ── */}
      <motion.div {...fadeUp(0.32)} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, ID, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters + View toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          {/* Role pills */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  roleFilter === r ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {roleFilter === r && (
                  <motion.span
                    layoutId="role-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {r}
              </button>
            ))}
          </div>

          {/* Dept pills */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {DEPARTMENTS.map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={cn(
                  "relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  deptFilter === d ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {deptFilter === d && (
                  <motion.span
                    layoutId="dept-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {d}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex shrink-0 items-center rounded-lg border border-border/60 bg-card/40 p-0.5">
            {(["table", "grid"] as const).map((v, i) => (
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
                {i === 0 ? <List size={14} /> : <LayoutGrid size={13} />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Content ── */}
      <motion.div {...fadeUp(0.40)}>
        <AnimatePresence mode="wait">
          {view === "table" ? (
            /* ── Table View ── */
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-10 pl-4 text-xs sm:pl-5">#</TableHead>
                          <TableHead className="text-xs">Member</TableHead>
                          <TableHead className="text-xs">Role</TableHead>
                          <TableHead className="hidden text-xs md:table-cell">Department</TableHead>
                          <TableHead className="hidden text-xs md:table-cell">Branch</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="hidden text-xs sm:table-cell">Last Login</TableHead>
                          <TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />
                        </TableRow>
                      </TableHeader>

                      {/* AnimatePresence on tbody content — fades rows on page change */}
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.tbody
                          key={page}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                        >
                          {paged.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-20 text-center text-sm text-muted-foreground">
                                No members found
                              </td>
                            </tr>
                          )}
                          {paged.map((user, i) => (
                            <TableRow key={user.id} className="group">
                              <TableCell className="pl-4 text-xs text-muted-foreground sm:pl-5">
                                {(page - 1) * PAGE_SIZE + i + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <UserAvatar
                                    avatarUrl={user.avatarUrl}
                                    initial={user.firstName[0]}
                                    color={user.color}
                                    size="sm"
                                    showStatus={user.status === "active"}
                                    statusRingClass="bg-card"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium leading-tight">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{user.employeeId}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell><RoleBadge role={user.role} /></TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Building2 size={11} />{user.department}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  <MapPin size={9} />{user.branch}
                                </span>
                              </TableCell>
                              <TableCell><StatusDot status={user.status} /></TableCell>
                              <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                                {user.lastLogin}
                              </TableCell>
                              <TableCell className="pr-3 sm:pr-4">
                                <ActionMenu actions={[
                                  { label: "Edit User", icon: Pencil, onClick: () => {} },
                                  { label: "Delete", icon: Trash2, destructive: true, onClick: () => {} },
                                ]} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </motion.tbody>
                      </AnimatePresence>
                    </Table>
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={filtered.length}
                    pageSize={PAGE_SIZE}
                    onChange={setPage}
                    layoutId="users-page-active-bg"
                    itemLabel="members"
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* ── Grid View ── */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paged.length === 0 && (
                  <div className="col-span-full py-20 text-center text-muted-foreground">
                    No members found
                  </div>
                )}
                <AnimatePresence mode="popLayout">
                  {paged.map((user, i) => (
                    <motion.div
                      key={`${user.id}-p${page}`}
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.22, delay: i * 0.05 }}
                    >
                      <Card className="group overflow-hidden transition-shadow duration-200 hover:shadow-md">
                        <CardContent className="p-0">
                          <div className={cn("h-20 bg-gradient-to-br to-transparent opacity-80", user.bannerGradient)} />
                          <div className="-mt-10 px-4 pb-4">
                            <div className="mb-3 flex items-end justify-between">
                              <UserAvatar
                                avatarUrl={user.avatarUrl}
                                initial={user.firstName[0]}
                                color={user.color}
                                size="lg"
                                showStatus={user.status === "active"}
                                statusRingClass="bg-card"
                                className="ring-2 ring-card"
                              />
                              <ActionMenu actions={[
                                { label: "Edit User", icon: Pencil, onClick: () => {} },
                                { label: "Delete", icon: Trash2, destructive: true, onClick: () => {} },
                              ]} />
                            </div>
                            <p className="text-sm font-semibold leading-tight">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="mb-2.5 text-xs text-muted-foreground">
                              {user.employeeId} · {user.position}
                            </p>
                            <div className="mb-3 flex flex-wrap gap-1.5">
                              <RoleBadge role={user.role} />
                              <StatusDot status={user.status} />
                            </div>
                            <div className="space-y-1.5 border-t pt-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail size={11} className="shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 size={11} className="shrink-0" />
                                <span>{user.department}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin size={11} className="shrink-0" />
                                <span>{user.branch}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Phone size={11} className="shrink-0" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-2 rounded-xl border bg-card">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onChange={setPage}
                  layoutId="users-page-active-bg"
                  itemLabel="members"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Drawer ── */}
      <UserDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
