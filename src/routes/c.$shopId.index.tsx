import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { LogOut, User, Droplets, ReceiptText, MessageSquare, Phone, ChevronRight, Clock, CheckCircle, XCircle, Settings } from 'lucide-react'
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
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [txns, setTxns] = useState<TxnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'balance' | 'orders'>('balance')

  useEffect(() => { loadCustomerData() }, [])

  const loadCustomerData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate({ to: `/c/${shopId}/login`, replace: true })

    let { data: custRows } = await supabase
      .from('customers').select('*')
      .eq('user_id', shopId).eq('auth_user_id', user.id).limit(1)

    let customer = custRows && custRows.length > 0 ? custRows[0] : null

    if (!customer) {
      const phone = user.email?.split('@')[0]
      if (phone) {
        const { data: matched } = await supabase
          .from('customers').update({ auth_user_id: user.id })
          .eq('user_id', shopId).eq('phone', phone).is('auth_user_id', null)
          .select()
        if (matched && matched.length > 0) customer = matched[0]
      }
    }

    if (customer) {
      setProfile(customer)

      // Fetch transactions
      const { data: txnData } = await supabase
        .from('txns').select('*')
        .eq('customer_id', customer.id)
        .order('at', { ascending: false }).limit(10)
      setTxns(txnData || [])

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders').select('*')
        .eq('customer_id', customer.id)
        .order('delivery_date', { ascending: false }).limit(10)
      setOrders(orderData || [])
    } else {
      setProfile(null)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: `/c/${shopId}/login`, replace: true })
  }

  // Compute balance from txns
  const balance = txns.reduce((acc, t) => acc + (t.type === 'debit' ? t.amount : -t.amount), 0)
  const isOwed = balance > 0

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

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-32">
            {/* Balance Card */}
            <div className={`rounded-3xl p-5 shadow-sm ${isOwed ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
              <p className={`text-sm font-medium mb-1 ${ta ? 'font-tamil' : 'font-display'} ${isOwed ? 'text-red-500' : 'text-green-600'}`}>
                {isOwed 
                  ? (ta ? 'கொடுக்க வேண்டிய பாக்கி' : 'Pending Balance') 
                  : (ta ? 'கணக்கு சரியாக உள்ளது ✓' : 'Account Settled ✓')}
              </p>
              <h2 className={`text-5xl font-black tracking-tight font-display ${isOwed ? 'text-red-500' : 'text-green-600'}`}>
                ₹{Math.abs(balance)}
              </h2>
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

            {/* Contact & Feedback */}
            <div className="space-y-2 pt-2">
              <a href={`tel:${profile?.shopPhone || ''}`}
                className="w-full h-12 bg-background border border-border rounded-2xl flex items-center gap-3 px-4 active:scale-95 transition-transform shadow-sm">
                <Phone className="size-4.5 text-primary" />
                <span className={`text-sm font-medium ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'கடைக்காரரை அழைக்கவும்' : 'Call Shop Owner'}
                </span>
              </a>
              <button
                onClick={() => navigate({ to: `/c/${shopId}/feedback` })}
                className="w-full h-12 bg-background border border-border rounded-2xl flex items-center gap-3 px-4 active:scale-95 transition-transform shadow-sm">
                <MessageSquare className="size-4.5 text-primary" />
                <span className={`text-sm font-medium ${ta ? 'font-tamil' : 'font-display'}`}>
                  {ta ? 'புகார் / கருத்து தெரிவிக்கவும்' : 'Send Feedback / Complaint'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="size-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <User className="size-8" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta ? 'கணக்கு கிடைக்கவில்லை' : 'Account Not Found'}
            </h3>
            <p className={`text-muted-foreground text-sm ${ta ? 'font-tamil' : 'font-display'}`}>
              {ta 
                ? 'இந்த கடையின் வாடிக்கையாளர் பட்டியலில் உங்கள் மொபைல் எண் இல்லை. கடைக்காரரை தொடர்பு கொள்ளவும்.' 
                : 'Your phone number is not registered in this shop. Please contact the shop owner.'}
            </p>
          </div>
        )}
      </div>
    </PhoneShell>
  )
}
