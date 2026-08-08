import { apiRequest } from "./api";
import type {
  CapabilityValue,
  CategoryOption,
  ContentTypeValue,
  MediaPlan,
  PlatformAccount,
  PlatformValue,
  PublisherOnboardingOptions,
  PublisherOnboardingStatus,
  PublisherOnboardingStep,
  PublisherProfile,
} from "../types/publisherOnboarding";


function authenticatedHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}


export function getPublisherOnboardingRoute(
  step: PublisherOnboardingStep
) {
  const routes = {
    PROFILE: "/publisher",
    PLATFORM_ACCOUNTS: "/publisher-platforms",
    MEDIA_PLANS: "/publisher-media-plans",
    PREFERENCES: "/publisher-preferences",
    COMPLETE: "/publisher",
  } as const;

  return routes[step];
}


export async function getPublisherOnboardingOptions(
  token: string
): Promise<PublisherOnboardingOptions> {
  return apiRequest("/profiles/publisher/onboarding-options", {
    headers: authenticatedHeaders(token),
  });
}


export async function getPublisherOnboardingStatus(
  token: string
): Promise<PublisherOnboardingStatus> {
  return apiRequest("/profiles/publisher/onboarding-status", {
    headers: authenticatedHeaders(token),
  });
}


export async function getPublisherProfile(
  token: string
): Promise<PublisherProfile> {
  return apiRequest("/profiles/publisher/me", {
    headers: authenticatedHeaders(token),
  });
}


export async function createPublisherBaseProfile(
  token: string,
  data: {
    public_name: string;
    bio: string;
    city: string;
    avatar_url?: string;
  }
): Promise<PublisherProfile> {
  return apiRequest("/profiles/publisher", {
    method: "POST",
    headers: authenticatedHeaders(token),
    body: JSON.stringify(data),
  });
}


export async function updatePublisherProfile(
  token: string,
  data: {
    public_name?: string;
    bio?: string;
    city?: string;
    avatar_url?: string | null;
  }
): Promise<PublisherProfile> {
  return apiRequest("/profiles/publisher/me", {
    method: "PATCH",
    headers: authenticatedHeaders(token),
    body: JSON.stringify(data),
  });
}


export async function listPlatformAccounts(
  token: string
): Promise<PlatformAccount[]> {
  return apiRequest("/profiles/publisher/platform-accounts", {
    headers: authenticatedHeaders(token),
  });
}


export async function createPlatformAccount(
  token: string,
  data: {
    platform: PlatformValue;
    handle: string;
    profile_url: string;
    followers_count: number;
  }
): Promise<PlatformAccount> {
  return apiRequest("/profiles/publisher/platform-accounts", {
    method: "POST",
    headers: authenticatedHeaders(token),
    body: JSON.stringify(data),
  });
}


export async function updatePlatformAccount(
  token: string,
  accountId: string,
  data: {
    platform?: PlatformValue;
    handle?: string;
    profile_url?: string;
    followers_count?: number;
    status?: "ACTIVE" | "INACTIVE";
  }
): Promise<PlatformAccount> {
  return apiRequest(
    `/profiles/publisher/platform-accounts/${accountId}`,
    {
      method: "PATCH",
      headers: authenticatedHeaders(token),
      body: JSON.stringify(data),
    }
  );
}


export async function deletePlatformAccount(
  token: string,
  accountId: string
) {
  return apiRequest(
    `/profiles/publisher/platform-accounts/${accountId}`,
    {
      method: "DELETE",
      headers: authenticatedHeaders(token),
    }
  );
}


export async function listMediaPlans(
  token: string
): Promise<MediaPlan[]> {
  return apiRequest("/profiles/publisher/media-plans", {
    headers: authenticatedHeaders(token),
  });
}


export async function createMediaPlan(
  token: string,
  data: {
    platform_account_id: string;
    content_type: ContentTypeValue;
    price: string;
    typical_views?: number;
  }
): Promise<MediaPlan> {
  return apiRequest("/profiles/publisher/media-plans", {
    method: "POST",
    headers: authenticatedHeaders(token),
    body: JSON.stringify(data),
  });
}


export async function updateMediaPlan(
  token: string,
  mediaPlanId: string,
  data: {
    platform_account_id?: string;
    content_type?: ContentTypeValue;
    price?: string;
    typical_views?: number | null;
    active?: boolean;
  }
): Promise<MediaPlan> {
  return apiRequest(
    `/profiles/publisher/media-plans/${mediaPlanId}`,
    {
      method: "PATCH",
      headers: authenticatedHeaders(token),
      body: JSON.stringify(data),
    }
  );
}


export async function deleteMediaPlan(
  token: string,
  mediaPlanId: string
) {
  return apiRequest(
    `/profiles/publisher/media-plans/${mediaPlanId}`,
    {
      method: "DELETE",
      headers: authenticatedHeaders(token),
    }
  );
}


export async function getPublisherInterests(
  token: string
): Promise<{ categories: CategoryOption[] }> {
  return apiRequest("/profiles/publisher/interests", {
    headers: authenticatedHeaders(token),
  });
}


export async function replacePublisherInterests(
  token: string,
  categoryIds: string[]
): Promise<{ categories: CategoryOption[] }> {
  return apiRequest("/profiles/publisher/interests", {
    method: "PUT",
    headers: authenticatedHeaders(token),
    body: JSON.stringify({ category_ids: categoryIds }),
  });
}


export async function getPublisherCapabilities(
  token: string
): Promise<{ capabilities: CapabilityValue[] }> {
  return apiRequest("/profiles/publisher/capabilities", {
    headers: authenticatedHeaders(token),
  });
}


export async function replacePublisherCapabilities(
  token: string,
  capabilities: CapabilityValue[]
): Promise<{ capabilities: CapabilityValue[] }> {
  return apiRequest("/profiles/publisher/capabilities", {
    method: "PUT",
    headers: authenticatedHeaders(token),
    body: JSON.stringify({ capabilities }),
  });
}
