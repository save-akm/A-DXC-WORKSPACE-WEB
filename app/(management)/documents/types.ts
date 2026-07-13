// Types สำหรับ Document & Collection API — อ้างอิง docs/document-api.md
// ⚠️ กลุ่ม API นี้ตอบเป็น raw object (ไม่มี envelope status/message/data)

export type SourceType = 'UPLOAD' | 'LINK';
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type CollectionType = 'PERSONAL' | 'PROJECT';
export type AccessLevel = 'OWNER' | 'EDITOR' | 'VIEWER';
export type MemberRole = 'EDITOR' | 'VIEWER';
export type DocCategory = 'U0_J5_APPROVE' | 'J_FLOW' | 'GITSP' | 'GENERAL';

// ── Documents ────────────────────────────────────────────────────────────────

/** โปรไฟล์ user ใน document/collection API */
export interface DocumentPerson {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname?: string | null;
  avatarUrl: string | null;
}

/** เอกสาร — จาก GET /api/documents (ของตัวเอง หรือทั้ง org ถ้า HIGH_PRIVILEGE) */
export interface MyDocument {
  id: string;
  title: string;
  /** มีทุกรายการใน GET /api/documents — อาจไม่มีใน response ของ upload/link */
  uploadedBy?: DocumentPerson;
  sourceType: SourceType;
  /** มีค่าเมื่อ sourceType = LINK */
  url: string | null;
  /** null เมื่อเป็น LINK */
  fileType: string | null;
  fileSizeBytes: number | null;
  status: DocumentStatus;
  chunkCount: number;
  uploadedAt: string;
  processedAt: string | null;
}

/** เอกสารข้างใน collection — document ฝังใน binding (folder เป็นของการผูก ไม่ใช่ของเอกสาร) */
export interface DocumentInCollection {
  documentId: string;
  /** null = อยู่ root ของ collection */
  folderId: string | null;
  category: DocCategory | null;
  addedAt: string;
  document: {
    id: string;
    title: string;
    uploadedBy?: DocumentPerson;
    sourceType: SourceType;
    url: string | null;
    fileType: string | null;
    status: DocumentStatus;
    chunkCount: number;
    uploadedAt: string;
  };
}

// ── Folders ──────────────────────────────────────────────────────────────────

/** ส่งมาเป็น flat list — หน้าบ้าน build tree เองจาก parentId */
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

// ── Collections ──────────────────────────────────────────────────────────────

export interface CollectionMember {
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

/** รายการ collection — จาก GET /api/collections */
export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  type: CollectionType;
  projectId: string | null;
  createdAt: string;
  role: AccessLevel;
  documentCount: number;
  memberCount: number;
  /** GET /api/collections — POST/PATCH อาจไม่ส่ง */
  owner?: DocumentPerson;
}

/** รายละเอียด collection — GET /api/collections/:id และ GET /api/projects/:projectId/collection */
export interface CollectionDetail {
  collection: {
    id: string;
    name: string;
    description: string | null;
    type: CollectionType;
    projectId: string | null;
    userId: string;
    owner?: DocumentPerson;
    createdAt: string;
    updatedAt: string;
    folders: Folder[];
    documents: DocumentInCollection[];
    members: CollectionMember[];
  };
  /** สิทธิ์ของคนที่เรียก — ใช้ซ่อน/โชว์ปุ่ม */
  accessLevel: AccessLevel;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface UploadDocumentInput {
  file: File;
  title?: string;
  collectionId?: string;
  folderId?: string;
  category?: DocCategory;
}

export interface LinkDocumentInput {
  title: string;
  url: string;
  collectionId?: string;
  folderId?: string;
  category?: DocCategory;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
}

/** POST /api/collections/:id/documents — ส่งได้ทั้ง id เปล่าและแบบระบุ folder/category */
export interface AddDocumentsInput {
  documentIds?: string[];
  documents?: Array<{ documentId: string; folderId?: string; category?: DocCategory }>;
}

export interface AddDocumentsResult {
  added: number;
  rejected: string[];
}

// ── AI Chat ──────────────────────────────────────────────────────────────────

export interface ChatSource {
  documentId: string;
  source: string;
  chunkIndex: number;
  similarity: number;
}

export interface ChatAnswer {
  answer: string;
  notFound: boolean;
  /** เป็น [] ได้เมื่อระบบจัดว่าเป็นแชตทั่วไป — อย่า assume ว่ามีเสมอ */
  sources: ChatSource[];
}
