'use client';

import { useRef, useState, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { avatarColor, displayInitial, userDisplayName } from '@/lib/chat/meta';
import type { ChatUserMini, Conversation, ConversationRole } from '@/lib/chat/types';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOnlineStore } from '@/lib/stores/online-store';

const ROLE_LABEL: Record<ConversationRole, string> = {
  OWNER: 'เจ้าของกลุ่ม',
  ADMIN: 'ผู้ดูแล',
  MEMBER: 'สมาชิก',
};

const CARD_WIDTH = 256;
const CARD_OFFSET = 10;

interface CardProps {
  memberUser: ChatUserMini;
  name: string;
  fullName: string | null;
  email: string | null;
  role: ConversationRole | undefined;
  isGroup: boolean;
  isOnline: boolean;
  color: string;
  anchorRect: DOMRect;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function Card({
  memberUser,
  name,
  fullName,
  email,
  role,
  isGroup,
  isOnline,
  color,
  anchorRect,
  onMouseEnter,
  onMouseLeave,
}: CardProps) {
  const [copied, setCopied] = useState(false);

  let left = anchorRect.right + CARD_OFFSET;
  let top = anchorRect.top;

  // keep within viewport
  if (left + CARD_WIDTH > window.innerWidth - 8) {
    left = anchorRect.left - CARD_WIDTH - CARD_OFFSET;
  }
  if (top < 8) top = 8;

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return ReactDOM.createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: 'fixed', top, left, width: CARD_WIDTH, zIndex: 99999 }}
      className="overflow-hidden rounded-xl bg-popover shadow-xl ring-1 ring-border/60"
    >
      {/* color strip */}
      <div className={cn('h-8 w-full opacity-80', color)} />

      {/* body */}
      <div className="-mt-5 flex flex-col items-center px-3 pb-3">
        <span className="rounded-full ring-[3px] ring-popover">
          <UserAvatar
            avatarUrl={memberUser.avatarUrl}
            initial={displayInitial(name)}
            color={color}
            size="lg"
            alt={name}
          />
        </span>

        {/* name + online dot inline */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <p className="text-center text-sm font-semibold leading-snug text-foreground">
            {name}
          </p>
          {isOnline ? (
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-label="ออนไลน์" />
          ) : null}
        </div>

        {/* full name below nickname */}
        {fullName ? (
          <p className="mt-0.5 text-center text-sm leading-snug text-muted-foreground">
            {fullName}
          </p>
        ) : null}

        {/* email — click to copy */}
        {email ? (
          <button
            type="button"
            onClick={copyEmail}
            className="group/copy mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-accent"
          >
            <span className="truncate text-sm text-muted-foreground/80 group-hover/copy:text-foreground">
              {email}
            </span>
            {copied ? (
              <Check className="size-3.5 shrink-0 text-emerald-500" />
            ) : (
              <Copy className="size-3.5 shrink-0 text-muted-foreground/50 group-hover/copy:text-muted-foreground" />
            )}
          </button>
        ) : null}

        {/* role badge — GROUP, OWNER/ADMIN only */}
        {isGroup && role && role !== 'MEMBER' ? (
          <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {ROLE_LABEL[role]}
          </span>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

interface Props {
  user: ChatUserMini;
  conversation: Conversation;
  children: ReactNode;
}

export function ChatMemberHoverCard({ user, conversation, children }: Props) {
  const myId = useAuthStore((s) => s.user?.id);
  const onlineIds = useOnlineStore((s) => s.onlineIds);

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isMe = user.id === myId;
  const isOnline = isMe || onlineIds.has(user.id);

  const member = conversation.members.find((m) => m.userId === user.id);
  const memberUser = member?.user ?? user;
  const role = member?.role;

  const name = isMe ? 'คุณ' : userDisplayName(user);
  const hasNickname = !isMe && Boolean(user.nickname?.trim());
  const fullName = hasNickname ? `${memberUser.firstName} ${memberUser.lastName}`.trim() : null;
  const email = memberUser.email ?? user.email ?? null;
  const color = avatarColor(user.id);

  const scheduleOpen = (rect: DOMRect) => {
    clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setAnchorRect(rect), 250);
  };

  const scheduleClose = () => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setAnchorRect(null), 100);
  };

  return (
    <>
      <span
        className="cursor-pointer"
        onMouseEnter={(e) => scheduleOpen(e.currentTarget.getBoundingClientRect())}
        onMouseLeave={scheduleClose}
      >
        {children}
      </span>

      {anchorRect ? (
        <Card
          memberUser={memberUser}
          name={name}
          fullName={fullName}
          email={email}
          role={role}
          isGroup={conversation.type === 'GROUP'}
          isOnline={isOnline}
          color={color}
          anchorRect={anchorRect}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={scheduleClose}
        />
      ) : null}
    </>
  );
}
