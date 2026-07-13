'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserPlus, Users, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  addCollectionMember,
  removeCollectionMember,
  updateCollectionMember,
} from '@/lib/api/documents';
import { fetchUserOptions, type UserOption } from '@/lib/api/users';
import type { CollectionMember, MemberRole } from '../types';
import { ModalShell } from './modal-shell';
import { avatarColorForId, displayPersonName as displayName } from './doc-meta';

const ROLE_OPTIONS: Array<{ value: MemberRole; label: string }> = [
  { value: 'VIEWER', label: 'ดูอย่างเดียว' },
  { value: 'EDITOR', label: 'แก้ไขได้' },
];

interface MembersModalProps {
  open: boolean;
  collectionId: string;
  /** id เจ้าของ collection — กันแชร์ให้ตัวเอง */
  ownerUserId: string;
  members: CollectionMember[];
  onClose: () => void;
  onMembersChange: (members: CollectionMember[]) => void;
}

/** แชร์ collection ส่วนตัว — เพิ่ม/ถอดสมาชิก, ปรับ role (เจ้าของเท่านั้น) */
export function MembersModal({
  open,
  collectionId,
  ownerUserId,
  members,
  onClose,
  onMembersChange,
}: MembersModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('VIEWER');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setNewRole('VIEWER');
    fetchUserOptions()
      .then(setUsers)
      .catch(() => toast.error('โหลดรายชื่อผู้ใช้ไม่สำเร็จ'));
  }, [open]);

  const memberIds = useMemo(() => new Set(members.map(m => m.userId)), [members]);

  const candidates = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return users
      .filter(u => u.id !== ownerUserId && !memberIds.has(u.id))
      .filter(u =>
        displayName(u).toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.employeeId ?? '').toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [users, search, ownerUserId, memberIds]);

  const handleAdd = useCallback(async (user: UserOption) => {
    setBusyUserId(user.id);
    try {
      const added = await addCollectionMember(collectionId, { userId: user.id, role: newRole });
      onMembersChange([
        ...members,
        {
          userId: user.id,
          role: added.role,
          joinedAt: added.joinedAt,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
          },
        },
      ]);
      toast.success(`แชร์ให้ ${displayName(user)} แล้ว`);
      setSearch('');
    } catch (e) {
      const err = e as Error & { status?: number };
      toast.error(err.status === 409 ? 'ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว' : err.message || 'เพิ่มสมาชิกไม่สำเร็จ');
    } finally {
      setBusyUserId(null);
    }
  }, [collectionId, newRole, members, onMembersChange]);

  const handleRoleChange = useCallback(async (member: CollectionMember, role: MemberRole) => {
    if (role === member.role) return;
    setBusyUserId(member.userId);
    try {
      await updateCollectionMember(collectionId, member.userId, role);
      onMembersChange(members.map(m => (m.userId === member.userId ? { ...m, role } : m)));
      toast.success('ปรับสิทธิ์สำเร็จ');
    } catch (e) {
      toast.error((e as Error).message || 'ปรับสิทธิ์ไม่สำเร็จ');
    } finally {
      setBusyUserId(null);
    }
  }, [collectionId, members, onMembersChange]);

  const handleRemove = useCallback(async (member: CollectionMember) => {
    setBusyUserId(member.userId);
    try {
      await removeCollectionMember(collectionId, member.userId);
      onMembersChange(members.filter(m => m.userId !== member.userId));
      toast.success(`ถอด ${displayName(member.user)} ออกแล้ว`);
    } catch (e) {
      toast.error((e as Error).message || 'ถอดสมาชิกไม่สำเร็จ');
    } finally {
      setBusyUserId(null);
    }
  }, [collectionId, members, onMembersChange]);

  return (
    <ModalShell
      open={open}
      title="แชร์ collection"
      description="สมาชิกที่ถูกแชร์จะเห็นเอกสารทั้งหมดในกล่องนี้"
      icon={Users}
      maxWidth="max-w-lg"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 pb-5">
        {/* เพิ่มสมาชิก */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="ค้นหาชื่อ, อีเมล หรือรหัสพนักงาน…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={newRole} onValueChange={v => setNewRole(v as MemberRole)}>
              <SelectTrigger size="sm" className="w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {search.trim() && (
            <div className="flex flex-col gap-1 rounded-xl border border-border/60 p-1.5">
              {candidates.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  ไม่พบผู้ใช้ที่ยังไม่ได้เป็นสมาชิก
                </p>
              ) : (
                candidates.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={busyUserId !== null}
                    onClick={() => handleAdd(u)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
                  >
                    <UserAvatar
                      avatarUrl={u.avatarUrl}
                      initial={displayName(u).charAt(0)}
                      color={avatarColorForId(u.id)}
                      size="xs"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{displayName(u)}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{u.email}</span>
                    </span>
                    {busyUserId === u.id ? (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <UserPlus className="size-3.5 text-indigo-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* สมาชิกปัจจุบัน */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            สมาชิก ({members.length})
          </span>
          {members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
              ยังไม่ได้แชร์ให้ใคร — ค้นหาชื่อด้านบนเพื่อเริ่มแชร์
            </p>
          ) : (
            members.map(m => (
              <div key={m.userId} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                <UserAvatar
                  avatarUrl={m.user.avatarUrl}
                  initial={displayName(m.user).charAt(0)}
                  color={avatarColorForId(m.userId)}
                  size="xs"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{displayName(m.user)}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{m.user.email}</span>
                </span>
                <Select
                  value={m.role}
                  onValueChange={v => handleRoleChange(m, v as MemberRole)}
                  disabled={busyUserId !== null}
                >
                  <SelectTrigger size="sm" className="w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  disabled={busyUserId !== null}
                  onClick={() => handleRemove(m)}
                  aria-label={`ถอด ${displayName(m.user)}`}
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {busyUserId === m.userId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
}
