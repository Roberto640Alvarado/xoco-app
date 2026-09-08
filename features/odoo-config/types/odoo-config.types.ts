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
