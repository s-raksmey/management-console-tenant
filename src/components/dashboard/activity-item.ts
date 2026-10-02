export interface ActivityItem {
  id: string;
  type: "create" | "update" | "delete" | "approve" | "reject" | "publish" | "feature";
  title: string;
  description?: string;
  user?: {
    name: string;
    role?: string;
  };
  timestamp: string;
  metadata?: {
    category?: string;
    priority?: "low" | "medium" | "high";
    status?: string;
  };
}
