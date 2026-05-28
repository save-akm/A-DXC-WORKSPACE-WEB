"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS = [
  { label: "Violet",  value: "bg-violet-500"  },
  { label: "Fuchsia", value: "bg-fuchsia-500" },
  { label: "Sky",     value: "bg-sky-500"     },
  { label: "Amber",   value: "bg-amber-500"   },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Rose",    value: "bg-rose-500"    },
  { label: "Indigo",  value: "bg-indigo-500"  },
  { label: "Teal",    value: "bg-teal-500"    },
];

export function RoleDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedColor, setSelectedColor] = useState("bg-violet-500");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
          >
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                  <ShieldPlus size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Create Role</h2>
                  <p className="text-xs text-muted-foreground">Define a new role &amp; permissions</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X size={15} />
              </Button>
            </div>

            <div className="mx-5 border-t" />

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Role Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Role Name
                </label>
                <Input placeholder="e.g. Manager" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what this role can do…"
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedColor(c.value)}
                      className={cn(
                        "relative flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110",
                        c.value,
                      )}
                    >
                      {selectedColor === c.value && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions placeholder */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissions
                </label>
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Permission matrix will be configured here
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button variant="cancel" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="create" className="flex-1">
                <ShieldPlus size={14} />
                Create Role
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
