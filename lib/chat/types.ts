export type ConversationType = 'DIRECT' | 'GROUP';
export type ConversationRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'STICKER' | 'SYSTEM';

export interface ChatUserMini {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email?: string | null;
  avatarUrl: string | null;
}

export interface ConversationMember {
  id: string;
  userId: string;
  role: ConversationRole;
  nickname: string | null;
  joinedAt: string;
  user: ChatUserMini;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  description: string | null;
  displayName: string;
  displayAvatar: string | null;
  lastMessageId: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  isArchived: boolean;
  isStarred: boolean;
  unreadCount: number;
  members: ConversationMember[];
  myRole: ConversationRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReplyPreview {
  id: string;
  type: MessageType;
  content: string | null;
  sender: ChatUserMini;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: ChatUserMini;
  createdAt: string;
}

export interface MessageMention {
  userId: string;
  user: ChatUserMini;
}

export interface Message {
  id: string;
  conversationId: string;
  type: MessageType;
  content: string | null;
  isEdited: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  replyToId: string | null;
  replyTo: MessageReplyPreview | null;
  sender: ChatUserMini;
  mentions: MessageMention[];
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface AttachmentUploadResult {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
}

export type ConversationsArchivedFilter = false | true | 'all';

export interface ConversationsQuery {
  archived?: ConversationsArchivedFilter;
}

export interface SendMessageInput {
  type?: MessageType;
  content?: string;
  replyToId?: string;
  mentionUserIds?: string[];
  attachments?: (Omit<AttachmentUploadResult, 'fileSizeBytes'> & { fileSizeBytes: number })[];
}

export interface ChatMessageEvent {
  conversationId: string;
  message: Message;
}

export interface ChatEditedEvent {
  conversationId: string;
  message: Message;
}

export interface ChatDeletedEvent {
  conversationId: string;
  message: Message;
}

export interface ChatReactionEvent {
  conversationId: string;
  messageId: string;
  emoji: string;
  userId: string;
  action: 'added' | 'removed' | 'changed';
  previousEmoji?: string | null;
  reaction?: MessageReaction;
}

export interface ChatReadEvent {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}

export interface ChatTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatConversationUpdatedEvent {
  conversationId: string;
  conversation?: Conversation;
}

export type SidebarTab = 'active' | 'archived';

export interface ConversationInvite {
  id: string;
  conversationId: string;
  inviteCode: string;
  createdById: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface MemberSettings {
  id: string;
  conversationId: string;
  userId: string;
  isMuted: boolean;
  mutedUntil: string | null;
  nickname: string | null;
}

export interface MentionItem {
  id: string;
  mentionCreatedAt: string;
  conversationId: string;
  message: Message;
}

export interface MentionPage {
  mentions: MentionItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ChatPinnedEvent {
  conversationId: string;
  message: Message;
}

export interface ChatMemberEvent {
  conversationId: string;
  userId: string;
  action: 'added' | 'removed' | 'left';
  member?: ConversationMember;
}

export interface ChatConversationDeletedEvent {
  conversationId: string;
}
