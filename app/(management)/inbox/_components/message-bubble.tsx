'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CornerUpLeft,
  Download,
  FileIcon,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EXTENDED_EMOJIS, QUICK_REACTIONS } from '@/lib/chat/constants';
import {
  canDeleteMessage,
  canEditMessage,
  canPinMessage,
} from '@/lib/chat/permissions';
import {
  avatarColor,
  displayInitial,
  formatFileSize,
  messageTime,
  userDisplayName,
} from '@/lib/chat/meta';
import type { ChatUserMini, Conversation, Message, MessageMention } from '@/lib/chat/types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ChatMemberHoverCard } from './chat-member-hover-card';
import { SystemMessage } from './message-bits';

function highlightMentions(
  content: string | null,
  mentions: MessageMention[],
  isMine: boolean,
  conversation: Conversation,
): ReactNode {
  if (!content || !mentions.length) return content;

  // Map each mentionable display name back to its user so the hover card can
  // show the right profile. Longer names first so "@John Doe" wins over "@John".
  const nameToUser = new Map<string, ChatUserMini>();
  for (const m of mentions) {
    const u = m.user;
    if (u.nickname) nameToUser.set(u.nickname, u);
    const full = `${u.firstName} ${u.lastName}`.trim();
    if (full) nameToUser.set(full, u);
    else if (u.firstName) nameToUser.set(u.firstName, u);
  }
  if (!nameToUser.size) return content;

  const sorted = Array.from(nameToUser.keys()).sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`@(${escaped.join('|')})`, 'g');

  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) nodes.push(content.slice(last, match.index));
    const user = nameToUser.get(match[1]);
    const token = (
      <span
        className={cn(
          'cursor-pointer rounded font-semibold',
          isMine ? 'text-white/90 underline decoration-white/50' : 'text-brand hover:bg-brand-muted',
        )}
      >
        {match[0]}
      </span>
    );
    nodes.push(
      user ? (
        <ChatMemberHoverCard key={match.index} user={user} conversation={conversation}>
          {token}
        </ChatMemberHoverCard>
      ) : (
        <span key={match.index}>{token}</span>
      ),
    );
    last = match.index + match[0].length;
  }
  if (!nodes.length) return content;
  if (last < content.length) nodes.push(content.slice(last));
  return nodes;
}

interface MessageBubbleProps {
  message: Message;
  showSender: boolean;
  conversation: Conversation;
  editing: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onToggleReaction: (message: Message, emoji: string) => void;
  onTogglePin: (message: Message) => void;
  onSaveEdit: (message: Message, content: string) => void;
  onCancelEdit: () => void;
}

export function MessageBubble({
  message,
  showSender,
  conversation,
  editing,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onTogglePin,
  onSaveEdit,
  onCancelEdit,
}: MessageBubbleProps) {
  const myId = useAuthStore((s) => s.user?.id);
  const [editText, setEditText] = useState(message.content ?? '');
  const [showReactions, setShowReactions] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  const isMine = message.sender.id === myId;
  const isDeleted = Boolean(message.deletedAt);
  const isSystem = message.type === 'SYSTEM';
  const isGroup = conversation.type === 'GROUP';

  if (isSystem) {
    return <SystemMessage content={message.content ?? ''} />;
  }

  const senderName = userDisplayName(message.sender);
  const displayName = isMine ? 'คุณ' : senderName;
  const allowEdit = canEditMessage(message, myId);
  const allowDelete = canDeleteMessage(message, myId, conversation.myRole, isGroup);
  const allowPin = canPinMessage(conversation.myRole, isGroup) && !isDeleted;

  const reactionGroups = message.reactions.reduce<Record<string, { count: number; mine: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
      acc[r.emoji].count += 1;
      if (r.userId === myId) acc[r.emoji].mine = true;
      return acc;
    },
    {},
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'group/row flex gap-3 px-4 transition-colors hover:bg-accent/20',
        showSender ? 'pt-2 pb-0.5' : 'py-0.5',
      )}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar column — fixed 40px */}
      <div className="w-10 shrink-0 pt-0.5">
        {showSender ? (
          <ChatMemberHoverCard user={message.sender} conversation={conversation}>
            <UserAvatar
              avatarUrl={message.sender.avatarUrl}
              initial={displayInitial(senderName)}
              color={avatarColor(message.sender.id)}
              size="md"
              alt={senderName}
            />
          </ChatMemberHoverCard>
        ) : (
          <time
            className="flex h-full items-start justify-end pt-1 text-[10px] leading-none text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100"
            dateTime={message.createdAt}
          >
            {messageTime(message.createdAt)}
          </time>
        )}
      </div>

      {/* Content column */}
      <div className="group/content min-w-0 flex-1">
        {/* Header: name + timestamp */}
        {showSender ? (
          <div className="mb-1 flex items-baseline gap-2">
            <span
              className={cn(
                'text-sm font-semibold leading-none',
                isMine ? 'text-brand' : 'text-foreground',
              )}
            >
              {displayName}
            </span>
            <time
              className="text-[11px] leading-none text-muted-foreground"
              dateTime={message.createdAt}
            >
              {messageTime(message.createdAt)}
            </time>
          </div>
        ) : null}

        {/* Reply quote */}
        {message.replyTo ? (
          <div className="mb-1.5 inline-flex max-w-[min(80%,520px)] items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-1.5 ring-1 ring-border/40">
            <CornerUpLeft className="size-3 shrink-0 text-muted-foreground" />
            <p className="line-clamp-1 text-[11px] text-muted-foreground">
              {message.replyTo.content ?? '[ข้อความ]'}
            </p>
          </div>
        ) : null}

        {/* Reaction picker */}
        {showReactions && !isDeleted ? (
          <div className="mb-1.5 inline-flex items-center gap-0.5 rounded-full bg-popover p-1 shadow-md ring-1 ring-border/60">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="cursor-pointer rounded-full px-1.5 py-0.5 text-base transition-colors hover:bg-accent"
                onClick={() => {
                  onToggleReaction(message, emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </button>
            ))}
            <Popover
              open={showFullPicker}
              onOpenChange={(open) => {
                setShowFullPicker(open);
                if (!open) setShowReactions(false);
              }}
            >
              <PopoverTrigger
                className="flex cursor-pointer items-center justify-center rounded-full px-1.5 py-1 transition-colors hover:bg-accent"
                aria-label="emoji เพิ่มเติม"
              >
                <Plus className="size-3.5 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-64 p-2">
                <div className="grid grid-cols-8 gap-0.5">
                  {EXTENDED_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="cursor-pointer rounded px-1 py-0.5 text-base transition-colors hover:bg-accent"
                      onClick={() => {
                        onToggleReaction(message, emoji);
                        setShowReactions(false);
                        setShowFullPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : null}

        {/* Bubble + action bar — flex row so action bar sits right next to bubble */}
        <div className="flex items-center gap-1.5">
          {/* Image type */}
          {!editing && !isDeleted && message.type === 'IMAGE' && message.attachments[0] ? (
            <div className="relative max-w-[min(78%,500px)]">
              {message.isPinned ? (
                <Pin
                  className="absolute -right-0.5 -top-1 z-10 size-3 rotate-45 text-amber-500 drop-shadow-sm"
                  aria-label="ปักหมุด"
                />
              ) : null}

              {message.content ? (
                /* Image + caption: bubble wraps both — image sits inside with inner rounding */
                <div
                  className={cn(
                    'rounded-2xl p-2',
                    isMine
                      ? 'bg-brand text-white shadow-sm shadow-brand/20'
                      : 'bg-muted text-foreground shadow-sm ring-1 ring-border',
                  )}
                >
                  <div
                    className="group/img relative cursor-zoom-in overflow-hidden rounded-xl"
                    onClick={() => setLightboxOpen(true)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.attachments[0].fileUrl}
                      alt={message.attachments[0].fileName}
                      className="max-h-64 w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-black/0 p-1.5 opacity-0 transition-all duration-150 group-hover/img:bg-black/25 group-hover/img:opacity-100">
                      <a
                        href={message.attachments[0].fileUrl}
                        download={message.attachments[0].fileName}
                        className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                        aria-label="ดาวน์โหลด"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="size-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="px-1.5 pt-1.5 pb-0.5 text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap break-words">{highlightMentions(message.content, message.mentions, isMine, conversation)}</p>
                    {message.isEdited ? (
                      <span
                        className={cn(
                          'ml-1.5 text-[10px]',
                          isMine ? 'text-white/55' : 'text-muted-foreground',
                        )}
                      >
                        (แก้ไขแล้ว)
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                /* Image only: no bubble */
                <div
                  className="group/img relative cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.attachments[0].fileUrl}
                    alt={message.attachments[0].fileName}
                    className="max-h-64 max-w-full rounded-2xl object-cover shadow-sm"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-end rounded-2xl bg-black/0 p-1.5 opacity-0 transition-all duration-150 group-hover/img:bg-black/25 group-hover/img:opacity-100">
                    <a
                      href={message.attachments[0].fileUrl}
                      download={message.attachments[0].fileName}
                      className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                      aria-label="ดาวน์โหลด"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="size-3.5" />
                    </a>
                  </div>
                  {message.isEdited ? (
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">(แก้ไขแล้ว)</span>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            /* Regular bubble for text, file, deleted, and edit mode */
            <div
              className={cn(
                'relative max-w-[min(78%,500px)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                isMine
                  ? 'bg-brand text-white shadow-sm shadow-brand/20'
                  : 'bg-muted text-foreground shadow-sm ring-1 ring-border',
                isDeleted && 'italic opacity-60',
              )}
            >
              {message.isPinned ? (
                <Pin
                  className="absolute -right-0.5 -top-1 size-3 rotate-45 text-amber-500 drop-shadow-sm"
                  aria-label="ปักหมุด"
                />
              ) : null}

              {editing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="min-h-0 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:ring-white/30"
                  />
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-white hover:bg-white/10"
                      onClick={onCancelEdit}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7"
                      onClick={() => onSaveEdit(message, editText.trim())}
                      disabled={!editText.trim()}
                    >
                      บันทึก
                    </Button>
                  </div>
                </div>
              ) : isDeleted ? (
                <p className="text-sm">ข้อความนี้ถูกลบแล้ว</p>
              ) : message.type === 'FILE' && message.attachments[0] ? (
                /* File card — outer div for hover group, two sibling <a> tags (no nesting) */
                <div
                  className={cn(
                    'group/file flex items-center gap-2 rounded-xl p-2.5 transition-colors',
                    isMine ? 'bg-white/10 hover:bg-white/15' : 'bg-muted/60 hover:bg-muted',
                  )}
                >
                  <a
                    href={message.attachments[0].fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <FileIcon className="size-4 shrink-0 opacity-70" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {message.attachments[0].fileName}
                      </span>
                      <span className="block text-[10px] opacity-70">
                        {formatFileSize(message.attachments[0].fileSizeBytes)}
                      </span>
                    </span>
                  </a>
                  <a
                    href={message.attachments[0].fileUrl}
                    download={message.attachments[0].fileName}
                    className="shrink-0 opacity-0 transition-opacity group-hover/file:opacity-70 hover:!opacity-100"
                    aria-label="ดาวน์โหลด"
                  >
                    <Download className="size-3.5" />
                  </a>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{highlightMentions(message.content, message.mentions, isMine, conversation)}</p>
              )}

              {!editing && message.isEdited && !isDeleted ? (
                <span
                  className={cn(
                    'ml-1.5 text-[10px]',
                    isMine ? 'text-white/55' : 'text-muted-foreground',
                  )}
                >
                  (แก้ไขแล้ว)
                </span>
              ) : null}
            </div>
          )}

          {/* Action bar — sits right next to bubble, CSS hover only */}
          {!isDeleted && !editing ? (
            <div className="flex shrink-0 items-center gap-0.5 self-center rounded-lg bg-popover/95 px-1 py-1 opacity-0 shadow-sm ring-1 ring-border/60 transition-opacity [pointer-events:none] group-hover/content:opacity-100 group-hover/content:[pointer-events:auto]">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onReply(message)}
                aria-label="ตอบกลับ"
              >
                <CornerUpLeft className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowReactions((v) => !v)}
                aria-label="react"
              >
                <Smile className="size-3.5" />
              </Button>
              {allowEdit ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(message)}
                  aria-label="แก้ไข"
                >
                  <Pencil className="size-3.5" />
                </Button>
              ) : null}
              {allowPin ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onTogglePin(message)}
                  aria-label="ปักหมุด"
                >
                  {message.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                </Button>
              ) : null}
              {allowDelete ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(message)}
                  aria-label="ลบ"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Reaction chips */}
        {Object.keys(reactionGroups).length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(message, emoji)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] ring-1 transition-colors',
                  mine
                    ? 'bg-brand-muted text-brand ring-brand/30'
                    : 'bg-muted/70 ring-border/50 hover:bg-accent',
                )}
              >
                {emoji}
                {count > 1 ? <span className="text-muted-foreground">{count}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Image lightbox */}
      {lightboxOpen && message.type === 'IMAGE' && message.attachments[0] ? (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.attachments[0].fileUrl}
            alt={message.attachments[0].fileName}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={message.attachments[0].fileUrl}
            download={message.attachments[0].fileName}
            className="absolute bottom-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="size-4" />
            ดาวน์โหลด
          </a>
        </div>
      ) : null}
    </div>
  );
}
