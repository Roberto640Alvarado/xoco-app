export interface OdooConfigStatus {
  apiKeyMasked: string;
  uid: number;
  durationDays: number;
  expiresAt: string;
  isExpired: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface RotateOdooConfigPayload {
  apiKey: string;
  uid: number;
  durationDays: number;
}

export interface OdooConfigHistoryItem {
  id: string;
  apiKeyMasked: string;
  uid: number;
  durationDays: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  isExpired: boolean;
  createdByEmail: string | null;
}
