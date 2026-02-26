"use client";

import React, {useState} from "react";
import Image from "next/image";
import {Input} from "@/components/coss-ui/input";
import {Button} from "@/components/shadcn/button";
import {z} from "zod";
import Spinner from "@/components/shadcn/coss-ui";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/shadcn/input-otp";
import {authClient} from "@/components/utils/better-auth/auth-client";
import {toastManager} from "@/components/coss-ui/toast";

const emailSchema = z.string().email("Please enter a valid email address");

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0].message);
    } else {
      setError(null);
      setIsLoading(true);

      const res = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setIsLoading(false);

      if (res.error) {
        setError(res.error.message ?? "Failed to send OTP");
        toastManager.add({
          title: "Failed to send OTP",
          type: "error",
        });
        return;
      }
      setStep("otp");

      toastManager.add({
        title: "OTP sent successfully",
        type: "success",
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await authClient.signIn.emailOtp({
      email,
      otp,
    });

    setIsLoading(false);

    if (res.error) {
      setError(res.error.message ?? "Invalid code");
      toastManager.add({
        title: "Invalid code",
        type: "error",
      });
      return;
    }

    toastManager.add({
      title: "OTP verified successfully",
      type: "success",
    });

    window.location.href = "/all";
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-full max-w-[400px] flex-col items-center px-8">
        {/* Logo Container */}
        <div className="mb-4 flex items-center justify-center">
          <div className="border-muted-foreground/40 relative flex h-16 w-16 items-center justify-center border border-dashed">
            <Image
              src="/logo/logo_light.svg"
              alt="Void Logo"
              width={40}
              height={40}
              className="invert dark:invert-0"
            />
          </div>
        </div>

        <h1 className="text-foreground mb-10 text-[24px] font-medium tracking-tight">
          {step === "email" ? "Enter your email address" : "Check your email"}
        </h1>

        {step === "email" ? (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1.5">
              <Input
                type="email"
                placeholder="you@example.com"
                size="lg"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={!!error}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button
              className="w-full rounded-lg"
              variant="default"
              size="lg"
              type="submit"
              disabled={isLoading}>
              {isLoading ? <Spinner /> : "Send me a code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full space-y-6">
            <div className="text-foreground flex flex-col items-center space-y-4 font-medium">
              <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="size-10" />
                  <InputOTPSlot index={1} className="size-10" />
                  <InputOTPSlot index={2} className="size-10" />
                  <InputOTPSlot index={3} className="size-10" />
                  <InputOTPSlot index={4} className="size-10" />
                  <InputOTPSlot index={5} className="size-10" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full rounded-lg"
                variant="default"
                size="lg"
                type="submit"
                disabled={isLoading || otp.length !== 6}>
                {isLoading ? <Spinner /> : "Verify code"}
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
                disabled={isLoading}>
                Back to email
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
