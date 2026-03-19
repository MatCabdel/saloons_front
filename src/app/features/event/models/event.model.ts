export type EventItem = {
  id: number;
  title: string;
  subTitle?: string;
  imageUrl: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  saloonId: number;
  saloonName: string;
  saloonImgUrl?: string;
  saloonAddress?: string;
  saloonCity?: string;
  saloonLatitude?: number;
  saloonLongitude?: number;
  saloonRadiusMeters?: number;
  saloonType?: string;
  saloonIsPrivate?: boolean;
  interestedCount?: number;
  isInterested?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
};

export type EventPeriod = 'today' | 'week' | 'month' | 'all';

/** Spring Page<EventDTO> response shape */
export type PagedEvents = {
  content: EventItem[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
};
