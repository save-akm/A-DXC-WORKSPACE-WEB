'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Briefcase, Loader2, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchUsers, fetchBranches, fetchPositions } from '@/lib/api/users';
import { fetchInvitationRecipientOptions } from '@/lib/api/activity-invitations';
import type { InvitationRecipientOption } from '@/lib/activity/invitation-types';
import type { User as AdminUser } from '@/app/(management)/admin/users/types';
import { invitationDisplayName } from './invitation-meta';

const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';

type TargetTab = 'users' | 'positions' | 'branches';

const TABS: { id: TargetTab; label: string; icon: typeof User }[] = [
  { id: 'users', label: 'รายบุคคล', icon: User },
  { id: 'positions', label: 'ตำแหน่ง', icon: Briefcase },
  { id: 'branches', label: 'สาขา', icon: Building2 },
];

export interface SelectedInvitationUser {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string;
  employeeId: string;
}

interface InvitationTargetPickerProps {
  activityId: string;
  active?: boolean;
  selectedUsers: SelectedInvitationUser[];
  selectedPositionIds: string[];
  selectedBranchIds: string[];
  onUsersChange: (users: SelectedInvitationUser[]) => void;
  onPositionIdsChange: (ids: string[]) => void;
  onBranchIdsChange: (ids: string[]) => void;
}

function formatRecipientLabel(opt: Pick<InvitationRecipientOption, 'name' | 'activeUserCount'>): string {
  return `${opt.name} (${opt.activeUserCount} คน)`;
}

export function InvitationTargetPicker({
  activityId,
  active = true,
  selectedUsers,
  selectedPositionIds,
  selectedBranchIds,
  onUsersChange,
  onPositionIdsChange,
  onBranchIdsChange,
}: InvitationTargetPickerProps) {
  const [tab, setTab] = useState<TargetTab>('users');
  const [positions, setPositions] = useState<InvitationRecipientOption[]>([]);
  const [branches, setBranches] = useState<InvitationRecipientOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsFallback, setOptionsFallback] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<AdminUser[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  useEffect(() => {
    if (!active || !activityId) return;
    setOptionsLoading(true);
    setOptionsFallback(false);

    fetchInvitationRecipientOptions(activityId)
      .then((data) => {
        setPositions([...data.positions].sort((a, b) => a.name.localeCompare(b.name)));
        setBranches([...data.branches].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(async () => {
        setOptionsFallback(true);
        try {
          const [pos, br] = await Promise.all([fetchPositions(), fetchBranches()]);
          setPositions(
            pos
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => ({ id: p.id, code: '', name: p.name, activeUserCount: 0 })),
          );
          setBranches(
            br
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((b) => ({ id: b.id, code: '', name: b.name, activeUserCount: 0 })),
          );
        } catch {
          setPositions([]);
          setBranches([]);
        }
      })
      .finally(() => setOptionsLoading(false));
  }, [active, activityId]);

  const runUserSearch = useCallback(async (query: string) => {
    setUserSearching(true);
    try {
      const data = await searchUsers({
        search: query || undefined,
        status: 'ACTIVE',
        page: 1,
        limit: 20,
      });
      setUserResults(data.users);
    } catch {
      setUserResults([]);
    } finally {
      setUserSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!active || tab !== 'users') return;
    const timer = setTimeout(() => runUserSearch(userSearch), 300);
    return () => clearTimeout(timer);
  }, [active, tab, userSearch, runUserSearch]);

  const selectedUserIds = useMemo(
    () => new Set(selectedUsers.map((u) => u.id)),
    [selectedUsers],
  );

  const positionMap = useMemo(
    () => new Map(positions.map((p) => [p.id, p])),
    [positions],
  );
  const branchMap = useMemo(
    () => new Map(branches.map((b) => [b.id, b])),
    [branches],
  );

  function toggleUser(user: AdminUser) {
    if (selectedUserIds.has(user.id)) {
      onUsersChange(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      onUsersChange([
        ...selectedUsers,
        {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          nickname: user.nickname,
          email: user.email,
          employeeId: user.employeeId,
        },
      ]);
    }
  }

  function toggleId(id: string, selected: string[], onChange: (ids: string[]) => void) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  function removeUser(id: string) {
    onUsersChange(selectedUsers.filter((u) => u.id !== id));
  }

  const totalSelected =
    selectedUsers.length + selectedPositionIds.length + selectedBranchIds.length;

  const countHint = optionsFallback
    ? null
    : 'ตัวเลขคือผู้ใช้ ACTIVE โดยประมาณ — จำนวนจริงดูในขั้นตรวจสอบ';

  return (
    <div className="space-y-4">
      {totalSelected > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className={LABEL_CLASS}>เลือกแล้ว ({totalSelected})</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedUsers.map((u) => (
              <SelectedChip
                key={`u-${u.id}`}
                label={invitationDisplayName(u)}
                sub={u.employeeId}
                onRemove={() => removeUser(u.id)}
              />
            ))}
            {selectedPositionIds.map((id) => {
              const opt = positionMap.get(id);
              return (
                <SelectedChip
                  key={`p-${id}`}
                  label={opt?.name ?? id}
                  sub={
                    opt && !optionsFallback && opt.activeUserCount > 0
                      ? `${opt.activeUserCount} คน`
                      : 'ตำแหน่ง'
                  }
                  onRemove={() => toggleId(id, selectedPositionIds, onPositionIdsChange)}
                />
              );
            })}
            {selectedBranchIds.map((id) => {
              const opt = branchMap.get(id);
              return (
                <SelectedChip
                  key={`b-${id}`}
                  label={opt?.name ?? id}
                  sub={
                    opt && !optionsFallback && opt.activeUserCount > 0
                      ? `${opt.activeUserCount} คน`
                      : 'สาขา'
                  }
                  onRemove={() => toggleId(id, selectedBranchIds, onBranchIdsChange)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-colors',
              tab === id
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLASS}>ค้นหาผู้ใช้ (ACTIVE)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ชื่อ, อีเมล, รหัสพนักงาน…"
                className={cn(INPUT_CLASS, 'pl-9')}
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-border/60">
            {userSearching ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                กำลังค้นหา…
              </div>
            ) : userResults.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {userSearch.trim() ? 'ไม่พบผู้ใช้' : 'พิมพ์เพื่อค้นหาผู้ใช้'}
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {userResults.map((user) => {
                  const checked = selectedUserIds.has(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                          checked && 'bg-violet-500/5',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]',
                            checked
                              ? 'border-violet-500 bg-violet-500 text-white'
                              : 'border-border bg-background',
                          )}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {invitationDisplayName(user)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email} · {user.employeeId}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'positions' && (
        <RecipientOptionGrid
          loading={optionsLoading}
          emptyHint="ไม่พบตำแหน่ง"
          options={positions}
          selected={selectedPositionIds}
          showCounts={!optionsFallback}
          countHint={countHint}
          onToggle={(id) => toggleId(id, selectedPositionIds, onPositionIdsChange)}
        />
      )}

      {tab === 'branches' && (
        <RecipientOptionGrid
          loading={optionsLoading}
          emptyHint="ไม่พบสาขา"
          options={branches}
          selected={selectedBranchIds}
          showCounts={!optionsFallback}
          countHint={countHint}
          onToggle={(id) => toggleId(id, selectedBranchIds, onBranchIdsChange)}
        />
      )}
    </div>
  );
}

function SelectedChip({
  label,
  sub,
  onRemove,
}: {
  label: string;
  sub?: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-violet-500/30 bg-background py-0.5 pl-2.5 pr-1 text-[11px] font-medium">
      <span className="truncate">
        {label}
        {sub && <span className="ml-1 text-muted-foreground">({sub})</span>}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function RecipientOptionGrid({
  loading,
  emptyHint,
  options,
  selected,
  showCounts,
  countHint,
  onToggle,
}: {
  loading: boolean;
  emptyHint: string;
  options: InvitationRecipientOption[];
  selected: string[];
  showCounts: boolean;
  countHint: string | null;
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        กำลังโหลด…
      </div>
    );
  }

  if (options.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <div className="space-y-2">
      {countHint && (
        <p className="text-[10px] text-muted-foreground">{countHint}</p>
      )}
      <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const label = showCounts ? formatRecipientLabel(opt) : opt.name;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              title={opt.code ? `${opt.code} · ${opt.name}` : opt.name}
              className={cn(
                'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                isSelected
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
