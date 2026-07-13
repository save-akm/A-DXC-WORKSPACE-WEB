'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ShieldPlus, Pencil, LayoutGrid, KeyRound, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import {
  createRole,
  updateRole,
  checkRoleAvailability,
  fetchRolePermissionsById,
} from '@/lib/api/roles';
import { patchRolePermissions } from '@/lib/api/permissions';
import {
  INITIAL_FORM,
  buildPermissionChanges,
  diffPermissionChanges,
  type RoleFormState,
  type ActionPerms,
} from './create-role-shared';
import type { Role } from '../types';
import { StepRoleInfo } from './steps/step-role-info';
import { StepMenuAccess } from './steps/step-menu-access';
import { StepPermissions } from './steps/step-permissions';
import { StepReview } from './steps/step-review';

interface RoleFormModalProps {
  open: boolean;
  /** Present = edit mode; null/undefined = create mode. */
  role?: Role | null;
  onClose: () => void;
  onSaved?: () => void;
}

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: 'Role Info', icon: ShieldPlus },
  { label: 'Menu Access', icon: LayoutGrid },
  { label: 'Permissions', icon: KeyRound },
  { label: 'Review', icon: Check },
];

export function RoleCreateModal({ open, role, onClose, onSaved }: RoleFormModalProps) {
  const isEdit = Boolean(role);

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RoleFormState>(INITIAL_FORM);
  const [originalPerms, setOriginalPerms] = useState<Record<string, ActionPerms>>({});
  const [permsLoading, setPermsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkErrors, setCheckErrors] = useState<{ name?: boolean; code?: boolean }>({});

  useEffect(() => setMounted(true), []);

  // Initialise whenever the modal (re)opens — create starts blank, edit prefills.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSaving(false);
    setChecking(false);
    setCheckErrors({});

    if (role) {
      setForm({
        roleName: role.name,
        roleCode: role.code,
        roleDesc: role.description,
        color: role.color,
        isSystem: role.isSystem,
        permissions: {},
      });
      setOriginalPerms({});
      setPermsLoading(true);
      fetchRolePermissionsById(role.id)
        .then((data) => {
          const perms: Record<string, ActionPerms> = {};
          for (const m of data.menus) {
            const a = m.actions;
            if (a.view || a.create || a.update || a.delete || a.export || a.highPrivilege) {
              perms[m.menuId] = {
                view: a.view,
                create: a.create,
                update: a.update,
                delete: a.delete,
                export: a.export,
                highPrivilege: a.highPrivilege,
              };
            }
          }
          setForm((f) => ({ ...f, permissions: perms }));
          setOriginalPerms(perms);
        })
        .catch(() => toast.error('โหลดสิทธิ์ของ role ไม่สำเร็จ'))
        .finally(() => setPermsLoading(false));
    } else {
      setForm(INITIAL_FORM);
      setOriginalPerms({});
      setPermsLoading(false);
    }
  }, [open, role]);

  const patch = (next: Partial<RoleFormState>) => {
    setForm((prev) => ({ ...prev, ...next }));
    if ('roleName' in next) setCheckErrors((e) => ({ ...e, name: false }));
    if ('roleCode' in next) setCheckErrors((e) => ({ ...e, code: false }));
  };

  const canNext = useMemo(() => {
    if (step === 0) return form.roleName.trim().length > 0 && form.roleCode.trim().length > 0;
    return true;
  }, [step, form.roleName, form.roleCode]);

  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    if (!canNext || checking) return;

    // Validate name/code uniqueness before leaving the first step.
    if (step === 0) {
      setChecking(true);
      try {
        const r = await checkRoleAvailability({
          name: form.roleName.trim(),
          // Code is immutable in edit mode, so only validate it on create.
          code: isEdit ? undefined : form.roleCode.trim(),
          excludeId: role?.id,
        });
        const nameTaken = r.name?.taken ?? false;
        const codeTaken = isEdit ? false : r.code?.taken ?? false;
        if (nameTaken || codeTaken) {
          setCheckErrors({ name: nameTaken, code: codeTaken });
          return;
        }
      } catch {
        // If the check endpoint is unavailable, fall through — the save will validate.
      } finally {
        setChecking(false);
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!form.roleName.trim() || !form.roleCode.trim()) return;
    setSaving(true);
    try {
      if (role) {
        await updateRole(role.id, {
          name: form.roleName.trim(),
          description: form.roleDesc.trim(),
          color: form.color,
        });
        const changes = diffPermissionChanges(role.id, originalPerms, form.permissions);
        if (changes.length > 0) await patchRolePermissions(changes);
        toast.success(`บันทึก role “${form.roleName.trim()}” สำเร็จ`);
      } else {
        const created = await createRole({
          code: form.roleCode.trim(),
          name: form.roleName.trim(),
          description: form.roleDesc.trim(),
          color: form.color,
          sortOrder: 0,
          ...(form.isSystem ? { isSystem: true } : {}),
        });
        const changes = buildPermissionChanges(created.id, form.permissions);
        if (changes.length > 0) await patchRolePermissions(changes);
        toast.success(`สร้าง role “${created.name}” สำเร็จ`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error((err as Error)?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  const HeaderIcon = isEdit ? Pencil : ShieldPlus;

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                    <HeaderIcon className="size-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {isEdit ? 'Edit Role' : 'Create Role'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isEdit ? `แก้ไข ${role?.name}` : 'กำหนด role และสิทธิ์การเข้าถึง'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-1 border-b border-border/60 px-6 py-3.5">
                {STEPS.map((s, i) => {
                  const StepIcon = s.icon;
                  const done = i < step;
                  const active = i === step;
                  return (
                    <div key={s.label} className="flex flex-1 items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold transition-colors',
                            active && 'bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30',
                            done && 'bg-indigo-500/15 text-indigo-500',
                            !active && !done && 'bg-muted text-muted-foreground',
                          )}
                        >
                          {done ? <Check size={13} strokeWidth={3} /> : <StepIcon size={13} />}
                        </span>
                        <span
                          className={cn(
                            'hidden text-[11px] font-semibold sm:inline',
                            active ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={cn('h-px flex-1', done ? 'bg-indigo-500/40' : 'bg-border')} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {step === 0 && (
                      <StepRoleInfo
                        state={form}
                        patch={patch}
                        errors={checkErrors}
                        codeDisabled={isEdit}
                        nameDisabled={isEdit && Boolean(role?.isSystem)}
                        showSystemToggle={!isEdit}
                      />
                    )}

                    {step > 0 && permsLoading && (
                      <div className="flex h-[220px] items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                        กำลังโหลดสิทธิ์…
                      </div>
                    )}

                    {step === 1 && !permsLoading && <StepMenuAccess state={form} patch={patch} />}
                    {step === 2 && !permsLoading && <StepPermissions state={form} patch={patch} />}
                    {step === 3 && !permsLoading && <StepReview state={form} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || permsLoading || !form.roleName.trim()}
                    className="flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังบันทึก…
                      </>
                    ) : isEdit ? (
                      <>
                        <Check size={14} strokeWidth={2.5} />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <ShieldPlus size={14} />
                        Create Role
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canNext || checking}
                    className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {checking ? (
                      <>
                        <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังตรวจสอบ…
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
