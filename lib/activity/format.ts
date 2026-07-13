const DAY_FMT = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DAY_MONTH_FMT = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
});

const DETAIL_FMT = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Compact range for cards and table cells. */
export function formatActivityDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '—';

  if (s.toDateString() === e.toDateString()) {
    return DAY_FMT.format(s);
  }

  if (s.getFullYear() === e.getFullYear()) {
    return `${DAY_MONTH_FMT.format(s)} – ${DAY_FMT.format(e)}`;
  }

  return `${DAY_FMT.format(s)} – ${DAY_FMT.format(e)}`;
}

/** Full range with times for detail views. */
export function formatActivityDateRangeDetail(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '—';

  if (s.toDateString() === e.toDateString()) {
    const timeFmt = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${DAY_FMT.format(s)} ${timeFmt.format(s)} – ${timeFmt.format(e)} น.`;
  }

  return `${DETAIL_FMT.format(s)} – ${DETAIL_FMT.format(e)}`;
}
