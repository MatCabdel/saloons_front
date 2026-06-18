export type SaloonType = 'BAR' | 'DISCO' | 'PUBLIC' | 'SPORT' | 'LOISIRS' | 'TRAVAIL';

export const SALOON_TYPE_LABELS: Record<SaloonType, string> = {
  BAR: 'Bar',
  DISCO: 'Discothèque',
  PUBLIC: 'Lieu public',
  SPORT: 'Salle de sport',
  LOISIRS: 'Loisirs',
  TRAVAIL: 'École / Fac',
};

export type Saloon = {
  id: number;
  name: string;
  imgUrl: string;
  address: string;
  visitorNumber?: number;
  visitors?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  radiusMeters?: number | null;
  isActive?: boolean;
  isPrivate?: boolean;
  connectedCount?: number;
  type?: SaloonType;
  typeDisplayName?: string;
};
