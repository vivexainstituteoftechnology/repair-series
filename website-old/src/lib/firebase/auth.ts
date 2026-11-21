import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/client";

export function getAuthClient() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

export async function getIdTokenSafe(): Promise<string | null> {
  const auth = getAuthClient();
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}
