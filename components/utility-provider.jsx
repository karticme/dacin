"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toastManager } from "@/components/ui/toast";

export function UtilityProvider() {
  const router = useRouter();
  const { theme, systemTheme, setTheme } = useTheme();

  const handleChange = () => {
    const changeTheme = (t) =>
      t === "light" ? setTheme("dark") : setTheme("light");
    theme === "system" ? changeTheme(systemTheme) : changeTheme(theme);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key?.toLowerCase() !== "d" || event.repeat) {
        return;
      }

      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      if (
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
        return;
      }

      event.preventDefault();
      handleChange();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [theme]);

  useEffect(() => {
    const handleOffline = () => {
      router.push("/offline");
      toastManager.add({
        id: "internet-connection",
        type: "warning",
        title: "You are offline. Check your internet connection.",
      });
    };

    window.addEventListener("offline", handleOffline);
  }, []);

  return <span className="hidden fixed" />;
}
