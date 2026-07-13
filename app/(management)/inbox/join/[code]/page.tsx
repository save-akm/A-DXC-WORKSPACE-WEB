'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { joinByInviteCode } from '@/lib/api/conversations';

export default function JoinGroupPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.code) return undefined;
    let cancelled = false;
    joinByInviteCode(params.code)
      .then((conversation) => {
        if (!cancelled) router.replace(`/inbox/${conversation.id}`);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error)?.message ?? 'เข้ากลุ่มไม่สำเร็จ');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.code, router]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      {loading ? (
        <>
          <Loader2 className="size-8 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">กำลังเข้าร่วมกลุ่ม...</p>
        </>
      ) : (
        <>
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
            <LogIn className="size-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium">เข้ากลุ่มไม่สำเร็จ</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/inbox')}>
            กลับไป Inbox
          </Button>
        </>
      )}
    </div>
  );
}
