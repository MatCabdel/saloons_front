export enum ReportReason {
  INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR',
  UNWANTED_PHYSICAL_CONTACT = 'UNWANTED_PHYSICAL_CONTACT',
  HARASSMENT = 'HARASSMENT',
  FAKE_PROFILE = 'FAKE_PROFILE',
  OTHER = 'OTHER',
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.INAPPROPRIATE_BEHAVIOR]: 'Comportement inapproprié',
  [ReportReason.UNWANTED_PHYSICAL_CONTACT]: 'Interaction physique non voulue',
  [ReportReason.HARASSMENT]: 'Harcèlement',
  [ReportReason.FAKE_PROFILE]: 'Faux profil',
  [ReportReason.OTHER]: 'Autre',
};

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: 'En attente',
  [ReportStatus.REVIEWED]: 'Examiné',
  [ReportStatus.RESOLVED]: 'Résolu',
  [ReportStatus.DISMISSED]: 'Rejeté',
};

export type ReporterDTO = {
  id: number;
  userName: string;
  imgUrl: string;
  profileImageUpdatedAt?: string | null;
  city: string;
  email: string;
};

export type ReportedDTO = {
  id: number;
  userName: string;
  imgUrl: string;
  profileImageUpdatedAt?: string | null;
  city: string;
  email: string;
};

export type SaloonInfoDTO = {
  id: number;
  name: string;
  city: string;
};

export type Report = {
  id: number;
  reporter: ReporterDTO;
  reported: ReportedDTO;
  saloon: SaloonInfoDTO | null;
  reason: ReportReason;
  reasonDisplayName: string;
  description: string | null;
  status: ReportStatus;
  statusDisplayName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateReportDTO = {
  reportedId: number;
  saloonId?: number;
  reason: ReportReason;
  description?: string;
};
