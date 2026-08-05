import { apiRequest } from "./api";
import { Platform } from "react-native";
import type {
  LocalOfferImage,
  Offer,
  OfferImage,
  OfferOptions,
  OfferStatus,
  OfferWritePayload,
} from "../types/offers";


function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}


export function getOfferOptions(): Promise<OfferOptions> {
  return apiRequest("/offers/options");
}


export function listOffers(
  token: string,
  status?: OfferStatus
): Promise<{ items: Offer[]; total: number }> {
  const query = status ? `?status=${status}` : "";
  return apiRequest(`/offers${query}`, {
    headers: authHeaders(token),
  });
}


export function getOffer(token: string, offerId: string): Promise<Offer> {
  return apiRequest(`/offers/${offerId}`, {
    headers: authHeaders(token),
  });
}


export function createOffer(
  token: string,
  data: OfferWritePayload
): Promise<Offer> {
  return apiRequest("/offers", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}


export function updateOffer(
  token: string,
  offerId: string,
  data: OfferWritePayload
): Promise<Offer> {
  return apiRequest(`/offers/${offerId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}


export function setOfferStatus(
  token: string,
  offerId: string,
  action: "pause" | "activate" | "expire"
): Promise<Offer> {
  return apiRequest(`/offers/${offerId}/${action}`, {
    method: "POST",
    headers: authHeaders(token),
  });
}


export async function uploadOfferImage(
  token: string,
  offerId: string,
  image: LocalOfferImage
): Promise<OfferImage> {
  const formData = new FormData();
  if (Platform.OS === "web") {
    const blob = await fetch(image.uri).then((response) => response.blob());
    formData.append("image", blob, image.fileName);
  } else {
    formData.append("image", {
      uri: image.uri,
      type: image.mimeType,
      name: image.fileName,
    } as unknown as Blob);
  }

  return apiRequest<OfferImage>(`/offers/${offerId}/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
}


export function deleteOfferImage(
  token: string,
  offerId: string,
  imageId: string
) {
  return apiRequest(`/offers/${offerId}/images/${imageId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
