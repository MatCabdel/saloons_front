export type Saloon = {
  id: number;
  name: string;
  imgUrl: string;
  address: string;
  visitorNumber?: number; // Nombre de visiteurs depuis le backend
  visitors?: number; // Alias pour compatibilité
  latitude?: number;
  longitude?: number;
  city?: string;
  radiusMeters?: number;
  isActive?: boolean;
  connectedCount?: number; // Nombre d'utilisateurs actuellement connectés
};
