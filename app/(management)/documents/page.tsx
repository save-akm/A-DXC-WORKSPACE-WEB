'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderPlus,
  Link2,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/management/stat-card';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { Pagination } from '@/components/management/pagination';
import { ConfirmDialog } from '@/components/management/confirm-dialog';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  fetchMyDocuments,
  fetchCollections,
  fetchCollectionDetail,
  deleteDocument,
  deleteCollection,
  downloadDocument,
} from '@/lib/api/documents';
import type { CollectionSummary, MyDocument, SourceType } from './types';
import { CollectionCard } from './_components/collection-card';
import { CollectionModal } from './_components/collection-modal';
import { UploadModal } from './_components/upload-modal';
import { LinkModal } from './_components/link-modal';
import {
  CollectionChips, DocIcon, DocTypeLabel, DocUploaderCell, StatusBadge,
  buildDownloadFilename, formatBytes, formatDate,
} from './_components/doc-meta';

const PAGE_SIZE = 10;
const COLLECTION_PREVIEW_ROWS = 2;
const COLLECTION_GRID_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
const EASE = [0.4, 0, 0.2, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

type TypeFilter = 'ALL' | SourceType;

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'UPLOAD', label: 'ไฟล์' },
  { value: 'LINK', label: 'ลิงก์' },
];

/** collection ที่มีเอกสารนี้อยู่ — เอกสารชิ้นเดียวอยู่ได้หลาย collection */
type DocCollectionsMap = Map<string, Array<{ id: string; name: string }>>;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<MyDocument[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [docCollections, setDocCollections] = useState<DocCollectionsMap>(new Map());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [page, setPage] = useState(1);

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<CollectionSummary | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<MyDocument | null>(null);
  const [deleteCol, setDeleteCol] = useState<CollectionSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);

  const is2xl = useMediaQuery('(min-width: 1536px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const isSm = useMediaQuery('(min-width: 640px)');
  const collectionCols = is2xl ? 4 : isXl ? 3 : isSm ? 2 : 1;
  const collectionCap = collectionCols * COLLECTION_PREVIEW_ROWS;

  useEffect(() => {
    Promise.all([fetchMyDocuments(), fetchCollections()])
      .then(([docs, cols]) => {
        setDocuments(docs);
        setCollections(cols);
      })
      .catch(() => toast.error('โหลดข้อมูลเอกสารไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  // GET /api/documents ไม่บอกว่าเอกสารอยู่ collection ไหน — ไล่ดึงรายละเอียดทีละกล่อง
  // (จำนวน collection ของ user มักน้อย) มาผูก documentId → collection เพื่อโชว์ในตาราง
  const collectionIdsKey = useMemo(() => collections.map(c => c.id).sort().join(','), [collections]);
  useEffect(() => {
    if (collections.length === 0) return;
    let cancelled = false;
    Promise.all(collections.map(c => fetchCollectionDetail(c.id).catch(() => null)))
      .then(details => {
        if (cancelled) return;
        const map: DocCollectionsMap = new Map();
        details.forEach((detail, i) => {
          if (!detail) return;
          const { id, name } = collections[i];
          for (const binding of detail.collection.documents) {
            const list = map.get(binding.documentId) ?? [];
            list.push({ id, name });
            map.set(binding.documentId, list);
          }
        });
        setDocCollections(map);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key แทน collections array เพื่อไม่ refetch ทุกครั้งที่แค่ documentCount เปลี่ยน
  }, [collectionIdsKey]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: documents.length,
    ready: documents.filter(d => d.sourceType === 'UPLOAD' && d.status === 'READY').length,
    links: documents.filter(d => d.sourceType === 'LINK').length,
  }), [documents]);

  const filtered = useMemo(() => {
    let result = documents;
    if (typeFilter !== 'ALL') result = result.filter(d => d.sourceType === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        d => d.title.toLowerCase().includes(q) || (d.url ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [documents, search, typeFilter]);

  /** collection ที่เพิ่มเอกสารเข้าไปได้ (EDITOR ขึ้นไป) — ปลายทางบังคับตอนสร้างเอกสาร */
  const editableCollections = useMemo(
    () => collections.filter(c => c.role === 'OWNER' || c.role === 'EDITOR'),
    [collections],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const effectiveDocCollections = useMemo(
    () => (collections.length === 0 ? new Map<string, Array<{ id: string; name: string }>>() : docCollections),
    [collections.length, docCollections],
  );

  const canToggleCollections = collections.length > collectionCap;
  const visibleCollections = useMemo(
    () => (collectionsExpanded || !canToggleCollections ? collections : collections.slice(0, collectionCap)),
    [collections, collectionsExpanded, canToggleCollections, collectionCap],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleUploaded = useCallback((doc: MyDocument, collectionId: string) => {
    setDocuments(prev => [doc, ...prev]);
    setCollections(prev =>
      prev.map(c => (c.id === collectionId ? { ...c, documentCount: c.documentCount + 1 } : c)),
    );
    setDocCollections(prev => {
      const col = collections.find(c => c.id === collectionId);
      if (!col) return prev;
      const next = new Map(prev);
      next.set(doc.id, [{ id: col.id, name: col.name }]);
      return next;
    });
  }, [collections]);

  /** ปิด modal สร้างเอกสารแล้วพาไปสร้าง collection ก่อน */
  const handleCreateCollectionFirst = useCallback(() => {
    setUploadOpen(false);
    setLinkOpen(false);
    setEditCollection(null);
    setCollectionModalOpen(true);
  }, []);

  const handleCollectionSaved = useCallback((saved: CollectionSummary) => {
    setCollections(prev => {
      const exists = prev.some(c => c.id === saved.id);
      // PATCH ตอบเฉพาะตัว collection — เก็บ count/role เดิมไว้
      return exists
        ? prev.map(c => (c.id === saved.id ? { ...c, name: saved.name, description: saved.description } : c))
        : [...prev, { ...saved, role: 'OWNER', documentCount: 0, memberCount: 0 }];
    });
  }, []);

  const handleDeleteDoc = useCallback(async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteDoc.id);
      setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
      setDocCollections(prev => {
        if (!prev.has(deleteDoc.id)) return prev;
        const next = new Map(prev);
        next.delete(deleteDoc.id);
        return next;
      });
      toast.success(`ลบ "${deleteDoc.title}" สำเร็จ`);
      setDeleteDoc(null);
    } catch (e) {
      toast.error((e as Error).message || 'ลบเอกสารไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }, [deleteDoc]);

  const handleDeleteCollection = useCallback(async () => {
    if (!deleteCol) return;
    setDeleting(true);
    try {
      await deleteCollection(deleteCol.id);
      setCollections(prev => prev.filter(c => c.id !== deleteCol.id));
      toast.success(`ลบ "${deleteCol.name}" สำเร็จ`);
      setDeleteCol(null);
    } catch (e) {
      toast.error((e as Error).message || 'ลบ collection ไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }, [deleteCol]);

  const handleDownload = useCallback((doc: MyDocument) => {
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

  const docActions = useCallback((doc: MyDocument): ActionItem[] => {
    const actions: ActionItem[] = [];
    if (doc.sourceType === 'LINK' && doc.url) {
      actions.push({
        label: 'เปิดลิงก์',
        icon: ExternalLink,
        onClick: () => window.open(doc.url!, '_blank', 'noopener,noreferrer'),
      });
    } else if (doc.sourceType === 'UPLOAD' && doc.status === 'READY') {
      actions.push({
        label: 'ดาวน์โหลด',
        icon: Download,
        onClick: () => handleDownload(doc),
      });
    }
    actions.push({
      label: 'ลบถาวร',
      icon: Trash2,
      destructive: true,
      onClick: () => setDeleteDoc(doc),
    });
    return actions;
  }, [handleDownload]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">เอกสาร</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            อัปโหลดไฟล์ให้ AI ค้นได้ จัดกล่อง collection และแชร์ให้ทีม
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => setLinkOpen(true)}>
            <Link2 />
            <span className="hidden sm:inline">แปะลิงก์</span>
            <span className="sm:hidden">ลิงก์</span>
          </Button>
          <Button variant="create" onClick={() => setUploadOpen(true)}>
            <CloudUpload />
            อัปโหลดเอกสาร
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp(0.06)} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={FileText} label="เอกสารทั้งหมด" value={stats.total} gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={Sparkles} label="พร้อมให้ AI ค้น" value={stats.ready} gradient="from-emerald-500 to-teal-500" />
        <StatCard icon={Link2} label="ลิงก์ภายนอก" value={stats.links} gradient="from-violet-500 to-fuchsia-500" />
        <StatCard icon={FolderOpen} label="Collections" value={collections.length} gradient="from-sky-500 to-blue-600" />
      </motion.div>

      {/* Collections */}
      <motion.section {...fadeUp(0.12)} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Collections ของฉัน</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditCollection(null); setCollectionModalOpen(true); }}
          >
            <FolderPlus />
            สร้าง collection
          </Button>
        </div>

        {loading ? (
          <div className={COLLECTION_GRID_CLASS}>
            {Array.from({ length: Math.min(collectionCap, 4) }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <button
            type="button"
            onClick={() => { setEditCollection(null); setCollectionModalOpen(true); }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground"
          >
            <FolderPlus className="size-5" />
            <span className="text-xs font-semibold">ยังไม่มี collection — สร้างกล่องแรกเพื่อจัดกลุ่มเอกสารและแชร์ให้ทีม</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className={COLLECTION_GRID_CLASS}>
              <AnimatePresence mode="popLayout">
                {visibleCollections.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22, delay: i * 0.04, ease: EASE }}
                  >
                    <CollectionCard
                      collection={c}
                      onEdit={col => { setEditCollection(col); setCollectionModalOpen(true); }}
                      onDelete={setDeleteCol}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {canToggleCollections && (
              <div className="flex justify-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setCollectionsExpanded(v => !v)}
                >
                  {collectionsExpanded ? (
                    <>
                      ย่อ
                      <ChevronUp />
                    </>
                  ) : (
                    <>
                      แสดงทั้งหมด ({collections.length} กล่อง)
                      <ChevronDown />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.section>

      {/* My documents */}
      <motion.section {...fadeUp(0.18)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold">เอกสารทั้งหมดของฉัน</h2>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="ค้นหาชื่อเอกสารหรือ URL…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => { setTypeFilter(f.value); setPage(1); }}
                  className={cn(
                    'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    typeFilter === f.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {typeFilter === f.value && (
                    <motion.span
                      layoutId="doc-type-tab-bg"
                      className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 pl-4 text-xs">#</TableHead>
                  <TableHead className="text-xs">เอกสาร</TableHead>
                  <TableHead className="hidden w-36 text-xs xl:table-cell">ผู้อัปโหลด</TableHead>
                  <TableHead className="hidden w-40 text-xs lg:table-cell">Collection</TableHead>
                  <TableHead className="hidden w-20 text-xs sm:table-cell">ประเภท</TableHead>
                  <TableHead className="hidden w-24 text-xs md:table-cell">ขนาด</TableHead>
                  <TableHead className="hidden w-28 text-xs 2xl:table-cell">อัปโหลดเมื่อ</TableHead>
                  <TableHead className="w-32 text-xs">สถานะ</TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9} className="px-4">
                        <div className="h-9 animate-pulse rounded-lg bg-muted/60" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16">
                      {search || typeFilter !== 'ALL' ? (
                        <p className="text-center text-sm text-muted-foreground">
                          ไม่พบเอกสารที่ตรงกับเงื่อนไข
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                            <FileText size={20} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">ยังไม่มีเอกสาร</p>
                            <p className="text-xs text-muted-foreground">
                              อัปโหลดไฟล์แรกเพื่อให้ AI ช่วยค้นและตอบคำถามจากเนื้อหาได้
                            </p>
                          </div>
                          <Button variant="create" onClick={() => setUploadOpen(true)}>
                            <CloudUpload />
                            อัปโหลดเอกสาร
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((doc, i) => (
                    <TableRow key={doc.id}>
                      <TableCell className="pl-4 text-xs text-muted-foreground">
                        {(currentPage - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <DocIcon sourceType={doc.sourceType} fileType={doc.fileType} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight">{doc.title}</p>
                            {doc.sourceType === 'LINK' ? (
                              <a
                                href={doc.url ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block max-w-72 truncate font-mono text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                              >
                                {doc.url}
                              </a>
                            ) : (
                              <p className="truncate text-[10px] text-muted-foreground">
                                {doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : ' '}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <DocUploaderCell uploader={doc.uploadedBy ?? null} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <CollectionChips collections={effectiveDocCollections.get(doc.id) ?? []} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <DocTypeLabel sourceType={doc.sourceType} fileType={doc.fileType} />
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {formatBytes(doc.fileSizeBytes)}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground 2xl:table-cell">
                        {formatDate(doc.uploadedAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <ActionMenu actions={docActions(doc)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!loading && filtered.length > 0 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                onChange={setPage}
                layoutId="documents-page-active-bg"
                itemLabel="เอกสาร"
              />
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        collections={editableCollections}
        onCreateCollection={handleCreateCollectionFirst}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
      <LinkModal
        open={linkOpen}
        collections={editableCollections}
        onCreateCollection={handleCreateCollectionFirst}
        onClose={() => setLinkOpen(false)}
        onCreated={handleUploaded}
      />
      <CollectionModal
        open={collectionModalOpen}
        editTarget={editCollection}
        onClose={() => setCollectionModalOpen(false)}
        onSaved={handleCollectionSaved}
      />

      <ConfirmDialog
        open={deleteDoc !== null}
        title="ลบเอกสารถาวร"
        message={
          <>
            ต้องการลบ{' '}
            <span className="font-semibold text-foreground">&quot;{deleteDoc?.title}&quot;</span>{' '}
            ใช่ไหม? เอกสารจะหายจาก<span className="font-semibold text-foreground">ทุก collection</span>{' '}
            และข้อมูลที่ AI ใช้ค้นจะถูกลบทั้งหมด — ยกเลิกไม่ได้
          </>
        }
        confirmLabel="ลบถาวร"
        loading={deleting}
        onConfirm={handleDeleteDoc}
        onCancel={() => setDeleteDoc(null)}
      />

      <ConfirmDialog
        open={deleteCol !== null}
        title="ลบ collection"
        message={
          <>
            ต้องการลบ{' '}
            <span className="font-semibold text-foreground">&quot;{deleteCol?.name}&quot;</span>{' '}
            ใช่ไหม? เอกสารข้างในจะไม่ถูกลบ — แค่หลุดออกจากกล่องนี้
          </>
        }
        confirmLabel="ลบ collection"
        loading={deleting}
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteCol(null)}
      />
    </div>
  );
}
