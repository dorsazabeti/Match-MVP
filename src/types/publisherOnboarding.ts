export type PlatformValue =
  | "INSTAGRAM"
  | "TELEGRAM"
  | "YOUTUBE"
  | "RUBIKA"
  | "BALE"
  | "EITAA"
  | "OTHER";

export type ContentTypeValue =
  | "POST"
  | "STORY"
  | "REEL"
  | "VIDEO"
  | "SHORT_VIDEO"
  | "LIVE"
  | "UGC";

export type CapabilityValue =
  | "REVIEW"
  | "TUTORIAL"
  | "UGC"
  | "NEWS"
  | "LIFESTYLE"
  | "UNBOXING"
  | "INTERVIEW";

export type PublisherOnboardingStep =
  | "PROFILE"
  | "PLATFORM_ACCOUNTS"
  | "MEDIA_PLANS"
  | "PREFERENCES"
  | "COMPLETE";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type PublisherProfile = {
  id: string;
  user_id: string;
  public_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  discoverable: boolean;
  status: "ACTIVE" | "BLOCKED";
};

export type PlatformAccount = {
  id: string;
  publisher_id: string;
  platform: PlatformValue;
  handle: string;
  profile_url: string;
  followers_count: number;
  verification_status:
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED";
  verification_evidence_url: string | null;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
};

export type MediaPlan = {
  id: string;
  publisher_id: string;
  platform_account_id: string;
  content_type: ContentTypeValue;
  price: string;
  currency: string;
  typical_views: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublisherOnboardingOptions = {
  platforms: SelectOption<PlatformValue>[];
  content_types: SelectOption<ContentTypeValue>[];
  capabilities: SelectOption<CapabilityValue>[];
  categories: CategoryOption[];
  currency: string;
};

export type PublisherOnboardingStatus = {
  profile_exists: boolean;
  base_profile_complete: boolean;
  active_platform_accounts: number;
  active_media_plans: number;
  interests_count: number;
  capabilities_count: number;
  discoverable: boolean;
  next_step: PublisherOnboardingStep;
  missing_requirements: string[];
};
