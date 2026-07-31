"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";
import {
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
} from "./ui/menu";
// import { SunIcon } from "lucide-react";
// import { ComputerIcon } from "lucide-react";
// import { MoonIcon } from "lucide-react";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <MenuSub>
      <MenuSubTrigger>
        {/* {theme === "system" ? (
          <ComputerIcon />
        ) : theme === "light" ? (
          <SunIcon />
        ) : (
          <MoonIcon />
        )}{" "} */}
        Theme
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

export function ThemeShortcut() {
  const { theme, setTheme } = useTheme();

  const handleChange = () => {
    const currentTheme = theme ?? "system";
    setTheme(
      currentTheme === "system"
        ? "light"
        : currentTheme === "light"
          ? "dark"
          : "system",
    );
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

  return <div className="hidden fixed" />;
}
