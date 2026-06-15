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
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { normalizeRoleName } from "@/lib/utils/role-color";
import { fetchAllUsers, fetchRoles, fetchBranches, fetchDepartments, fetchPositions } from "@/lib/api/users";
import type { SelectOption, DepartmentOption } from "./components/user-modal";

import { type User } from "./types";
import { RoleBadge }  from "./components/role-badge";
import { StatusDot }  from "./components/status-dot";
import { UserModal } from "./components/user-modal";
import { Button } from "@/components/ui/button";
import { StatCard }   from "@/components/management/stat-card";
import { PageHeader } from "@/components/management/page-header";
import { ActionMenu } from "@/components/management/action-menu";
import { Pagination } from "@/components/management/pagination";

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { color: "bg-violet-500",  banner: "from-violet-700 to-fuchsia-500" },
  { color: "bg-fuchsia-500", banner: "from-fuchsia-700 to-pink-400" },
  { color: "bg-pink-500",    banner: "from-pink-700 to-rose-400" },
  { color: "bg-rose-500",    banner: "from-rose-700 to-orange-400" },
  { color: "bg-emerald-500", banner: "from-emerald-700 to-teal-400" },
  { color: "bg-sky-500",     banner: "from-sky-700 to-blue-400" },
  { color: "bg-amber-500",   banner: "from-amber-600 to-orange-300" },
  { color: "bg-indigo-500",  banner: "from-indigo-700 to-violet-400" },
];

function userPalette(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[hash % PALETTES.length];
}

// ─── Animation helpers ────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;

const fadeUp   = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

const MotionTableRow = motion.create(TableRow);

const PAGE_SIZE = 10;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableRowSkeleton({ index }: { index: number }) {
  return (
    <tr style={{ animationDelay: `${index * 40}ms` }}>
      <td className="py-3 pl-4 sm:pl-5"><div className="h-3.5 w-5 animate-pulse rounded bg-muted" /></td>
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </td>
      <td className="py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-3.5 w-20 animate-pulse rounded bg-muted" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-5 w-12 animate-pulse rounded-full bg-muted" /></td>
      <td className="py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 sm:table-cell"><div className="h-3.5 w-24 animate-pulse rounded bg-muted" /></td>
      <td className="py-3 pr-3 sm:pr-4"><div className="size-6 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}

function GridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="h-20 animate-pulse bg-muted" />
      <div className="-mt-10 px-4 pb-4">
        <div className="mb-3 flex items-end justify-between">
          <div className="size-14 animate-pulse rounded-full border-2 border-card bg-muted" />
          <div className="size-7 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="mb-1 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mb-3 flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-2 border-t pt-3">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState<"table" | "grid">("table");
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [page,       setPage]       = useState(1);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [roleOptions,   setRoleOptions]   = useState<SelectOption[]>([]);
  const [branchOptions,     setBranchOptions]     = useState<SelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [positionOptions,   setPositionOptions]   = useState<SelectOption[]>([]);
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllUsers(), fetchRoles(), fetchBranches(), fetchDepartments(), fetchPositions()])
      .then(([all, roles, branches, departments, positions]) => {
        setUsers(all);
        setRoleOptions(roles);
        setBranchOptions(branches);
        setDepartmentOptions(departments);
        setPositionOptions(positions);
      })
      .finally(() => setLoading(false));
  }, []);

  // Dynamic filter options derived from full dataset
  const roles = useMemo(() => {
    const unique = Array.from(new Set(users.map((u) => u.role)));
    return ["All", ...unique];
  }, [users]);

  const departments = useMemo(() => {
    const unique = Array.from(new Set(users.map((u) => u.department)));
    return ["All", ...unique];
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.nickname?.toLowerCase().includes(q) ?? false);
      return (
        matchSearch &&
        (roleFilter === "All" || u.role === roleFilter) &&
        (deptFilter === "All" || u.department === deptFilter)
      );
    });
  }, [users, search, roleFilter, deptFilter]);

  // Reset page when filters change
  const handleSearch     = (v: string) => { setSearch(v);     setPage(1); };
  const handleRoleFilter = (v: string) => { setRoleFilter(v); setPage(1); };
  const handleDeptFilter = (v: string) => { setDeptFilter(v); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter((u) => u.status === "ACTIVE").length,
    admins:   users.filter((u) => ["SYSTEM", "SUPER_ADMIN", "ADMIN"].includes(u.role)).length,
    branches: new Set(users.map((u) => u.branch)).size,
  }), [users]);

  return (
    <div className="page-shell">

      {/* ── Header ── */}
      <PageHeader
        title="User Management"
        subtitle="Manage workspace members, roles & permissions"
        actions={
          <Button variant="create" size="lg" onClick={() => setDrawerOpen(true)}>
            <UserPlus />
            <span className="hidden sm:inline">Invite User</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}><StatCard icon={Users}    label="Total Members" value={stats.total}    gradient="from-violet-500 to-fuchsia-500" /></motion.div>
        <motion.div {...fadeUp(0.14)}><StatCard icon={Activity} label="Active Now"    value={stats.active}   gradient="from-emerald-500 to-teal-500"   /></motion.div>
        <motion.div {...fadeUp(0.20)}><StatCard icon={Shield}   label="Admins"        value={stats.admins}   gradient="from-sky-500 to-blue-600"        /></motion.div>
        <motion.div {...fadeUp(0.26)}><StatCard icon={MapPin}   label="Branches"      value={stats.branches} gradient="from-amber-500 to-orange-500"   /></motion.div>
      </div>

      {/* ── Toolbar ── */}
      <motion.div {...fadeUp(0.32)} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, ID, email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          {/* Role pills */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => handleRoleFilter(r)}
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
                {r === "All" ? "All" : normalizeRoleName(r)}
              </button>
            ))}
          </div>

          {/* Dept pills */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => handleDeptFilter(d)}
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
                          <TableHead className="hidden text-xs sm:table-cell">Position</TableHead>
                          <TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />
                        </TableRow>
                      </TableHeader>

                      {loading ? (
                        <tbody>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableRowSkeleton key={i} index={i} />
                          ))}
                        </tbody>
                      ) : (
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
                            {paged.map((user, i) => {
                              const { color } = userPalette(user.id);
                              return (
                                <MotionTableRow
                                  key={user.id}
                                  className="group"
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
                                >
                                  <TableCell className="pl-4 text-xs text-muted-foreground sm:pl-5">
                                    {(page - 1) * PAGE_SIZE + i + 1}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <UserAvatar
                                        avatarUrl={user.avatarUrl}
                                        initial={user.firstName[0]}
                                        color={color}
                                        size="sm"
                                        showStatus={user.status === "ACTIVE"}
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
                                    {user.position ?? "—"}
                                  </TableCell>
                                  <TableCell className="pr-3 sm:pr-4">
                                    <ActionMenu actions={[
                                      { label: "Edit User", icon: Pencil, onClick: () => {} },
                                      { label: "Delete", icon: Trash2, destructive: true, onClick: () => {} },
                                    ]} />
                                  </TableCell>
                                </MotionTableRow>
                              );
                            })}
                          </motion.tbody>
                        </AnimatePresence>
                      )}
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
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <GridCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paged.length === 0 && (
                      <div className="col-span-full py-20 text-center text-muted-foreground">
                        No members found
                      </div>
                    )}
                    <AnimatePresence mode="popLayout">
                      {paged.map((user, i) => {
                        const { color, banner } = userPalette(user.id);
                        return (
                          <motion.div
                            key={`${user.id}-p${page}`}
                            initial={{ opacity: 0, y: 12, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.22, delay: i * 0.05 }}
                          >
                            <Card className="group overflow-hidden pt-0 transition-shadow duration-200 hover:shadow-md">
                              <CardContent className="p-0">
                                <div className={cn("relative h-20 overflow-hidden bg-linear-to-r", banner)}>
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/30 to-transparent" />
                                </div>
                                <div className="-mt-10 px-4 pb-4">
                                  <div className="mb-3 flex items-end justify-between">
                                    <UserAvatar
                                      avatarUrl={user.avatarUrl}
                                      initial={user.firstName[0]}
                                      color={color}
                                      size="lg"
                                      showStatus={user.status === "ACTIVE"}
                                      statusRingClass="bg-card"
                                      className="drop-shadow-md"
                                    />
                                    <ActionMenu actions={[
                                      { label: "Edit User", icon: Pencil, onClick: () => {} },
                                      { label: "Delete", icon: Trash2, destructive: true, onClick: () => {} },
                                    ]} />
                                  </div>
                                  <p className="text-sm font-semibold leading-tight">
                                    {user.firstName} {user.lastName}
                                    {user.nickname && (
                                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">({user.nickname})</span>
                                    )}
                                  </p>
                                  <p className="mb-2.5 text-xs text-muted-foreground">
                                    {user.employeeId}{user.position ? ` · ${user.position}` : ""}
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
                        );
                      })}
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
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Modal ── */}
      <UserModal open={drawerOpen} onClose={() => setDrawerOpen(false)} roles={roleOptions} branches={branchOptions} departments={departmentOptions} positions={positionOptions} />
    </div>
  );
}
