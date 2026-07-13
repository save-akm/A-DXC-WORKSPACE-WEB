'use client';

import { Children, isValidElement, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentImage } from './content-image';

// Sanitize schema extended to keep the `id` (rehype-slug) and the classNames
// our pipeline actually emits: `tc-*` author text colors and highlight tokens.
// Scoped by regex — a blanket className allowlist would let raw HTML in a post
// body apply arbitrary Tailwind classes (e.g. fixed overlays).
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'id'],
    span: [...(defaultSchema.attributes?.span ?? []), ['className', /^(tc-|hljs)/]],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^(language-|hljs)/]],
  },
};

// Friendly labels for the code-frame header.
const LANG_LABELS: Record<string, string> = {
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX',
  js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX',
  sql: 'SQL', bash: 'Bash', sh: 'Shell', shell: 'Shell', zsh: 'Shell',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', html: 'HTML', xml: 'XML',
  css: 'CSS', scss: 'SCSS', python: 'Python', py: 'Python', go: 'Go',
  java: 'Java', php: 'PHP', rust: 'Rust', c: 'C', cpp: 'C++', csharp: 'C#',
  ruby: 'Ruby', kotlin: 'Kotlin', swift: 'Swift', dockerfile: 'Dockerfile',
  vue: 'Vue', md: 'Markdown', markdown: 'Markdown', text: 'Text', plaintext: 'Text',
};

/** Recursively collect plain text from rendered React nodes (for copy). */
function nodeToText(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (isValidElement(node)) return nodeToText((node.props as { children?: ReactNode }).children);
  return '';
}

/** Styled code frame with a language label and a copy button. */
function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeEl = Children.toArray(children).find(isValidElement) as
    | { props: { className?: string; children?: ReactNode } }
    | undefined;
  const className = codeEl?.props?.className ?? '';
  const lang = /language-(\w+)/.exec(className)?.[1]?.toLowerCase();
  const label = lang ? (LANG_LABELS[lang] ?? lang.toUpperCase()) : 'Code';
  const raw = nodeToText(codeEl?.props?.children);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="blog-code group relative my-5 overflow-hidden rounded-xl border border-white/10 shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-3.5 py-1.5">
        <span className="font-mono text-[11px] font-medium tracking-wide text-white/45">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="คัดลอกโค้ด"
          className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">{children}</pre>
    </div>
  );
}

/**
 * Renders sanitized GFM markdown with syntax highlighting (rehype-highlight),
 * auto heading ids (rehype-slug) for the table of contents, and a copy-enabled
 * code frame. Element styles match the dashboard tokens (no typography plugin).
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('blog-prose max-w-[68ch] text-[15px] leading-7 text-foreground/90', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          rehypeRaw,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          [rehypeSanitize, schema],
        ]}
        components={{
          // Headings carry hierarchy via scale + weight; the brand accent is
          // reserved for links, markers, and the active TOC state.
          h1: ({ children, id }) => (
            <h1 id={id} className="mt-8 mb-3 scroll-mt-24 text-2xl font-bold tracking-tight text-foreground first:mt-0">{children}</h1>
          ),
          h2: ({ children, id }) => (
            <h2 id={id} className="mt-8 mb-3 scroll-mt-24 border-b border-border/60 pb-1.5 text-xl font-bold tracking-tight text-foreground first:mt-0">{children}</h2>
          ),
          h3: ({ children, id }) => (
            <h3 id={id} className="mt-6 mb-2 scroll-mt-24 text-lg font-semibold tracking-tight text-foreground">{children}</h3>
          ),
          h4: ({ children, id }) => (
            <h4 id={id} className="mt-5 mb-2 scroll-mt-24 text-base font-semibold text-foreground/90">{children}</h4>
          ),
          p: ({ children }) => <p className="my-4 leading-7">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline decoration-brand/30 underline-offset-2 transition-colors hover:decoration-brand"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-4 list-disc space-y-1.5 pl-6 marker:text-brand/60">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-1.5 pl-6 marker:text-brand/70">{children}</ol>,
          li: ({ children }) => <li className="leading-7 [&>ul]:my-1.5 [&>ol]:my-1.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-5 rounded-xl bg-brand-muted/40 px-4 py-3 text-[0.95em] text-muted-foreground italic ring-1 ring-inset ring-brand/15">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-border/60" />,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          img: ({ src, alt }) =>
            typeof src === 'string' ? <ContentImage src={src} alt={alt} /> : null,
          code: ({ className: cls, children }) => {
            const isBlock = /language-|hljs/.test(cls ?? '');
            if (isBlock) {
              // Rendered inside the CodeBlock frame; keep hljs token classes.
              return <code className={cls}>{children}</code>;
            }
            return (
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border/60 px-3 py-2 text-left text-xs font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border/40 px-3 py-2 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
