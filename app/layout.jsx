import { CalSansText, CalSansUI } from "@calcom/cal-sans-ui";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { UtilityProvider } from "@/components/utility-provider";

export const metadata = {
  title: "Dacin",
  description: "Unlimited, encrypted Telegram based storage",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={cn(CalSansUI.variable, CalSansText.variable)}
      suppressContentEditableWarning
      suppressHydrationWarning
    >
      <body className="w-full h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] p-0 m-0 overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider position="bottom-center">{children}</ToastProvider>
          <UtilityProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
