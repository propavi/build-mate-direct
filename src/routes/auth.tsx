import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, HardHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — BuildSupply" },
      {
        name: "description",
        content: "Sign in or register to order construction materials for your site.",
      },
      { property: "og:title", content: "Sign in — BuildSupply" },
      {
        property: "og:description",
        content: "Sign in or register to order construction materials for your site.",
      },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(100),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<string>(mode === "login" ? "login" : "register");

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: isAdmin ? "/admin" : "/dashboard", replace: true });
    }
  }, [session, isAdmin, loading, navigate]);


  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <HardHat className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-sidebar-foreground">BuildSupply</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-snug text-sidebar-foreground">
            Materials on site,
            <br />
            without the phone calls.
          </h2>
          <p className="mt-4 max-w-md text-sm text-sidebar-foreground/70">
            Order cement, bricks, sand and steel with the exact brand and grade you need. Track your
            order from placement to delivery.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Trusted by engineers, builders and contractors.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <HardHat className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">BuildSupply</span>
          </Link>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onCreateAccount={() => setTab("register")} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSignIn={() => setTab("login")} />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}

function LoginForm({ onCreateAccount }: { onCreateAccount: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      const code = err.message.toLowerCase();
      if (code.includes("email not confirmed")) {
        setError("Please confirm your email address first, then sign in.");
      } else if (code.includes("too many") || code.includes("rate limit")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Invalid email or password. Please check your credentials and try again.");
      }
      return;
    }
    toast.success("Welcome back");
  };

  return (
    <form onSubmit={submit} className="surface-panel mt-4 space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your orders and materials.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
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
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onCreateAccount}
          className="font-medium text-primary hover:underline"
        >
          Create Account
        </button>
      </p>
    </form>
  );
}


function RegisterForm({ onSignIn }: { onSignIn: () => void }) {
  const [values, setValues] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicate(false);
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("user already")) {
        setDuplicate(true);
        return;
      }
      if (msg.includes("password")) {
        setErrors({ password: "Password must be at least 6 characters." });
        return;
      }
      setErrors({ form: "We couldn't create your account right now. Please try again." });
      return;
    }
    // Supabase obfuscates existing accounts: identities is empty when the email is taken.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setDuplicate(true);
      return;
    }
    if (!data.session) {
      setSent(true);
    }
    toast.success("Account created");
  };


  const field = (
    key: keyof typeof values,
    label: string,
    type: string,
    autoComplete?: string,
    placeholder?: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`reg-${key}`}>{label}</Label>
      <Input
        id={`reg-${key}`}
        type={type}
        value={values[key]}
        onChange={set(key)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="surface-panel mt-4 space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start ordering materials for your construction site.
        </p>
      </div>
      {field("full_name", "Full Name", "text", "name", "Rajesh Kumar")}
      {field("phone", "Phone Number", "tel", "tel", "98765 43210")}
      {field("email", "Email", "email", "email", "you@company.com")}
      {field("password", "Password", "password", "new-password")}
      {field("confirm", "Confirm Password", "password", "new-password")}
      {duplicate && (
        <div
          role="alert"
          className="space-y-3 rounded-md border border-destructive/30 bg-destructive/10 p-3"
        >
          <p className="text-sm text-destructive">
            An account with this email already exists. Please sign in instead.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" onClick={onSignIn}>
              Sign In
            </Button>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      )}
      {sent && !duplicate && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Check your inbox to confirm your email address, then sign in.
        </p>
      )}
      {errors["form"] && <p className="text-sm text-destructive">{errors["form"]}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSignIn} className="font-medium text-primary hover:underline">
          Sign In
        </button>
      </p>

    </form>
  );
}
