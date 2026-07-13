'use client';

import { useParams } from 'next/navigation';
import { ChatPanel } from '../_components/chat-panel';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  return <ChatPanel key={params.id} conversationId={params.id} />;
}
