import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Droplets, Calendar, Minus, Plus, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/c/$shopId/order')({
  component: CustomerOrder,
})

function CustomerOrder() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()

  const [quantity, setQuantity] = useState(1)
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const PRICE_PER_CAN = 30 // Shop owner can configure this later

  const handleOrder = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate({ to: `/c/${shopId}/login`, replace: true })

    // Find customer profile
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', shopId)
      .eq('auth_user_id', user.id)
      .single()

    if (!customer) {
      setError('உங்கள் கணக்கு கிடைக்கவில்லை. கடைக்காரரை தொடர்பு கொள்ளவும்.')
      setLoading(false)
      return
    }

    const { error: orderError } = await supabase.from('orders').insert({
      shop_owner_id: shopId,
      customer_id: customer.id,
      quantity,
      delivery_date: new Date(deliveryDate).getTime(),
      amount: quantity * PRICE_PER_CAN,
      status: 'pending',
      created_at: Date.now(),
    })

    if (orderError) {
      setError('ஆர்டர் அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <PhoneShell hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 bg-gradient-to-b from-background to-muted/30">
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="size-14 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-tamil text-foreground">ஆர்டர் அனுப்பப்பட்டது!</h2>
            <p className="mt-2 text-sm text-muted-foreground font-tamil">
              {quantity} கேன் தண்ணீர் - {new Date(deliveryDate).toLocaleDateString('ta-IN')} அன்று டெலிவரி செய்யப்படும்.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: `/c/${shopId}`, replace: true })}
            className="w-full max-w-xs h-12 bg-primary text-primary-foreground font-bold rounded-xl font-tamil"
          >
            முகப்பு பக்கத்திற்கு செல்லவும்
          </button>
        </div>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="bg-primary px-6 pt-12 pb-8 text-primary-foreground rounded-b-3xl">
          <button onClick={() => navigate({ to: `/c/${shopId}`, replace: true })} className="mb-4 text-sm opacity-80 font-tamil">← திரும்பு</button>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Droplets className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-tamil">தண்ணீர் கேன் ஆர்டர்</h1>
              <p className="text-sm opacity-80 font-tamil">டெலிவரி கோரிக்கை</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-6 space-y-5">
          {/* Quantity Selector */}
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground mb-4 font-tamil">எத்தனை கேன் வேண்டும்?</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="size-14 rounded-2xl bg-muted flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus className="size-5" />
              </button>
              <div className="text-center">
                <span className="text-6xl font-black text-primary tracking-tight">{quantity}</span>
                <p className="text-sm text-muted-foreground font-tamil mt-1">கேன்</p>
              </div>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform shadow-soft"
              >
                <Plus className="size-5" />
              </button>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground font-tamil">
              மொத்தம்: <span className="font-bold text-foreground">₹{quantity * PRICE_PER_CAN}</span>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground mb-3 font-tamil flex items-center gap-2">
              <Calendar className="size-4" /> எந்த தேதியில் வேண்டும்?
            </p>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-12 bg-muted rounded-xl px-4 text-base font-display focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium font-tamil text-center border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="px-5 pb-8">
          <button
            onClick={handleOrder}
            disabled={loading}
            className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl shadow-soft flex items-center justify-center gap-2 font-tamil active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? (
              <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Droplets className="size-5" />
                ஆர்டர் செய்யவும்
              </>
            )}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
