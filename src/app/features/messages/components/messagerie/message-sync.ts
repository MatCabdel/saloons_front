import { Message } from '../../../conversation/models/Conversation';

export function mergeAndSortMessages(
  currentMessages: Message[],
  incomingMessages: (Message | (Partial<Message> & { senderId?: number }))[],
  fallbackConversationId: number | null
): Message[] {
  const byId = new Map<number, Message>();

  [...currentMessages, ...incomingMessages].forEach(raw => {
    const normalizedRaw = raw as Partial<Message> & { senderId?: number };
    const message: Message = {
      ...(raw as Message),
      id: Number(raw.id),
      conversationId: Number(raw.conversationId ?? fallbackConversationId),
      sender: Number(normalizedRaw.sender ?? normalizedRaw.senderId),
    };
    byId.set(message.id, message);
  });

  return [...byId.values()].sort((first, second) => {
    const timeDifference = new Date(first.sentAt).getTime() - new Date(second.sentAt).getTime();
    return timeDifference || first.id - second.id;
  });
}
