import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PhoneShell } from '@/components/PhoneShell'
import { User, Lock, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/c/$shopId/login')({
  component: CustomerLogin,
})

function CustomerLogin() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()
  
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    
    // Clean phone number and create dummy email
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }
    const fakeEmail = `${cleanPhone}@kadaikanakku.com`

    let authError = null

    if (isLogin) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })
      authError = signInErr
    } else {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
      })
      authError = signUpErr
    }

    if (authError) {
      setError(authError.message === "Invalid login credentials" ? "தவறான மொபைல் எண் அல்லது பாஸ்வேர்ட்" : authError.message)
      setLoading(false)
    } else {
      // Success, go to customer dashboard
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
            {isLogin ? "உள்நுழையவும்" : "கணக்கு உருவாக்கவும்"}
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="பாஸ்வேர்ட் உள்ளிடவும்"
                className="w-full h-12 bg-background rounded-xl border border-input pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-display"
                required
                minLength={6}
              />
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
                {isLogin ? "உள்நுழைக" : "கணக்கு உருவாக்கு"}
                <ArrowRight className="size-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-tamil">
            {isLogin ? "புதிய வாடிக்கையாளரா?" : "ஏற்கனவே கணக்கு உள்ளதா?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="mt-2 text-primary font-bold text-sm hover:underline font-tamil active:scale-95 transition-transform"
          >
            {isLogin ? "புதிய கணக்கை உருவாக்கவும்" : "உள்நுழையவும்"}
          </button>
        </div>

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
