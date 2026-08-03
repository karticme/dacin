"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn, Hugeicons, isMac } from "@/lib/utils";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuShortcut,
} from "@/components/ui/menu";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ThemeToggle } from "@/components/theme-provider";
import { KeyboardIcon } from "@hugeicons/core-free-icons";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { signOut } from "@/lib/telegram";
import { clearProfileCache, getProfile } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HubSidebar({ ...props }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((profile) => setProfile(profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await signOut();
    await clearProfileCache();
    window.location.reload();
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="relative h-10 flex-row items-center pl-20.5">
        {loading ? (
          <>
            <Skeleton className="shrink-0 size-6" />
            <Skeleton className="w-full h-5" />
          </>
        ) : (
          <>
            {profile && (
              <Avatar className="shrink-0 size-6 rounded-md border">
                <AvatarImage src={profile?.photoUrl} draggable={false} />
                <AvatarFallback>
                  {profile?.fullName && profile.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <p className="truncate text-sidebar-primary text-sm font-medium">
                {profile?.firstName
                  ? profile.firstName + "'s Dacin"
                  : "Dacin User"}
              </p>
            </div>
          </>
        )}
        <div
          className="absolute inset-0 z-10 tauri-drag-region"
          data-tauri-drag-region
        />
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {loading ? (
            <div className="flex items-center gap-2 p-0.5">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="w-28 h-4.5" />
                <Skeleton className="w-18 h-3" />
              </div>
              <Skeleton className="size-7 ml-auto" />
            </div>
          ) : (
            <SidebarMenuItem
              className={cn(profile && "flex items-center gap-2")}
            >
              {profile && (
                <>
                  {profile && (
                    <Avatar className="size-10 rounded-lg border">
                      <AvatarImage src={profile?.photoUrl} draggable={false} />
                      <AvatarFallback>
                        {profile?.fullName && profile.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="min-w-0 space-y-0.5 [&>p]:truncate">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {"@" + profile?.username}
                    </p>
                  </div>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      className={cn(
                        "aria-expanded:bg-sidebar-accent",
                        profile && "size-8 ml-auto",
                      )}
                      size={profile ? "sm" : "default"}
                    />
                  }
                >
                  <Hugeicons icon={Settings01Icon} />
                  {!profile && (
                    <>
                      Settings{" "}
                      <Hugeicons
                        icon={ArrowRight01Icon}
                        className="ml-auto group-aria-expanded/menu-button:-rotate-90 transition-transform ease-in-out duration-300"
                      />
                    </>
                  )}
                </DropdownMenuTrigger>
                <MenuPopup sideOffset={10} align="end" className="w-67 md:w-59">
                  {profile && profile?.phone && (
                    <>
                      <MenuGroup>
                        <MenuGroupLabel>Phone Number</MenuGroupLabel>
                        <MenuGroupLabel className="text-sm font-normal text-foreground tracking-wider -mt-2.5">
                          {"+" + profile?.phone}
                        </MenuGroupLabel>
                      </MenuGroup>
                      <MenuSeparator />
                    </>
                  )}
                  <ThemeToggle />
                  <MenuItem>
                    <Hugeicons icon={KeyboardIcon} /> Shortcuts
                    <MenuShortcut>
                      {isMac ? "\u2303\u21E7/" : "Ctrl+Shift+/"}
                    </MenuShortcut>
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem variant="destructive" onClick={handleLogout}>
                    <Hugeicons icon={Logout01Icon} /> Logout
                  </MenuItem>
                </MenuPopup>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
