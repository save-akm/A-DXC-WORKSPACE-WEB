'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { avatarColor, displayInitial, userDisplayName } from '@/lib/chat/meta';
import type { Conversation } from '@/lib/chat/types';
import { GroupAdminSections } from './group-admin-sections';

interface ConversationInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  description: string | null;
  onConversationChange: (c: Conversation) => void;
  onDeleted: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'เจ้าของกลุ่ม',
  ADMIN: 'แอดมิน',
  MEMBER: 'สมาชิก',
};

export function ConversationInfoSheet({
  open,
  onOpenChange,
  conversation,
  description,
  onConversationChange,
  onDeleted,
}: ConversationInfoSheetProps) {
  const { displayName, displayAvatar, type, members, myRole } = conversation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>ข้อมูลการสนทนา</SheetTitle>
          <SheetDescription>
            {type === 'GROUP' ? 'จัดการกลุ่มและสมาชิก' : 'รายละเอียดแชทส่วนตัว'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex shrink-0 flex-col items-center gap-2 px-4 py-4 text-center">
          <UserAvatar
            avatarUrl={displayAvatar}
            initial={displayInitial(displayName)}
            color={avatarColor(conversation.id)}
            size="lg"
            alt={displayName}
          />
          <h3 className="text-base font-semibold">{displayName}</h3>
          {description ? (
            <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
          ) : null}
          {type === 'GROUP' && myRole ? (
            <span className="rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand">
              {ROLE_LABELS[myRole] ?? myRole}
            </span>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {type === 'GROUP' ? (
            <GroupAdminSections
              key={conversation.updatedAt}
              conversation={conversation}
              onUpdated={onConversationChange}
              onDeleted={() => {
                onOpenChange(false);
                onDeleted();
              }}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">สมาชิก</p>
              <ul className="space-y-1">
                {members.map((m) => {
                  const name = userDisplayName(m.user);
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-1.5"
                    >
                      <UserAvatar
                        avatarUrl={m.user.avatarUrl}
                        initial={displayInitial(name)}
                        color={avatarColor(m.userId)}
                        size="xs"
                        alt={name}
                      />
                      <span className="text-sm">{name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
