import { apiRequest } from "./api";


export async function selectRole(
  token: string,
  role: "BUSINESS" | "PUBLISHER"
) {
  return apiRequest("/users/role", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      role,
    }),
  });
}
