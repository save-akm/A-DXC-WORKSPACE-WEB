// Types for the Project Survey module — mirrors docs/project-survey-api.md

export interface ApiEnvelope<T> {
  status: 'OK' | 'ERROR';
  message: string;
  data: T;
  timestamp: string;
}

// ── Enums ─────────────────────────────────────────────────────────────────────

export type SurveyStatus = 'DRAFT' | 'SEND' | 'REVIEW' | 'APPROVE' | 'REJECT';
export type TypeSystem = 'AS400' | 'NON_AS400';
export type CostCategory = 'HARDWARE' | 'SOFTWARE' | 'OUTSOURCE' | 'IN_HOUSE';
export type ScheduleJob = 'REQUIREMENT' | 'DEVELOP' | 'START_USE';
export type ScheduleSource = 'USER' | 'A_DXC';
export type SchedulePlanType = 'ORIGINAL_PLAN' | 'REVISE_PLAN' | 'FORECAST_PLAN' | 'ACTUAL';
export type ActorRole = 'USER' | 'A_DXC';
export type SurveyFileType = 'PDF' | 'XLSX' | 'CSV' | 'DOCX' | 'TXT';
export type DocStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

/** Processes a USER may plan with. */
export const USER_PROCESSES = ['U0', 'J3', 'J5'] as const;
/** Processes A-DXC may plan with. */
export const ADXC_PROCESSES = ['J0_J2', 'J3', 'J4', 'J5'] as const;

// ── Shared shapes ─────────────────────────────────────────────────────────────

export interface UserMini {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  email?: string;
}

export interface RefItem {
  id: string;
  code: string;
  name: string;
}

export interface KiYearRef {
  id: string;
  code: number;
  name: string;
}

/** Cost row as returned by the API — `amount` is a Decimal string. */
export interface CostRow {
  id: string;
  surveyId: string;
  category: CostCategory;
  amount: string;
  createdAt: string;
}

/** Cost as sent in request bodies. */
export interface CostInput {
  category: CostCategory;
  amount: number;
}

/** Schedule row as returned by the API. */
export interface ScheduleRow {
  id: string;
  surveyId: string;
  source: ScheduleSource;
  job: ScheduleJob;
  process: string;
  planType: SchedulePlanType;
  planStart: string | null;
  planEnd: string | null;
  estimateCost: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Schedule as sent in request bodies — `source` is set by the server. */
export interface ScheduleInput {
  job: ScheduleJob;
  process: string;
  planType: SchedulePlanType;
  planStart?: string | null;
  planEnd?: string | null;
  estimateCost?: number | null;
  remark?: string | null;
}

export interface SurveyReview {
  id: string;
  surveyId: string;
  estimateCost: string | null;
  estimateSchedule: string | null;
  responsibleId: string | null;
  comment: string | null;
  recommendation: string | null;
  replyDate: string | null;
  reviewerId: string;
  createdAt: string;
  updatedAt: string;
  reviewer: UserMini | null;
  responsible: UserMini | null;
}

export interface SurveyAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: SurveyFileType;
  fileSizeBytes: number;
  status: DocStatus;
  chunkCount: number | null;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  uploadedBy?: UserMini;
  collectionId: string;
}

export interface SurveyComment {
  id: string;
  surveyId: string;
  comment: string;
  commentById: string;
  role: ActorRole;
  createdAt: string;
  commentBy: UserMini;
}

export interface SurveyHistoryEntry {
  id: string;
  surveyId: string;
  fromStatus: SurveyStatus | null;
  toStatus: SurveyStatus;
  action: string;
  remark: string | null;
  actorId: string;
  actorRole: ActorRole;
  createdAt: string;
  actor: UserMini;
}

export interface SurveyActionEntry {
  id: string;
  surveyId: string;
  actionType: string;
  actionById: string;
  actionRole: ActorRole;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actionBy: UserMini;
}

export interface SurveyAuditLog {
  id: string;
  surveyId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdById: string;
  createdAt: string;
  createdBy: UserMini;
}

export interface SurveyNotification {
  id: string;
  surveyId: string;
  receiverId: string;
  receiverEmail: string;
  type: SurveyStatus;
  subject: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}

// ── List / detail ─────────────────────────────────────────────────────────────

export interface SurveyListItem {
  id: string;
  docNo: string;
  projectName: string;
  requesterId: string;
  requesterName: string;
  branchId: string;
  departmentId: string;
  kiId: string;
  typeSystem: TypeSystem;
  budgetTypeId: string;
  status: SurveyStatus;
  currentStep: string;
  revision: number;
  resubmitCount: number;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
  branch: RefItem;
  department: RefItem;
  kiYear: KiYearRef;
  budgetType: RefItem;
  requester: UserMini;
}

export interface SurveyDetail extends SurveyListItem {
  /** Optional while DRAFT — a draft may not have picked a requestTo yet. */
  requestToId: string | null;
  request: string | null;
  changePoint: string | null;
  detail: string | null;
  /** Reason A-DXC gave when REJECT — null otherwise. */
  reason: string | null;
  requestTo: UserMini | null;
  updatedBy: UserMini;
  collection: { id: string } | null;
  costs: CostRow[];
  schedules: ScheduleRow[];
  review: SurveyReview | null;
  attachments: SurveyAttachment[];
}

export interface PaginatedSurveys {
  items: SurveyListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SurveyListParams {
  page?: number;
  limit?: number;
  status?: SurveyStatus;
  requesterId?: string;
  branchId?: string;
  departmentId?: string;
  keyword?: string;
  mine?: boolean;
}

// ── Inputs ────────────────────────────────────────────────────────────────────

export interface CreateSurveyInput {
  projectName: string;
  branchId: string;
  departmentId: string;
  kiId: string;
  typeSystem: TypeSystem;
  budgetTypeId: string;
  /** Required unless `asDraft` is true. */
  requestToId?: string;
  /** true → status DRAFT, no notification. Omit/false → sent immediately (requestToId required). */
  asDraft?: boolean;
  request?: string;
  changePoint?: string;
  detail?: string;
  costs?: CostInput[];
  schedules?: ScheduleInput[];
}

export type UpdateSurveyInput = Partial<Omit<CreateSurveyInput, 'asDraft'>>;

export interface SubmitSurveyInput {
  /** Required unless requestToId was already set on the survey. */
  requestToId?: string;
}

export interface RejectSurveyInput {
  reason: string;
}

export interface ReviewSurveyInput {
  estimateCost?: number;
  estimateSchedule?: string;
  responsibleId?: string;
  comment?: string;
  recommendation?: string;
  costs?: CostInput[];
  schedules?: ScheduleInput[];
}

export interface ContentImageResult {
  url: string;
  fileSizeBytes: number;
}
