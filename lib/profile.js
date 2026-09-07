import { fetchTelegramProfile } from "@/lib/telegram";
import { getItem, removeItem, setItem } from "@/lib/indexdb-utils";

const DATABASE_NAME = "dacin-profile";
const PROFILE_KEY = "current";

/**
 * Fetches the user profile from Telegram and caches details + avatar in IndexedDB.
 */
export async function fetchAndCacheProfile() {
  const { photoBytes, ...details } = await fetchTelegramProfile();
  const photo = photoBytes?.length
    ? new Blob([new Uint8Array(photoBytes)], { type: "image/jpeg" })
    : null;

  await setItem(DATABASE_NAME, PROFILE_KEY, { details, photo });
}

/**
 * Retrieves the cached user profile with photo object URL.
 * @returns {Promise<Object|null>}
 */
export async function getProfile() {
  const profile = await getItem(DATABASE_NAME, PROFILE_KEY);
  if (!profile) return null;

  return {
    ...profile.details,
    photoUrl: profile.photo ? URL.createObjectURL(profile.photo) : null,
  };
}

/**
 * Clears cached profile from IndexedDB.
 */
export function clearProfileCache() {
  return removeItem(DATABASE_NAME, PROFILE_KEY);
}
