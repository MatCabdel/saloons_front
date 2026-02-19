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
  lastMessage: Message | null;
  lastMessageDate: string;
  otherParticipantLeft: boolean;
  isPermanent: boolean;
  expiredAt: string | null;
  isMatchCancelled: boolean; // true si match annulé, false si juste quitté le saloon
  unreadCount: number; // Nombre de messages non lus
  isHeartWindowExpired: boolean; // true si la fenêtre 12h pour envoyer un coup de cœur est expirée
};

export type HeartRequestStatus = {
  sentByMe: boolean;
  receivedFromOther: boolean;
  isPermanent: boolean;
  canSend: boolean;
  expiresAt: string | null;
  conversationExpiredAt: string | null;
};

export type SendHeartRequest = {
  conversationId: number;
  receiverId: number;
  saloonId: number | null;
};

export type HeartRequest = {
  id: number;
  senderId: number;
  senderUserName: string;
  receiverId: number;
  receiverUserName: string;
  conversationId: number;
  saloonId: number | null;
  saloonName: string | null;
  createdAt: string;
  isMutual: boolean;
};
