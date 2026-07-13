'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
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

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  employeeId:   z.string().min(1, 'Required'),
  firstName:    z.string().min(1, 'Required'),
  lastName:     z.string().min(1, 'Required'),
  nickname:     z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().min(1, 'Required').email('Invalid email'),
  roleId:       z.string().min(1, 'Required'),
  branchId:     z.string().min(1, 'Required'),
  departmentId: z.string().min(1, 'Required'),
  positionId:   z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Public types ─────────────────────────────────────────────────────────────

export interface SelectOption    { id: string; name: string }
export interface DepartmentOption {
  id: string;
  name: string;
  deptId: string;
  /** Parent department code — used when options are flattened to units */
  deptCode: string;
  /** Present when this option represents a department unit */
  unitCode?: string;
}

const ADXC_DEPT_CODE = 'A-DXC';

function isAdxcDepartment(option: DepartmentOption | undefined): boolean {
  if (!option) return false;
  return option.deptCode === ADXC_DEPT_CODE || option.unitCode === ADXC_DEPT_CODE;
}

export interface InviteUserInput extends FormValues {
  avatarUrl?: string;
  commuteMinutes?: number;
  departmentUnitId?: string;
}

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (input: InviteUserInput) => Promise<void>;
  branches?: SelectOption[];
  departments?: DepartmentOption[];
  roles?: SelectOption[];
  positions?: SelectOption[];
}

// ── Component ────────────────────────────────────────────────────────────────

export function UserModal({
  open,
  onClose,
  onSubmit,
  branches = [],
  departments = [],
  roles = [],
  positions = [],
}: UserModalProps) {
  const [mounted, setMounted]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [commuteMinutes, setCommute]      = useState('');
  const [selectedPreset, setPreset]       = useState<string | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const objUrlRef                         = useRef<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '', firstName: '', lastName: '',
      nickname: '', phone: '', email: '',
      roleId: '', branchId: '', departmentId: '', positionId: '',
    },
  });

  const departmentId = form.watch('departmentId');
  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const showCommute = isAdxcDepartment(selectedDepartment);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showCommute) setCommute('');
  }, [showCommute]);

  useEffect(() => {
    if (!open) return;
    form.reset();
    setCommute('');
    setPreset(null);
    setCustomPreview(null);
  }, [open, form]);

  useEffect(() => () => { if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current); }, []);

  function handleUpload(file: File) {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    const url = URL.createObjectURL(file);
    objUrlRef.current = url;
    setCustomPreview(url);
    setPreset(null);
  }

  function clearCustom() {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    objUrlRef.current = null;
    setCustomPreview(null);
  }

  function handleSelectPreset(filename: string) {
    clearCustom();
    setPreset(filename);
  }

  async function onValid(values: FormValues) {
    setSaving(true);
    const selected = departments.find((d) => d.id === values.departmentId);
    try {
      await onSubmit?.({
        ...values,
        departmentId:     selected?.deptId ?? values.departmentId,
        departmentUnitId: selected && selected.id !== selected.deptId ? selected.id : undefined,
        nickname:         values.nickname   || undefined,
        phone:            values.phone      || undefined,
        positionId:       values.positionId || undefined,
        avatarUrl:        customPreview ?? (selectedPreset ? `/avatars/${selectedPreset}` : undefined),
        commuteMinutes:   showCommute && commuteMinutes ? parseInt(commuteMinutes, 10) : undefined,
      });
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
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/30">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">Invite User</h2>
                    <p className="text-[11px] text-muted-foreground">Add a new workspace member</p>
                  </div>
                </div>
                <button type="button" onClick={onClose}
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
                        onClearCustom={clearCustom}
                      />
                    </div>

                    {/* Two-column form */}
                    <div className="grid grid-cols-2">

                      {/* Left: identity */}
                      <div className="space-y-4 border-r border-border/60 px-6 py-5">

                        <FormField control={form.control} name="employeeId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. H-01-002936" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="สมชาย" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="ใจดี" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="nickname" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nickname</FormLabel>
                              <FormControl><Input placeholder="ชาย" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl><Input placeholder="0812345678" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="email" placeholder="name@hlas.co.th" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />


                      </div>

                      {/* Right: org */}
                      <div className="space-y-4 px-6 py-5">

                        <FormField control={form.control} name="roleId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="branchId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
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
                                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {positions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />


                        {showCommute && (
                          <FormItem>
                            <FormLabel>Commute (min)</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              placeholder="e.g. 30"
                              value={commuteMinutes}
                              onChange={(e) => setCommute(e.target.value)}
                            />
                          </FormItem>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                    <button type="button" onClick={onClose}
                      className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-violet-500/30 transition-all hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60">
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Inviting…
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          Invite User
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

  if (!mounted) return null;
  return createPortal(modal, document.body);
}