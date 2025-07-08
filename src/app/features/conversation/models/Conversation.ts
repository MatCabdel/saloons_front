import { User } from "../../user/models/user";

export type LastMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
};

export type Conversation = {
    id: number;
    participants: User[];
    lastMessage: LastMessage;
    lastMessageDate: string;
  };