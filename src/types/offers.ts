import type { CategoryOption, SelectOption } from "./publisherOnboarding";

export type RewardType = "PRODUCT" | "SERVICE" | "CASH" | "HYBRID";
export type OfferStatus = "ACTIVE" | "PAUSED" | "EXPIRED";

export type OfferImage = {
  id: string;
  storage_path: string;
  sort_order: number;
};

export type Offer = {
  id: string;
  business_id: string;
  category_id: string;
  title: string;
  description: string;
  reward_type: RewardType;
  retail_value: string | null;
  cash_amount: string | null;
  currency: string;
  units_per_deal: number;
  available_quantity: number;
  reserved_quantity: number;
  fulfillment_notes: string | null;
  remotely_fulfillable: boolean;
  expires_at: string | null;
  status: OfferStatus;
  images: OfferImage[];
  created_at: string;
  updated_at: string;
};

export type OfferWritePayload = {
  category_id: string;
  title: string;
  description: string;
  reward_type: RewardType;
  retail_value: string | null;
  cash_amount: string | null;
  currency: string;
  units_per_deal: number;
  available_quantity: number;
  fulfillment_notes: string | null;
  remotely_fulfillable: boolean;
  expires_at: string | null;
};

export type OfferOptions = {
  reward_types: SelectOption<RewardType>[];
  categories: CategoryOption[];
  currency: string;
  max_image_size_mb: number;
};

export type LocalOfferImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};
