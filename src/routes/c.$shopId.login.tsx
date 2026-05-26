import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PhoneShell } from '@/components/PhoneShell'
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export const Route = createFileRoute('/c/$shopId/login')({
  component: CustomerLogin,
})

function CustomerLogin() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()
  
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: `/c/${shopId}`, replace: true })
      }
    })
  }, [shopId, navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }
    const fakeEmail = `${cleanPhone}@kadaikanakku.com`

    // Attempt login first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (signInErr) {
      if (signInErr.message === "Invalid login credentials") {
        // User doesn't exist or wrong password. Try sign up!
        const { error: signUpErr } = await supabase.auth.signUp({
          email: fakeEmail,
          password,
        })
        
        if (signUpErr) {
          if (signUpErr.message.includes("already registered")) {
            setError("தவறான பாஸ்வேர்ட். தயவுசெய்து மீண்டும் சரிபார்க்கவும்.") // Wrong password
          } else {
            setError(signUpErr.message)
          }
          setLoading(false)
        } else {
          // Signup success
          navigate({ to: `/c/${shopId}`, replace: true })
        }
      } else {
        setError(signInErr.message)
        setLoading(false)
      }
    } else {
      // Login success
      navigate({ to: `/c/${shopId}`, replace: true })
    }
  }

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col justify-center px-6 pt-12 pb-8 bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center mb-10">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-soft">
            <User className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold font-tamil">
            உள்நுழையவும்
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center font-tamil">
            வாடிக்கையாளர் கணக்கு
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4 max-w-sm w-full mx-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium ml-1 font-tamil">மொபைல் எண்</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10 இலக்க எண்"
                className="w-full h-12 bg-background rounded-xl border border-input pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-display"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium ml-1 font-tamil">பாஸ்வேர்ட் (Password)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="size-4.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="பாஸ்வேர்ட் உள்ளிடவும்"
                className="w-full h-12 bg-background rounded-xl border border-input pl-10 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-display"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium font-tamil text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-soft hover:bg-primary/90 transition-all font-tamil active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                தொடரவும்
                <ArrowRight className="size-5" />
              </>
            )}
          </button>
        </form>

        {/* Link back to shop owner login for testing/owners */}
        <div className="mt-8 text-center border-t border-border pt-6">
          <p className="text-xs text-muted-foreground font-tamil mb-2">
            கடைக்காரரா நீங்கள்?
          </p>
          <a
            href="/"
            className="text-xs text-primary font-bold hover:underline font-tamil"
          >
            Shop Owner Login
          </a>
        </div>
      </div>
    </PhoneShell>
  )
}
