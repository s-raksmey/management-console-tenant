function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700/80 ${className}`} />;
}

function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
      <Bone className="h-3 w-20" />
      <Bone className="mt-4 h-7 w-14" />
    </div>
  );
}

function HeaderSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-start gap-4"
      style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) max-content", alignItems: "start", width: "100%" }}
    >
      <div className="min-w-0 space-y-2.5">
        <Bone className="h-3 w-24" />
        <Bone className={`h-8 max-w-full ${wide ? "w-72" : "w-56"}`} />
        <Bone className="h-3.5 w-full max-w-md" />
      </div>
      <Bone className="h-9 w-40 rounded-lg" />
    </div>
  );
}

function TableRows({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5">
          <div className="min-w-0 space-y-2">
            <Bone className="h-3.5 w-40 max-w-full" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="hidden h-3.5 w-full max-w-[12rem] sm:block" />
          <Bone className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TenantsPageSkeleton() {
  return (
    <div className="w-full space-y-6" aria-busy="true" aria-live="polite">
      <HeaderSkeleton wide />
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800">
          <div className="space-y-2">
            <Bone className="h-5 w-36" />
            <Bone className="h-3.5 w-56 max-w-full" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bone className="h-9 min-w-0 flex-1 rounded-lg" />
            <Bone className="h-9 w-full rounded-lg sm:w-44" />
          </div>
        </div>
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 border-b border-slate-100 px-5 py-3 dark:border-slate-800 sm:grid">
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-14" />
        </div>
        <TableRows count={6} />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="min-h-screen space-y-8 bg-slate-50 p-3 dark:bg-slate-950 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Bone className="h-8 w-64 max-w-full" />
          <Bone className="h-4 w-80 max-w-full" />
        </div>
        <Bone className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <Bone className="h-5 w-40" />
              <Bone className="h-3.5 w-56 max-w-full" />
            </div>
            <TableRows count={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

const sidebarRowWidths = [
  ["w-28", "w-40"],
  ["w-36", "w-24"],
  ["w-32", "w-44"],
  ["w-24", "w-36"],
  ["w-40", "w-28"],
  ["w-20", "w-32"],
  ["w-32", "w-24"],
  ["w-28", "w-36"],
] as const;

export function SidebarSkeleton({
  collapsed,
  activeIndex = 0,
  count = 14,
}: {
  collapsed: boolean;
  activeIndex?: number;
  count?: number;
}) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => {
        const [titleWidth, detailWidth] = sidebarRowWidths[index % sidebarRowWidths.length];
        const active = index === activeIndex;

        if (collapsed) {
          return (
            <div
              key={index}
              className={`flex justify-center rounded-lg py-2 ${active ? "bg-blue-50 dark:bg-blue-500/15" : ""}`}
            >
              <Bone className="h-8 w-8 rounded-md" />
            </div>
          );
        }

        return (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${active ? "bg-blue-50 dark:bg-blue-500/15" : ""}`}
          >
            <Bone className="h-8 w-8 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className={`h-3 ${titleWidth}`} />
              {active ? null : <Bone className={`h-2.5 ${detailWidth}`} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <Bone className="h-5 w-32" />
        </div>
        <TableRows />
      </div>
    </div>
  );
}
