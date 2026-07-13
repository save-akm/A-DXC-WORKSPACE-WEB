'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CloudUpload,
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  Folder as FolderIcon,
  FolderInput,
  FolderX,
  Link2,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { Pagination } from '@/components/management/pagination';
import { ConfirmDialog } from '@/components/management/confirm-dialog';
import {
  fetchCollectionDetail,
  deleteCollection,
  deleteFolder,
  removeDocumentFromCollection,
  downloadDocument,
} from '@/lib/api/documents';
import type {
  CollectionDetail,
  CollectionMember,
  CollectionSummary,
  DocumentInCollection,
  Folder,
} from '../types';
import { FolderTree, type FolderSelection } from '../_components/folder-tree';
import { FolderModal } from '../_components/folder-modal';
import { UploadModal } from '../_components/upload-modal';
import { LinkModal } from '../_components/link-modal';
import { AddDocsModal } from '../_components/add-docs-modal';
import { MoveDocModal } from '../_components/move-doc-modal';
import { MembersModal } from '../_components/members-modal';
import { CollectionModal } from '../_components/collection-modal';
import { AskAiPanel } from '../_components/ask-ai-panel';
import {
  CategoryBadge, DocIcon, DocTypeLabel, DocUploaderCell, RoleBadge, StatusBadge,
  buildDownloadFilename, formatDate,
} from '../_components/doc-meta';

const PAGE_SIZE = 10;
const EASE = [0.4, 0, 0.2, 1] as const;

/** id ของ folder ทั้ง subtree (รวมตัวเอง) — ใช้ตัดสินใจ reset selection ตอนลบ */
function subtreeIds(folders: Folder[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        grew = true;
      }
    }
  }
  return ids;
}

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selection, setSelection] = useState<FolderSelection>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals / panels
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [addDocsOpen, setAddDocsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [folderModal, setFolderModal] = useState<{ parentId: string | null; editTarget: Folder | null } | null>(null);
  const [moveTarget, setMoveTarget] = useState<DocumentInCollection | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null);
  const [removeDocTarget, setRemoveDocTarget] = useState<DocumentInCollection | null>(null);
  const [deleteColOpen, setDeleteColOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const reload = useCallback(() => {
    return fetchCollectionDetail(id)
      .then(d => { setDetail(d); setLoadError(false); })
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => { setPage(1); }, [selection, search]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const col = detail?.collection ?? null;
  const accessLevel = detail?.accessLevel ?? 'VIEWER';
  const canEdit = accessLevel === 'OWNER' || accessLevel === 'EDITOR';
  const isPersonalOwner = accessLevel === 'OWNER' && col?.type === 'PERSONAL';

  const folderNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of col?.folders ?? []) map.set(f.id, f.name);
    return map;
  }, [col?.folders]);

  const existingDocIds = useMemo(
    () => new Set((col?.documents ?? []).map(d => d.documentId)),
    [col?.documents],
  );

  const filtered = useMemo(() => {
    let result = col?.documents ?? [];
    if (selection === 'root') result = result.filter(d => d.folderId === null);
    else if (selection !== 'all') result = result.filter(d => d.folderId === selection);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => d.document.title.toLowerCase().includes(q));
    }
    return result;
  }, [col?.documents, selection, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedFolderId = selection !== 'all' && selection !== 'root' ? selection : null;
  const showFolderColumn = selection === 'all';
  const colCount = 7 + (showFolderColumn ? 1 : 0);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFolderSaved = useCallback((folder: Folder, mode: 'create' | 'rename') => {
    setDetail(prev => {
      if (!prev) return prev;
      const folders = mode === 'create'
        ? [...prev.collection.folders, folder]
        : prev.collection.folders.map(f => (f.id === folder.id ? { ...f, name: folder.name } : f));
      return { ...prev, collection: { ...prev.collection, folders } };
    });
  }, []);

  const handleDeleteFolder = useCallback(async () => {
    if (!deleteFolderTarget || !col) return;
    setConfirmBusy(true);
    try {
      await deleteFolder(col.id, deleteFolderTarget.id);
      const removed = subtreeIds(col.folders, deleteFolderTarget.id);
      setDetail(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          collection: {
            ...prev.collection,
            folders: prev.collection.folders.filter(f => !removed.has(f.id)),
            // เอกสารในสายที่ถูกลบตกไป root ตาม behavior ของ API
            documents: prev.collection.documents.map(d =>
              d.folderId && removed.has(d.folderId) ? { ...d, folderId: null } : d,
            ),
          },
        };
      });
      if (selection !== 'all' && selection !== 'root' && removed.has(selection)) setSelection('all');
      toast.success(`ลบโฟลเดอร์ "${deleteFolderTarget.name}" แล้ว`);
      setDeleteFolderTarget(null);
    } catch (e) {
      toast.error((e as Error).message || 'ลบโฟลเดอร์ไม่สำเร็จ');
    } finally {
      setConfirmBusy(false);
    }
  }, [deleteFolderTarget, col, selection]);

  const handleRemoveDoc = useCallback(async () => {
    if (!removeDocTarget || !col) return;
    setConfirmBusy(true);
    try {
      await removeDocumentFromCollection(col.id, removeDocTarget.documentId);
      setDetail(prev => prev && ({
        ...prev,
        collection: {
          ...prev.collection,
          documents: prev.collection.documents.filter(d => d.documentId !== removeDocTarget.documentId),
        },
      }));
      toast.success(`เอา "${removeDocTarget.document.title}" ออกจาก collection แล้ว`);
      setRemoveDocTarget(null);
    } catch (e) {
      toast.error((e as Error).message || 'เอาเอกสารออกไม่สำเร็จ');
    } finally {
      setConfirmBusy(false);
    }
  }, [removeDocTarget, col]);

  const handleDeleteCollection = useCallback(async () => {
    if (!col) return;
    setConfirmBusy(true);
    try {
      await deleteCollection(col.id);
      toast.success(`ลบ "${col.name}" แล้ว`);
      router.push('/documents');
    } catch (e) {
      toast.error((e as Error).message || 'ลบ collection ไม่สำเร็จ');
      setConfirmBusy(false);
    }
  }, [col, router]);

  const handleMoved = useCallback((docId: string, folderId: string | null, category: DocumentInCollection['category']) => {
    setDetail(prev => prev && ({
      ...prev,
      collection: {
        ...prev.collection,
        documents: prev.collection.documents.map(d =>
          d.documentId === docId ? { ...d, folderId, category } : d,
        ),
      },
    }));
  }, []);

  const handleRenamed = useCallback((saved: CollectionSummary) => {
    setDetail(prev => prev && ({
      ...prev,
      collection: { ...prev.collection, name: saved.name, description: saved.description },
    }));
  }, []);

  const handleMembersChange = useCallback((members: CollectionMember[]) => {
    setDetail(prev => prev && ({ ...prev, collection: { ...prev.collection, members } }));
  }, []);

  const handleDownload = useCallback((doc: DocumentInCollection['document']) => {
    toast.promise(downloadDocument(doc.id, buildDownloadFilename(doc.title, doc.fileType)), {
      loading: `กำลังดาวน์โหลด "${doc.title}"…`,
      success: 'ดาวน์โหลดสำเร็จ',
      error: e => {
        const err = e as Error & { status?: number };
        return err.status === 404
          ? 'ไม่พบไฟล์ต้นฉบับ (อาจอัปโหลดไว้ก่อนระบบเก็บไฟล์ถาวร) กรุณาอัปโหลดใหม่'
          : err.message || 'ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่';
      },
    });
  }, []);

  const docActions = useCallback((binding: DocumentInCollection): ActionItem[] => {
    const actions: ActionItem[] = [];
    const doc = binding.document;
    if (doc.sourceType === 'LINK' && doc.url) {
      actions.push({
        label: 'เปิดลิงก์',
        icon: ExternalLink,
        onClick: () => window.open(doc.url!, '_blank', 'noopener,noreferrer'),
      });
    } else if (doc.sourceType === 'UPLOAD' && doc.status === 'READY') {
      actions.push({ label: 'ดาวน์โหลด', icon: Download, onClick: () => handleDownload(doc) });
    }
    if (canEdit) {
      actions.push({ label: 'ย้าย / จัดหมวด', icon: FolderInput, onClick: () => setMoveTarget(binding) });
      actions.push({
        label: 'เอาออกจากกล่อง',
        icon: X,
        destructive: true,
        onClick: () => setRemoveDocTarget(binding),
      });
    }
    return actions;
  }, [canEdit, handleDownload]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="h-16 animate-pulse rounded-xl bg-muted/60" />
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-96 animate-pulse rounded-xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (loadError || !col) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <FolderX size={20} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">ไม่พบ collection นี้</p>
          <p className="text-xs text-muted-foreground">อาจถูกลบไปแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/documents" />}>
          <ArrowLeft />
          กลับหน้าเอกสาร
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon-sm" aria-label="กลับหน้าเอกสาร" className="mt-0.5 shrink-0" nativeButton={false} render={<Link href="/documents" />}>
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">{col.name}</h1>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {col.type === 'PROJECT' ? 'โปรเจกต์' : 'ส่วนตัว'}
              </span>
              <RoleBadge role={accessLevel} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {col.description || `${col.documents.length} เอกสาร · อัปเดต ${formatDate(col.updatedAt)}`}
            </p>
            {col.owner && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="shrink-0">เจ้าของ</span>
                <DocUploaderCell uploader={col.owner} />
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
          {isPersonalOwner && (
            <Button variant="outline" onClick={() => setMembersOpen(true)}>
              <Users />
              <span className="hidden sm:inline">แชร์</span>
              {col.members.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                  {col.members.length}
                </span>
              )}
            </Button>
          )}
          <Button variant="create" onClick={() => setAskAiOpen(true)}>
            <Sparkles />
            ถาม AI
          </Button>
          {isPersonalOwner && (
            <ActionMenu
              triggerSize="icon-sm"
              actions={[
                { label: 'แก้ไขชื่อ', icon: Pencil, onClick: () => setRenameOpen(true) },
                { label: 'ลบ collection', icon: Trash2, destructive: true, onClick: () => setDeleteColOpen(true) },
              ]}
            />
          )}
        </div>
      </motion.div>

      {/* Body */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: EASE }}
        className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]"
      >
        {/* Folder tree */}
        <Card size="sm" className="lg:sticky lg:top-4">
          <CardContent className="p-2">
            <FolderTree
              folders={col.folders}
              documents={col.documents}
              selected={selection}
              canEdit={canEdit}
              onSelect={setSelection}
              onCreate={parentId => setFolderModal({ parentId, editTarget: null })}
              onRename={folder => setFolderModal({ parentId: null, editTarget: folder })}
              onDelete={setDeleteFolderTarget}
            />
          </CardContent>
        </Card>

        {/* Documents */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="ค้นหาในกล่องนี้…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setAddDocsOpen(true)}>
                  <FilePlus2 />
                  <span className="hidden md:inline">เพิ่มที่มีอยู่</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)}>
                  <Link2 />
                  <span className="hidden md:inline">แปะลิงก์</span>
                </Button>
                <Button variant="save" size="sm" onClick={() => setUploadOpen(true)}>
                  <CloudUpload />
                  อัปโหลด
                </Button>
              </div>
            )}
          </div>

          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4 text-xs">#</TableHead>
                    <TableHead className="text-xs">เอกสาร</TableHead>
                    <TableHead className="hidden w-36 text-xs xl:table-cell">ผู้อัปโหลด</TableHead>
                    <TableHead className="w-20 text-xs">ประเภท</TableHead>
                    {showFolderColumn && (
                      <TableHead className="hidden w-32 text-xs sm:table-cell">โฟลเดอร์</TableHead>
                    )}
                    <TableHead className="w-32 text-xs">สถานะ</TableHead>
                    <TableHead className="hidden w-28 text-xs md:table-cell">เพิ่มเมื่อ</TableHead>
                    <TableHead className="w-10 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colCount} className="py-16">
                        {search ? (
                          <p className="text-center text-sm text-muted-foreground">
                            ไม่พบเอกสารที่ตรงกับคำค้น
                          </p>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                              <FileText size={20} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {selection === 'all' ? 'ยังไม่มีเอกสารในกล่องนี้' : 'โฟลเดอร์นี้ยังว่าง'}
                              </p>
                              {canEdit && (
                                <p className="text-xs text-muted-foreground">
                                  อัปโหลดไฟล์ใหม่ หรือเพิ่มเอกสารที่มีอยู่เข้ามา
                                </p>
                              )}
                            </div>
                            {canEdit && (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setAddDocsOpen(true)}>
                                  <FilePlus2 />
                                  เพิ่มที่มีอยู่
                                </Button>
                                <Button variant="save" size="sm" onClick={() => setUploadOpen(true)}>
                                  <CloudUpload />
                                  อัปโหลด
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((binding, i) => {
                      const doc = binding.document;
                      return (
                        <TableRow key={binding.documentId}>
                          <TableCell className="pl-4 text-xs text-muted-foreground">
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <DocIcon sourceType={doc.sourceType} fileType={doc.fileType} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-medium leading-tight">{doc.title}</p>
                                  {binding.category && <CategoryBadge category={binding.category} />}
                                </div>
                                {doc.sourceType === 'LINK' && doc.url && (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block max-w-64 truncate font-mono text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                                  >
                                    {doc.url}
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <DocUploaderCell uploader={doc.uploadedBy ?? null} />
                          </TableCell>
                          <TableCell>
                            <DocTypeLabel sourceType={doc.sourceType} fileType={doc.fileType} />
                          </TableCell>
                          {showFolderColumn && (
                            <TableCell className="hidden sm:table-cell">
                              {binding.folderId ? (
                                <span className="inline-flex max-w-28 items-center gap-1 truncate text-xs text-muted-foreground">
                                  <FolderIcon className="size-3 shrink-0" />
                                  <span className="truncate">{folderNames.get(binding.folderId) ?? '—'}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">Root</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <StatusBadge status={doc.status} />
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                            {formatDate(binding.addedAt)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <ActionMenu actions={docActions(binding)} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {filtered.length > 0 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onChange={setPage}
                  layoutId="collection-docs-page-active-bg"
                  itemLabel="เอกสาร"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        collection={{ id: col.id, type: col.type, folders: col.folders }}
        defaultFolderId={selectedFolderId}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => reload()}
      />
      <LinkModal
        open={linkOpen}
        collection={{ id: col.id, type: col.type, folders: col.folders }}
        defaultFolderId={selectedFolderId}
        onClose={() => setLinkOpen(false)}
        onCreated={() => reload()}
      />
      <AddDocsModal
        open={addDocsOpen}
        collectionId={col.id}
        existingDocIds={existingDocIds}
        targetFolderId={selectedFolderId}
        targetFolderName={selectedFolderId ? folderNames.get(selectedFolderId) : undefined}
        onClose={() => setAddDocsOpen(false)}
        onAdded={() => reload()}
      />
      <MoveDocModal
        open={moveTarget !== null}
        collectionId={col.id}
        collectionType={col.type}
        folders={col.folders}
        target={moveTarget}
        onClose={() => setMoveTarget(null)}
        onMoved={handleMoved}
      />
      <MembersModal
        open={membersOpen}
        collectionId={col.id}
        ownerUserId={col.owner?.id ?? col.userId}
        members={col.members}
        onClose={() => setMembersOpen(false)}
        onMembersChange={handleMembersChange}
      />
      <CollectionModal
        open={renameOpen}
        editTarget={{ id: col.id, name: col.name, description: col.description }}
        onClose={() => setRenameOpen(false)}
        onSaved={handleRenamed}
      />
      {folderModal && (
        <FolderModal
          open
          collectionId={col.id}
          parentId={folderModal.parentId}
          parentName={folderModal.parentId ? folderNames.get(folderModal.parentId) : undefined}
          editTarget={folderModal.editTarget}
          onClose={() => setFolderModal(null)}
          onSaved={handleFolderSaved}
        />
      )}
      <AskAiPanel
        open={askAiOpen}
        collectionId={col.id}
        collectionName={col.name}
        onClose={() => setAskAiOpen(false)}
      />

      <ConfirmDialog
        open={deleteFolderTarget !== null}
        title="ลบโฟลเดอร์"
        message={
          <>
            ต้องการลบ{' '}
            <span className="font-semibold text-foreground">&quot;{deleteFolderTarget?.name}&quot;</span>{' '}
            ใช่ไหม? โฟลเดอร์ย่อยข้างในจะถูกลบทั้งหมด
            ส่วนเอกสารไม่หาย — จะย้ายไปอยู่ root ของ collection
          </>
        }
        confirmLabel="ลบโฟลเดอร์"
        loading={confirmBusy}
        onConfirm={handleDeleteFolder}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      <ConfirmDialog
        open={removeDocTarget !== null}
        title="เอาเอกสารออกจากกล่อง"
        message={
          <>
            ต้องการเอา{' '}
            <span className="font-semibold text-foreground">&quot;{removeDocTarget?.document.title}&quot;</span>{' '}
            ออกจาก collection นี้ใช่ไหม? ตัวเอกสารจะไม่ถูกลบ
          </>
        }
        confirmLabel="เอาออก"
        loading={confirmBusy}
        onConfirm={handleRemoveDoc}
        onCancel={() => setRemoveDocTarget(null)}
      />

      <ConfirmDialog
        open={deleteColOpen}
        title="ลบ collection"
        message={
          <>
            ต้องการลบ{' '}
            <span className="font-semibold text-foreground">&quot;{col.name}&quot;</span>{' '}
            ใช่ไหม? เอกสารข้างในจะไม่ถูกลบ — แค่หลุดออกจากกล่องนี้
          </>
        }
        confirmLabel="ลบ collection"
        loading={confirmBusy}
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteColOpen(false)}
      />
    </div>
  );
}
