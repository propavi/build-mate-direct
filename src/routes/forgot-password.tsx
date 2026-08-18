import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { HardHat, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — BuildSupply" },
      {
        name: "description",
        content: "Request a secure password reset link for your BuildSupply account.",
      },
      { property: "og:title", content: "Reset your password — BuildSupply" },
      {
        property: "og:description",
        content: "Request a secure password reset link for your BuildSupply account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const RESEND_COOLDOWN_SECONDS = 60;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendResetLink = async (targetEmail: string) => {
    await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setError(null);
    setBusy(true);
    // Ignore provider errors on purpose: never reveal whether the email exists.
    await sendResetLink(parsed.data);
    setBusy(false);
    setSent(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const resend = async () => {
    if (cooldown > 0 || !email) return;
    setResendStatus(null);
    setBusy(true);
    await sendResetLink(email);
    setBusy(false);
    setResendStatus("If an account exists with this email, a new reset link has been sent.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">BuildSupply</span>
        </Link>

        {sent ? (
          <div className="surface-panel space-y-4 p-6">
            <MailCheck className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists with this email, a password reset link has been sent to{" "}
              <span className="font-medium text-foreground">{email}</span>. Please check your
              inbox.
            </p>
            {resendStatus && <p className="text-sm text-emerald-600">{resendStatus}</p>}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy || cooldown > 0}
              onClick={resend}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend reset link
              {cooldown > 0 && ` (${cooldown}s)`}
            </Button>
            <Button asChild className="w-full">
              <Link to="/auth" search={{ mode: "login" }}>
                Back to sign in
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-panel space-y-4 p-6">
            <div>
              <h1 className="text-xl font-bold">Forgot your password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your registered email address and we'll send you a password reset link.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email address</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send Reset Link
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link
                to="/auth"
                search={{ mode: "login" }}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
