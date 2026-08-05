import Constants from "expo-constants";
import { Platform } from "react-native";


function getDevelopmentApiUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000/api/v1`;
  }

  const metroHostUri = Constants.expoConfig?.hostUri;
  if (metroHostUri) {
    try {
      const metroUrl = new URL(
        metroHostUri.includes("://")
          ? metroHostUri
          : `http://${metroHostUri}`
      );
      return `http://${metroUrl.hostname}:8000/api/v1`;
    } catch {
      // Simulator fallback below. Production must provide EXPO_PUBLIC_API_URL.
    }
  }

  return "http://127.0.0.1:8000/api/v1";
}


const DEFAULT_API_URL = getDevelopmentApiUrl();

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}


export function resolveApiAssetUrl(storagePath: string) {
  if (/^https?:\/\//i.test(storagePath)) {
    return storagePath;
  }
  const serverOrigin = API_URL.replace(/\/api\/v1$/, "");
  const normalizedPath = storagePath.replace(/^\/+/, "");
  return `${serverOrigin}/uploads/${normalizedPath}`;
}


export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const isFormData = typeof FormData !== "undefined"
    && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "پاسخی از سرور دریافت نشد. مطمئن شوید FastAPI روشن است و گوشی و مک روی یک Wi-Fi هستند."
      );
    }
    throw new Error(
      "ارتباط با سرور برقرار نشد. اتصال Wi-Fi و آدرس API را بررسی کنید."
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return null as T;
  }

  const responseBody = await response.text();
  let data: any = null;
  if (responseBody) {
    try {
      data = JSON.parse(responseBody);
    } catch {
      data = responseBody;
    }
  }

  if (!response.ok) {
    let message = "درخواست انجام نشد. دوباره تلاش کنید.";
    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail[0]?.msg || message;
    } else if (typeof data?.error?.message === "string") {
      message = data.error.message;
    }
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
