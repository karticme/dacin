export { cn } from "cnfast";
export { fetchAndCacheProfile, getProfile, clearProfileCache } from "@/lib/profile";

export const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform?.toLowerCase().includes("mac");
