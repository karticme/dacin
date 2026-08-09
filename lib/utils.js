import { fetchTelegramProfile } from "@/lib/telegram";
import { getItem, removeItem, setItem } from "@/lib/indexdb-utils";

export { cn } from "cnfast";

// profile caching
const DATABASE_NAME = "dacin-profile";
const PROFILE_KEY = "current";

export async function fetchAndCacheProfile() {
  const { photoBytes, ...details } = await fetchTelegramProfile();
  const photo = photoBytes?.length
    ? new Blob([new Uint8Array(photoBytes)], { type: "image/jpeg" })
    : null;

  await setItem(DATABASE_NAME, PROFILE_KEY, { details, photo });
}

export async function getProfile() {
  const profile = await getItem(DATABASE_NAME, PROFILE_KEY);
  if (!profile) return null;

  return {
    ...profile.details,
    photoUrl: profile.photo ? URL.createObjectURL(profile.photo) : null,
  };
}

export function clearProfileCache() {
  return removeItem(DATABASE_NAME, PROFILE_KEY);
}

export const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform?.toLowerCase().includes("mac");
