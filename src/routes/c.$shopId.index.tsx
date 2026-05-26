import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { LogOut, User, Droplets, ReceiptText, MessageSquare, Phone, ChevronRight, Clock, CheckCircle, XCircle, Settings, CreditCard, QrCode } from 'lucide-react'
import { QRScanner } from '@/components/QRScanner'
import { useI18n } from '@/lib/i18n'

export const Route = createFileRoute('/c/$shopId/')({
  component: CustomerDashboard,
})

type OrderItem = {
  id: string
  quantity: number
  delivery_date: number
  status: 'pending' | 'delivered' | 'cancelled'
  amount: number
}

type TxnItem = {
  id: string
  type: 'debit' | 'credit'
  amount: number
  note: string
  at: number
}

function CustomerDashboard() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()
  const { lang } = useI18n()
  const ta = lang === 'ta'

  const [profile, setProfile] = useState<any>(null)
  const [shopProfile, setShopProfile] = useState<any>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [txns, setTxns] = useState<TxnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'balance' | 'orders'>('balance')
  const [paying, setPaying] = useState(false)
  const [billAmount, setBillAmount] = useState('')
  const [billNote, setBillNote] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [registering, setRegistering] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => { 
    let cleanupFunc: (() => void) | void;
    let pollInterval: any;

    const init = async () => {
      cleanupFunc = await loadCustomerData();
      
      // If customer is not found yet, auto-retry every 3 seconds (so they don't have to refresh)
      if (!cleanupFunc) {
        pollInterval = setInterval(async () => {
          const cleanup = await loadCustomerData();
          if (cleanup) {
            cleanupFunc = cleanup;
            clearInterval(pollInterval);
          }
        }, 3000);
      }
    };
    init();

    return () => { 
      if (cleanupFunc) cleanupFunc();
      if (pollInterval) clearInterval(pollInterval);
    }
  }, [])

  const loadCustomerData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate({ to: `/c/${shopId}/login`, replace: true })

    // Fetch shop info (UPI ID, etc)
    const { data: sProfile } = await supabase
      .from('shop_profiles')
      .select('*')
      .eq('owner_id', shopId)
      .single()
    setShopProfile(sProfile)

    let { data: custRows } = await supabase
      .from('customers').select('*')
      .eq('user_id', shopId).eq('auth_user_id', user.id).limit(1)

    let customer = custRows && custRows.length > 0 ? custRows[0] : null

    if (!customer) {
      // Extract phone from the fake email (e.g., "9876543210@kadaikanakku.com" → "9876543210")
      const rawPhone = user.email?.split('@')[0]
      if (rawPhone) {
        const last10 = rawPhone.replace(/\D/g, '').slice(-10)

        // Fetch ALL unlinked customers for this shop, then match by last-10-digits
        // This handles any format the owner may have typed (spaces, +91, etc.)
        const { data: allUnlinked } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', shopId)
          .is('auth_user_id', null)

        if (allUnlinked && last10.length === 10) {
          const matchedRow = allUnlinked.find(c => {
            const storedClean = (c.phone || '').replace(/\D/g, '').slice(-10)
            return storedClean === last10
          })

          if (matchedRow) {
            // Link the customer row to this Supabase auth user permanently
            const { data: linked } = await supabase
              .from('customers')
              .update({ auth_user_id: user.id })
              .eq('id', matchedRow.id)
              .select()
              .single()
            if (linked) customer = linked
          }
        }
      }
    }

    if (customer) {
      setProfile(customer)

      // Fetch transactions
      const { data: txnData } = await supabase
        .from('txns').select('*')
        .eq('customer_id', customer.id)
        .order('at', { ascending: false }).limit(20)
      setTxns(txnData || [])

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders').select('*')
        .eq('customer_id', customer.id)
        .order('delivery_date', { ascending: false }).limit(10)
      setOrders(orderData || [])

      // Realtime subscription
      const channel = supabase.channel(`customer_data_${customer.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${customer.id}` }, () => {
          supabase.from('orders').select('*').eq('customer_id', customer.id).order('delivery_date', { ascending: false }).limit(10).then(({ data }) => setOrders(data || []))
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'txns', filter: `customer_id=eq.${customer.id}` }, () => {
          supabase.from('txns').select('*').eq('customer_id', customer.id).order('at', { ascending: false }).limit(20).then(({ data }) => setTxns(data || []))
        })
        .subscribe()

      setLoading(false)
      return () => { supabase.removeChannel(channel) }
    } else {
      setProfile(null)
      // Pre-fill phone if available from auth
      if (user?.email) {
        const rawPhone = user.email.split('@')[0]
        const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10)
        if (cleanPhone.length >= 10) setNewPhone(cleanPhone)
      }
      setLoading(false)
    }
  }


  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: `/c/${shopId}/login`, replace: true })
  }

  const handleAutoRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPhone.trim()) return
    setRegistering(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data, error } = await supabase.from('customers').insert({
      user_id: shopId,
      auth_user_id: user.id,
      name: newName.trim(),
      phone: newPhone.trim(),
      created_at: Date.now()
    }).select().single()
    
    if (!error && data) {
      setProfile(data)
      setTxns([])
      setOrders([])
    } else {
      alert(ta ? 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' : 'Error creating account. Please try again.')
    }
    setRegistering(false)
  }

  // Compute balance from txns
  const balance = txns.reduce((acc, t) => acc + (t.type === 'debit' ? t.amount : -t.amount), 0)
  const isOwed = balance > 0

  const handleUPILink = async (amount: number, note: string) => {
    if (!shopProfile?.upi_id) {
      alert(ta ? "கடைக்காரர் இன்னும் UPI ID-ஐ இணைக்கவில்லை." : "Shop owner hasn't linked a UPI ID yet.")
      return
    }

    const upiUrl = `upi://pay?pa=${shopProfile.upi_id}&pn=${encodeURIComponent(shopProfile.shop_name || 'Shop')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`

    // Open UPI app
    window.location.href = upiUrl

    // Show verification info dialog
    setPaying(true)
  }

  const handlePOSBaki = async () => {
    if (!billAmount || !profile) return
    setLoading(true)
    const amount = Number(billAmount)
    const note = billNote || (ta ? 'கடை பில்' : 'Shop Bill')
    
    await supabase.from('txns').insert({
      customer_id: profile.id,
      user_id: shopId,
      type: 'debit',
      amount,
      note: note,
      at: Date.now()
    })
    
    setBillAmount('')
    setBillNote('')
    alert(ta ? 'பாக்கியில் சேர்க்கப்பட்டது!' : 'Added to Baki!')
    setLoading(false)
  }

  const handlePOSUPI = async () => {
    if (!billAmount || !profile) return
    const amount = Number(billAmount)
    const note = billNote || (ta ? 'கடை பில்' : 'Shop Bill')

    if (!shopProfile?.upi_id) {
      alert(ta ? "கடைக்காரர் இன்னும் UPI ID-ஐ இணைக்கவில்லை." : "Shop owner hasn't linked a UPI ID yet.")
      return
    }

    setLoading(true)
    const now = Date.now()

    // 1. Record the sale (debit)
    await supabase.from('txns').insert({
      customer_id: profile.id,
      user_id: shopId,
      type: 'debit',
      amount,
      note: note,
      at: now
    })

    // 2. Record the payment immediately (credit)
    await supabase.from('txns').insert({
      customer_id: profile.id,
      user_id: shopId,
      type: 'credit',
      amount,
      note: ta ? `ஆன்லைன் பேமென்ட் (${note})` : `Online Payment (${note})`,
      at: now + 1
    })

    setBillAmount('')
    setBillNote('')
    
    const upiUrl = `upi://pay?pa=${shopProfile.upi_id}&pn=${encodeURIComponent(shopProfile.shop_name || 'Shop')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
    window.location.href = upiUrl
    
    setLoading(false)
  }

  const statusIcon = (s: string) => {
    if (s === 'pending') return <Clock className="size-3.5 text-amber-500" />
    if (s === 'delivered') return <CheckCircle className="size-3.5 text-green-600" />
    return <XCircle className="size-3.5 text-red-400" />
  }

  return (
    <PhoneShell hideNav>
      <div className="min-h-screen flex flex-col bg-muted/30">
        {/* Header */}
        <div className="bg-primary px-5 pt-12 pb-5 text-primary-foreground rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h1 className={`text-lg font-bold ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'என் கணக்கு' : 'My Account'}
            </h1>
            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="p-2 bg-white/20 rounded-full active:scale-95 transition-transform flex items-center justify-center">
                <QrCode className="size-4.5" />
              </button>
              <button onClick={() => navigate({ to: `/c/${shopId}/settings` })} className="p-2 bg-white/20 rounded-full active:scale-95 transition-transform">
                <Settings className="size-4.5" />
              </button>
              <button onClick={handleLogout} className="p-2 bg-white/20 rounded-full active:scale-95 transition-transform">
                <LogOut className="size-4.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">{profile?.name || (ta ? 'வாடிக்கையாளர்' : 'Customer')}</h2>
              <p className="text-xs opacity-80 font-display">+91 {profile?.phone}</p>
            </div>
          </div>
        </div>

        {loading && !paying ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-32">

            {/* Payment Info Overlay - Secure: no self-confirm */}
            {paying && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                <div className="bg-background rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="size-8 text-primary" />
                  </div>
                  <h3 className={`text-xl font-bold text-center mb-2 ${ta ? 'font-tamil' : 'font-display'}`}>
                    {ta ? 'UPI பேமென்ட்' : 'UPI Payment'}
                  </h3>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <p className={`text-xs font-bold text-amber-700 ${ta ? 'font-tamil' : 'font-display'}`}>
                      {ta 
                        ? 'UPI ஆப்பில் பணம் செலுத்தியிருந்தால், கடைக்காரர் சரிபார்த்த பிறகு உங்கள் கணக்கில் தானாக வரவு வைக்கப்படும்.'
                        : 'If you paid in your UPI app, it will be settled in your account once the shop owner verifies the payment.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setPaying(false)}
                    className={`w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft ${ta ? 'font-tamil' : 'font-display'}`}>
                    {ta ? 'சரி, புரிந்தது' : 'OK, Got it'}
                  </button>
                </div>
              </div>
            )}

            {/* POS - Ultra Simple */}
            <div className="bg-background rounded-3xl border-2 border-primary/20 shadow-lg overflow-hidden">
              {/* Amount Display */}
              <div className="bg-primary/5 px-5 pt-5 pb-4">
                <p className={`text-xs font-black text-primary/60 uppercase tracking-widest mb-2 ${ta ? 'font-tamil' : ''}`}>
                  {ta ? 'தொகை உள்ளிடுக' : 'Enter Amount'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-primary/40">₹</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={billAmount}
                    onChange={e => setBillAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-5xl font-black text-primary bg-transparent outline-none w-full placeholder:text-primary/20"
                  />
                </div>
              </div>

              {/* Two Big Action Buttons */}
              <div className="grid grid-cols-2">
                <button
                  onClick={handlePOSUPI}
                  disabled={!billAmount || loading}
                  className="py-5 bg-green-600 text-white flex flex-col items-center justify-center gap-1.5 active:brightness-90 transition-all disabled:opacity-40"
                >
                  <CreditCard className="size-6" />
                  <span className={`font-black text-sm ${ta ? 'font-tamil' : ''}`}>
                    {ta ? 'UPI Pay' : 'Pay (UPI)'}
                  </span>
                </button>
                <button
                  onClick={handlePOSBaki}
                  disabled={!billAmount || loading}
                  className="py-5 bg-primary text-primary-foreground flex flex-col items-center justify-center gap-1.5 active:brightness-90 transition-all disabled:opacity-40"
                >
                  <Clock className="size-6" />
                  <span className={`font-black text-sm ${ta ? 'font-tamil' : ''}`}>
                    {ta ? 'பாக்கி' : 'Baki'}
                  </span>
                </button>
              </div>
            </div>

            {/* Balance Card */}
            <div className={`rounded-3xl p-5 shadow-sm relative overflow-hidden ${isOwed ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
              <div className="relative z-10">
                <p className={`text-sm font-medium mb-1 ${ta ? 'font-tamil' : 'font-display'} ${isOwed ? 'text-red-500' : 'text-green-600'}`}>
                  {isOwed
                    ? (ta ? 'கொடுக்க வேண்டிய பாக்கி' : 'Pending Balance')
                    : (ta ? 'கணக்கு சரியாக உள்ளது ✓' : 'Account Settled ✓')}
                </p>
                <div className="flex items-end justify-between gap-4">
                  <h2 className={`text-5xl font-black tracking-tight font-display ${isOwed ? 'text-red-500' : 'text-green-600'}`}>
                    ₹{Math.abs(balance)}
                  </h2>
                  {isOwed && (
                    <button
                      onClick={() => handleUPILink(Math.abs(balance), `Baki Payment - ${profile.name}`)}
                      className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold shadow-soft active:scale-95 transition-all flex items-center gap-2"
                    >
                      <CreditCard className="size-4" />
                      <span className={ta ? 'font-tamil' : ''}>{ta ? 'செலுத்துக' : 'Pay Now'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions (Call / Feedback) */}
            <div className="flex gap-2">
              <a href={`tel:${shopProfile?.phone || profile?.shopPhone || ''}`}
                className="flex-1 h-12 bg-background border border-border rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm">
                <Phone className="size-4.5 text-primary" />
                <span className={`text-xs font-bold ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'அழைக்க' : 'Call'}
                </span>
              </a>
              <button
                onClick={() => navigate({ to: `/c/${shopId}/feedback` })}
                className="flex-1 h-12 bg-background border border-border rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm">
                <MessageSquare className="size-4.5 text-primary" />
                <span className={`text-xs font-bold ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'புகார் / கருத்து' : 'Feedback'}
                </span>
              </button>
            </div>

            {/* Order Water Button */}
            <button
              onClick={() => navigate({ to: `/c/${shopId}/order` })}
              className="w-full h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-between px-5 shadow-soft active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <Droplets className="size-5" />
                <span className={`font-bold ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'தண்ணீர் கேன் ஆர்டர் செய்' : 'Order Water Can'}
                </span>
              </div>
              <ChevronRight className="size-5 opacity-70" />
            </button>

            {/* Tabs */}
            <div className="flex gap-2">
              {(['balance', 'orders'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${ta ? 'font-tamil' : 'font-display'} ${tab === t ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-background text-muted-foreground border border-border'}`}>
                  {t === 'balance' 
                    ? (ta ? 'பரிவர்த்தனைகள்' : 'Transactions') 
                    : (ta ? 'ஆர்டர்கள்' : 'Orders')}
                </button>
              ))}
            </div>

            {/* Transactions */}
            {tab === 'balance' && (
              <div className="space-y-2">
                {txns.length === 0 ? (
                  <div className="flex flex-col items-center py-10 opacity-40">
                    <ReceiptText className="size-12 mb-3" strokeWidth={1} />
                    <p className={`text-sm ${ta ? 'font-tamil' : 'font-display'}`}>
                      {ta ? 'பரிவர்த்தனைகள் இல்லை' : 'No transactions'}
                    </p>
                  </div>
                ) : txns.map(t => (
                  <div key={t.id} className="bg-background rounded-2xl p-4 border border-border flex items-center justify-between shadow-sm">
                    <div>
                      <p className={`text-sm font-medium ${ta ? 'font-tamil' : 'font-display'}`}>
                        {t.note || (t.type === 'debit' 
                          ? (ta ? 'பாக்கி சேர்க்கப்பட்டது' : 'Balance Added') 
                          : (ta ? 'பணம் செலுத்தப்பட்டது' : 'Payment Received'))}
                      </p>
                      <p className="text-xs text-muted-foreground font-display mt-0.5">{new Date(t.at).toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}</p>
                    </div>
                    <span className={`font-bold font-display ${t.type === 'debit' ? 'text-red-500' : 'text-green-600'}`}>
                      {t.type === 'debit' ? '+' : '-'}₹{t.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Orders */}
            {tab === 'orders' && (
              <div className="space-y-3 pb-8">
                {orders.length === 0 && (
                  <div className={`text-center py-10 opacity-60 text-sm ${ta ? 'font-tamil' : 'font-display'}`}>
                    {ta ? 'ஆர்டர்கள் ஏதுமில்லை' : 'No orders found'}
                  </div>
                )}
                {orders.map(o => (
                  <div key={o.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex justify-between items-center">
                    <div>
                      <div className={`font-bold flex items-center gap-2 ${ta ? 'font-tamil' : 'font-display'}`}>
                        <Droplets className="size-4 text-primary" /> {o.quantity} {ta ? 'கேன்' : 'Cans'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-display">
                        {statusIcon(o.status)} {o.status.toUpperCase()} • {new Date(o.delivery_date).toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}
                      </div>
                    </div>
                    <div className="font-bold font-display">₹{o.amount}</div>
                  </div>
                ))}
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="size-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-6 shadow-soft rotate-3">
              <User className="size-10" />
            </div>
            <h3 className={`text-2xl font-black tracking-tight mb-2 ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'கணக்கு தொடங்கவும்' : 'Join Shop'}
            </h3>
            <p className={`text-muted-foreground text-sm text-center mb-8 ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta 
                ? 'உங்கள் பெயரை பதிவு செய்து கணக்கை தொடங்கவும்.' 
                : 'Enter your name to start tracking your purchases.'}
            </p>
            
            <form onSubmit={handleAutoRegister} className="w-full max-w-sm">
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-sm font-bold ml-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                    {ta ? 'உங்கள் பெயர்' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={ta ? "பெயரை உள்ளிடவும்" : "Enter your name"}
                    className="w-full h-14 bg-background rounded-2xl border-2 border-primary/20 px-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-display shadow-sm"
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className={`text-sm font-bold ml-1 ${ta ? 'font-tamil' : 'font-display'}`}>
                    {ta ? 'மொபைல் எண்' : 'Mobile Number'}
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={ta ? "மொபைல் எண்" : "Enter mobile number"}
                    className="w-full h-14 bg-background rounded-2xl border-2 border-primary/20 px-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-display shadow-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={registering || !newName.trim() || !newPhone.trim()}
                className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg press-scale disabled:opacity-50"
              >
                {registering ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  ta ? 'உறுதி செய்' : 'Join Now'
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {showScanner && (
        <QRScanner 
          ta={ta} 
          onClose={() => setShowScanner(false)} 
          onScan={(text) => {
            if (text.includes('upi://')) {
              window.location.href = text;
            } else if (text.startsWith('http')) {
              window.location.href = text;
            } else {
              alert(ta ? 'தவறான QR கோடு' : 'Invalid QR Code');
            }
          }} 
        />
      )}
    </PhoneShell>
  )
}
