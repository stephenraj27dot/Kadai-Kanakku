import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PhoneShell } from "@/components/PhoneShell";
import { useI18n } from "@/lib/i18n";
import { BookOpen, User, Lock, Store } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Role = 'owner' | 'customer';

function AuthPage() {
  const { t, lang } = useI18n();
  const ta = lang === "ta";
  const navigate = useNavigate();
  
  const [role, setRole] = useState<Role>('owner');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let authError = null;

    if (role === 'owner') {
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
    } else {
      // Customer Login / Signup
      let cleanPhone = phone.replace(/\D/g, '');
      
      // If the user typed 91 at the beginning, strip it out to get the 10-digit number
      if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.substring(cleanPhone.length - 10);
      }

      if (cleanPhone.length < 10) {
        setError(ta ? 'சரியான மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter a valid phone number');
        setLoading(false);
        return;
      }
      
      const fakeEmail = `${cleanPhone}@kadaikanakku.com`;

      if (isLogin) {
        // --- LOGIN FLOW ---
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password,
        });

        if (signInErr) {
          setError(ta
            ? "தவறான மொபைல் எண்/பாஸ்வேர்ட். புதிய வாடிக்கையாளராக இருந்தால் கீழே உள்ள 'புதிய கணக்கு தொடங்க வேண்டுமா' என்பதை கிளிக் செய்யவும்."
            : "Invalid phone or password. New customer? Click 'Need an account? Sign up' below.");
          setLoading(false);
          return;
        }

        // Find shop and auto-link
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        if (loggedUser) {
          // Try find by auth_user_id first (already linked)
          let { data: custRows } = await supabase
            .from('customers')
            .select('user_id')
            .eq('auth_user_id', loggedUser.id)
            .limit(1);

          if (!custRows || custRows.length === 0) {
            // Auto-link using RPC (bypasses RLS securely)
            const { data: matchedUserId } = await supabase.rpc('link_customer_account', {
              phone_number: cleanPhone
            });
            if (matchedUserId) {
              custRows = [{ user_id: matchedUserId }];
            }
          }

          if (custRows && custRows.length > 0) {
            navigate({ to: `/c/${custRows[0].user_id}`, replace: true });
          } else {
            setError(ta
              ? "கடைக்காரர் உங்களை இன்னும் சேர்க்கவில்லை. கடைக்காரரை தொடர்பு கொள்ளவும்."
              : "Shop owner hasn't added you yet. Please contact the shop owner.");
            setLoading(false);
          }
        }

      } else {
        // --- SIGNUP FLOW ---
        // First check if this phone number is registered in any shop using RPC
        const { data: isExists } = await supabase.rpc('check_customer_phone', {
          phone_number: cleanPhone
        });

        if (!isExists) {
          setError(ta
            ? "இந்த மொபைல் எண் எந்தக் கடையிலும் பதிவு செய்யப்படவில்லை. கடைக்காரரிடம் உங்கள் எண்ணை சேர்க்கச் சொல்லுங்கள்."
            : "This phone number is not registered in any shop. Ask the shop owner to add you first.");
          setLoading(false);
          return;
        }

        const { error: signUpErr, data: signUpData } = await supabase.auth.signUp({
          email: fakeEmail,
          password,
        });

        if (signUpErr) {
          if (signUpErr.message.includes('already registered') || signUpErr.message.includes('already been registered')) {
            setError(ta
              ? "இந்த மொபைல் எண்ணில் ஏற்கனவே கணக்கு உள்ளது. 'உள்நுழை' என்பதை கிளிக் செய்யவும்."
              : "Account already exists. Please click 'Login' instead.");
          } else {
            setError(signUpErr.message);
          }
          setLoading(false);
          return;
        }

        // Auto-link the customer record using RPC
        if (signUpData.user) {
          const { data: matchedUserId } = await supabase.rpc('link_customer_account', {
            phone_number: cleanPhone
          });

          if (matchedUserId) {
            navigate({ to: `/c/${matchedUserId}`, replace: true });
          } else {
            navigate({ to: "/dashboard", replace: true }); // Fallback
          }
        } else {
          // Email confirmation may be required - shouldn't happen with our config
          setError(ta
            ? "கணக்கு உருவாக்கப்பட்டது. இப்போது 'உள்நுழை' என்பதை கிளிக் செய்யவும்."
            : "Account created! Please click 'Login' now.");
          setIsLogin(true);
          setLoading(false);
        }
      }
    }
  };

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 bg-gradient-to-b from-background to-muted/30 overflow-y-auto">
        <div className="flex flex-col items-center mb-8 pt-8">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-soft">
            <BookOpen className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className={`text-3xl font-bold font-display ${ta ? "font-tamil" : ""}`}>
            {isLogin ? (ta ? "உள்நுழையவும்" : "Sign In") : (ta ? "கணக்கு உருவாக்கவும்" : "Sign Up")}
          </h1>
          <p className={`mt-2 text-sm text-muted-foreground text-center ${ta ? "font-tamil" : ""}`}>
            {ta ? "கணக்கு வழக்குகளை நிர்வகிக்க" : "Manage your accounts securely"}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex p-1 bg-muted rounded-2xl mb-8 shadow-inner">
          <button
            type="button"
            onClick={() => { setRole('owner'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              role === 'owner' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            } ${ta ? 'font-tamil' : ''}`}
          >
            <Store className="size-4" />
            {ta ? 'கடைக்காரர்' : 'Shop Owner'}
          </button>
          <button
            type="button"
            onClick={() => { setRole('customer'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              role === 'customer' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            } ${ta ? 'font-tamil' : ''}`}
          >
            <User className="size-4" />
            {ta ? 'வாடிக்கையாளர்' : 'Customer'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}
          
          {role === 'owner' ? (
            <>
              <div>
                <label className="text-sm font-semibold text-muted-foreground ml-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1.5 w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none transition-all shadow-sm font-display"
                  placeholder="shop@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground ml-1">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="size-4.5" />
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="mt-1.5 w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary outline-none transition-all shadow-sm font-display"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={`text-sm font-semibold text-muted-foreground ml-1 ${ta ? 'font-tamil' : ''}`}>
                  {ta ? 'மொபைல் எண்' : 'Phone Number'}
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={ta ? '10 இலக்க எண்' : '10 digit number'}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary outline-none transition-all shadow-sm font-display"
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm font-semibold text-muted-foreground ml-1 ${ta ? 'font-tamil' : ''}`}>
                  {ta ? 'பாஸ்வேர்ட் (Password)' : 'Password'}
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="size-4.5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={ta ? 'பாஸ்வேர்ட் உள்ளிடவும்' : 'Enter password'}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary outline-none transition-all shadow-sm font-display"
                    minLength={8}
                  />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft mt-6 disabled:opacity-50 press-scale ${ta ? 'font-tamil' : ''}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              isLogin ? (ta ? "உள்நுழை" : "Login") : (ta ? "தொடங்கு" : "Create Account")
            )}
          </button>
        </form>

        <div className="mt-8 text-center pb-8">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className={`text-sm font-medium text-primary hover:underline ${ta ? 'font-tamil' : ''}`}
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
