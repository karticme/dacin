"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toastManager } from "@/components/ui/toast";
import { Hugeicons } from "@/lib/utils";
import { WifiOff01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function Offline() {
  const router = useRouter();

  useEffect(() => {
    const hO = () => {
      router.push("/hub");
      toast();
    };
    window.addEventListener("online", hO);
    return () => window.removeEventListener("online", hO);
  }, []);

  function handleRefresh() {
    if (navigator.onLine) {
      router.push("/hub");
      toast();
    } else {
      router.refresh();
    }
  }

  const toast = () =>
    toastManager.add({
      id: "internet-connection",
      type: "success",
      title: "Connection Restored. You are now online.",
    });

  return (
    <Empty className="h-full">
      <EmptyHeader>
        <div className="scale-150">
          <EmptyMedia variant="icon">
            <Hugeicons icon={WifiOff01Icon} className="text-warning" />
          </EmptyMedia>
        </div>
        <EmptyTitle>No Internet Connection</EmptyTitle>
        <EmptyDescription>
          You are currently offline. Please check your internet connection and
          try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  );
}
