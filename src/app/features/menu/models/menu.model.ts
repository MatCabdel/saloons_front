export type MenuItem = {
  id: string;
  label: string;
  icon: string;
  route: string;
  order: number;
};

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
};

export type ContactForm = {
  subject: string;
  message: string;
  email?: string;
};

export type ContactResponse = {
  success: boolean;
  message: string;
  ticketId?: string;
};

export type SaloonDemande = {
  id?: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  email?: string;
  status?: SaloonDemandeStatus;
  createdAt?: Date;
};

export enum SaloonDemandeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
