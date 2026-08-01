"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/telegram";

export default function Hub() {
  return (
    <div>
      <Button
        onClick={() => {
          signOut();
          window.location.reload();
        }}
      >
        Logout
      </Button>
    </div>
  );
}
