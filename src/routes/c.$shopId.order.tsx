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
      const msg = ta ? 'உங்கள் கணக்கு கிடைக்கவில்லை.' : 'Your account was not found.'
      setError(msg)
      alert(msg)
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
      console.error("Order Insert Error:", orderError)
      const errorMsg = ta ? `பிழை: ${orderError.message}` : `Error: ${orderError.message}`
      setError(errorMsg)
      alert(errorMsg) // Show exact error to user
      setLoading(false)
      return
    }

    // Removed insecure client-side txn insertion. Shop owner will verify and add credit.

    setSuccess(true)
    setLoading(false)
  }

  const handleUPIFlow = () => {
    if (!shopProfile?.upi_id) {
      alert(ta ? "கடைக்காரர் இன்னும் UPI ID-ஐ இணைக்கவில்லை." : "Shop owner hasn't linked a UPI ID yet.")
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
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${ta ? 'font-tamil' : 'font-display'} text-foreground`}>
              {ta ? 'ஆர்டர் அனுப்பப்பட்டது!' : 'Order Placed!'}
            </h2>
            <p className={`text-sm text-muted-foreground ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta
                ? `${quantity} கேன் தண்ணீர் - ${new Date(deliveryDate).toLocaleDateString('ta-IN')} அன்று டெலிவரி செய்யப்படும்.`
                : `${quantity} can(s) of water will be delivered on ${new Date(deliveryDate).toLocaleDateString('en-IN')}.`}
            </p>
            {paymentMethod === 'upi' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className={`text-xs font-bold text-amber-700 ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta 
                    ? 'உங்கள் ஆன்லைன் பேமென்ட் கடைக்காரரால் சரிபார்க்கப்பட்ட பிறகு கணக்கில் வரவு வைக்கப்படும் (Settled).'
                    : 'Your online payment will be settled in your account once verified by the shop owner.'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate({ to: `/c/${shopId}`, replace: true })}
            className="w-full max-w-xs h-12 bg-primary text-primary-foreground font-bold rounded-xl mt-4"
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
        {/* UPI Overlay */}
        {paying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="bg-background rounded-3xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold text-center mb-4">{ta ? 'பணம் செலுத்திவிட்டீர்களா?' : 'Payment Completed?'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaying(false)} className="h-12 rounded-xl border border-border font-bold">{ta ? 'இல்லை' : 'Cancel'}</button>
                <button onClick={() => handleOrder(true)} className="h-12 rounded-xl bg-primary text-primary-foreground font-bold">{ta ? 'ஆம், செலுத்தினேன்' : 'Yes, Paid'}</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-primary px-6 pt-12 pb-8 text-primary-foreground rounded-b-3xl">
          <button onClick={() => navigate({ to: `/c/${shopId}`, replace: true })} className="mb-4 flex items-center gap-1 text-sm opacity-80">
            <ChevronLeft className="size-4" /> <span>{ta ? 'திரும்பு' : 'Back'}</span>
          </button>
          <h1 className="text-xl font-bold">{ta ? 'தண்ணீர் கேன் ஆர்டர்' : 'Water Can Order'}</h1>
        </div>

        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
          {/* Quantity Selector */}
          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className="text-sm font-semibold mb-4">{ta ? 'எத்தனை கேன் வேண்டும்?' : 'How many cans?'}</p>
            <div className="flex items-center justify-between">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="size-14 rounded-2xl bg-muted flex items-center justify-center"><Minus className="size-5" /></button>
              <span className="text-6xl font-black text-primary">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><Plus className="size-5" /></button>
            </div>
            <div className="mt-4 pt-4 border-t border-dashed border-border flex justify-between items-center font-bold">
              <span>{ta ? 'மொத்த தொகை:' : 'Total Amount:'}</span>
              <span className="text-xl">₹{totalAmount}</span>
            </div>
          </div>

          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className="text-sm font-semibold mb-3">{ta ? 'எந்த தேதியில் வேண்டும்?' : 'Delivery Date'}</p>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full h-12 bg-muted rounded-xl px-4" />
          </div>

          <div className="bg-background rounded-3xl p-5 border border-border shadow-sm">
            <p className="text-sm font-semibold mb-3">{ta ? 'பணம் செலுத்தும் முறை' : 'Payment Method'}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('cod')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border opacity-60'}`}>
                <Banknote className="size-6" /> <span>{ta ? 'நேரடி பணம்' : 'Cash'}</span>
              </button>
              <button onClick={() => setPaymentMethod('upi')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border opacity-60'}`}>
                <CreditCard className="size-6" /> <span>{ta ? 'ஆன்லைன்' : 'Online'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8">
          <button onClick={() => paymentMethod === 'upi' ? handleUPIFlow() : handleOrder()} disabled={loading} className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl">
            {loading ? <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : (ta ? 'ஆர்டர் செய்யவும்' : 'Place Order')}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
