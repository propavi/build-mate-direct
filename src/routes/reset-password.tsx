import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Eye, EyeOff, HardHat, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — BuildSupply" },
      {
        name: "description",
        content: "Choose a new password for your BuildSupply account.",
      },
      { property: "og:title", content: "Set a new password — BuildSupply" },
      { property: "og:description", content: "Choose a new password for your BuildSupply account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) {
        setValidLink(true);
        setReady(true);
      }
    });
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const hash = window.location.hash;
      const isRecovery = hash.includes("type=recovery") || Boolean(data.session);
      setValidLink(isRecovery);
      setReady(true);
    })();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setBusy(false);
    if (error) {
      setErrors({
        form: "We couldn't update your password. The reset link may have expired — request a new one.",
      });
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
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

        {done ? (
          <div className="surface-panel space-y-4 p-6">
            <CheckCircle2 className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold">Password updated successfully.</h1>
            <p className="text-sm text-muted-foreground">
              You can now sign in with your new password.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth" search={{ mode: "login" }}>
                Sign In
              </Link>
            </Button>
          </div>
        ) : ready && !validLink ? (
          <div className="surface-panel space-y-4 p-6">
            <h1 className="text-xl font-bold">Reset link invalid or expired</h1>
            <p className="text-sm text-muted-foreground">
              Password reset links can only be used once and expire after a short time. Request a
              new one to continue.
            </p>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface-panel space-y-4 p-6">
            <div>
              <h1 className="text-xl font-bold">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a strong password you haven't used before.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors["password"] && (
                <p className="text-xs text-destructive">{errors["password"]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {errors["confirm"] && <p className="text-xs text-destructive">{errors["confirm"]}</p>}
            </div>
            {errors["form"] && <p className="text-sm text-destructive">{errors["form"]}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
