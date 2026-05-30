export function TeamCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="h-[72px] shrink-0 animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-6">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="my-2.5 h-px bg-border" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="ml-1.5 h-3 w-10 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
