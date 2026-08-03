export type MatchUser = {
  id: number;
  userName: string;
  imgUrl: string;
  profileImageUpdatedAt?: string | null;
  matchedAt: string | null;
  sessionExpired: boolean;
  sessionEndedAt: string | null;
  heartWindowExpiresAt: string | null;
  heartConfirmed: boolean;
};
