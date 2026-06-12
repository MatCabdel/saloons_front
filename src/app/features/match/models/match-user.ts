export type MatchUser = {
  id: number;
  userName: string;
  imgUrl: string;
  profileImageUpdatedAt?: string | null;
  matchedAt: string | null;
  sessionExpired: boolean;
};
