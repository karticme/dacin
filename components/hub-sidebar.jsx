"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn, Hugeicons } from "@/lib/utils";
import {
  HardDriveIcon,
  KeyboardIcon,
  LockKeyIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
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
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { signOut } from "@/lib/telegram";
import { clearProfileCache, getProfile } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import SearchUploadTray from "./search-upload-tray";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";
import AddChannelModal from "@/components/models/add-channel";
import ShortcutsModal from "./models/shortcuts";
import { isMac } from "@/lib/utils";

export default function HubSidebar({ ...props }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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
      <SidebarHeader>
        <div className="relative flex items-center gap-2 pl-18.5">
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
            className="absolute h-10 inset-x-0 z-10 tauri-drag-region"
            data-tauri-drag-region
          />
        </div>
        <SearchUploadTray disabled={loading} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel>Channels</SidebarGroupLabel>
          <AddChannelModal />
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Hugeicons icon={HardDriveIcon} /> Personal Photos
                  <SidebarMenuBadge>
                    <Hugeicons icon={LockKeyIcon} />
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Hugeicons icon={HardDriveIcon} /> Study Material
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
              className={cn(profile && "flex items-center gap-2 p-1")}
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
                <Tooltip>
                  <TooltipTrigger
                    render={
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
                  </TooltipTrigger>
                  <TooltipPopup>Settings</TooltipPopup>
                </Tooltip>
                <MenuPopup
                  sideOffset={10}
                  align="end"
                  alignOffset={profile ? -4 : 0}
                  className="w-67 md:w-59"
                >
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
                  <MenuItem onClick={() => setShortcutsOpen(true)}>
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
              <ShortcutsModal
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
              />
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
