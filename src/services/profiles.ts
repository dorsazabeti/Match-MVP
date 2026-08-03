import { apiRequest } from "./api";


export async function createBusinessProfile(
  token: string,
  data: {
    name: string;
    category: string;
    description?: string;
    city?: string;
    logo_url?: string;
    contact_phone?: string;
    contact_email?: string;
  }
) {
  return apiRequest("/profiles/business", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}


export async function createPublisherProfile(
  token: string,
  data: {
    public_name: string;
    bio: string;
    city: string;
    avatar_url?: string;
    platforms?: object;
    followers_count?: number;
    content_capabilities?: object;
    personal_interests?: object;
  }
) {
  return apiRequest("/profiles/publisher", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
