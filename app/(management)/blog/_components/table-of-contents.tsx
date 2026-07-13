'use client';

import { useEffect, useState, type RefObject } from 'react';
import { AlignLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export function useToc(containerRef: RefObject<HTMLElement | null>, dep: unknown) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const headings = Array.from(root.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]'));
    const list: TocItem[] = headings.map((h) => ({
      id: h.id,
      text: h.textContent ?? '',
      level: h.tagName === 'H1' ? 1 : h.tagName === 'H3' ? 3 : 2,
    }));
    setItems(list);
    if (list.length === 0) return;

    setActiveId(list[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: '-96px 0px -68% 0px', threshold: [0, 1] },
    );
    headings.forEach((h) => observer.observe(h));

    function onScroll() {
      const el = containerRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const scrolled = Math.max(0, -top + 96);
      const total = Math.max(1, height - viewH + 96);
      setProgress(Math.min(100, Math.round((scrolled / total) * 100)));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dep]);

  return { items, activeId, progress };
}

function TocLink({
  item,
  active,
  onClick,
}: {
  item: TocItem;
  active: boolean;
  onClick: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <li>
      <a
        href={`#${item.id}`}
        onClick={(e) => onClick(e, item.id)}
        title={item.text}
        className={cn(
          '-ml-px block border-l py-[5px] text-[12.5px] leading-snug transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50',
          item.level === 1 ? 'pl-3 font-semibold' : item.level === 2 ? 'pl-4' : 'pl-7 text-[11.5px] opacity-90',
          active
            ? 'border-brand font-medium text-brand'
            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
        )}
      >
        <span className="line-clamp-2">{item.text}</span>
      </a>
    </li>
  );
}

function handleScroll(e: React.MouseEvent, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

/** Desktop sticky sidebar TOC — shown at lg+ only */
export function TableOfContents({
  items,
  activeId,
  progress,
}: {
  items: TocItem[];
  activeId: string;
  progress: number;
}) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="สารบัญ"
      className="sticky top-[3.75rem] max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 pt-1 scrollbar-thin"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-1.5">
        <AlignLeft className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">
          สารบัญ
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3.5 h-0.5 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <ul className="border-l border-border/60">
        {items.map((it) => (
          <TocLink key={it.id} item={it} active={activeId === it.id} onClick={handleScroll} />
        ))}
      </ul>
    </nav>
  );
}

/** Mobile collapsible TOC — shown below lg */
export function MobileToc({
  items,
  activeId,
  progress,
}: {
  items: TocItem[];
  activeId: string;
  progress: number;
}) {
  const [open, setOpen] = useState(false);
  if (items.length < 2) return null;

  const active = items.find((it) => it.id === activeId);

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-border/60 bg-card/50 lg:hidden print:hidden">
      {/* Toggle row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      >
        <AlignLeft className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-[13px] font-semibold text-foreground">สารบัญ</span>
        {active && !open && (
          <span className="ml-1 truncate text-[12px] text-muted-foreground">— {active.text}</span>
        )}
        <ChevronDown
          className={cn(
            'ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Progress bar (always visible) */}
      <div className="h-0.5 w-full bg-border/60">
        <div
          className="h-full bg-brand transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* List */}
      {open && (
        <div className="border-t border-border/60 px-4 py-3">
          <ul className="border-l border-border/60">
            {items.map((it) => (
              <TocLink
                key={it.id}
                item={it}
                active={activeId === it.id}
                onClick={(e, id) => {
                  handleScroll(e, id);
                  setOpen(false);
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
