'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Paperclip, Send, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { uploadChatAttachment } from '@/lib/api/messages';
import { avatarColor, displayInitial, userDisplayName } from '@/lib/chat/meta';
import type { ConversationMember, Message, SendMessageInput } from '@/lib/chat/types';
import { useAuthStore } from '@/lib/stores/auth-store';

function memberName(m: ConversationMember): string {
  if (m.nickname) return m.nickname;
  const u = m.user;
  if (u.nickname) return u.nickname;
  return `${u.firstName} ${u.lastName}`.trim() || u.email || 'User';
}

interface MessageComposerProps {
  conversationId: string;
  sending: boolean;
  replyTo: Message | null;
  onClearReply: () => void;
  onSend: (input: SendMessageInput) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  members?: ConversationMember[];
}

export function MessageComposer({
  conversationId,
  sending,
  replyTo,
  onClearReply,
  onSend,
  onTyping,
  members,
}: MessageComposerProps) {
  const myId = useAuthStore((s) => s.user?.id);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCountRef = useRef(0);

  const busy = sending || uploading;
  const canSend = !busy && (pendingImage !== null || text.trim().length > 0);

  // Members available for mention — exclude self
  const mentionableMembers = useMemo(
    () => (members ?? []).filter((m) => m.user.id !== myId),
    [members, myId],
  );

  // Filtered list shown in the picker
  const mentionMatches = useMemo(() => {
    if (mentionQuery === null || !mentionableMembers.length) return [];
    const q = mentionQuery.toLowerCase();
    return mentionableMembers
      .filter((m) => {
        const name = memberName(m).toLowerCase();
        const email = (m.user.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 8);
  }, [mentionQuery, mentionableMembers]);

  const closePicker = useCallback(() => setMentionQuery(null), []);

  const insertMention = useCallback(
    (member: ConversationMember) => {
      const name = memberName(member);
      const el = textareaRef.current;
      const caretPos = el?.selectionStart ?? text.length;
      const before = text.slice(0, caretPos);
      const after = text.slice(caretPos);

      // Find the @ that opened the picker
      const match = before.match(/(?:^|\s)@([^\s]*)$/);
      const atIdx = match ? before.lastIndexOf('@') : before.length;
      const newText = before.slice(0, atIdx) + `@${name} ` + after;

      setText(newText);
      setMentionedIds((prev) => (prev.includes(member.user.id) ? prev : [...prev, member.user.id]));
      closePicker();

      // Restore focus and caret
      requestAnimationFrame(() => {
        el?.focus();
        const pos = atIdx + name.length + 2; // @ + name + space
        el?.setSelectionRange(pos, pos);
      });
    },
    [text, closePicker],
  );

  const detectMention = (value: string, caretPos: number) => {
    const before = value.slice(0, caretPos);
    // @ preceded by start-of-string or whitespace
    const match = before.match(/(?:^|\s)@([^\s]*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const clearPendingImage = useCallback(() => {
    setPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingImage(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const queueImagePreview = useCallback((file: File) => {
    setPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingImage(file);
  }, []);

  const handleSend = useCallback(async () => {
    if (busy) return;
    closePicker();

    if (pendingImage) {
      const file = pendingImage;
      const caption = text.trim();
      setPendingImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      setPendingImage(null);
      setText('');
      onTyping(false);
      if (fileRef.current) fileRef.current.value = '';
      setUploading(true);
      try {
        const uploaded = await uploadChatAttachment(conversationId, file);
        await onSend({
          type: 'IMAGE',
          content: caption || undefined,
          attachments: [{
            fileName: uploaded.fileName,
            fileUrl: uploaded.fileUrl,
            fileType: uploaded.fileType,
            fileSizeBytes: uploaded.fileSizeBytes,
            width: uploaded.width != null && uploaded.width > 0 ? uploaded.width : undefined,
            height: uploaded.height != null && uploaded.height > 0 ? uploaded.height : undefined,
          }],
          replyToId: replyTo?.id,
        });
        onClearReply();
      } finally {
        setUploading(false);
      }
      return;
    }

    const content = text.trim();
    if (!content) return;
    const ids = mentionedIds.length ? mentionedIds : undefined;
    setText('');
    setMentionedIds([]);
    onTyping(false);
    await onSend({ type: 'TEXT', content, replyToId: replyTo?.id, mentionUserIds: ids });
    onClearReply();
  }, [busy, closePicker, pendingImage, text, mentionedIds, onTyping, conversationId, onSend, replyTo, onClearReply]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault();
      closePicker();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If picker open, select first match instead of sending
      if (mentionQuery !== null && mentionMatches.length > 0) {
        insertMention(mentionMatches[0]);
        return;
      }
      if (canSend) void handleSend();
    }
  };

  // Immediate upload + send for non-image files
  const sendFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const uploaded = await uploadChatAttachment(conversationId, file);
        await onSend({
          type: 'FILE',
          content: uploaded.fileName,
          attachments: [{
            fileName: uploaded.fileName,
            fileUrl: uploaded.fileUrl,
            fileType: uploaded.fileType,
            fileSizeBytes: uploaded.fileSizeBytes,
            width: uploaded.width != null && uploaded.width > 0 ? uploaded.width : undefined,
            height: uploaded.height != null && uploaded.height > 0 ? uploaded.height : undefined,
          }],
          replyToId: replyTo?.id,
        });
        onClearReply();
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [conversationId, onSend, replyTo, onClearReply],
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCountRef.current++;
    if (dragCountRef.current === 1) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setIsDragging(false);
      if (busy) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      if (files.length === 1 && files[0].type.startsWith('image/')) {
        queueImagePreview(files[0]);
      } else {
        files.reduce((p, file) => p.then(() => sendFile(file)), Promise.resolve());
      }
    },
    [busy, queueImagePreview, sendFile],
  );

  return (
    <div
      className="relative shrink-0 border-t border-border/60 bg-background/80 px-3 py-3 backdrop-blur-sm"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-sm border-2 border-dashed border-brand bg-brand-muted/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-brand">
            <Upload className="size-8" />
            <span className="text-sm font-semibold">วางไฟล์ที่นี่</span>
            <span className="text-xs text-brand/70">รูปภาพ · PDF · เอกสาร · ZIP</span>
          </div>
        </div>
      ) : null}

      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1 truncate text-muted-foreground">
            ตอบกลับ: {replyTo.content ?? '[ข้อความ]'}
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClearReply} aria-label="ยกเลิกตอบกลับ">
            <X className="size-3" />
          </Button>
        </div>
      ) : null}

      {pendingImage && pendingImagePreview ? (
        <div className="mb-2 inline-flex">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImagePreview}
              alt={pendingImage.name}
              className="max-h-32 max-w-[180px] rounded-xl border border-border/60 object-cover shadow-sm"
            />
            <button
              type="button"
              onClick={clearPendingImage}
              disabled={busy}
              className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              aria-label="ลบรูป"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.type.startsWith('image/')) {
              queueImagePreview(file);
            } else {
              void sendFile(file);
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          aria-label="แนบไฟล์"
          className="shrink-0"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </Button>

        {/* Textarea wrapper — positions the mention picker */}
        <div className="relative flex-1">
          {/* @ mention picker */}
          {mentionMatches.length > 0 ? (
            <div className="absolute bottom-full left-0 z-20 mb-1.5 w-64 overflow-hidden rounded-xl bg-popover shadow-lg ring-1 ring-border/60">
              {mentionMatches.map((member) => {
                const name = memberName(member);
                const senderName = userDisplayName(member.user);
                return (
                  <button
                    key={member.userId}
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    onMouseDown={(e) => {
                      // Prevent textarea blur so caret position is preserved
                      e.preventDefault();
                      insertMention(member);
                    }}
                  >
                    <UserAvatar
                      avatarUrl={member.user.avatarUrl}
                      initial={displayInitial(senderName)}
                      color={avatarColor(member.user.id)}
                      size="sm"
                      alt={name}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{name}</span>
                      {member.user.email ? (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {member.user.email}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              const value = e.target.value;
              const caret = e.target.selectionStart ?? value.length;
              setText(value);
              onTyping(value.length > 0);
              detectMention(value, caret);
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              // Update mention detection on arrow key navigation
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const el = e.currentTarget;
                detectMention(el.value, el.selectionStart ?? el.value.length);
              }
            }}
            placeholder={pendingImage ? 'เพิ่มคำอธิบายรูป (ไม่บังคับ)...' : 'พิมพ์ข้อความ... (@เพื่อแท็ก)'}
            rows={3}
            disabled={busy}
            className="max-h-40 min-h-[72px] w-full resize-none border-border/60 bg-background py-2"
          />
        </div>

        <Button
          variant="create"
          size="icon-sm"
          disabled={!canSend}
          onClick={() => void handleSend()}
          aria-label="ส่งข้อความ"
          className="shrink-0"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
      <p className="mt-1.5 hidden text-[10px] text-muted-foreground sm:block">
        Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · @ แท็กสมาชิก
      </p>
    </div>
  );
}
