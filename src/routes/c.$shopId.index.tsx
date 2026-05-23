import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { LogOut, User, ReceiptText } from 'lucide-react'

export const Route = createFileRoute('/c/$shopId/')({
  component: CustomerDashboard,
})

function CustomerDashboard() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate({ to: `/c/${shopId}/login`, replace: true })

    // 1. Try to find an already linked profile for this shop
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', shopId)
      .eq('auth_user_id', user.id)
      .single()

    // 2. If not found, try to auto-link using phone number
    if (!customer) {
      const phone = user.email?.split('@')[0]
      if (phone) {
        const { data: matchedCustomer } = await supabase
          .from('customers')
          .update({ auth_user_id: user.id })
          .eq('user_id', shopId)
          .eq('phone', phone)
          .is('auth_user_id', null)
          .select()
          .single()

        if (matchedCustomer) {
          customer = matchedCustomer
        }
      }
    }

    setProfile(customer)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: `/c/${shopId}/login`, replace: true })
  }

  return (
    <PhoneShell>
      <div className="flex-1 bg-muted/30 overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-primary px-6 pt-12 pb-6 text-primary-foreground rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold font-tamil">என் கணக்கு</h1>
            <button onClick={handleLogout} className="p-2 bg-white/20 rounded-full active:scale-95 transition-transform">
              <LogOut className="size-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">{profile?.name || "வாடிக்கையாளர்"}</h2>
              <p className="text-sm opacity-90 font-display">{profile?.phone}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="px-4 py-6 space-y-6">
            {/* Balance Card */}
            <div className="bg-background p-6 rounded-3xl shadow-sm border border-border">
              <p className="text-sm font-medium text-muted-foreground font-tamil mb-1">கொடுக்க வேண்டிய பாக்கி</p>
              <h2 className={`text-4xl font-black tracking-tight font-display ${profile.balance > 0 ? "text-red-500" : "text-green-600"}`}>
                ₹{profile.balance || 0}
              </h2>
            </div>

            {/* Empty State for Orders/Txns */}
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <ReceiptText className="size-16 mb-4" strokeWidth={1} />
              <p className="font-tamil font-medium">பரிவர்த்தனைகள் எதுவும் இல்லை</p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <div className="size-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="size-8" />
            </div>
            <h3 className="text-lg font-bold font-tamil mb-2">கணக்கு கிடைக்கவில்லை</h3>
            <p className="text-muted-foreground font-tamil text-sm">
              இந்த கடையின் வாடிக்கையாளர் பட்டியலில் உங்கள் மொபைல் எண் இல்லை. கடைக்காரரை தொடர்பு கொள்ளவும்.
            </p>
          </div>
        )}
      </div>
    </PhoneShell>
  )
}
