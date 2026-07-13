'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserCog } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AvatarPicker } from '@/app/(management)/account/components/avatar-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User, UserStatus } from '../types';
import type { SelectOption, DepartmentOption } from './user-modal';
import type { UpdateUserBody } from '@/lib/api/users';

// ── Schema ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: UserStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED'];

const schema = z.object({
  firstName:      z.string().min(1, 'Required'),
  lastName:       z.string().min(1, 'Required'),
  email:          z.email({ error: 'Invalid email' }),
  nickname:       z.string().optional(),
  phone:          z.string().optional(),
  roleId:         z.string().optional(),
  departmentId:   z.string().optional(),
  positionId:     z.string().optional(),
  status:         z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED']),
  password:       z.string().optional().refine(
    (v) => !v || v.length >= 8,
    { message: 'At least 8 characters' },
  ),
  commuteMinutes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (id: string, body: UpdateUserBody) => Promise<void>;
  onUploadAvatar?: (id: string, file: File) => Promise<void>;
  onDeleteAvatar?: (id: string) => Promise<void>;
  roles?: SelectOption[];
  departments?: DepartmentOption[];
  positions?: SelectOption[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findRoleId(roles: SelectOption[], code: string): string {
  const upper = code.toUpperCase();
  return roles.find((r) =>
    r.name.toUpperCase() === upper ||
    r.name.toUpperCase().replace(/\s+/g, '_') === upper,
  )?.id ?? '';
}

function findDeptId(departments: DepartmentOption[], deptCode: string): string {
  return (
    departments.find((d) => d.deptCode === deptCode && !d.unitCode)?.id ??
    departments.find((d) => d.deptCode === deptCode)?.id ??
    ''
  );
}

function findPositionId(positions: SelectOption[], positionName: string | null): string {
  if (!positionName) return '';
  const lower = positionName.toLowerCase();
  return positions.find((p) => p.name.toLowerCase() === lower)?.id ?? '';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditUserModal({
  open,
  user,
  onClose,
  onSubmit,
  onUploadAvatar,
  onDeleteAvatar,
  roles = [],
  departments = [],
  positions = [],
}: EditUserModalProps) {
  const [saving, setSaving] = useState(false);

  // ── Avatar state ───────────────────────────────────────────────────────────
  const [selectedPreset,  setPreset]       = useState<string | null>(null);
  const [customPreview,   setCustomPreview] = useState<string | null>(null);
  const [pendingFile,     setPendingFile]   = useState<File | null>(null);
  const [pendingDelete,   setPendingDelete] = useState(false);
  const objUrlRef = useRef<string | null>(null);

  function handleUpload(file: File) {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    const url = URL.createObjectURL(file);
    objUrlRef.current = url;
    setCustomPreview(url);
    setPendingFile(file);
    setPreset(null);
    setPendingDelete(false);
  }

  function handleClearCustom() {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    objUrlRef.current = null;
    setCustomPreview(null);
    setPendingFile(null);
  }

  function handleSelectPreset(filename: string) {
    handleClearCustom();
    setPreset(filename);
    setPendingDelete(false);
  }

  function handleDeleteCurrentAvatar() {
    handleClearCustom();
    setPreset(null);
    setPendingDelete(true);
  }

  function resetAvatarState() {
    handleClearCustom();
    setPreset(null);
    setPendingDelete(false);
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      firstName:      user?.firstName      ?? '',
      lastName:       user?.lastName       ?? '',
      email:          user?.email          ?? '',
      nickname:       user?.nickname       ?? '',
      phone:          user?.phone          ?? '',
      roleId:         user ? findRoleId(roles, user.role.code)        : '',
      departmentId:   user ? findDeptId(departments, user.department)  : '',
      positionId:     user ? findPositionId(positions, user.position)  : '',
      status:         user?.status         ?? 'ACTIVE',
      password:       '',
      commuteMinutes: user?.commuteMinutes != null ? String(user.commuteMinutes) : '',
    },
  });

  function handleClose() {
    resetAvatarState();
    onClose();
  }

  async function onValid(values: FormValues) {
    if (!user) return;
    setSaving(true);

    try {
      // 1. PATCH user fields
      const selected = departments.find((d) => d.id === values.departmentId);
      const body: UpdateUserBody = {
        firstName:        values.firstName,
        lastName:         values.lastName,
        email:            values.email,
        nickname:         values.nickname       || undefined,
        phone:            values.phone          || undefined,
        roleId:           values.roleId         || undefined,
        departmentId:     selected?.deptId      ?? (values.departmentId || undefined),
        departmentUnitId: selected && selected.id !== selected.deptId ? selected.id : undefined,
        positionId:       values.positionId     || undefined,
        status:           values.status,
        password:         values.password       || undefined,
        commuteMinutes:   values.commuteMinutes ? parseInt(values.commuteMinutes, 10) : undefined,
      };
      await onSubmit(user.id, body);

      // 2. Avatar operations (after PATCH)
      if (pendingDelete) {
        await onDeleteAvatar?.(user.id);
      } else if (pendingFile) {
        await onUploadAvatar?.(user.id, pendingFile);
      } else if (selectedPreset) {
        // Fetch preset image and upload as file
        const res = await fetch(`/avatars/${selectedPreset}`);
        const blob = await res.blob();
        const file = new File([blob], selectedPreset, { type: blob.type });
        await onUploadAvatar?.(user.id, file);
      }

      resetAvatarState();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/30">
                    <UserCog className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">Edit User</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {user ? `${user.firstName} ${user.lastName} · ${user.employeeId}` : ''}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={handleClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onValid)}>
                  <div className="max-h-[70vh] overflow-y-auto">

                    {/* Avatar picker */}
                    <div className="border-b border-border/60 px-6 py-4">
                      <AvatarPicker
                        selectedPreset={selectedPreset}
                        onSelectPreset={handleSelectPreset}
                        customPreview={customPreview}
                        onUpload={handleUpload}
                        onClearCustom={handleClearCustom}
                        currentAvatarUrl={pendingDelete ? null : user?.avatarUrl}
                        onDeleteAvatar={handleDeleteCurrentAvatar}
                      />
                    </div>

                    <div className="grid grid-cols-2">

                      {/* Left: identity */}
                      <div className="space-y-4 border-r border-border/60 px-6 py-5">

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="nickname" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nickname</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Leave blank to keep current" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                      </div>

                      {/* Right: org + status */}
                      <div className="space-y-4 px-6 py-5">

                        <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="roleId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={user?.role.code} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={user?.department} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="positionId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={user?.position ?? '—'} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {positions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="commuteMinutes" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commute (min)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} placeholder="e.g. 30" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                    <button type="button" onClick={handleClose}
                      className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:cursor-not-allowed disabled:opacity-60">
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <UserCog className="h-3.5 w-3.5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
