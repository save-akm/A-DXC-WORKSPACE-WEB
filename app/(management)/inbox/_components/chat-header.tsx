'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Archive, ArchiveRestore, ArrowLeft, AtSign, Info, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ActionMenu } from '@/components/management/action-menu';
import {
  archiveConversation,
  leaveGroup,
  unarchiveConversation,
} from '@/lib/api/conversations';
import { avatarColor, displayInitial } from '@/lib/chat/meta';
import type { Conversation } from '@/lib/chat/types';
import { ConversationInfoSheet } from './conversation-info-sheet';
import { MentionsSheet } from './mentions-sheet';

interface ChatHeaderProps {
  conversation: Conversation;
  typingLabel: string | null;
  onConversationChange: (c: Conversation) => void;
  onLeave: () => void;
}

export function ChatHeader({
  conversation,
  typingLabel,
  onConversationChange,
  onLeave,
}: ChatHeaderProps) {
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState(false);
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const { displayName, displayAvatar, type, members, description } = conversation;

  const subtitle =
    typingLabel
    ?? (type === 'GROUP'
      ? `${members.length} สมาชิก`
      : 'แชทส่วนตัว');

  const menuActions = [
    {
      label: conversation.isArchived ? 'กู้คืนจากเก็บถาวร' : 'เก็บถาวร',
      icon: conversation.isArchived ? ArchiveRestore : Archive,
      onClick: async () => {
        if (conversation.isArchived) {
          await unarchiveConversation(conversation.id);
          const updated = { ...conversation, isArchived: false };
          onConversationChange(updated);
          window.dispatchEvent(new CustomEvent('inbox:conversation-updated', { detail: updated }));
        } else {
          await archiveConversation(conversation.id);
          const updated = { ...conversation, isArchived: true };
          onConversationChange(updated);
          window.dispatchEvent(new CustomEvent('inbox:conversation-updated', { detail: updated }));
        }
      },
    },
    ...(type === 'GROUP' && conversation.myRole !== 'OWNER'
      ? [{
          label: 'ออกจากกลุ่ม',
          icon: Users,
          destructive: true as const,
          onClick: async () => {
            await leaveGroup(conversation.id);
            onLeave();
          },
        }]
      : []),
  ];

  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          onClick={() => router.push('/inbox')}
          aria-label="กลับไปรายการแชท"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <UserAvatar
            avatarUrl={displayAvatar}
            initial={displayInitial(displayName)}
            color={avatarColor(conversation.id)}
            size="sm"
            alt={displayName}
          />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{displayName}</h2>
            <p className={typingLabel ? 'truncate text-xs text-brand' : 'truncate text-xs text-muted-foreground'}>
              {subtitle}
            </p>
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMentionsOpen(true)}
          aria-label="Mention ของฉัน"
        >
          <AtSign className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setInfoOpen(true)}
          aria-label="ข้อมูลห้องแชท"
        >
          <Info className="size-4" />
        </Button>

        <ActionMenu actions={menuActions} triggerSize="icon-sm" />
      </header>

      <ConversationInfoSheet
        open={infoOpen}
        onOpenChange={setInfoOpen}
        conversation={conversation}
        description={description}
        onConversationChange={onConversationChange}
        onDeleted={onLeave}
      />

      <MentionsSheet open={mentionsOpen} onOpenChange={setMentionsOpen} />
    </>
  );
}
