import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Droplets, Calendar, Minus, Plus, CheckCircle, ChevronLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export const Route = createFileRoute('/c/$shopId/order')({
  component: CustomerOrder,
})

function CustomerOrder() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()
  const { lang } = useI18n()
  const ta = lang === 'ta'

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
    const { data: custRows } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', shopId)
      .eq('auth_user_id', user.id)
      .limit(1)

    const customer = custRows && custRows.length > 0 ? custRows[0] : null

    if (!customer) {
      setError(ta
        ? 'உங்கள் கணக்கு கிடைக்கவில்லை. கடைக்காரரை தொடர்பு கொள்ளவும்.'
        : 'Your account was not found. Please contact the shop owner.')
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
      setError(ta
        ? 'ஆர்டர் அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        : 'Could not place order. Please try again.')
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
            <h2 className={`text-2xl font-bold ${ta ? 'font-tamil' : 'font-display'} text-foreground`}>
              {ta ? 'ஆர்டர் அனுப்பப்பட்டது!' : 'Order Placed!'}
            </h2>
            <p className={`mt-2 text-sm text-muted-foreground ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta
                ? `${quantity} கேன் தண்ணீர் - ${new Date(deliveryDate).toLocaleDateString('ta-IN')} அன்று டெலிவரி செய்யப்படும்.`
                : `${quantity} can(s) of water will be delivered on ${new Date(deliveryDate).toLocaleDateString('en-IN')}.`}
            </p>
          </div>
          <button
            onClick={() => navigate({ to: `/c/${shopId}`, replace: true })}
            className={`w-full max-w-xs h-12 bg-primary text-primary-foreground font-bold rounded-xl ${ta ? 'font-tamil' : 'font-display'}`}
          >
            {ta ? 'முகப்பு பக்கத்திற்கு செல்லவும்' : 'Back to Home'}
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
          <button
            onClick={() => navigate({ to: `/c/${shopId}`, replace: true })}
            className="mb-4 flex items-center gap-1 text-sm opacity-80"
          >
            <ChevronLeft className="size-4" />
            <span className={ta ? 'font-tamil' : 'font-display'}>{ta ? 'திரும்பு' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Droplets className="size-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'தண்ணீர் கேன் ஆர்டர்' : 'Water Can Order'}
              </h1>
              <p className={`text-sm opacity-80 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'டெலிவரி கோரிக்கை' : 'Delivery Request'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-6 space-y-5">
          {/* Quantity Selector */}
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className={`text-sm font-semibold text-muted-foreground mb-4 ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'எத்தனை கேன் வேண்டும்?' : 'How many cans?'}
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="size-14 rounded-2xl bg-muted flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus className="size-5" />
              </button>
              <div className="text-center">
                <span className="text-6xl font-black text-primary tracking-tight">{quantity}</span>
                <p className={`text-sm text-muted-foreground mt-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'கேன்' : 'cans'}
                </p>
              </div>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform shadow-soft"
              >
                <Plus className="size-5" />
              </button>
            </div>
            <div className={`mt-4 text-center text-sm text-muted-foreground ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'மொத்தம்:' : 'Total:'}{' '}
              <span className="font-bold text-foreground">₹{quantity * PRICE_PER_CAN}</span>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className={`text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 ${ta ? 'font-tamil' : 'font-display'}`}>
              <Calendar className="size-4" />
              {ta ? 'எந்த தேதியில் வேண்டும்?' : 'Delivery Date'}
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
            <div className={`p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100 ${ta ? 'font-tamil' : 'font-display'}`}>
              {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="px-5 pb-8">
          <button
            onClick={handleOrder}
            disabled={loading}
            className={`w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl shadow-soft flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 ${ta ? 'font-tamil' : 'font-display'}`}
          >
            {loading ? (
              <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Droplets className="size-5" />
                {ta ? 'ஆர்டர் செய்யவும்' : 'Place Order'}
              </>
            )}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
