import type { SelectOption } from "./publisherOnboarding";

export type PromotionGoal =
  | "AWARENESS"
  | "ENGAGEMENT"
  | "CONTENT"
  | "TRAFFIC"
  | "SALES";
export type PromotionStatus =
  | "GENERATING"
  | "READY"
  | "PAUSED"
  | "FILLED"
  | "EXPIRED";
export type RecommendationStatus =
  | "AVAILABLE"
  | "INVITED"
  | "DISMISSED"
  | "UNAVAILABLE";
export type PromotionPlatform =
  | "INSTAGRAM"
  | "TELEGRAM"
  | "YOUTUBE"
  | "RUBIKA"
  | "BALE"
  | "EITAA"
  | "OTHER";

export type PromotionWritePayload = {
  goal: PromotionGoal;
  target_city: string | null;
  preferred_platforms: PromotionPlatform[];
  desired_deals: number;
  invitation_expiry_hours: number;
  content_deadline_days: number;
  brief: string | null;
};

export type Promotion = PromotionWritePayload & {
  id: string;
  business_id: string;
  offer_id: string;
  active_deals_count: number;
  status: PromotionStatus;
  recommendation_count: number;
  created_at: string;
  updated_at: string;
};

export type PromotionOptions = {
  goals: SelectOption<PromotionGoal>[];
  platforms: SelectOption<PromotionPlatform>[];
  default_invitation_expiry_hours: number;
  default_content_deadline_days: number;
  maximum_cash_deals: number;
};

export type RecommendationPlatform = {
  platform: PromotionPlatform;
  handle: string;
  followers_count: number;
  verification_status: string;
};

export type RecommendationMediaPlan = {
  id: string;
  platform: PromotionPlatform;
  content_type: string;
  price: string;
  currency: string;
  typical_views: number | null;
};

export type ScoreFactor = {
  score: number;
  maximum: number;
  matched?: boolean | string[];
};

export type Recommendation = {
  id: string;
  promotion_id: string;
  publisher_id: string;
  publisher_public_name: string;
  publisher_city: string;
  publisher_bio: string | null;
  publisher_avatar_url: string | null;
  platforms: RecommendationPlatform[];
  best_media_plan: RecommendationMediaPlan;
  score: string;
  factors: {
    algorithm_version: string;
    interest: ScoreFactor;
    value_fit: ScoreFactor & {
      reward_value: string;
      media_plan_price: string;
      ratio: string;
    };
    location: ScoreFactor;
    platform: ScoreFactor;
    capability: ScoreFactor;
  };
  package: Record<string, unknown> | null;
  explanation: string;
  confidence: string;
  status: RecommendationStatus;
  created_at: string;
};
