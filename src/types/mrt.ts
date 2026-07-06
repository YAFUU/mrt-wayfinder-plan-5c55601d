export type LineId = "blue" | "purple" | "yellow" | "pink" | "orange" | "brown";
export type LineStatus = "operational" | "under_construction" | "planned";

export interface DataSourceMetadata {
  sourceName: string;
  sourceType:
    | "mrta_public"
    | "operator_public"
    | "osm"
    | "open_data"
    | "manual_verified"
    | "demo_only";
  sourceUrl?: string;
  lastUpdated?: string;
  lastVerified?: string;
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

export interface MrtLine {
  id: LineId;
  code: string;
  nameTh: string;
  nameEn: string;
  color: string;
  operator: string;
  status: LineStatus;
  source: DataSourceMetadata;
}

export interface MrtStation {
  id: string; // e.g. "BL22"
  lineId: LineId;
  code: string; // "BL22"
  order: number;
  nameTh: string;
  nameEn: string;
  lat: number;
  lng: number;
  isInterchange?: boolean;
  interchangeWith?: string[]; // other station ids
  accessibility?: {
    elevator?: boolean;
    ramp?: boolean;
    tactile?: boolean;
  };
  operational: boolean;
  source: DataSourceMetadata;
}

export interface StationExit {
  stationId: string;
  exitCode: string; // "1", "2", "3A"
  nameTh?: string;
  nameEn?: string;
  hasElevator?: boolean;
  hasRamp?: boolean;
  nearbyPlaces?: string[];
  source: DataSourceMetadata;
}

export interface FareBand {
  minStations: number;
  maxStations: number;
  fare: number;
}

export interface FareRule {
  lineId: LineId;
  operator: string;
  baseFare: number;
  maxFare: number;
  fareBands: FareBand[];
  effectiveDate: string;
  source: DataSourceMetadata;
}

export interface NearbyPlace {
  id: string;
  nameTh: string;
  nameEn: string;
  category: "mall" | "hospital" | "university" | "landmark" | "office" | "tourism" | "transport";
  lat: number;
  lng: number;
  nearestStationId: string;
  suggestedExit?: string;
  walkingMeters: number;
  source: DataSourceMetadata;
}

export interface QueueDemo {
  stationId: string;
  queueStatus: "low" | "medium" | "high" | "very_high";
  estimatedWaitMinutes: number;
  activeMachines: number;
  totalMachines: number;
  trend: "up" | "down" | "stable";
  updatedAt: string;
}

export type TicketStatus =
  | "payment_pending"
  | "ready_to_enter"
  | "in_journey"
  | "completed"
  | "expired"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface Ticket {
  id: string;
  userId: string;
  originStationId: string;
  destinationStationId: string;
  passengerCount: number;
  amount: number;
  currency: string;
  status: TicketStatus;
  qrToken: string;
  validUntil: string;
  groupId?: string;
  passengerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  ticketIds: string[];
  provider: string;
  providerReference: string;
  method: "promptpay" | "card" | "banking" | "wallet";
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SavedTrip {
  id: string;
  userId: string;
  nickname: string;
  icon: string;
  originStationId: string;
  destinationStationId: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  ticketId?: string;
  issueType: string;
  message: string;
  referenceCode: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  isGuest: boolean;
  isAuthenticated?: boolean;
  email?: string;
  displayName: string;
  preferredLanguage: "th" | "en";
  fontSize: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reduceMotion: boolean;
  autoBrightnessOnQr: boolean;
  hasSeenTour?: boolean;
  walletBalance?: number;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "topup" | "spend" | "refund";
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export interface AuthAccount {
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
}
