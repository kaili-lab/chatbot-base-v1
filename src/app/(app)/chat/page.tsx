import type { Metadata } from "next";

import { ChatWorkspace } from "./chat-workspace";
import {
  getChatConversationData,
  getChatConversations,
  getChatSettingsSummary,
  requireChatUserId,
} from "./data";

export const metadata: Metadata = { title: "Chat - Chatbot Base" };

type ChatPageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const userId = await requireChatUserId();
  const resolvedParams = searchParams ? await searchParams : {};
  const conversationId = resolvedParams?.id ?? null;

  const [conversations, settings, conversationData] = await Promise.all([
    getChatConversations(userId),
    getChatSettingsSummary(userId),
    getChatConversationData(userId, conversationId),
  ]);

  return (
    <ChatWorkspace
      conversations={conversations}
      activeConversation={conversationData.conversation}
      initialMessages={conversationData.messages}
      lastMessageAt={conversationData.lastMessageAt}
      settings={settings}
    />
  );
}
