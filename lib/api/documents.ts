import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  MyDocument,
  DocCategory,
  CollectionSummary,
  CollectionDetail,
  CollectionType,
  CollectionMember,
  MemberRole,
  Folder,
  UploadDocumentInput,
  LinkDocumentInput,
  CreateCollectionInput,
  AddDocumentsInput,
  AddDocumentsResult,
  ChatSource,
  ChatAnswer,
} from '@/app/(management)/documents/types';

// Document & Collection API — docs/document-api.md
// ⚠️ ตอบเป็น raw object ไม่มี envelope status/data — error = { error } + HTTP status

function uploaderFromAuth(): MyDocument['uploadedBy'] {
  const u = useAuthStore.getState().user;
  if (!u) return undefined;
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
  };
}

function normalizeDocument(doc: MyDocument): MyDocument {
  return {
    ...doc,
    sourceType: doc.sourceType ?? 'UPLOAD',
    url: doc.url ?? null,
    uploadedBy: doc.uploadedBy ?? uploaderFromAuth(),
  };
}

// ── Documents (ของ user เอง) ──────────────────────────────────────────────────

export async function fetchMyDocuments(): Promise<MyDocument[]> {
  const res = await apiFetch<{ documents: MyDocument[] }>('/api/documents');
  return res.documents;
}

/**
 * อัปโหลดไฟล์ (multipart) — synchronous: response กลับเมื่อ chunk/embed เสร็จ
 * ไฟล์ใหญ่อาจหลายวินาที ฝั่ง UI ต้องมี loading ค้างไว้
 */
export async function uploadDocument(input: UploadDocumentInput): Promise<MyDocument> {
  const { accessToken } = useAuthStore.getState();
  const form = new FormData();
  form.append('file', input.file);
  if (input.title?.trim()) form.append('title', input.title.trim());
  if (input.collectionId) form.append('collectionId', input.collectionId);
  if (input.folderId) form.append('folderId', input.folderId);
  if (input.category) form.append('category', input.category);

  const res = await fetch('/api/_proxy/api/upload', {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    const err = new Error(data?.error ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const { document } = await res.json() as { document: MyDocument };
  return normalizeDocument(document);
}

export async function createLinkDocument(input: LinkDocumentInput): Promise<MyDocument> {
  const res = await apiFetch<{ document: MyDocument }>('/api/documents/link', {
    method: 'POST',
    body: input,
  });
  return normalizeDocument(res.document);
}

/** ลบถาวร — หายจากทุก collection + chunks ทั้งหมด (เจ้าของเท่านั้น) */
export async function deleteDocument(docId: string): Promise<void> {
  await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
}

/**
 * ดาวน์โหลดไฟล์ต้นฉบับ (เฉพาะ sourceType UPLOAD)
 * LINK ไม่ต้องผ่าน endpoint นี้ — มี `url` ตรงอยู่แล้วในข้อมูลเอกสาร เปิดตรงได้เลย
 * (endpoint นี้ตอบ 302 redirect สำหรับ LINK แต่ fetch จากฝั่ง client อ่าน Location ของ manual redirect ไม่ได้)
 */
export async function downloadDocument(docId: string, filename: string): Promise<void> {
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(`/api/_proxy/api/documents/${docId}/download`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    const err = new Error(data?.error ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Collections ───────────────────────────────────────────────────────────────

export async function fetchCollections(type?: CollectionType): Promise<CollectionSummary[]> {
  const qs = type ? `?type=${type}` : '';
  const res = await apiFetch<{ collections: CollectionSummary[] }>(`/api/collections${qs}`);
  return res.collections;
}

export async function createCollection(input: CreateCollectionInput): Promise<CollectionSummary> {
  const res = await apiFetch<{ collection: CollectionSummary }>('/api/collections', {
    method: 'POST',
    body: input,
  });
  return res.collection;
}

export async function fetchCollectionDetail(id: string): Promise<CollectionDetail> {
  return apiFetch<CollectionDetail>(`/api/collections/${id}`);
}

/** Entry point เดียวของ tab เอกสารในหน้า project — เรียกครั้งแรกระบบสร้าง collection ให้เอง */
export async function fetchProjectCollection(projectId: string): Promise<CollectionDetail> {
  return apiFetch<CollectionDetail>(`/api/projects/${projectId}/collection`);
}

export async function updateCollection(
  id: string,
  input: { name?: string; description?: string },
): Promise<CollectionSummary> {
  const res = await apiFetch<{ collection: CollectionSummary }>(`/api/collections/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.collection;
}

/** Soft delete — เอกสารข้างในไม่หาย แค่หลุดจากกล่อง */
export async function deleteCollection(id: string): Promise<void> {
  await apiFetch(`/api/collections/${id}`, { method: 'DELETE' });
}

// ── เอกสารใน collection ──────────────────────────────────────────────────────

export async function addDocumentsToCollection(
  collectionId: string,
  input: AddDocumentsInput,
): Promise<AddDocumentsResult> {
  return apiFetch<AddDocumentsResult>(`/api/collections/${collectionId}/documents`, {
    method: 'POST',
    body: input,
  });
}

/** ย้าย folder (folderId: null = root) / เปลี่ยน category — ส่งพร้อมกันได้ */
export async function updateDocumentInCollection(
  collectionId: string,
  docId: string,
  input: { folderId?: string | null; category?: DocCategory },
): Promise<void> {
  await apiFetch(`/api/collections/${collectionId}/documents/${docId}`, {
    method: 'PATCH',
    body: input,
  });
}

/** เอาออกจากกล่องเท่านั้น — ตัวเอกสารไม่ถูกลบ */
export async function removeDocumentFromCollection(
  collectionId: string,
  docId: string,
): Promise<void> {
  await apiFetch(`/api/collections/${collectionId}/documents/${docId}`, { method: 'DELETE' });
}

// ── Folders ───────────────────────────────────────────────────────────────────

export async function createFolder(
  collectionId: string,
  input: { name: string; parentId?: string },
): Promise<Folder> {
  const res = await apiFetch<{ folder: Folder }>(`/api/collections/${collectionId}/folders`, {
    method: 'POST',
    body: input,
  });
  return res.folder;
}

export async function updateFolder(
  collectionId: string,
  folderId: string,
  input: { name?: string; parentId?: string | null },
): Promise<Folder> {
  const res = await apiFetch<{ folder: Folder }>(
    `/api/collections/${collectionId}/folders/${folderId}`,
    { method: 'PATCH', body: input },
  );
  return res.folder;
}

/** folder ลูกถูกลบตามทั้งสาย — เอกสารข้างในตกไป root ของ collection */
export async function deleteFolder(collectionId: string, folderId: string): Promise<void> {
  await apiFetch(`/api/collections/${collectionId}/folders/${folderId}`, { method: 'DELETE' });
}

// ── Members (เฉพาะ PERSONAL) ─────────────────────────────────────────────────

export async function addCollectionMember(
  collectionId: string,
  input: { userId: string; role?: MemberRole },
): Promise<Pick<CollectionMember, 'userId' | 'role' | 'joinedAt'>> {
  const res = await apiFetch<{ member: Pick<CollectionMember, 'userId' | 'role' | 'joinedAt'> }>(
    `/api/collections/${collectionId}/members`,
    { method: 'POST', body: input },
  );
  return res.member;
}

export async function updateCollectionMember(
  collectionId: string,
  userId: string,
  role: MemberRole,
): Promise<void> {
  await apiFetch(`/api/collections/${collectionId}/members/${userId}`, {
    method: 'PATCH',
    body: { role },
  });
}

export async function removeCollectionMember(collectionId: string, userId: string): Promise<void> {
  await apiFetch(`/api/collections/${collectionId}/members/${userId}`, { method: 'DELETE' });
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface ChatRequest {
  question: string;
  /** จำกัดให้ AI ค้นเฉพาะ collection นี้ (ต้องมีสิทธิ์อย่างน้อย VIEWER) */
  collectionId?: string;
  topK?: number;
  threshold?: number;
}

/** ถาม-ตอบแบบรอคำตอบทีเดียว — ใช้เป็น fallback เมื่อ stream ใช้ไม่ได้ */
export async function askChat(body: ChatRequest): Promise<ChatAnswer> {
  return apiFetch<ChatAnswer>('/api/chat', { method: 'POST', body });
}

export interface ChatStreamHandlers {
  onSources?: (sources: ChatSource[]) => void;
  onToken: (text: string) => void;
  onDone?: (notFound: boolean) => void;
}

/**
 * ถาม-ตอบแบบ SSE streaming (POST /api/chat/stream)
 * events: sources (มาก่อน token แรก) → token ต่อเนื่อง → done | error
 */
export async function streamChat(
  body: ChatRequest,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const { accessToken } = useAuthStore.getState();

  const res = await fetch('/api/_proxy/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    const err = new Error(data?.error ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (rawEvent: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of rawEvent.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) return;
    let data: unknown;
    try {
      data = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }
    switch (event) {
      case 'sources':
        handlers.onSources?.(data as ChatSource[]);
        break;
      case 'token':
        handlers.onToken((data as { text: string }).text);
        break;
      case 'done':
        handlers.onDone?.((data as { notFound: boolean }).notFound);
        break;
      case 'error': {
        const { error } = data as { error: string };
        throw new Error(error || 'AI ตอบไม่สำเร็จ');
      }
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE คั่นแต่ละ event ด้วยบรรทัดว่าง
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep).replace(/\r/g, '');
      buffer = buffer.slice(sep + 2);
      if (rawEvent.trim()) dispatch(rawEvent);
    }
  }
}
