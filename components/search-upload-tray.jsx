import { Button } from "@/components/ui/button";
import {
  Cancel01Icon,
  Eraser01Icon,
  FolderAddIcon,
  Search01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { cn, Hugeicons } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function SearchUploadTray({ loading }) {
  const [searchOn, setSearchOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInput = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (searchInput.current === document.activeElement) {
          setSearchOn(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative flex justify-end p-1 *:transform-gpu">
      <TooltipProvider>
        <div
          className={cn(
            "absolute left-1 right-13 flex gap-2 transition-transform duration-400 ease-in-out",
            searchOn && "-translate-x-[calc(100%+1rem)] pointer-events-none",
            !searchOn && "",
          )}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button className="flex-1" size="xl" disabled={loading} />
              }
            >
              <Hugeicons icon={Upload01Icon} />
            </TooltipTrigger>
            <TooltipPopup>Upload Files</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="flex-1"
                  size="xl"
                  variant="outline"
                  disabled={loading}
                />
              }
            >
              <Hugeicons icon={FolderAddIcon} />
            </TooltipTrigger>
            <TooltipPopup>Create New Folder</TooltipPopup>
          </Tooltip>
        </div>
        <InputGroup
          className={cn(
            "overflow-hidden transition-all duration-400 ease-in-out",
            searchOn ? "w-full" : "p-0! m-0! size-11 sm:size-10 border-input",
          )}
        >
          <InputGroupAddon
            className={cn("transition-discrete", !searchOn && "ps-1.5")}
          >
            {!searchOn ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon-xl"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => {
                        setSearchOn(true);
                        searchInput.current?.focus();
                      }}
                    />
                  }
                >
                  <Hugeicons className="size-4.75!" icon={Search01Icon} />
                </TooltipTrigger>
                <TooltipPopup>Search</TooltipPopup>
              </Tooltip>
            ) : (
              <Hugeicons className="size-4.75!" icon={Search01Icon} />
            )}
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInput}
            size="xl"
            placeholder="Search items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <Button
              size="icon-sm"
              variant="secondary"
              className="relative rounded-sm overflow-hidden mr-0.5"
              onClick={() =>
                searchQuery ? setSearchQuery("") : setSearchOn(false)
              }
              disabled={!searchOn}
            >
              <Hugeicons
                icon={Cancel01Icon}
                className={cn(
                  searchIcon,
                  searchQuery && "-translate-x-6 zoom-75",
                )}
              />
              <Hugeicons
                icon={Eraser01Icon}
                className={cn(
                  searchIcon,
                  "rotate-180",
                  !searchQuery && "translate-x-6 zoom-75",
                )}
              />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </TooltipProvider>
    </div>
  );
}

const searchIcon = "absolute transition-transform duration-400 ease-in-out";
