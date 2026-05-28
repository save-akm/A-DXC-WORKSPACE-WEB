import { notFound } from 'next/navigation';
import { projects } from '@/lib/management/nav-config';

const MOCK_COLUMNS = [
  {
    id: 'todo',
    label: 'Todo',
    color: 'bg-muted-foreground/20',
    cards: ['Design system tokens', 'Setup CI pipeline', 'Write unit tests'],
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    color: 'bg-sky-400/20',
    cards: ['Auth integration', 'Dashboard layout'],
  },
  {
    id: 'done',
    label: 'Done',
    color: 'bg-emerald-400/20',
    cards: ['Project scaffold', 'DB schema', 'API contracts'],
  },
];

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) notFound();

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className={`size-3 rounded-full ${project.color}`} />
          <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
            {project.badge}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>{project.openIssues} open issues</span>
          <span>{project.dueLabel}</span>
          <div className="flex items-center gap-1">
            {project.members.map((m, i) => (
              <span
                key={i}
                className={`inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-background ${m.color}`}
              >
                {m.initial}
              </span>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="flex max-w-sm items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full ${project.color}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
        </div>
      </div>

      {/* Board */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
        {MOCK_COLUMNS.map((col) => (
          <div key={col.id} className="flex w-64 shrink-0 flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <span className={`size-2 rounded-full ${col.color.replace('/20', '')}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{col.cards.length}</span>
            </div>

            <div className={`flex flex-col gap-2 rounded-lg p-2 ${col.color}`}>
              {col.cards.map((card) => (
                <div
                  key={card}
                  className="cursor-pointer rounded-md border border-border/60 bg-card px-3 py-2.5 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
