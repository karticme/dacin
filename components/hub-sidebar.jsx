"use client";

import {
  HardDriveIcon,
  KeyboardIcon,
  SquareLockPasswordIcon,
  Settings01Icon,
  ArrowRight01Icon,
  Logout01Icon,
  Edit03Icon,
  Delete01Icon,
  ZzzIcon,
  Hugeicons,
  MoreVerticalIcon,
} from "@/components/utils/hugeicons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Menu,
  MenuTrigger,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuShortcut,
} from "@/components/ui/menu";
import { ThemeToggle } from "@/components/theme-provider";
import {
  createChannel,
  deleteChannel,
  getCachedChannels,
  listChannels,
  renameChannel,
  signOut,
} from "@/lib/telegram";
import { clearProfileCache, getProfile } from "@/lib/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import SearchUploadTray from "@/components/search-upload-tray";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import AddChannelModal from "@/components/models/add-channel";
import ShortcutsModal from "@/components/models/shortcuts";
import { isMac } from "@/lib/utils";
import RenameModal from "@/components/models/rename-item";
import DeleteModal from "@/components/models/delete-item";
import { toastManager } from "@/components/ui/toast";
import { Loader } from "@/components/ui/loader";
import UploadStateSheet from "@/components/models/upload-state-sheet";
import Truncated from "./utils/truncated";

export default function HubSidebar({
  activeChannel,
  activeChannelId: controlledActiveChannelId,
  onChannelChange,
  onCreateFolder,
  onUpload,
  channelLoading = false,
  searchQuery,
  onSearchQueryChange,
  ...props
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [localActiveChannelId, setLocalActiveChannelId] = useState(null);
  const activeChannelId = controlledActiveChannelId ?? activeChannel?.channel_id ?? localActiveChannelId;

  function selectChannel(channel) {
    setLocalActiveChannelId(channel.channel_id);
    onChannelChange?.(channel);
  }

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((profile) => setProfile(profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Instant load from local disk cache
    getCachedChannels()
      .then((cached) => {
        if (cached && cached.length > 0) {
          setChannels(cached);
          if (cached[0] && !controlledActiveChannelId && !activeChannel) {
            selectChannel(cached[0]);
          }
        }
      })
      .catch(() => {});

    // Background fresh network scan
    listChannels()
      .then((items) => {
        setChannels(items);
        if (items.length > 0) {
          if (!controlledActiveChannelId && !activeChannel && items[0]) {
            selectChannel(items[0]);
          }
        } else {
          setLocalActiveChannelId(null);
          onChannelChange?.(null);
        }
      })
      .catch((error) =>
        toastManager.add({ type: "error", title: String(error) }),
      );
  }, []);

  async function handleCreateChannel(name, encrypted = true) {
    const promise = createChannel(name, encrypted).then((channel) => {
      setChannels((items) => [...items, channel]);
      selectChannel(channel);
      return channel;
    });

    toastManager.promise(promise, {
      loading: {
        title: "Creating channel",
        description: `${name} : Setting up your channel.`,
        iconDirection: "up",
      },
      success: (channel) => ({
        title: "Channel created",
        description: `${channel.name} : ${
          channel.encrypted
            ? "Channel is encrypted."
            : "Channel isn't encrypted."
        }`,
      }),
      error: (error) => ({
        title: "Failed to create channel",
        description: String(error?.message || error),
      }),
    });

    return promise;
  }

  function handleSwitchChannel(channel) {
    selectChannel(channel);
  }

  async function handleRenameChannel(channel, name) {
    const promise = renameChannel(channel.channel_id, name).then((renamed) => {
      setChannels((items) =>
        items.map((item) =>
          item.channel_id === renamed.channel_id ? renamed : item,
        ),
      );
      if (activeChannelId === channel.channel_id) {
        selectChannel(renamed);
      }
      return renamed;
    });

    toastManager.promise(promise, {
      loading: (renamed) => ({
        title: `Renaming channel`,
        description: `Updating channel name ${channel.name} -> ${name}`,
        iconDirection: "right",
      }),
      success: (renamed) => ({
        title: "Channel renamed",
        description: `${channel.name} -> ${renamed.name}`,
      }),
      error: (error) => ({
        title: "Failed to rename channel",
        description: String(error?.message || error),
      }),
    });

    return promise;
  }

  async function handleDeleteChannel(channel) {
    const promise = deleteChannel(channel.channel_id).then(() => {
      setChannels((items) =>
        items.filter((item) => item.channel_id !== channel.channel_id),
      );
      if (activeChannelId === channel.channel_id) {
        setLocalActiveChannelId(null);
        onChannelChange?.(null);
      }
    });

    toastManager.promise(promise, {
      loading: {
        title: `Deleting ${channel.name} channel`,
        description: `Removing ${channel.name} from your channels.`,
        iconDirection: "down",
        iconClass: "[&_svg]:text-destructive",
      },
      success: () => ({
        title: `${channel.name} channel deleted.`,
        iconClass: "[&_svg]:text-destructive",
      }),
      error: (error) => ({
        title: "Failed to delete channel",
        description: String(error?.message || error),
      }),
    });

    return promise;
  }

  async function handleLogout() {
    await signOut();
    await clearProfileCache();
    window.location.reload();
  }

  const isTrayDisabled = loading || channelLoading || !activeChannel;

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
              {profile && profile.firstName && (
                <Avatar className="shrink-0 size-6 rounded-md border">
                  <AvatarImage src={profile?.photoUrl} draggable={false} />
                  <AvatarFallback>
                    {profile?.fullName && profile.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <p className="truncate text-sidebar-primary text-sm font-medium">
                  {profile?.firstName + "'s Dacin" || "Dacin User"}
                </p>
              </div>
            </>
          )}
          <div
            className="absolute h-10 inset-x-0 z-10 tauri-drag-region"
            data-tauri-drag-region
          />
        </div>
        <SearchUploadTray
          disabled={isTrayDisabled}
          onCreateFolder={onCreateFolder}
          onUpload={onUpload}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel>Channels</SidebarGroupLabel>
          <AddChannelModal onCreate={handleCreateChannel} />
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuSkeleton key={i} showIcon={true} />
                ))
              ) : channels.length > 0 ? (
                channels.map((channel) => (
                  <SidebarMenuItem key={channel.channel_id}>
                    <SidebarMenuButton
                      isActive={activeChannelId === channel.channel_id}
                      onClick={() => handleSwitchChannel(channel)}
                      className="group-data-pressed/menu-item:bg-sidebar-accent group-data-pressed/menu-item:text-sidebar-accent-foreground"
                    >
                      <Hugeicons icon={HardDriveIcon} /> {channel.name}
                      {channel.encrypted && (
                        <SidebarMenuBadge className="opacity-60">
                          <Hugeicons icon={SquareLockPasswordIcon} />
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                    <ChannelMenuItem
                      channel={channel}
                      onRename={handleRenameChannel}
                      onDelete={handleDeleteChannel}
                    />
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="flex flex-col items-center gap-4 py-8 text-xs text-sidebar-foreground">
                  <Hugeicons icon={ZzzIcon} className="size-5 stroke-[1.5px]" />
                  No channels found.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {/* uploading state */}
          <UploadStateSheet>
            <SidebarMenuItem className="my-2 [&_button]:px-3 [&_button]:gap-2.5">
              <SidebarMenuButton>
                <Loader direction="up" /> Uploading
              </SidebarMenuButton>
              <SidebarMenuBadge>2/7</SidebarMenuBadge>
            </SidebarMenuItem>
          </UploadStateSheet>

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
                  {profile && profile.fullName && (
                    <Avatar className="size-10 rounded-lg border">
                      <AvatarImage src={profile.photoUrl} draggable={false} />
                      <AvatarFallback>
                        {profile.fullName && profile.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="min-w-0 space-y-0.5 [&>p]:truncate">
                    <Truncated
                      className="text-sm font-medium text-foreground"
                      value={profile?.fullName || "Dacin User"}
                    />
                    {profile?.username && (
                      <p className="text-xs text-muted-foreground">
                        {"@" + profile.username}
                      </p>
                    )}
                  </div>
                </>
              )}
              <Menu>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <MenuTrigger
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
              </Menu>
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

function ChannelMenuItem({ channel, active, onSwitch, onRename, onDelete }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <SidebarMenuAction className="hidden group-hover/menu-item:flex">
              <Hugeicons icon={MoreVerticalIcon} />
            </SidebarMenuAction>
          }
        />
        <MenuPopup align="end">
          <MenuItem onClick={() => setRenameOpen(true)}>
            <Hugeicons icon={Edit03Icon} /> Rename
          </MenuItem>
          <MenuSeparator />
          <MenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Hugeicons icon={Delete01Icon} /> Delete
          </MenuItem>
        </MenuPopup>
      </Menu>
      <RenameModal
        type="Channel"
        open={renameOpen}
        onOpenChange={setRenameOpen}
        name={channel.name}
        encrypted={channel.encrypted}
        onRename={(name) => onRename(channel, name)}
      />
      <DeleteModal
        type="Channel"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={channel.name}
        onDelete={() => onDelete(channel)}
      />
    </>
  );
}
