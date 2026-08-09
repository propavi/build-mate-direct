import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { HardHat, Loader2 } from "lucide-react";
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
          <Tabs defaultValue={mode === "login" ? "login" : "register"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
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
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
      </Button>
    </form>
  );
}

function RegisterForm() {
  const [values, setValues] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      setErrors({ form: error.message });
      return;
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
      {errors["form"] && <p className="text-sm text-destructive">{errors["form"]}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
      </Button>
    </form>
  );
}
