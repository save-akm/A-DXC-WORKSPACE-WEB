"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
                  <UserPlus size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Invite User</h2>
                  <p className="text-xs text-muted-foreground">Add a new workspace member</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X size={15} />
              </Button>
            </div>

            <div className="mx-5 border-t" />

            <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Employee ID
                </label>
                <Input placeholder="e.g. H-01-002936" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    First Name
                  </label>
                  <Input placeholder="First name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Last Name
                  </label>
                  <Input placeholder="Last name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <Input type="email" placeholder="name@hlas.co.th" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <Input type="password" placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Department
                  </label>
                  <Input placeholder="e.g. A-DXC" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </label>
                  <Input placeholder="e.g. Admin" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Position
                </label>
                <Input placeholder="e.g. Senior Developer" />
              </div>
            </div>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button variant="cancel" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="create" className="flex-1">
                <UserPlus size={14} />
                Invite User
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
