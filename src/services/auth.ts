import { apiRequest } from "./api";


export async function registerUser(
  email: string,
  password: string
) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}


export async function loginUser(
  email: string,
  password: string
) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}


export async function getCurrentUser(
  token: string
) {
  return apiRequest("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
