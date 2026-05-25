import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Droplets, Calendar, Minus, Plus, CheckCircle, ChevronLeft, CreditCard, Banknote } from 'lucide-react'
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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [shopProfile, setShopProfile] = useState<any>(null)

  useEffect(() => {
    async function loadShopProfile() {
      const { data } = await supabase
        .from('shop_profiles')
        .select('*')
        .eq('owner_id', shopId)
        .single()
      if (data) {
        setShopProfile(data)
      }
    }
    loadShopProfile()
  }, [shopId])

  const canPrice = shopProfile?.can_price || 30
  const totalAmount = quantity * canPrice

  const handleOrder = async (isAlreadyPaid = false) => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate({ to: `/c/${shopId}/login`, replace: true })

    // Find customer profile
    const { data: custRows } = await supabase
      .from('customers')
      .select('id, name')
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

    // 1. Place Order
    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      shop_owner_id: shopId,
      customer_id: customer.id,
      quantity,
      delivery_date: new Date(deliveryDate).getTime(),
      amount: totalAmount,
      status: 'pending',
      payment_method: paymentMethod,
      created_at: Date.now(),
    }).select().single()

    if (orderError) {
      setError(ta ? 'ஆர்டர் அனுப்ப முடியவில்லை.' : 'Could not place order.')
      setLoading(false)
      return
    }

    // 2. If UPI payment was successful, record the credit transaction
    if (isAlreadyPaid) {
      await supabase.from('txns').insert({
        customer_id: customer.id,
        user_id: shopId,
        type: 'credit',
        amount: totalAmount,
        note: ta ? `Online Payment - ${quantity} Can Order` : `Online Payment - ${quantity} Can Order`,
        at: Date.now()
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleUPIFlow = () => {
    if (!shopProfile?.upi_id) {
      alert(ta ? "கடைக்காரர் இன்னும் UPI ID-ஐ இணைக்கவில்லை. Cash on Delivery பயன்படுத்தவும்." : "Shop owner hasn't linked a UPI ID yet. Please use Cash on Delivery.")
      return
    }

    const note = `Water Order - ${quantity} Cans`
    const upiUrl = `upi://pay?pa=${shopProfile.upi_id}&pn=${encodeURIComponent(shopProfile.shop_name || 'Shop')}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(note)}`

    window.location.href = upiUrl
    setPaying(true)
  }

  if (success) {
    return (
      <PhoneShell hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 bg-gradient-to-b from-background to-muted/30">
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle className="size-14 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className={`text-2xl font-bold ${ta ? 'font-tamil' : 'font-display'} text-foreground`}>
              {ta ? 'ஆர்டர் அனுப்பப்பட்டது!' : 'Order Placed!'}
            </h2>
            <p className={`text-sm text-muted-foreground ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta
                ? `${quantity} கேன் தண்ணீர் - ${new Date(deliveryDate).toLocaleDateString('ta-IN')} அன்று டெলিவரி செய்யப்படும்.`
                : `${quantity} can(s) of water will be delivered on ${new Date(deliveryDate).toLocaleDateString('en-IN')}.`}
            </p>
            <div className="mt-4 p-3 bg-card rounded-2xl border border-border inline-block px-6">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{ta ? 'பணம் செலுத்தும் முறை' : 'Payment Method'}</p>
              <p className="font-bold text-primary">{paymentMethod === 'upi' ? (ta ? 'ஆன்லைன் மூலம் செலுத்தினீர்கள்' : 'Paid via UPI') : (ta ? 'நேரடியாக பணம் செலுத்துதல்' : 'Cash on Delivery')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: `/c/${shopId}`, replace: true })}
            className={`w-full max-w-xs h-12 bg-primary text-primary-foreground font-bold rounded-xl shadow-soft active:scale-95 transition-all ${ta ? 'font-tamil' : 'font-display'}`}
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

        {/* UPI Confirmation Overlay */}
        {paying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="bg-background rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="size-8 text-primary" />
              </div>
              <h3 className={`text-xl font-bold text-center mb-2 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'பணம் செலுத்திவிட்டீர்களா?' : 'Payment Completed?'}
              </h3>
              <p className={`text-sm text-center text-muted-foreground mb-6 ${ta ? 'font-tamil' : 'font-display'}`}>
                {ta ? 'பணம் செலுத்தியிருந்தால் மட்டுமே ஆர்டர் உறுதி செய்யப்படும்.' : 'Order will be placed only after payment is confirmed.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaying(false)}
                  className={`h-12 rounded-xl border border-border font-bold ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'இல்லை' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleOrder(true)}
                  className={`h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'ஆம், செலுத்தினேன்' : 'Yes, Paid'}
                </button>
              </div>
            </div>
          </div>
        )}

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

        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
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
            <div className={`mt-4 pt-4 border-t border-dashed border-border flex justify-between items-center ${ta ? 'font-tamil' : 'font-display'}`}>
              <span className="text-muted-foreground">{ta ? 'மொத்த தொகை:' : 'Total Amount:'}</span>
              <span className="text-xl font-black text-foreground">₹{totalAmount}</span>
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

          {/* Payment Method Selector */}
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className={`text-sm font-semibold text-muted-foreground mb-3 ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'பணம் செலுத்தும் முறை' : 'Payment Method'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}
              >
                <Banknote className={`size-6 ${paymentMethod === 'cod' ? 'text-primary' : ''}`} />
                <span className={`text-xs font-bold ${ta ? 'font-tamil' : ''}`}>{ta ? 'நேரடி பணம்' : 'Cash'}</span>
              </button>
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}
              >
                <CreditCard className={`size-6 ${paymentMethod === 'upi' ? 'text-primary' : ''}`} />
                <span className={`text-xs font-bold ${ta ? 'font-tamil' : ''}`}>{ta ? 'ஆன்லைன்' : 'Online'}</span>
              </button>
            </div>
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
            onClick={() => paymentMethod === 'upi' ? handleUPIFlow() : handleOrder()}
            disabled={loading}
            className={`w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl shadow-soft flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 ${ta ? 'font-tamil' : 'font-display'}`}
          >
            {loading ? (
              <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {paymentMethod === 'upi' ? <CreditCard className="size-5" /> : <Droplets className="size-5" />}
                {paymentMethod === 'upi' ? (ta ? 'பணம் செலுத்தி ஆர்டர் செய்' : 'Pay & Order') : (ta ? 'ஆர்டர் செய்யவும்' : 'Place Order')}
              </>
            )}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
