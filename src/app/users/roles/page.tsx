"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Shield, SlidersHorizontal } from "lucide-react";
import { Permission } from "@/components/permissions/PermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { RolePermissionService } from "@/services/role-permissions.gql";
import { useAdminLocale } from "@/hooks/useAdminLocale";

type ManagedRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR";
type PermissionGroup = {
  title: string;
  description: string;
  excludedRoles?: ManagedRole[];
  permissions: Array<{
    key: Permission;
    label: string;
    description: string;
  }>;
};

const roles: ManagedRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"];

const rolePageCopy = {
  en: {
    accessDenied: "Access denied: Insufficient permissions",
    updateFailed: "Failed to update role permission.",
    eyebrow: "Role Management",
    title: "Role Permissions",
    superAdminDescription: "Main Tenant has one role: Super Admin. Admin, Editor, and Author are website roles — adjust their permissions here.",
    tenantAdminDescription: "Review what each website role can do. Permission switches are read-only for sub-tenant admins.",
    roles: (count: number) => `${count} roles`,
    groups: (count: number) => `${count} groups`,
    enabled: (count: number) => `${count} enabled`,
    editable: "Editable",
    viewOnly: "View only",
    enabledPermissions: "Enabled permissions",
    permission: "Permission",
    enable: "Enable",
    disable: "Disable",
    cancel: "Cancel",
    enablePermissionTitle: "Enable permission?",
    disablePermissionTitle: "Disable permission?",
    permissionConfirmation: (action: string, permission: string, role: string) =>
      `${action} “${permission}” for ${role}? This changes access for every user with this role.`,
    ariaToggle: (action: string, permission: string, role: string) => `${action} ${permission} for ${role}`,
    roleNames: {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      EDITOR: "Editor",
      AUTHOR: "Author",
    },
    roleDescriptions: {
      SUPER_ADMIN: "Only Main Tenant role. Manages websites, system operations, and console access.",
      ADMIN: "Website owner role with team, content, settings, and publishing control.",
      EDITOR: "Editorial role for reviewing, publishing, and improving content.",
      AUTHOR: "Writing role for drafting and maintaining owned content.",
    },
    groupsCopy: {
      users: { title: "Users", description: "Team access and role governance." },
      articles: { title: "Articles", description: "Content creation, editing, and publishing." },
      editorial: { title: "Editorial", description: "Review queue and article promotion controls." },
      structure: { title: "Structure", description: "Category, topic, and site organization." },
      system: { title: "System", description: "Settings, logs, and Main Tenant operations." },
      carousel: { title: "Carousel", description: "Public hero slide management." },
      ads: { title: "Ads", description: "Sponsored placements and public ad operations." },
      media: { title: "Media", description: "Uploaded files and image library." },
    },
    permissions: {
      CREATE_USER: ["Create users", "Invite or create sub-tenant users."],
      UPDATE_USER: ["Update users", "Edit user profile and account details."],
      DELETE_USER: ["Delete users", "Remove or deactivate users."],
      VIEW_ALL_USERS: ["View users", "See users in management views."],
      MANAGE_USER_ROLES: ["Manage roles", "Change role assignments and permissions."],
      MANAGE_USERS: ["Review requests", "Approve or reject account requests."],
      CREATE_ARTICLE: ["Create articles", "Create drafts and submissions."],
      VIEW_ALL_ARTICLES: ["All articles", "See articles from every author."],
      UPDATE_OWN_ARTICLE: ["Edit own articles", "Update articles created by the user."],
      UPDATE_ANY_ARTICLE: ["Edit any article", "Update articles from any author."],
      DELETE_OWN_ARTICLE: ["Delete own articles", "Delete own draft content."],
      DELETE_ANY_ARTICLE: ["Delete any article", "Delete any article in the sub-tenant."],
      PUBLISH_ARTICLE: ["Publish articles", "Move approved content to published."],
      UNPUBLISH_ARTICLE: ["Unpublish articles", "Return published content to draft."],
      PREVIEW_ARTICLE: ["Preview articles", "Preview content before publication."],
      REVIEW_ARTICLES: ["Review articles", "Access the review queue."],
      APPROVE_ARTICLES: ["Approve articles", "Approve submitted content."],
      REJECT_ARTICLES: ["Reject articles", "Reject submitted content."],
      SET_FEATURED: ["Set featured", "Feature articles publicly."],
      SET_BREAKING_NEWS: ["Set breaking news", "Mark content as breaking news."],
      SET_EDITORS_PICK: ["Set editor picks", "Mark articles as editor picks."],
      LIST_CATEGORIES: ["List categories", "View all categories and topics."],
      CREATE_CATEGORY: ["Create categories", "Add new categories."],
      UPDATE_CATEGORY: ["Update categories", "Edit category details."],
      DELETE_CATEGORY: ["Delete categories", "Remove categories."],
      CREATE_TOPIC: ["Create topics", "Add sub-categories/topics."],
      UPDATE_TOPIC: ["Update topics", "Edit topic details."],
      DELETE_TOPIC: ["Delete topics", "Remove topics."],
      VIEW_SETTINGS: ["View settings", "Read configuration values."],
      UPDATE_SETTINGS: ["Update settings", "Change configuration values."],
      VIEW_ANALYTICS: ["View analytics", "Open dashboard and performance charts."],
      VIEW_AUDIT_LOGS: ["View audit logs", "Inspect system activity."],
      SYSTEM_ADMINISTRATION: ["System administration", "Access Main Tenant administration tools."],
      CREATE_CAROUSEL: ["Create slides", "Create public carousel slides."],
      UPDATE_CAROUSEL: ["Update slides", "Edit carousel slides and placements."],
      DELETE_CAROUSEL: ["Delete slides", "Remove carousel slides."],
      VIEW_ADS: ["View ads", "Open ads management and review ad performance."],
      CREATE_ADS: ["Create ads", "Create sponsored placements for public pages."],
      UPDATE_ADS: ["Update ads", "Edit ad creative, targeting, status, and schedule."],
      DELETE_ADS: ["Archive ads", "Archive ads that should no longer be shown."],
      VIEW_MEDIA: ["View media", "Open and browse uploaded media."],
      MANAGE_MEDIA: ["Manage media", "Upload, update, and remove media files."],
    },
  },
  km: {
    accessDenied: "គ្មានសិទ្ធិ៖ សិទ្ធិមិនគ្រប់គ្រាន់",
    updateFailed: "មិនអាចកែសិទ្ធិតួនាទីបានទេ។",
    eyebrow: "គ្រប់គ្រងតួនាទី",
    title: "សិទ្ធិតួនាទី",
    superAdminDescription: "អ្នកជួលមេមានតែតួនាទីមួយ៖ អ្នកគ្រប់គ្រងកំពូល។ Admin, Editor និង Author ជាតួនាទីគេហទំព័រ — កែសិទ្ធិរបស់ពួកគេនៅទីនេះ។",
    tenantAdminDescription: "ពិនិត្យថាតួនាទីគេហទំព័រនីមួយៗអាចធ្វើអ្វីបាន។ ប៊ូតុងបើក/បិទសិទ្ធិអាចមើលបានតែប៉ុណ្ណោះសម្រាប់អ្នកគ្រប់គ្រងគេហទំព័រ។",
    roles: (count: number) => `${count} តួនាទី`,
    groups: (count: number) => `${count} ក្រុម`,
    enabled: (count: number) => `${count} បានបើក`,
    editable: "អាចកែបាន",
    viewOnly: "មើលប៉ុណ្ណោះ",
    enabledPermissions: "សិទ្ធិបានបើក",
    permission: "សិទ្ធិ",
    enable: "បើក",
    disable: "បិទ",
    cancel: "បោះបង់",
    enablePermissionTitle: "បើកសិទ្ធិ?",
    disablePermissionTitle: "បិទសិទ្ធិ?",
    permissionConfirmation: (action: string, permission: string, role: string) =>
      `${action} “${permission}” សម្រាប់ ${role}? វានឹងផ្លាស់ប្តូរសិទ្ធិរបស់អ្នកប្រើទាំងអស់ដែលមានតួនាទីនេះ។`,
    ariaToggle: (action: string, permission: string, role: string) => `${action} ${permission} សម្រាប់ ${role}`,
    roleNames: {
      SUPER_ADMIN: "អ្នកគ្រប់គ្រងកំពូល",
      ADMIN: "អ្នកគ្រប់គ្រង",
      EDITOR: "អ្នកកែសម្រួល",
      AUTHOR: "អ្នកនិពន្ធ",
    },
    roleDescriptions: {
      SUPER_ADMIN: "តួនាទីតែមួយរបស់អ្នកជួលមេ។ គ្រប់គ្រងគេហទំព័រ ប្រតិបត្តិការប្រព័ន្ធ និងកុងសូល។",
      ADMIN: "តួនាទីម្ចាស់គេហទំព័រសម្រាប់គ្រប់គ្រងក្រុម មាតិកា ការកំណត់ និងការផ្សព្វផ្សាយ។",
      EDITOR: "តួនាទីវិចារណករ សម្រាប់ពិនិត្យ ផ្សព្វផ្សាយ និងកែលម្អមាតិកា។",
      AUTHOR: "តួនាទីអ្នកនិពន្ធ សម្រាប់សរសេរព្រាង និងថែទាំមាតិកាផ្ទាល់ខ្លួន។",
    },
    groupsCopy: {
      users: { title: "អ្នកប្រើ", description: "ការចូលប្រើរបស់ក្រុម និងការគ្រប់គ្រងតួនាទី។" },
      articles: { title: "អត្ថបទ", description: "ការបង្កើត កែសម្រួល និងផ្សព្វផ្សាយមាតិកា។" },
      editorial: { title: "វិចារណកិច្ច", description: "ជួរពិនិត្យ និងការលើកស្ទួយអត្ថបទ។" },
      structure: { title: "រចនាសម្ព័ន្ធ", description: "ការរៀបចំប្រភេទ ប្រធានបទ និងគេហទំព័រ។" },
      system: { title: "ប្រព័ន្ធ", description: "ការកំណត់ កំណត់ហេតុ និងប្រតិបត្តិការអ្នកជួលមេ។" },
      carousel: { title: "ការ៉ូសែល", description: "គ្រប់គ្រងស្លាយមុខសាធារណៈ។" },
      ads: { title: "ពាណិជ្ជកម្ម", description: "ទីតាំងដែលបានឧបត្ថម្ភ និងប្រតិបត្តិការពាណិជ្ជកម្មសាធារណៈ។" },
      media: { title: "មេឌៀ", description: "ឯកសារបានផ្ទុកឡើង និងបណ្ណាល័យរូបភាព។" },
    },
    permissions: {
      CREATE_USER: ["បង្កើតអ្នកប្រើ", "អញ្ជើញ ឬបង្កើតអ្នកប្រើគេហទំព័រ។"],
      UPDATE_USER: ["កែអ្នកប្រើ", "កែប្រវត្តិរូប និងព័ត៌មានគណនីអ្នកប្រើ។"],
      DELETE_USER: ["លុបអ្នកប្រើ", "លុប ឬបិទអ្នកប្រើ។"],
      VIEW_ALL_USERS: ["មើលអ្នកប្រើ", "មើលអ្នកប្រើក្នុងទិដ្ឋភាពគ្រប់គ្រង។"],
      MANAGE_USER_ROLES: ["គ្រប់គ្រងតួនាទី", "ប្តូរការផ្តល់តួនាទី និងសិទ្ធិ។"],
      MANAGE_USERS: ["ពិនិត្យសំណើ", "អនុម័ត ឬបដិសេធសំណើគណនី។"],
      CREATE_ARTICLE: ["បង្កើតអត្ថបទ", "បង្កើតព្រាង និងការដាក់ស្នើ។"],
      VIEW_ALL_ARTICLES: ["អត្ថបទទាំងអស់", "មើលអត្ថបទពីអ្នកនិពន្ធទាំងអស់។"],
      UPDATE_OWN_ARTICLE: ["កែអត្ថបទខ្លួនឯង", "កែអត្ថបទដែលអ្នកប្រើបានបង្កើត។"],
      UPDATE_ANY_ARTICLE: ["កែអត្ថបទណាមួយ", "កែអត្ថបទពីអ្នកនិពន្ធណាមួយ។"],
      DELETE_OWN_ARTICLE: ["លុបអត្ថបទខ្លួនឯង", "លុបមាតិកាព្រាងផ្ទាល់ខ្លួន។"],
      DELETE_ANY_ARTICLE: ["លុបអត្ថបទណាមួយ", "លុបអត្ថបទណាមួយក្នុងគេហទំព័រ។"],
      PUBLISH_ARTICLE: ["ផ្សព្វផ្សាយអត្ថបទ", "ផ្លាស់ទីមាតិកាដែលបានអនុម័តទៅស្ថានភាពផ្សព្វផ្សាយ។"],
      UNPUBLISH_ARTICLE: ["ដកការផ្សព្វផ្សាយ", "ត្រឡប់មាតិកាដែលបានផ្សព្វផ្សាយទៅព្រាង។"],
      PREVIEW_ARTICLE: ["មើលអត្ថបទជាមុន", "មើលមាតិកាមុនផ្សព្វផ្សាយ។"],
      REVIEW_ARTICLES: ["ពិនិត្យអត្ថបទ", "ចូលទៅជួរពិនិត្យ។"],
      APPROVE_ARTICLES: ["អនុម័តអត្ថបទ", "អនុម័តមាតិកាដែលបានដាក់ស្នើ។"],
      REJECT_ARTICLES: ["បដិសេធអត្ថបទ", "បដិសេធមាតិកាដែលបានដាក់ស្នើ។"],
      SET_FEATURED: ["កំណត់ជាពិសេស", "ដាក់អត្ថបទជាអត្ថបទពិសេសសាធារណៈ។"],
      SET_BREAKING_NEWS: ["កំណត់ជាព័ត៌មានទាន់ហេតុការណ៍", "សម្គាល់មាតិកាជាព័ត៌មានទាន់ហេតុការណ៍។"],
      SET_EDITORS_PICK: ["កំណត់ជាជម្រើសអ្នកកែសម្រួល", "សម្គាល់អត្ថបទជាជម្រើសអ្នកកែសម្រួល។"],
      LIST_CATEGORIES: ["បញ្ជីប្រភេទ", "មើលប្រភេទ និងប្រធានបទទាំងអស់។"],
      CREATE_CATEGORY: ["បង្កើតប្រភេទ", "បន្ថែមប្រភេទថ្មី។"],
      UPDATE_CATEGORY: ["កែប្រភេទ", "កែព័ត៌មានប្រភេទ។"],
      DELETE_CATEGORY: ["លុបប្រភេទ", "លុបប្រភេទ។"],
      CREATE_TOPIC: ["បង្កើតប្រធានបទ", "បន្ថែមប្រភេទរង ឬប្រធានបទ។"],
      UPDATE_TOPIC: ["កែប្រធានបទ", "កែព័ត៌មានប្រធានបទ។"],
      DELETE_TOPIC: ["លុបប្រធានបទ", "លុបប្រធានបទ។"],
      VIEW_SETTINGS: ["មើលការកំណត់", "អានតម្លៃការកំណត់រចនាសម្ព័ន្ធ។"],
      UPDATE_SETTINGS: ["កែការកំណត់", "ប្តូរតម្លៃការកំណត់រចនាសម្ព័ន្ធ។"],
      VIEW_ANALYTICS: ["មើលវិភាគទិន្នន័យ", "បើកផ្ទាំងគ្រប់គ្រង និងក្រាហ្វប្រសិទ្ធភាព។"],
      VIEW_AUDIT_LOGS: ["មើលកំណត់ហេតុសវនកម្ម", "ពិនិត្យសកម្មភាពប្រព័ន្ធ។"],
      SYSTEM_ADMINISTRATION: ["គ្រប់គ្រងប្រព័ន្ធ", "ចូលឧបករណ៍គ្រប់គ្រងអ្នកជួលមេ។"],
      CREATE_CAROUSEL: ["បង្កើតស្លាយ", "បង្កើតស្លាយការ៉ូសែលសាធារណៈ។"],
      UPDATE_CAROUSEL: ["កែស្លាយ", "កែស្លាយការ៉ូសែល និងទីតាំងបង្ហាញ។"],
      DELETE_CAROUSEL: ["លុបស្លាយ", "លុបស្លាយការ៉ូសែល។"],
      VIEW_ADS: ["មើលពាណិជ្ជកម្ម", "បើកការគ្រប់គ្រងពាណិជ្ជកម្ម និងពិនិត្យប្រសិទ្ធភាព។"],
      CREATE_ADS: ["បង្កើតពាណិជ្ជកម្ម", "បង្កើតទីតាំងដែលបានឧបត្ថម្ភសម្រាប់ទំព័រសាធារណៈ។"],
      UPDATE_ADS: ["កែពាណិជ្ជកម្ម", "កែមាតិកាផ្សាយ ការកំណត់គោលដៅ ស្ថានភាព និងកាលវិភាគ។"],
      DELETE_ADS: ["ដាក់ពាណិជ្ជកម្មក្នុងប័ណ្ណសារ", "ដាក់ពាណិជ្ជកម្មដែលមិនគួរបង្ហាញទៀតក្នុងប័ណ្ណសារ។"],
      VIEW_MEDIA: ["មើលមេឌៀ", "បើក និងរកមើលមេឌៀដែលបានផ្ទុកឡើង។"],
      MANAGE_MEDIA: ["គ្រប់គ្រងមេឌៀ", "ផ្ទុកឡើង កែ និងលុបឯកសារមេឌៀ។"],
    },
  },
} as const;

function getPermissionGroups(copy: typeof rolePageCopy.en | typeof rolePageCopy.km): PermissionGroup[] {
  const permission = (key: keyof typeof copy.permissions) => ({
    key: Permission[key],
    label: copy.permissions[key][0],
    description: copy.permissions[key][1],
  });

  return [
    {
      title: copy.groupsCopy.users.title,
      description: copy.groupsCopy.users.description,
      permissions: [
        permission("CREATE_USER"),
        permission("UPDATE_USER"),
        permission("DELETE_USER"),
        permission("VIEW_ALL_USERS"),
        permission("MANAGE_USER_ROLES"),
        permission("MANAGE_USERS"),
      ],
    },
    {
      title: copy.groupsCopy.articles.title,
      description: copy.groupsCopy.articles.description,
      excludedRoles: ["SUPER_ADMIN"],
      permissions: [
        permission("CREATE_ARTICLE"),
        permission("VIEW_ALL_ARTICLES"),
        permission("UPDATE_OWN_ARTICLE"),
        permission("UPDATE_ANY_ARTICLE"),
        permission("DELETE_OWN_ARTICLE"),
        permission("DELETE_ANY_ARTICLE"),
        permission("PUBLISH_ARTICLE"),
        permission("UNPUBLISH_ARTICLE"),
        permission("PREVIEW_ARTICLE"),
      ],
    },
    {
      title: copy.groupsCopy.editorial.title,
      description: copy.groupsCopy.editorial.description,
      excludedRoles: ["SUPER_ADMIN"],
      permissions: [
        permission("REVIEW_ARTICLES"),
        permission("APPROVE_ARTICLES"),
        permission("REJECT_ARTICLES"),
        permission("SET_FEATURED"),
        permission("SET_BREAKING_NEWS"),
        permission("SET_EDITORS_PICK"),
      ],
    },
    {
      title: copy.groupsCopy.structure.title,
      description: copy.groupsCopy.structure.description,
      excludedRoles: ["SUPER_ADMIN"],
      permissions: [
        permission("LIST_CATEGORIES"),
        permission("CREATE_CATEGORY"),
        permission("UPDATE_CATEGORY"),
        permission("DELETE_CATEGORY"),
        permission("CREATE_TOPIC"),
        permission("UPDATE_TOPIC"),
        permission("DELETE_TOPIC"),
      ],
    },
    {
      title: copy.groupsCopy.system.title,
      description: copy.groupsCopy.system.description,
      permissions: [
        permission("VIEW_SETTINGS"),
        permission("UPDATE_SETTINGS"),
        permission("VIEW_ANALYTICS"),
        permission("VIEW_AUDIT_LOGS"),
        permission("SYSTEM_ADMINISTRATION"),
      ],
    },
    {
      title: copy.groupsCopy.carousel.title,
      description: copy.groupsCopy.carousel.description,
      excludedRoles: ["SUPER_ADMIN"],
      permissions: [
        permission("CREATE_CAROUSEL"),
        permission("UPDATE_CAROUSEL"),
        permission("DELETE_CAROUSEL"),
      ],
    },
    {
      title: copy.groupsCopy.ads.title,
      description: copy.groupsCopy.ads.description,
      excludedRoles: ["SUPER_ADMIN"],
      permissions: [
        permission("VIEW_ADS"),
        permission("CREATE_ADS"),
        permission("UPDATE_ADS"),
        permission("DELETE_ADS"),
      ],
    },
    {
      title: copy.groupsCopy.media.title,
      description: copy.groupsCopy.media.description,
      permissions: [
        permission("VIEW_MEDIA"),
        permission("MANAGE_MEDIA"),
      ],
    },
  ];
}

const tenantContentPermissions = new Set<Permission>(
  getPermissionGroups(rolePageCopy.en)
    .filter((group) => group.excludedRoles?.includes("SUPER_ADMIN"))
    .flatMap((group) => group.permissions.map((permission) => permission.key)),
);

const defaultRolePermissions: Record<ManagedRole, Permission[]> = {
  SUPER_ADMIN: [
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_USERS,
    Permission.VIEW_SETTINGS,
    Permission.UPDATE_SETTINGS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_ADMINISTRATION,
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  ADMIN: [
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_USERS,
    Permission.CREATE_ARTICLE,
    Permission.VIEW_ALL_ARTICLES,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.DELETE_ANY_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.SET_FEATURED,
    Permission.SET_BREAKING_NEWS,
    Permission.SET_EDITORS_PICK,
    Permission.REVIEW_ARTICLES,
    Permission.APPROVE_ARTICLES,
    Permission.REJECT_ARTICLES,
    Permission.LIST_CATEGORIES,
    Permission.CREATE_CATEGORY,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.CREATE_TOPIC,
    Permission.UPDATE_TOPIC,
    Permission.DELETE_TOPIC,
    Permission.VIEW_SETTINGS,
    Permission.UPDATE_SETTINGS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_ADMINISTRATION,
    Permission.CREATE_CAROUSEL,
    Permission.UPDATE_CAROUSEL,
    Permission.DELETE_CAROUSEL,
    Permission.VIEW_ADS,
    Permission.CREATE_ADS,
    Permission.UPDATE_ADS,
    Permission.DELETE_ADS,
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  EDITOR: [
    Permission.CREATE_ARTICLE,
    Permission.VIEW_ALL_ARTICLES,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.PUBLISH_ARTICLE,
    Permission.UNPUBLISH_ARTICLE,
    Permission.SET_FEATURED,
    Permission.SET_BREAKING_NEWS,
    Permission.SET_EDITORS_PICK,
    Permission.REVIEW_ARTICLES,
    Permission.APPROVE_ARTICLES,
    Permission.REJECT_ARTICLES,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_CAROUSEL,
    Permission.UPDATE_CAROUSEL,
    Permission.DELETE_CAROUSEL,
    Permission.VIEW_ADS,
    Permission.VIEW_MEDIA,
    Permission.MANAGE_MEDIA,
  ],
  AUTHOR: [
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_OWN_ARTICLE,
    Permission.DELETE_OWN_ARTICLE,
    Permission.PREVIEW_ARTICLE,
    Permission.VIEW_MEDIA,
  ],
};

function normalizeRolePermissionsForUi(
  permissions: Record<ManagedRole, Permission[]>,
): Record<ManagedRole, Permission[]> {
  return {
    ...permissions,
    SUPER_ADMIN: permissions.SUPER_ADMIN.filter(
      (permission) => !tenantContentPermissions.has(permission),
    ),
  };
}

export default function RoleManagementPage() {
  const { locale } = useAdminLocale();
  const copy = rolePageCopy[locale];
  const permissionGroups = useMemo(() => getPermissionGroups(copy), [copy]);
  const { user, rolePermissions: authRolePermissions, refreshRolePermissions } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canViewRoleManagement =
    isSuperAdmin || hasPermission(Permission.MANAGE_USER_ROLES);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  const [permissionConfirmation, setPermissionConfirmation] = useState<{
    role: ManagedRole;
    permission: Permission;
    permissionLabel: string;
    enabled: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [rolePermissions, setRolePermissions] =
    useState<Record<ManagedRole, Permission[]>>(defaultRolePermissions);

  useEffect(() => {
    setRolePermissions(normalizeRolePermissionsForUi({
      SUPER_ADMIN: authRolePermissions.SUPER_ADMIN || defaultRolePermissions.SUPER_ADMIN,
      ADMIN: authRolePermissions.ADMIN || defaultRolePermissions.ADMIN,
      EDITOR: authRolePermissions.EDITOR || defaultRolePermissions.EDITOR,
      AUTHOR: authRolePermissions.AUTHOR || defaultRolePermissions.AUTHOR,
    }));
  }, [authRolePermissions]);

  useEffect(() => {
    void refreshRolePermissions();
  }, [refreshRolePermissions]);

  const permissionCount = useMemo(
    () => Object.values(rolePermissions).reduce((total, items) => total + items.length, 0),
    [rolePermissions],
  );

  const updatePermission = async (role: ManagedRole, permission: Permission, enabled: boolean) => {
    if (!isSuperAdmin) return;

    const savingKey = `${role}:${permission}`;
    setSavingPermission(savingKey);
    setError("");

    try {
      const result = await RolePermissionService.updatePermission({
        role,
        permission,
        enabled,
      });

      setRolePermissions((current) => ({
        ...current,
        [role]: result.permissions,
      }));
      await refreshRolePermissions();
    } catch (error: any) {
      setError(locale === "en" ? error?.response?.errors?.[0]?.message || copy.updateFailed : copy.updateFailed);
    } finally {
      setSavingPermission(null);
    }
  };

  return (
    <>
      {!permissionsLoading && !canViewRoleManagement ? (
        <div className="text-sm text-red-600">
          {copy.accessDenied}
        </div>
      ) : (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase text-blue-600">
                <Shield className="h-4 w-4" />
                {copy.eyebrow}
              </div>
              <CardTitle className="mt-2 text-3xl">{copy.title}</CardTitle>
              <CardDescription className="mt-2">
                {isSuperAdmin
                  ? copy.superAdminDescription
                  : copy.tenantAdminDescription}
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Badge variant="outline" className="justify-center px-3 py-2">
                {copy.roles(roles.length)}
              </Badge>
              <Badge variant="outline" className="justify-center px-3 py-2">
                {copy.groups(permissionGroups.length)}
              </Badge>
              <Badge variant="outline" className="justify-center px-3 py-2">
                {copy.enabled(permissionCount)}
              </Badge>
              <Badge variant={isSuperAdmin ? "default" : "secondary"} className="justify-center px-3 py-2">
                {isSuperAdmin ? copy.editable : copy.viewOnly}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {roles.map((role) => (
            <Card key={role} className="flex h-full flex-col">
              <CardHeader className="flex-1">
                <CardTitle>
                  {copy.roleNames[role]}
                </CardTitle>
                <CardDescription>{copy.roleDescriptions[role]}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">{copy.enabledPermissions}</span>
                  <span className="text-xl font-bold text-slate-950">{rolePermissions[role].length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {permissionGroups.map((group) => {
            const visibleRoles = roles.filter(
              (role) => !group.excludedRoles?.includes(role),
            );

            return (
            <Card key={group.title}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="py-3 pr-4">{copy.permission}</th>
                        {visibleRoles.map((role) => (
                          <th key={role} className="w-36 px-4 py-3 text-center">
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.permissions.map((permission) => (
                        <tr key={permission.key} className="border-b last:border-0">
                          <td className="py-4 pr-4">
                            <p className="font-medium text-slate-950">{permission.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                          </td>
                          {visibleRoles.map((role) => {
                            const enabled = rolePermissions[role].includes(permission.key);
                            const savingKey = `${role}:${permission.key}`;
                            const isSaving = savingPermission === savingKey;
                            return (
                              <td key={`${role}-${permission.key}`} className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  disabled={!isSuperAdmin || Boolean(savingPermission)}
                                  onClick={() =>
                                    setPermissionConfirmation({
                                      role,
                                      permission: permission.key,
                                      permissionLabel: permission.label,
                                      enabled: !enabled,
                                    })
                                  }
                                  className={[
                                    "mx-auto flex h-7 w-12 items-center rounded-full border p-0.5 transition",
                                    enabled ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-slate-200",
                                    isSuperAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-80",
                                  ].join(" ")}
                                  aria-label={copy.ariaToggle(enabled ? copy.disable : copy.enable, permission.label, copy.roleNames[role])}
                                >
                                  <span
                                    className={[
                                      "flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition",
                                      enabled ? "translate-x-5" : "translate-x-0",
                                    ].join(" ")}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      enabled && <Check className="h-3 w-3" />
                                    )}
                                  </span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      </div>
      )}
      <ConfirmationDialog
        open={Boolean(permissionConfirmation)}
        onOpenChange={(open) => {
          if (!open) setPermissionConfirmation(null);
        }}
        title={permissionConfirmation?.enabled ? copy.enablePermissionTitle : copy.disablePermissionTitle}
        description={
          permissionConfirmation
            ? copy.permissionConfirmation(
                permissionConfirmation.enabled ? copy.enable : copy.disable,
                permissionConfirmation.permissionLabel,
                copy.roleNames[permissionConfirmation.role],
              )
            : ""
        }
        confirmText={permissionConfirmation?.enabled ? copy.enable : copy.disable}
        cancelText={copy.cancel}
        variant={permissionConfirmation?.enabled ? "default" : "destructive"}
        onConfirm={async () => {
          if (!permissionConfirmation) return;
          await updatePermission(
            permissionConfirmation.role,
            permissionConfirmation.permission,
            permissionConfirmation.enabled,
          );
        }}
      />
    </>
  );
}
