export type IssueStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';

export interface MyIssue {
  id: string;
  /** Issue key เช่น ORB-142 — ใช้ font Geist (ตัวเลข/latin) */
  key: string;
  title: string;
  projectId: string;
  status: IssueStatus;
  priority: IssuePriority;
  /** ISO date string (วันครบกำหนด) — ไม่มี = ไม่กำหนด */
  dueDate?: string;
  updatedAt: string;
}
