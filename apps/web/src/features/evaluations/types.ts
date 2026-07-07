export interface CourseEvaluationListItem {
  courseId: string;
  subject: string;
  scheduledAt: string | null;
  counterpartName: string;
  status: string;
  rating: { stars: number } | null;
  canRate: boolean;
  hasSummary: boolean;
  summaryTitle: string | null;
  hasSummaryPdf: boolean;
  clarificationsCount: number;
  messagesCount: number;
  lastMessageAt: string | null;
}

export interface CourseEvaluationDetail {
  courseId: string;
  subject: string;
  scheduledAt: string | null;
  status: string;
  counterpart: { id: string; name: string; role: string };
  viewerRole: "student" | "teacher";
  rating: { stars: number; createdAt: string } | null;
  canRate: boolean;
  summary: {
    id: string;
    title: string;
    content: string;
    hasPdf: boolean;
    publishedAt: string;
    folderId: string;
  } | null;
  clarifications: Array<{
    id: string;
    title: string;
    content: string | null;
    hasPdf: boolean;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    authorId: string;
    authorName: string;
    body: string;
    createdAt: string;
    isMine: boolean;
  }>;
}
