'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, Users } from 'lucide-react';
import { RolePermissionsTab } from './_components/role-permissions-tab';
import { UserPermissionsTab } from './_components/user-permissions-tab';

type Tab = 'role' | 'user';

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'role', label: 'Role Permissions Settings', icon: LayoutGrid },
  { id: 'user', label: 'User Permissions Settings', icon: Users },
];

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('role');

  return (
    <div className="p-6">
      {/* Tab pill switcher */}
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content with slide transition */}
      <AnimatePresence mode="wait">
        {activeTab === 'role' ? (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <RolePermissionsTab />
          </motion.div>
        ) : (
          <motion.div
            key="user"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <UserPermissionsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
