'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy,
  Link2,
  Loader2,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  addGroupMember,
  createInvite,
  deleteGroup,
  deleteGroupAvatar,
  fetchConversation,
  fetchInvites,
  removeGroupMember,
  revokeInvite,
  transferOwnership,
  updateConversation,
  updateMemberRole,
  updateMyMemberSettings,
  uploadGroupAvatar,
} from '@/lib/api/conversations';
import { fetchUserOptions, type UserOption } from '@/lib/api/users';
import {
  avatarColor,
  displayInitial,
  userDisplayName,
  userOptionName,
} from '@/lib/chat/meta';
import {
  canChangeRoles,
  canManageGroup,
  isGroupOwner,
} from '@/lib/chat/permissions';
import type { Conversation, ConversationInvite, ConversationRole } from '@/lib/chat/types';
import { useAuthStore } from '@/lib/stores/auth-store';

interface GroupAdminSectionsProps {
  conversation: Conversation;
  onUpdated: (c: Conversation) => void;
  onDeleted: () => void;
}

const ROLE_LABELS: Record<ConversationRole, string> = {
  OWNER: 'เจ้าของ',
  ADMIN: 'แอดมิน',
  MEMBER: 'สมาชิก',
};

export function GroupAdminSections({ conversation, onUpdated, onDeleted }: GroupAdminSectionsProps) {
  const myId = useAuthStore((s) => s.user?.id);
  const canManage = canManageGroup(conversation.myRole);
  const isOwner = isGroupOwner(conversation.myRole);
  const canRoles = canChangeRoles(conversation.myRole);

  const [name, setName] = useState(conversation.name ?? '');
  const [description, setDescription] = useState(conversation.description ?? '');
  const [saving, setSaving] = useState(false);
  const [groupNickname, setGroupNickname] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [invites, setInvites] = useState<ConversationInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(canManage);
  const [busy, setBusy] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canManage) return undefined;
    let cancelled = false;
    fetchInvites(conversation.id)
      .then((list) => {
        if (!cancelled) setInvites(list);
      })
      .catch(() => {
        if (!cancelled) setInvites([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingInvites(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversation.id, canManage]);

  useEffect(() => {
    if (!canManage) return;
    fetchUserOptions()
      .then((list) =>
        setUserOptions(list.filter((u) => u.status === 'ACTIVE' && !conversation.members.some((m) => m.userId === u.id))),
      )
      .catch(() => setUserOptions([]));
  }, [canManage, conversation.members]);

  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await updateConversation(conversation.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }, [conversation.id, name, description, onUpdated]);

  const handleAvatar = useCallback(
    async (file: File) => {
      setBusy('avatar');
      try {
        const updated = await uploadGroupAvatar(conversation.id, file);
        onUpdated(updated);
      } finally {
        setBusy(null);
      }
    },
    [conversation.id, onUpdated],
  );

  const handleAddMember = useCallback(
    async (userId: string) => {
      setBusy(userId);
      try {
        await addGroupMember(conversation.id, userId);
        const refreshed = await fetchConversation(conversation.id);
        onUpdated(refreshed);
        setMemberSearch('');
      } finally {
        setBusy(null);
      }
    },
    [conversation.id, onUpdated],
  );

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      setBusy(`rm-${userId}`);
      try {
        await removeGroupMember(conversation.id, userId);
        const refreshed = await fetchConversation(conversation.id);
        onUpdated(refreshed);
      } finally {
        setBusy(null);
      }
    },
    [conversation.id, onUpdated],
  );

  const handleRoleChange = useCallback(
    async (userId: string, role: 'ADMIN' | 'MEMBER') => {
      setBusy(`role-${userId}`);
      try {
        await updateMemberRole(conversation.id, userId, role);
        const refreshed = await fetchConversation(conversation.id);
        onUpdated(refreshed);
      } finally {
        setBusy(null);
      }
    },
    [conversation.id, onUpdated],
  );

  const handleCreateInvite = useCallback(async () => {
    setBusy('invite');
    try {
      const invite = await createInvite(conversation.id, { maxUses: 50 });
      setInvites((prev) => [invite, ...prev]);
    } finally {
      setBusy(null);
    }
  }, [conversation.id]);

  const handleSaveMySettings = useCallback(async () => {
    setBusy('me');
    try {
      await updateMyMemberSettings(conversation.id, {
        nickname: groupNickname.trim() || null,
        isMuted,
      });
    } finally {
      setBusy(null);
    }
  }, [conversation.id, groupNickname, isMuted]);

  const handleTransfer = useCallback(
    async (userId: string) => {
      if (!confirm('โอนความเป็นเจ้าของกลุ่มให้สมาชิกนี้?')) return;
      setBusy(`transfer-${userId}`);
      try {
        const updated = await transferOwnership(conversation.id, userId);
        onUpdated(updated);
      } finally {
        setBusy(null);
      }
    },
    [conversation.id, onUpdated],
  );

  const handleDeleteGroup = useCallback(async () => {
    if (!confirm('ลบกลุ่มถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    setBusy('delete');
    try {
      await deleteGroup(conversation.id);
      onDeleted();
    } finally {
      setBusy(null);
    }
  }, [conversation.id, onDeleted]);

  const filteredAddUsers = userOptions.filter((u) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return userOptionName(u).toLowerCase().includes(q);
  }).slice(0, 8);

  const inviteUrl = (code: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/inbox/join/${code}`;

  return (
    <div className="space-y-6 pb-4">
      {canManage ? (
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ข้อมูลกลุ่ม
          </h4>
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={conversation.displayAvatar}
              initial={displayInitial(conversation.displayName)}
              color={avatarColor(conversation.id)}
              size="md"
            />
            <div className="flex gap-1">
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatar(f);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={busy === 'avatar'}
                onClick={() => avatarRef.current?.click()}
              >
                {busy === 'avatar' ? <Loader2 className="size-3 animate-spin" /> : null}
                เปลี่ยนรูป
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setBusy('avatar');
                  try {
                    onUpdated(await deleteGroupAvatar(conversation.id));
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                ลบรูป
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grp-name">ชื่อกลุ่ม</Label>
            <Input id="grp-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grp-desc">คำอธิบาย</Label>
            <Textarea
              id="grp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button variant="save" size="sm" disabled={saving || !name.trim()} onClick={() => void saveProfile()}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : null}
            บันทึก
          </Button>
        </section>
      ) : null}

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          สมาชิก ({conversation.members.length})
        </h4>
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {conversation.members.map((m) => {
            const n = userDisplayName(m.user);
            const isMe = m.userId === myId;
            return (
              <li key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40">
                <UserAvatar
                  avatarUrl={m.user.avatarUrl}
                  initial={displayInitial(n)}
                  color={avatarColor(m.userId)}
                  size="xs"
                  alt={n}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {n}
                  {isMe ? <span className="text-muted-foreground"> (คุณ)</span> : null}
                </span>
                <span className="text-[10px] text-muted-foreground">{ROLE_LABELS[m.role]}</span>
                {canRoles && m.role !== 'OWNER' && !isMe ? (
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title={m.role === 'ADMIN' ? 'ลดเป็น Member' : 'ตั้งเป็น Admin'}
                      disabled={busy === `role-${m.userId}`}
                      onClick={() =>
                        void handleRoleChange(m.userId, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                    >
                      <Shield className="size-3" />
                    </Button>
                    {isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="โอน ownership"
                        disabled={busy === `transfer-${m.userId}`}
                        onClick={() => void handleTransfer(m.userId)}
                      >
                        <UserPlus className="size-3" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="ลบออกจากกลุ่ม"
                      disabled={busy === `rm-${m.userId}`}
                      onClick={() => void handleRemoveMember(m.userId)}
                    >
                      <UserMinus className="size-3 text-destructive" />
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {canManage ? (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            เพิ่มสมาชิก
          </h4>
          <Input
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="ค้นหาชื่อ..."
            className="h-8"
          />
          <ul className="space-y-0.5">
            {filteredAddUsers.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  disabled={busy === u.id}
                  onClick={() => void handleAddMember(u.id)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent/50"
                >
                  <UserAvatar
                    avatarUrl={u.avatarUrl}
                    initial={displayInitial(userOptionName(u))}
                    color={avatarColor(u.id)}
                    size="xs"
                  />
                  {userOptionName(u)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canManage ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              ลิงก์เชิญ
            </h4>
            <Button variant="outline" size="sm" disabled={busy === 'invite'} onClick={() => void handleCreateInvite()}>
              {busy === 'invite' ? <Loader2 className="size-3 animate-spin" /> : <Link2 className="size-3" />}
              สร้างลิงก์
            </Button>
          </div>
          {loadingInvites ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : invites.length === 0 ? (
            <p className="text-xs text-muted-foreground">ยังไม่มีลิงก์เชิญ</p>
          ) : (
            <ul className="space-y-2">
              {invites.filter((i) => i.isActive).map((inv) => (
                <li key={inv.id} className="rounded-lg bg-muted/50 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-brand">{inv.inviteCode}</code>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => void navigator.clipboard.writeText(inviteUrl(inv.inviteCode))}
                    >
                      <Copy className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={busy === `revoke-${inv.id}`}
                      onClick={async () => {
                        setBusy(`revoke-${inv.id}`);
                        try {
                          await revokeInvite(inv.id);
                          setInvites((prev) =>
                            prev.map((i) => (i.id === inv.id ? { ...i, isActive: false } : i)),
                          );
                        } finally {
                          setBusy(null);
                        }
                      }}
                      aria-label="ยกเลิกลิงก์"
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    ใช้แล้ว {inv.useCount}{inv.maxUses ? `/${inv.maxUses}` : ''} ครั้ง
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          การตั้งค่าของฉันในกลุ่ม
        </h4>
        <div className="space-y-1.5">
          <Label htmlFor="my-nick">ชื่อเล่นในกลุ่ม</Label>
          <Input
            id="my-nick"
            value={groupNickname}
            onChange={(e) => setGroupNickname(e.target.value)}
            placeholder="ไม่บังคับ"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isMuted}
            onChange={(e) => setIsMuted(e.target.checked)}
            className="size-4 rounded border-border"
          />
          ปิดเสียงการแจ้งเตือน
        </label>
        <Button variant="outline" size="sm" disabled={busy === 'me'} onClick={() => void handleSaveMySettings()}>
          บันทึกการตั้งค่า
        </Button>
      </section>

      {isOwner ? (
        <section className="space-y-2 border-t border-border/60 pt-4">
          <Button
            variant="delete"
            size="sm"
            className="w-full"
            disabled={busy === 'delete'}
            onClick={() => void handleDeleteGroup()}
          >
            <Trash2 />
            ลบกลุ่มถาวร
          </Button>
        </section>
      ) : null}
    </div>
  );
}
