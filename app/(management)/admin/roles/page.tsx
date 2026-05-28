"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldPlus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Lock,
  Pencil,
  Trash2,
  KeyRound,
  UserCog,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { type Role }      from "./types";
import { RoleDrawer }     from "./components/role-drawer";
import { StatCard }       from "@/components/management/stat-card";
import { ActionMenu }     from "@/components/management/action-menu";
import { Pagination }     from "@/components/management/pagination";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockRoles: Role[] = [
  {
    id: "1",
    name: "System",
    description: "Has full control over the entire system, including configuration, security, and all administrative tasks.",
    color: "bg-violet-500",
    gradient: "from-violet-500 to-fuchsia-500",
    usersCount: 2,
    permissionsCount: 128,
    isProtected: true,
    createdBy: "Akaraphon Monkhong",
    createdAt: "2026-01-08 15:27:41",
  },
  {
    id: "2",
    name: "Super Admin",
    description: "Highest level administrator with full system access and control over all management features.",
    color: "bg-fuchsia-500",
    gradient: "from-fuchsia-500 to-pink-500",
    usersCount: 5,
    permissionsCount: 96,
    isProtected: true,
    createdBy: "Akaraphon Monkhong",
    createdAt: "2025-12-19 10:30:00",
  },
  {
    id: "3",
    name: "Admin",
    description: "Administrator with permissions to manage users and most system data.",
    color: "bg-sky-500",
    gradient: "from-sky-500 to-blue-500",
    usersCount: 4,
    permissionsCount: 64,
    isProtected: true,
    createdBy: "Akaraphon Monkhong",
    createdAt: "2025-12-19 10:30:00",
  },
  {
    id: "4",
    name: "Supervisor",
    description: "Responsible for supervising users, monitoring activities, and ensuring operational compliance.",
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-500",
    usersCount: 8,
    permissionsCount: 40,
    isProtected: false,
    createdBy: "Akaraphon Monkhong",
    createdAt: "2025-12-19 10:30:00",
  },
  {
    id: "5",
    name: "Viewer",
    description: "Read-only user who can view but cannot modify any data.",
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    usersCount: 12,
    permissionsCount: 18,
    isProtected: false,
    createdBy: "Akaraphon Monkhong",
    createdAt: "2026-01-17 19:20:57",
  },
];

const PAGE_SIZE = 10;

const ROLE_ICON: Record<string, { icon: LucideIcon; shape: string }> = {
  "System":      { icon: ShieldAlert, shape: "rounded-lg ring-2 ring-white/25 shadow-lg" },
  "Super Admin": { icon: ShieldCheck, shape: "rounded-lg ring-1 ring-white/15 shadow-md" },
  "Admin":       { icon: Shield,      shape: "rounded-lg shadow-sm" },
  "Supervisor":  { icon: UserCog,     shape: "rounded-full shadow-sm" },
  "Viewer":      { icon: Eye,         shape: "rounded-full shadow-sm" },
};

// ─── Animation helpers ────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp   = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay, ease: EASE } });
const fadeLeft = (delay = 0) => ({ initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.3, delay, ease: EASE } });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mockRoles.filter((r) =>
      !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
    );
  }, [search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:     mockRoles.length,
    protected: mockRoles.filter((r) => r.isProtected).length,
    custom:    mockRoles.filter((r) => !r.isProtected).length,
    users:     mockRoles.reduce((s, r) => s + r.usersCount, 0),
  }), []);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">

      {/* ── Header ── */}
      <motion.div {...fadeLeft(0)} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Role Management</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Define roles &amp; assign permission sets
          </p>
        </div>
        <Button variant="create" size="lg" onClick={() => setDrawerOpen(true)} className="shrink-0">
          <ShieldPlus size={14} />
          <span className="hidden sm:inline">Create Role</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}><StatCard icon={Shield}   label="Total Roles"   value={stats.total}     gradient="from-violet-500 to-fuchsia-500" /></motion.div>
        <motion.div {...fadeUp(0.14)}><StatCard icon={Lock}     label="Protected"      value={stats.protected} gradient="from-rose-500 to-pink-500"       /></motion.div>
        <motion.div {...fadeUp(0.20)}><StatCard icon={KeyRound} label="Custom"         value={stats.custom}    gradient="from-amber-500 to-orange-500"    /></motion.div>
        <motion.div {...fadeUp(0.26)}><StatCard icon={Users}    label="Total Assigned" value={stats.users}     gradient="from-sky-500 to-blue-600"        /></motion.div>
      </div>

      {/* ── Toolbar ── */}
      <motion.div {...fadeUp(0.32)} className="flex items-center gap-2">
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search role name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* ── Table ── */}
      <motion.div {...fadeUp(0.38)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4 text-xs sm:pl-5">#</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">Description</TableHead>
                    <TableHead className="text-xs">Users</TableHead>
                    <TableHead className="hidden text-xs md:table-cell">Permissions</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">Created By</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">Created At</TableHead>
                    <TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />
                  </TableRow>
                </TableHeader>

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
                          No roles found
                        </td>
                      </tr>
                    )}
                    {paged.map((role, i) => (
                      <TableRow key={role.id} className="group">
                        {/* # */}
                        <TableCell className="pl-4 text-xs text-muted-foreground sm:pl-5">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </TableCell>

                        {/* Role name */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const cfg = ROLE_ICON[role.name] ?? { icon: Shield, shape: "rounded-lg shadow-sm" };
                              const RoleIcon = cfg.icon;
                              return (
                                <div className={cn("flex size-8 shrink-0 items-center justify-center text-white bg-gradient-to-br", role.gradient, cfg.shape)}>
                                  <RoleIcon size={14} />
                                </div>
                              );
                            })()}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium leading-tight">{role.name}</p>
                                {role.isProtected && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                    <Lock size={8} />
                                    Protected
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:hidden">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Description — hidden on mobile */}
                        <TableCell className="hidden max-w-xs sm:table-cell">
                          <p className="line-clamp-2 text-xs text-muted-foreground">{role.description}</p>
                        </TableCell>

                        {/* Users count */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            <Users size={9} />
                            {role.usersCount}
                          </span>
                        </TableCell>

                        {/* Permissions */}
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            <KeyRound size={9} />
                            {role.permissionsCount}
                          </span>
                        </TableCell>

                        {/* Created by */}
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {role.createdBy}
                        </TableCell>

                        {/* Created at */}
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {role.createdAt}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="pr-3 sm:pr-4">
                          <ActionMenu actions={[
                            { label: "Edit Role", icon: Pencil, onClick: () => {} },
                            { label: "Delete", icon: Trash2, destructive: true, disabled: role.isProtected, onClick: () => {} },
                          ]} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              layoutId="roles-page-active-bg"
              itemLabel="roles"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Drawer ── */}
      <RoleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
