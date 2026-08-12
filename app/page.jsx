"use client";

import {
  Search01Icon,
  ViewIcon,
  ViewOffIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
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
import { Hugeicons } from "@/components/utils/hugeicons";
import { OpenLink } from "@/components/utils/open-link";
import { countryCodes } from "@/lib/country-codes";

import { OTPField, OTPFieldInput } from "@/components/ui/otp-field";
import { Loader } from "@/components/ui/loader";
import { toastManager } from "@/components/ui/toast";
import {
  checkPassword,
  isTauriInvokeTimeout,
  restoreSession,
  setCredentials,
  startAuth,
  submitCode,
} from "@/lib/telegram";
import { fetchAndCacheProfile } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Group, GroupSeparator } from "@/components/ui/group";

function errorMessage(error) {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";
  const normalized = message.toUpperCase();

  if (
    normalized.includes("PHONE_NUMBER_UNOCCUPIED") ||
    normalized.includes("ACCOUNT WITH THIS NUMBER DOES NOT EXIST")
  ) {
    return "Account with this number does not exist. Make sure you entered the correct number.";
  }
  if (
    normalized.includes("PHONE_NUMBER_INVALID") ||
    normalized.includes("ENTER A VALID PHONE NUMBER")
  ) {
    return "Enter a valid phone number with the correct country code.";
  }
  if (
    normalized.includes("PHONE_NUMBER_BANNED") ||
    normalized.includes("CANNOT BE USED TO SIGN IN")
  ) {
    return "This phone number cannot be used to sign in to Telegram.";
  }
  if (
    normalized.includes("PHONE_CODE_EXPIRED") ||
    normalized.includes("LOGIN CODE HAS EXPIRED")
  ) {
    return "That login code has expired. Request a new code and try again.";
  }
  if (
    normalized.includes("PHONE_CODE_INVALID") ||
    normalized.includes("LOGIN CODE IS NOT VALID")
  ) {
    return "That login code is incorrect. Please enter the correct code.";
  }
  if (normalized.includes("TELEGRAM PASSWORD IS NOT VALID")) {
    return "That Telegram password is not valid.";
  }
  if (normalized.includes("SIGN-UP MUST BE COMPLETED")) {
    return "Telegram sign-up must be completed in an official client first.";
  }
  if (
    normalized.includes("REQUEST A LOGIN CODE BEFORE") ||
    normalized.includes("NO LONGER ACCEPTS THE PREVIOUS CODE TOKEN")
  ) {
    return "Request a new login code and try again.";
  }
  if (
    normalized.includes("FLOOD_WAIT") ||
    normalized.includes("PHONE_CODE_FLOOD") ||
    normalized.includes("TOO MANY ATTEMPTS")
  ) {
    return "Too many attempts. Please wait a while before trying again.";
  }
  if (normalized.includes("NETWORK") || normalized.includes("CONNECTION")) {
    return "Unable to reach Telegram. Check your internet connection and try again.";
  }

  return "Unable to complete this request. Please try again.";
}

function notify(type, title) {
  toastManager.add({ type, title });
}

export default function Page() {
  const router = useRouter();
  const phoneInput = useRef(null);
  const otpInput = useRef(null);
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
        if (active) setCheckingSession(false);
      } catch (error) {
        if (!active || isTauriInvokeTimeout(error)) return;
        console.error("[session] restore_session failed:", error);
        notify("error", errorMessage(error));
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

  async function finishLogin() {
    await fetchAndCacheProfile();
    router.replace("/hub");
  }

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
      if (response?.state !== "code_sent") {
        notify("error", "Unable to complete this request. Please try again.");
        return;
      }
      setCode("");
      setPhase("code");
      otpInput.current?.focus();
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
      if (response?.state === "authorized") {
        await finishLogin();
        return;
      }
      notify("error", "Unable to complete this request. Please try again.");
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
      if (response?.state === "authorized") {
        await finishLogin();
        return;
      }
      notify("error", "Unable to complete this request. Please try again.");
    } catch (error) {
      console.error("[auth] check_password failed:", error);
      notify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid size-full grid-rows-4 md:grid-rows-1 md:grid-cols-2">
      <div
        className="fixed top-0 inset-x-0 h-10 tauri-drag-region"
        data-tauri-drag-region
      />
      <img
        alt="Dithered Image of View from Bastei"
        src="/dithered-image.png"
        className="size-full border-r object-cover"
        draggable={false}
      />
      <div className="row-span-3 flex size-full md:items-center justify-center px-8 py-12">
        <div className="flex w-full max-w-80 flex-col gap-8">
          <div className="flex items-center gap-2">
            <img
              src="/dacin-logo.png"
              alt="Dacin"
              className="size-10"
              draggable={false}
            />
            <h1 className="text-xl font-semibold">Welcome to Dacin!</h1>
          </div>

          {checkingSession ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader /> Checking your session...
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
                    <Group className="w-full">
                      <Combobox
                        value={dialCode}
                        onValueChange={setDialCode}
                        items={countryCodes}
                      >
                        <ComboboxTrigger
                          render={
                            <Button
                              variant="outline"
                              className="justify-between gap-2 active:translate-0"
                            />
                          }
                          disabled={busy}
                        >
                          <ComboboxValue />
                          <Hugeicons
                            icon={UnfoldMoreIcon}
                            className="text-muted-foreground/80"
                          />
                        </ComboboxTrigger>
                        <ComboboxPopup
                          aria-label="Select country code"
                          className="md:max-w-80 rounded-t-xl"
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
                      <GroupSeparator />
                      <Input
                        id="phone-number"
                        ref={phoneInput}
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="9876543210"
                        type="tel"
                        inputMode="tel"
                        disabled={busy}
                      />
                    </Group>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy && <Loader />} {busy ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              )}

              {phase === "code" && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={handleSubmitCode}
                >
                  <p className="text-sm text-muted-foreground">
                    Check Telegram ({dialCode} {phoneNumber}) for your code.{" "}
                    <button
                      type="button"
                      className="cursor-pointer text-info transition-all hover:underline underline-offset-4"
                      onClick={() => {
                        setPhase("credentials");
                        setPhoneNumber("");
                        setCode("");
                      }}
                    >
                      Change phone number
                    </button>
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
                          ref={index === 0 ? otpInput : null}
                          key={index}
                          aria-label={`Character ${index + 1} of 5`}
                        />
                      ))}
                    </OTPField>
                  </div>
                  <Button type="submit" disabled={busy}>
                    {busy && <Loader />} {busy ? "Verifying..." : "Verify"}
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
                    {busy && <Loader />} {busy ? "Checking..." : "Continue"}
                  </Button>
                </form>
              )}
            </>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            For more check out
            <OpenLink url="https://github.com/karticme/dacin">dacin</OpenLink>
            on GitHub.
          </div>
          <div className="-mt-4 flex items-center gap-1 text-xs text-muted-foreground">
            Made with ❤️ by
            <OpenLink url="https://x.com/karticme">@karticme</OpenLink>
          </div>
        </div>
      </div>
    </main>
  );
}
