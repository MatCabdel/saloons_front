import { User } from '../../user/models/user';

export type Message = {
  id: number;
  conversationId: number;
  sender: number;
  senderName: string;
  content: string;
  sentAt: string;
};

export type Conversation = {
  id: number;
  participants: User[];
  lastMessage: Message;
  lastMessageDate: string;
};
