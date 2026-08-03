import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { UtilityProvider } from "@/components/utility-provider";

export const metadata = {
  title: "Dacin",
  description: "Unlimited, encrypted Telegram based storage",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressContentEditableWarning suppressHydrationWarning>
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
