const DEFAULT_API_URL = "http://10.215.160.133:8000/api/v1";

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      }
    );
  } catch {
    throw new Error(
      "ارتباط با سرور برقرار نشد. اتصال Wi-Fi و آدرس API را بررسی کنید."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Something went wrong"
    );
  }

  return data;
}
