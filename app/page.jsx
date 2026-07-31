"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Hugeicons } from "@/lib/utils";
import { countryCodes } from "@/lib/country-codes";
import {
  Search01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import {
  checkPassword,
  isTauriInvokeTimeout,
  restoreSession,
  setCredentials,
  startAuth,
  submitCode,
} from "@/lib/telegram";

function errorMessage(error) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong while talking to Telegram.";
}

function notify(type, title) {
  toastManager.add({ type, title });
}

export default function Page() {
  const router = useRouter();
  const phoneInput = useRef(null);
  const passwordInput = useRef(null);
  const [dialCode, setDialCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState("credentials");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await restoreSession({ timeoutMs: 3000 });
        if (!active) return;

        if (response?.state === "authorized") {
          router.replace("/hub");
          return;
        }
        if (response?.state === "code_sent") setPhase("code");
        if (response?.state === "needs_password") setPhase("password");
      } catch (error) {
        if (!active || isTauriInvokeTimeout(error)) return;
        console.error("[session] restore_session failed:", error);
        notify("error", errorMessage(error));
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (phase === "password") passwordInput.current?.focus();
  }, [phase]);

  async function handleSendCode(event) {
    event.preventDefault();
    const localNumber = phoneNumber.replace(/\D/g, "");
    if (!localNumber) {
      notify(
        "error",
        "Enter the phone number linked to your Telegram account.",
      );
      phoneInput.current?.focus();
      return;
    }

    setBusy(true);
    try {
      const credentials = await setCredentials(`${dialCode}${localNumber}`);
      if (credentials?.state === "authorized") {
        router.replace("/hub");
        return;
      }

      const response = await startAuth();
      if (response?.state === "authorized") {
        router.replace("/hub");
        return;
      }
      setCode("");
      setPhase("code");
      notify(
        "success",
        response?.message ?? "Verification code sent. Check Telegram.",
      );
    } catch (error) {
      console.error("[auth] start_auth failed:", error);
      notify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitCode(event) {
    event.preventDefault();
    if (code.length !== 5) {
      notify("error", "Enter the five-digit code from Telegram.");
      return;
    }

    setBusy(true);
    try {
      const response = await submitCode(code);
      if (response?.state === "needs_password") {
        setPhase("password");
        notify("success", response.message);
        return;
      }
      if (response?.state === "authorized") router.replace("/hub");
    } catch (error) {
      console.error("[auth] submit_code failed:", error);
      notify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitPassword(event) {
    event.preventDefault();
    if (!password) {
      notify("error", "Enter your Telegram password.");
      passwordInput.current?.focus();
      return;
    }

    setBusy(true);
    try {
      const response = await checkPassword(password);
      if (response?.state === "authorized") router.replace("/hub");
    } catch (error) {
      console.error("[auth] check_password failed:", error);
      notify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid h-dvh w-full grid-cols-2">
      <img
        alt="Dithered Image of View from Bastei"
        src="/dithered-image.png"
        className="size-full border-r object-cover"
        draggable={false}
      />
      <div className="flex size-full items-center justify-center p-8">
        <div className="flex w-full max-w-80 flex-col gap-8">
          <div className="flex items-center gap-2">
            <img
              src="/dacin-logo.png"
              alt="Dacin"
              className="size-10"
              draggable={false}
            />
            <h1 className="font-heading text-xl font-semibold">
              Welcome to Dacin!
            </h1>
          </div>

          {checkingSession ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Checking your session...
            </div>
          ) : (
            <>
              {phase === "credentials" && (
                <form className="flex flex-col gap-4" onSubmit={handleSendCode}>
                  <p className="text-sm text-muted-foreground">
                    Login with your Telegram account.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <InputGroup>
                      <InputGroupInput
                        id="phone-number"
                        ref={phoneInput}
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="9876543210"
                        type="tel"
                        inputMode="tel"
                        disabled={busy}
                      />
                      <InputGroupAddon>
                        <Combobox
                          value={dialCode}
                          onValueChange={setDialCode}
                          items={countryCodes}
                        >
                          <ComboboxTrigger
                            render={
                              <Button
                                className="w-full justify-between gap-2 rounded-sm font-normal"
                                size="xs"
                                variant="secondary"
                              />
                            }
                            disabled={busy}
                          >
                            <ComboboxValue />
                          </ComboboxTrigger>
                          <ComboboxPopup
                            alignOffset={-4}
                            aria-label="Select country code"
                          >
                            <div className="border-b p-2">
                              <ComboboxInput
                                className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                                placeholder="e.g. India"
                                showTrigger={false}
                                startAddon={<Hugeicons icon={Search01Icon} />}
                              />
                            </div>
                            <ComboboxEmpty>No countries found.</ComboboxEmpty>
                            <ComboboxList>
                              {(country) => (
                                <ComboboxItem
                                  key={country.code}
                                  value={country.dial_code}
                                >
                                  <div className="-me-1.5 flex items-center gap-2">
                                    {country.emoji}&nbsp; {country.name}
                                    <span className="ml-auto font-light text-muted-foreground">
                                      {country.dial_code}
                                    </span>
                                  </div>
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxPopup>
                        </Combobox>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy && <Spinner />} {busy ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              )}

              {phase === "code" && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={handleSubmitCode}
                >
                  <p className="text-sm text-muted-foreground">
                    Check Telegram for your code.
                  </p>
                  <div className="space-y-2">
                    <Label>Enter OTP</Label>
                    <OTPField
                      aria-label="One-time password"
                      length={5}
                      size="lg"
                      value={code}
                      onValueChange={setCode}
                      disabled={busy}
                      className="[&>input]:h-11 [&>input]:w-full [&>input]:text-xl"
                    >
                      {[0, 1, 2, 3, 4].map((index) => (
                        <OTPFieldInput
                          key={index}
                          aria-label={`Character ${index + 1} of 5`}
                        />
                      ))}
                    </OTPField>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy && <Spinner />} {busy ? "Verifying..." : "Verify"}
                  </Button>
                </form>
              )}

              {phase === "password" && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={handleSubmitPassword}
                >
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication is enabled.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="telegram-password">Enter Password</Label>
                    <InputGroup>
                      <InputGroupInput
                        id="telegram-password"
                        ref={passwordInput}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={busy}
                      />
                      <InputGroupAddon align="inline-end">
                        <Button
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                          onClick={() => setShowPassword((visible) => !visible)}
                        >
                          <Hugeicons
                            icon={showPassword ? ViewOffIcon : ViewIcon}
                          />
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy && <Spinner />} {busy ? "Checking..." : "Continue"}
                  </Button>
                </form>
              )}
            </>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            For more check out
            <button
              type="button"
              onClick={() =>
                import("@/lib/telegram").then((module) =>
                  module.openUrl("https://github.com/karticme/dacin"),
                )
              }
              className="cursor-pointer text-info transition-all hover:underline"
            >
              dacin
            </button>
            on GitHub.
          </div>
          <div className="-mt-4 flex items-center gap-1 text-xs text-muted-foreground">
            Created by
            <button
              type="button"
              onClick={() =>
                import("@/lib/telegram").then((module) =>
                  module.openUrl("https://x.com/karticme"),
                )
              }
              className="cursor-pointer text-info transition-all hover:underline"
            >
              @karticme
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
