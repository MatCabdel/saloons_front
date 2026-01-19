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
  placeName: string;
  placeType: PlaceType;
  address: string;
  comment?: string;
  userId?: number;
  userEmail?: string;
  status?: SaloonDemandeStatus;
  createdAt?: Date;
};

export enum PlaceType {
  BAR_RESTAURANT = 'BAR_RESTAURANT',
  NIGHTCLUB = 'NIGHTCLUB',
  PUBLIC_PLACE = 'PUBLIC_PLACE',
  LEISURE = 'LEISURE',
  WORK = 'WORK',
}

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  [PlaceType.BAR_RESTAURANT]: 'Bar / Restaurant',
  [PlaceType.NIGHTCLUB]: 'Discothèque',
  [PlaceType.PUBLIC_PLACE]: 'Lieu public (parc, quai, place...)',
  [PlaceType.LEISURE]: 'Loisirs (salle de sport, cinéma, bowling...)',
  [PlaceType.WORK]: 'Travail (coworking, entreprise, campus...)',
};

export enum SaloonDemandeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
