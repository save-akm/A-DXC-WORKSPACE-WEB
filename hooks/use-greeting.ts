'use client';

import { useEffect, useState } from 'react';

export interface Greeting {
  text: string;
  emoji: string;
}

function getGreeting(date: Date): Greeting {
  const h = date.getHours();
  if (h >= 5 && h < 11) return { text: 'อรุณสวัสดิ์', emoji: '☀️' };
  if (h >= 11 && h < 14) return { text: 'สวัสดีตอนเที่ยง', emoji: '🌤️' };
  if (h >= 14 && h < 17) return { text: 'สวัสดีตอนบ่าย', emoji: '🌥️' };
  if (h >= 17 && h < 20) return { text: 'สวัสดีตอนเย็น', emoji: '🌇' };
  return { text: 'สวัสดีตอนค่ำ', emoji: '🌙' };
}

export function useGreeting(): Greeting {
  const [greeting, setGreeting] = useState<Greeting>(() => getGreeting(new Date()));

  useEffect(() => {
    const update = () => setGreeting(getGreeting(new Date()));
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return greeting;
}
