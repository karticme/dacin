"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HubSidebar from "@/components/hub-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAuthorized } from "@/lib/telegram";
import ActionBar from "@/components/action-bar";

export default function Layout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    let active = true;

    async function guardRoute() {
      try {
        const authenticated = await isAuthorized();
        if (!active) return;
        if (!authenticated) {
          router.replace("/");
          return;
        }
        setAuthorized(true);
      } catch {
        if (active) router.replace("/");
      }
    }

    guardRoute();
    return () => {
      active = false;
    };
  }, [router]);

  if (authorized !== true) return null;

  return (
    <SidebarProvider>
      <HubSidebar />
      <SidebarInset>
        <ActionBar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
