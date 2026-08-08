import { apiRequest } from "./api";
import type {
  Promotion,
  PromotionOptions,
  PromotionWritePayload,
  Recommendation,
} from "../types/promotions";


function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}


export function getPromotionOptions(): Promise<PromotionOptions> {
  return apiRequest("/promotions/options");
}


export function createPromotion(
  token: string,
  offerId: string,
  data: PromotionWritePayload
): Promise<Promotion> {
  return apiRequest(`/offers/${offerId}/promotions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}


export function listPromotions(
  token: string,
  offerId?: string
): Promise<{ items: Promotion[]; total: number }> {
  const query = offerId ? `?offer_id=${encodeURIComponent(offerId)}` : "";
  return apiRequest(`/promotions${query}`, {
    headers: authHeaders(token),
  });
}


export function getPromotion(
  token: string,
  promotionId: string
): Promise<Promotion> {
  return apiRequest(`/promotions/${promotionId}`, {
    headers: authHeaders(token),
  });
}


export function listRecommendations(
  token: string,
  promotionId: string
): Promise<{ items: Recommendation[]; total: number }> {
  return apiRequest(`/promotions/${promotionId}/recommendations`, {
    headers: authHeaders(token),
  });
}


export function getRecommendation(
  token: string,
  recommendationId: string
): Promise<Recommendation> {
  return apiRequest(`/recommendations/${recommendationId}`, {
    headers: authHeaders(token),
  });
}
export function invitePublisher(
  token: string,
  recommendationId: string,
  message?: string
) {
  return apiRequest(`/recommendations/${recommendationId}/invite`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });
}
