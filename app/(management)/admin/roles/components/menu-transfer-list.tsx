'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronRight, ChevronLeft, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupMenus, type FlatMenu } from './create-role-shared';

interface MenuTransferListProps {
  items: FlatMenu[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

interface PanelProps {
  title: string;
  items: FlatMenu[];
  query: string;
  onQuery: (q: string) => void;
  onItemClick: (id: string) => void;
  onMoveAll: () => void;
  side: 'left' | 'right';
  emptyLabel: string;
}

function Panel({ title, items, query, onQuery, onItemClick, onMoveAll, side, emptyLabel }: PanelProps) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => m.name.toLowerCase().includes(q) || m.group.toLowerCase().includes(q));
  }, [items, query]);

  const groups = useMemo(() => groupMenus(filtered), [filtered]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title} <span className="text-foreground">({items.length})</span>
        </span>
        <button
          type="button"
          onClick={onMoveAll}
          disabled={items.length === 0}
          className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 disabled:opacity-40 dark:text-indigo-400 cursor-pointer disabled:cursor-not-allowed"
        >
          {side === 'left' ? 'Add all' : 'Remove all'}
        </button>
      </div>

      {/* Search */}
      <div className="relative border-b border-border/60 px-2.5 py-2">
        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="ค้นหาเมนู…"
          className="w-full rounded-lg border border-border bg-card py-1.5 pl-7 pr-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground/60">
            <Inbox size={20} />
            <span className="text-[11px]">{emptyLabel}</span>
          </div>
        ) : (
          Array.from(groups.entries()).map(([group, rows]) => (
            <div key={group} className="mb-2 last:mb-0">
              <p className="px-1.5 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {group}
              </p>
              <div className="flex flex-col gap-0.5">
                {rows.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onItemClick(m.id)}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-indigo-500/10 cursor-pointer"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-indigo-500/15 group-hover:text-indigo-500">
                        <Icon size={13} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground">
                        {m.name}
                      </span>
                      {side === 'left' ? (
                        <ChevronRight size={13} className="shrink-0 text-muted-foreground/40 group-hover:text-indigo-500" />
                      ) : (
                        <ChevronLeft size={13} className="shrink-0 text-muted-foreground/40 group-hover:text-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function MenuTransferList({ items, selected, onChange }: MenuTransferListProps) {
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const available = useMemo(() => items.filter((m) => !selectedSet.has(m.id)), [items, selectedSet]);
  const assigned = useMemo(() => items.filter((m) => selectedSet.has(m.id)), [items, selectedSet]);

  const add = (id: string) => onChange([...selected, id]);
  const remove = (id: string) => onChange(selected.filter((x) => x !== id));
  const addAll = () => onChange(items.map((m) => m.id));
  const removeAll = () => onChange([]);

  return (
    <div className={cn('flex h-[340px] gap-3')}>
      <Panel
        title="Available"
        items={available}
        query={leftQuery}
        onQuery={setLeftQuery}
        onItemClick={add}
        onMoveAll={addAll}
        side="left"
        emptyLabel="เพิ่มครบทุกเมนูแล้ว"
      />
      <Panel
        title="Assigned"
        items={assigned}
        query={rightQuery}
        onQuery={setRightQuery}
        onItemClick={remove}
        onMoveAll={removeAll}
        side="right"
        emptyLabel="ยังไม่ได้เลือกเมนู"
      />
    </div>
  );
}
