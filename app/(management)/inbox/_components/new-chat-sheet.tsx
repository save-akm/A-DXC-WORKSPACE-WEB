'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { createDirectConversation, createGroupConversation } from '@/lib/api/conversations';
import { fetchUserOptions, type UserOption } from '@/lib/api/users';
import { avatarColor, displayInitial, userOptionName } from '@/lib/chat/meta';
import type { Conversation } from '@/lib/chat/types';
import { useAuthStore } from '@/lib/stores/auth-store';

type Mode = 'direct' | 'group';

interface NewChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversation: Conversation) => void;
}

export function NewChatSheet({ open, onOpenChange, onCreated }: NewChatSheetProps) {
  const myId = useAuthStore((s) => s.user?.id);
  const [mode, setMode] = useState<Mode>('direct');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserOption | null>(null);
  const [groupMembers, setGroupMembers] = useState<UserOption[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMode('direct');
    setSearch('');
    setSelected(null);
    setGroupMembers([]);
    setGroupName('');
    setGroupDesc('');
    setError(null);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setLoadingUsers(true);
      else resetForm();
      onOpenChange(next);
    },
    [onOpenChange, resetForm],
  );

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    fetchUserOptions()
      .then((list) => {
        if (!cancelled) setUsers(list.filter((u) => u.id !== myId && u.status === 'ACTIVE'));
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, myId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 30);
    return users.filter((u) => {
      const name = userOptionName(u);
      return (
        name.toLowerCase().includes(q)
        || u.email?.toLowerCase().includes(q)
        || u.employeeId?.toLowerCase().includes(q)
      );
    }).slice(0, 30);
  }, [users, search]);

  const toggleGroupMember = useCallback((user: UserOption) => {
    setGroupMembers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'direct') {
        if (!selected) {
          setError('เลือกผู้รับแชท');
          return;
        }
        const conv = await createDirectConversation(selected.id);
        onCreated(conv);
        return;
      }
      if (!groupName.trim()) {
        setError('กรอกชื่อกลุ่ม');
        return;
      }
      const conv = await createGroupConversation({
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        memberIds: groupMembers.map((m) => m.id),
      });
      onCreated(conv);
    } catch (e) {
      setError((e as Error)?.message ?? 'สร้างแชทไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }, [mode, selected, groupName, groupDesc, groupMembers, onCreated]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>เริ่มแชทใหม่</SheetTitle>
          <SheetDescription>แชท 1:1 หรือสร้างกลุ่มสนทนา</SheetDescription>
        </SheetHeader>

        <div className="mx-4 flex shrink-0 gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
          {([
            { id: 'direct' as const, label: '1:1', icon: UserPlus },
            { id: 'group' as const, label: 'กลุ่ม', icon: Users },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                mode === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {mode === 'group' ? (
          <div className="mx-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="group-name">ชื่อกลุ่ม</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="เช่น ทีม Dev"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group-desc">คำอธิบาย (ไม่บังคับ)</Label>
              <Textarea
                id="group-desc"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="ห้องประสานงาน..."
                rows={2}
              />
            </div>
            {groupMembers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {groupMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleGroupMember(m)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand"
                  >
                    {userOptionName(m)}
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="relative mx-4 shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสมาชิก..."
            className="h-8 pl-8"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto py-1">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ไม่พบสมาชิก</p>
          ) : (
            filtered.map((user) => {
              const name = userOptionName(user);
              const isDirectSelected = mode === 'direct' && selected?.id === user.id;
              const isGroupSelected = mode === 'group' && groupMembers.some((m) => m.id === user.id);
              const isSelected = isDirectSelected || isGroupSelected;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    if (mode === 'direct') setSelected(user);
                    else toggleGroupMember(user);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2 text-left transition-colors',
                    isSelected ? 'bg-brand-muted ring-1 ring-brand/20' : 'hover:bg-accent/60',
                  )}
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    initial={displayInitial(name)}
                    color={avatarColor(user.id)}
                    size="sm"
                    alt={name}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email ?? user.employeeId ?? '—'}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        {error ? <p className="mx-4 text-sm text-destructive">{error}</p> : null}

        <div className="mx-4 flex shrink-0 gap-2 border-t border-border/60 pb-2 pt-4">
          <Button variant="cancel" className="flex-1" onClick={() => handleOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="create"
            className="flex-1"
            disabled={submitting || (mode === 'direct' ? !selected : !groupName.trim())}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === 'direct' ? 'เริ่มแชท' : 'สร้างกลุ่ม'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
