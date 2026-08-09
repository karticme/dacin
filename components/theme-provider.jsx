"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";
import {
  MenuRadioGroup,
  MenuRadioItem,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import {
  LayerMask01Icon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { Hugeicons } from "@/components/utils/hugeicons";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <MenuSub>
      <MenuSubTrigger className="[&_svg]:ms-0!">
        <Hugeicons
          className={cn("size-3.5", theme === "system" && "-rotate-45")}
          icon={
            theme === "system"
              ? LayerMask01Icon
              : theme === "light"
                ? Sun03Icon
                : Moon02Icon
          }
        />
        Theme
        <MenuShortcut>D</MenuShortcut>
      </MenuSubTrigger>
      <MenuSubPopup>
        <MenuRadioGroup value={theme} onValueChange={setTheme}>
          <MenuRadioItem value="system">System</MenuRadioItem>
          <MenuRadioItem value="light">Light</MenuRadioItem>
          <MenuRadioItem value="dark">Dark</MenuRadioItem>
        </MenuRadioGroup>
      </MenuSubPopup>
    </MenuSub>
  );
}
