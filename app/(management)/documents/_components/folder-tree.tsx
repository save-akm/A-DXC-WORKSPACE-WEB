'use client';

import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Files,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  Inbox,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { cn } from '@/lib/utils';
import type { DocumentInCollection, Folder } from '../types';

/** สิ่งที่เลือกอยู่ใน tree: ทั้งหมด / เอกสารนอกโฟลเดอร์ / โฟลเดอร์หนึ่ง */
export type FolderSelection = 'all' | 'root' | string;

interface TreeNode extends Folder {
  children: TreeNode[];
}

interface FolderTreeProps {
  folders: Folder[];
  documents: DocumentInCollection[];
  selected: FolderSelection;
  canEdit: boolean;
  onSelect: (sel: FolderSelection) => void;
  onCreate: (parentId: string | null) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}

/** สร้าง tree จาก flat list (parentId) — โฟลเดอร์กำพร้าถือเป็น root */
function buildTree(folders: Folder[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>();
  for (const f of folders) nodes.set(f.id, { ...f, children: [] });
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sortRec = (list: TreeNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    for (const n of list) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
}

export function FolderTree({
  folders,
  documents,
  selected,
  canEdit,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: FolderTreeProps) {
  const tree = useMemo(() => buildTree(folders), [folders]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const countByFolder = useMemo(() => {
    const map = new Map<string | null, number>();
    for (const d of documents) map.set(d.folderId, (map.get(d.folderId) ?? 0) + 1);
    return map;
  }, [documents]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRow = (
    key: string,
    sel: FolderSelection,
    icon: React.ReactNode,
    label: string,
    count: number,
    depth: number,
    extra?: { hasChildren: boolean; isCollapsed: boolean; folder: Folder },
  ) => {
    const active = selected === sel;
    return (
      <div
        key={key}
        className={cn(
          'group/row flex items-center gap-1 rounded-lg pr-1 transition-colors',
          active ? 'bg-accent/70 text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        {extra?.hasChildren ? (
          <button
            type="button"
            aria-label={extra.isCollapsed ? 'ขยาย' : 'ย่อ'}
            onClick={() => toggleCollapse(extra.folder.id)}
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <ChevronRight
              className={cn('size-3 transition-transform duration-150', !extra.isCollapsed && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(sel)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-1.5 text-left"
        >
          {icon}
          <span className={cn('min-w-0 truncate text-xs', active ? 'font-semibold' : 'font-medium')}>
            {label}
          </span>
          {count > 0 && (
            <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              {count}
            </span>
          )}
        </button>

        {canEdit && extra && (
          <span className="shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
            <ActionMenu
              actions={[
                { label: 'โฟลเดอร์ย่อย', icon: FolderPlus, onClick: () => onCreate(extra.folder.id) },
                { label: 'เปลี่ยนชื่อ', icon: Pencil, onClick: () => onRename(extra.folder) },
                { label: 'ลบโฟลเดอร์', icon: Trash2, destructive: true, onClick: () => onDelete(extra.folder) },
              ] satisfies ActionItem[]}
            />
          </span>
        )}
      </div>
    );
  };

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const isCollapsed = collapsed.has(node.id);
    const active = selected === node.id;
    return (
      <div key={node.id}>
        {renderRow(
          node.id,
          node.id,
          active
            ? <FolderOpen className="size-3.5 shrink-0 text-indigo-500" />
            : <FolderIcon className="size-3.5 shrink-0" />,
          node.name,
          countByFolder.get(node.id) ?? 0,
          depth,
          { hasChildren: node.children.length > 0, isCollapsed, folder: node },
        )}
        {!isCollapsed && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="mb-1 flex items-center justify-between pl-1">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">โฟลเดอร์</span>
        {canEdit && (
          <Button variant="ghost" size="icon-xs" aria-label="สร้างโฟลเดอร์" onClick={() => onCreate(null)}>
            <FolderPlus />
          </Button>
        )}
      </div>

      {renderRow('all', 'all', <Files className="size-3.5 shrink-0" />, 'เอกสารทั้งหมด', documents.length, 0)}
      {renderRow('root', 'root', <Inbox className="size-3.5 shrink-0" />, 'นอกโฟลเดอร์', countByFolder.get(null) ?? 0, 0)}

      {tree.length > 0 && <div className="my-1 h-px bg-border/60" />}
      {tree.map(node => renderNode(node, 0))}

      {tree.length === 0 && canEdit && (
        <button
          type="button"
          onClick={() => onCreate(null)}
          className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground"
        >
          <FolderPlus className="size-3.5" />
          สร้างโฟลเดอร์แรก
        </button>
      )}
    </div>
  );
}
