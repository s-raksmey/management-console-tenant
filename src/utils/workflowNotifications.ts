type AdminLocale = "en" | "km";

export interface WorkflowNotification {
  title: string;
  message?: string;
  type: "success" | "info" | "warning" | "error";
}

export function getApprovalNotification(locale: AdminLocale = "en"): WorkflowNotification {
  const isKm = locale === "km";

  return {
    title: isKm ? "✅ បានអនុម័ត និងផ្សព្វផ្សាយអត្ថបទ" : "✅ Article approved and published",
    message: isKm ? "អត្ថបទកំពុងបង្ហាញជាសាធារណៈ ហើយអ្នកអានអាចមើលបាន" : "The article is now live and visible to readers",
    type: "success",
  };
}

export function getRejectionNotification(locale: AdminLocale = "en"): WorkflowNotification {
  const isKm = locale === "km";

  return {
    title: isKm ? "📝 បានបដិសេធអត្ថបទ" : "📝 Article rejected",
    message: isKm ? "អត្ថបទត្រូវបានផ្ញើត្រឡប់ទៅអ្នកនិពន្ធដើម្បីកែសម្រួល" : "The article has been sent back to the author for revision",
    type: "info",
  };
}
