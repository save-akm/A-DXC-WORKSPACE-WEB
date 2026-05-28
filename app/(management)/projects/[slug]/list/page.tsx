import { notFound } from 'next/navigation';
import { projects } from '@/lib/management/nav-config';

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) notFound();

  return (
    <div className="p-6">
      <p className="text-muted-foreground">List view — coming soon</p>
    </div>
  );
}
