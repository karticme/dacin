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
} from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
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
import { ThemeToggle } from "@/components/theme-provider";
import {
  createChannel,
  deleteChannel,
  listChannels,
  renameChannel,
  signOut,
} from "@/lib/telegram";
import { clearProfileCache, getProfile } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import SearchUploadTray from "@/components/search-upload-tray";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import AddChannelModal from "@/components/models/add-channel";
import ShortcutsModal from "@/components/models/shortcuts";
import { isMac } from "@/lib/utils";
import { Hugeicons } from "@/components/utils/hugeicons";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import RenameModal from "@/components/models/rename-item";
import DeleteModal from "@/components/models/delete-item";
import { toastManager } from "@/components/ui/toast";

export default function HubSidebar({
  activeChannelId: controlledActiveChannelId,
  onChannelChange,
  ...props
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [localActiveChannelId, setLocalActiveChannelId] = useState(null);
  const activeChannelId = controlledActiveChannelId ?? localActiveChannelId;

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
    listChannels()
      .then((items) => {
        setChannels(items);
        if (items[0]) selectChannel(items[0]);
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
        description: `${name} : Setting up your channel on Telegram.`,
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
      loading: {
        title: `Renaming channel`,
        description: `Updating channel name ${channel.name} -> ${renamed.name}`,
      },
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
          <AddChannelModal onCreate={handleCreateChannel} />
          <SidebarGroupContent>
            <SidebarMenu>
              {channels.map((channel) => (
                <ChannelMenuItem
                  key={channel.channel_id}
                  channel={channel}
                  active={activeChannelId === channel.channel_id}
                  onSwitch={handleSwitchChannel}
                  onRename={handleRenameChannel}
                  onDelete={handleDeleteChannel}
                />
              ))}
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

function ChannelMenuItem({ channel, active, onSwitch, onRename, onDelete }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={active}
                onClick={() => onSwitch(channel)}
                className="group-data-pressed/menu-item:bg-sidebar-accent group-data-pressed/menu-item:text-sidebar-accent-foreground"
              >
                <Hugeicons icon={HardDriveIcon} /> {channel.name}
                {channel.encrypted && (
                  <SidebarMenuBadge>
                    <Hugeicons icon={SquareLockPasswordIcon} />
                  </SidebarMenuBadge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          }
        />
        <ContextMenuPopup align="start">
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            <Hugeicons icon={Edit03Icon} /> Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Hugeicons icon={Delete01Icon} /> Delete
          </ContextMenuItem>
        </ContextMenuPopup>
      </ContextMenu>
      <RenameModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        type="Channel"
        name={channel.name}
        encrypted={channel.encrypted}
        onRename={(name) => onRename(channel, name)}
      />
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="Channel"
        name={channel.name}
        onDelete={() => onDelete(channel)}
      />
    </>
  );
}
