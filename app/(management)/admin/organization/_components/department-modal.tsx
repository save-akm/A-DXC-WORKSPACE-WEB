'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Branch, Department, DepartmentCreateBody, DepartmentUpdateBody } from '@/lib/api/organization';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  branchId: z.string(),
  code:     z.string().min(1, 'Required').max(20),
  name:     z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface DepartmentModalProps {
  open:        boolean;
  onClose:     () => void;
  onSave:      (body: DepartmentCreateBody | DepartmentUpdateBody) => Promise<void>;
  department?: Department | null;
  branches:    Branch[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentModal({ open, onClose, onSave, department, branches }: DepartmentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const isEdit = !!department;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { branchId: '', code: '', name: '' },
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    form.reset({
      branchId: '',
      code: department?.code ?? '',
      name: department?.name ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, department]);

  async function onSubmit(values: FormValues) {
    if (!isEdit && !values.branchId) {
      form.setError('branchId', { message: 'Required' });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await onSave({ code: values.code.toUpperCase(), name: values.name });
      } else {
        await onSave({ branchId: values.branchId, code: values.code.toUpperCase(), name: values.name });
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'CODE_TAKEN') {
        form.setError('code', { message: 'This code is already taken' });
      }
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
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1 w-full bg-linear-to-r from-sky-500 to-blue-600" />

              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/30">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {isEdit ? 'Edit Department' : 'Add Department'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isEdit ? `Editing ${department?.name}` : 'Create a new department'}
                    </p>
                  </div>
                </div>
                <button
                  type="button" onClick={onClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-4 px-5 py-5">

                    {/* Branch — create only */}
                    {!isEdit && (
                      <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    <span className="font-mono text-xs text-muted-foreground mr-2">{b.code}</span>
                                    {b.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Code */}
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. HR"
                              className="font-mono uppercase"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Human Resources" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>

                  <div className="flex gap-3 border-t border-border/60 px-5 py-4">
                    <button
                      type="button" onClick={onClose}
                      className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" disabled={saving}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Saving…
                        </>
                      ) : (
                        isEdit ? 'Save Changes' : 'Create Department'
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
