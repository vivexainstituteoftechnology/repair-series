import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./firebase";
import { DEFAULT_API_BASE_URL, NETWORK_LAN_API_URL } from "../config/env";

const API_OVERRIDE_KEY = "rs_partner_api_base_url";

export async function getApiBaseUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(API_OVERRIDE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_API_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_OVERRIDE_KEY, url.trim());
}

export async function resetApiBaseUrl(): Promise<void> {
  await AsyncStorage.removeItem(API_OVERRIDE_KEY);
}

async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

interface RequestOptions extends RequestInit {
  data?: unknown;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  let baseUrl = await getApiBaseUrl();
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      body: options.data ? JSON.stringify(options.data) : options.body,
    });
  } catch (err) {
    // If Android emulator or local host fails, try LAN IP fallback if different
    if (baseUrl !== NETWORK_LAN_API_URL) {
      try {
        const fallbackUrl = `${NETWORK_LAN_API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
        res = await fetch(fallbackUrl, {
          ...options,
          headers,
          body: options.data ? JSON.stringify(options.data) : options.body,
        });
        // Cache working LAN URL
        await setApiBaseUrl(NETWORK_LAN_API_URL);
      } catch {
        throw new Error(
          `Unable to connect to Repair Series server (${url}). Please check your internet or network connection.`,
        );
      }
    } else {
      throw new Error(
        `Unable to connect to Repair Series server (${url}). Please check your internet or network connection.`,
      );
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      json?.error ||
      json?.message ||
      `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).code = json?.code;
    throw error;
  }

  return json;
}

export const PartnerApi = {
  resolveIdentity: (displayName?: string) =>
    apiRequest("/api/auth/resolve-identity", {
      method: "POST",
      data: { role: "partner", displayName },
    }),

  respondAssignment: (bookingId: string, action: "accept" | "decline" | "timeout") =>
    apiRequest("/api/bookings/assignment-response", {
      method: "POST",
      data: { bookingId, action },
    }),

  startJob: (bookingId: string, otp: string) =>
    apiRequest("/api/bookings/start-job", {
      method: "POST",
      data: { bookingId, otp },
    }),

  collectCash: (bookingId: string) =>
    apiRequest("/api/bookings/collect-cash", {
      method: "POST",
      data: { bookingId },
    }),

  getWallet: () =>
    apiRequest("/api/partners/wallet", {
      method: "GET",
    }),

  requestPayout: (amountRupees: number) =>
    apiRequest("/api/partners/payout-request", {
      method: "POST",
      data: { amountRupees },
    }),

  submitSettlement: (data: {
    settlementDate?: string;
    amountPaise: number;
    paymentReference?: string;
    proofUrl?: string;
  }) =>
    apiRequest("/api/partners/settlements/submit", {
      method: "POST",
      data,
    }),

  submitKyc: (data: unknown) =>
    apiRequest("/api/partners/kyc/submit", {
      method: "POST",
      data: { ...(data as object), action: "submit" },
    }),

  saveKycDraft: (data: unknown) =>
    apiRequest("/api/partners/kyc/submit", {
      method: "POST",
      data: { ...(data as object), action: "save-draft" },
    }),

  getDistance: (originLat: number, originLng: number, destLat: number, destLng: number) =>
    apiRequest(`/api/maps/distance?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`, {
      method: "GET",
    }),
};
