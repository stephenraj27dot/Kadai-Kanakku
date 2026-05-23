import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let authError = null;

    if (isLogin) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      authError = signInErr;
    } else {
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      authError = signUpErr;
    }

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate({ to: "/dashboard", replace: true });
    }
  };

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col justify-center px-6 pt-12 pb-8 bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center mb-10">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-soft">
            <BookOpen className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className={`text-3xl font-bold font-display ${ta ? "font-tamil" : ""}`}>
            {isLogin ? (ta ? "உள்நுழையவும்" : "Sign In") : (ta ? "கணக்கு உருவாக்கவும்" : "Sign Up")}
          </h1>
          <p className={`mt-2 text-sm text-muted-foreground text-center ${ta ? "font-tamil" : ""}`}>
            {ta ? "உங்கள் கடை கணக்கை பாதுகாப்பாக சேமிக்க" : "Securely sync your shop data to the cloud"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label className="text-sm font-semibold text-muted-foreground ml-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1.5 w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none transition-all shadow-sm"
              placeholder="shop@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground ml-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1.5 w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft mt-6 disabled:opacity-50 press-scale"
          >
            {loading ? "..." : (isLogin ? (ta ? "உள்நுழை" : "Login") : (ta ? "தொடங்கு" : "Create Account"))}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {isLogin 
              ? (ta ? "புதிய கணக்கு தொடங்க வேண்டுமா?" : "Need an account? Sign up") 
              : (ta ? "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்" : "Already have an account? Log in")}
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}
