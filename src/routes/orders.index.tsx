import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell, TopBar } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { Droplets, CheckCircle, Clock, XCircle, ChevronRight, CreditCard, Banknote, Check } from 'lucide-react'

export const Route = createFileRoute('/orders/')({
  component: OrdersDashboard,
})

type Order = {
  id: string
  quantity: number
  delivery_date: number
  status: 'pending' | 'delivered' | 'cancelled'
  amount: number
  payment_method?: 'cod' | 'upi'
  customer_id: string
  shop_owner_id: string
  created_at: number
  customers: { name: string; phone: string } | null
}

function OrdersDashboard() {
  const { session } = useAuth()
  const { lang } = useI18n()
  const ta = lang === 'ta'
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'delivered' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    if (!session) return
    const channel = supabase.channel(`shop_orders_${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_owner_id=eq.${session.user.id}` }, () => {
        fetchOrders()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])

  const fetchOrders = async () => {
    if (!session) return
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, customers(name, phone)')
      .eq('shop_owner_id', session.user.id)
      .order('delivery_date', { ascending: true })
    setOrders(data || [])
    setLoading(false)
  }

  const handleDelivery = async (order: Order, collectedCash: boolean) => {
    setProcessingId(order.id)

    // 1. Update Order Status
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)

    // 2. Add Debit (Kanakku entry for the delivery)
    await supabase.from('txns').insert({
      customer_id: order.customer_id,
      user_id: order.shop_owner_id,
      type: 'debit',
      amount: order.amount,
      note: ta ? `${order.quantity} தண்ணீர் கேன் டெலிவரி` : `${order.quantity} Water cans delivered`,
      at: Date.now(),
    })

    // 3. If Cash collected or UPI (already handled at order time, but for safety), add Credit
    // If it was UPI, the credit is usually added at the time of order in the customer side.
    // If it's COD and owner says "Yes, I got cash", we add credit now.
    if (collectedCash) {
      await supabase.from('txns').insert({
        customer_id: order.customer_id,
        user_id: order.shop_owner_id,
        type: 'credit',
        amount: order.amount,
        note: ta ? 'நேரடியாகப் பெற்ற பணம் (Cash)' : 'Received Cash on Delivery',
        at: Date.now() + 1, // slight offset to ensure it follows debit
      })
    }

    setProcessingId(null)
    fetchOrders()
  }

  const cancelOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    fetchOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <PhoneShell>
      <div className="flex-1 bg-muted/30 overflow-y-auto pb-24">
        <div className="bg-primary px-5 pt-12 pb-5 text-primary-foreground rounded-b-3xl shadow-sm">
          <h1 className={`text-xl font-bold ${ta ? 'font-tamil' : ''}`}>{ta ? 'டெலிவரி ஆர்டர்கள்' : 'Delivery Orders'}</h1>
          <p className="text-sm opacity-75">{ta ? 'தண்ணீர் கேன் நிர்வாகம்' : 'Manage your deliveries'}</p>
        </div>

        <div className="px-4 pt-4 pb-2 flex gap-2">
          {(['pending', 'delivered', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-background text-muted-foreground border border-border'}`}>
              {f === 'pending' ? (ta ? 'காத்திருக்கும்' : 'Pending') : f === 'delivered' ? (ta ? 'டெலிவரி ஆனது' : 'Delivered') : (ta ? 'அனைத்தும்' : 'All')}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-40"><Droplets className="size-16 mb-4" /><p>{ta ? 'ஆர்டர்கள் இல்லை' : 'No orders'}</p></div>
          ) : (
            filtered.map(order => (
              <div key={order.id} className="bg-background rounded-2xl border border-border p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-base">{order.customers?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-display">+91 {order.customers?.phone}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 ${order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {order.status === 'pending' ? <Clock className="size-3" /> : <CheckCircle className="size-3" />}
                    <span className="text-[10px] font-bold uppercase">{order.status}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-bold flex items-center gap-1.5">
                      <Droplets className="size-4" /> {order.quantity}
                    </div>
                    <div className="bg-muted px-2 py-1 rounded-lg text-xs font-bold text-muted-foreground">
                      📅 {new Date(order.delivery_date).toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-foreground">₹{order.amount}</p>
                    <p className={`text-[10px] font-bold flex items-center justify-end gap-1 ${order.payment_method === 'upi' ? 'text-green-600' : 'text-amber-600'}`}>
                      {order.payment_method === 'upi' ? <CreditCard className="size-3" /> : <Banknote className="size-3" />}
                      {order.payment_method === 'upi' ? 'ONLINE' : 'CASH'}
                    </p>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{ta ? 'டெலிவரி செய்யும்போது:' : 'Action:'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelivery(order, true)}
                        disabled={!!processingId}
                        className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-soft"
                      >
                        <Check className="size-4" /> {ta ? 'பணம் வாங்கினேன்' : 'Got Cash'}
                      </button>
                      <button
                        onClick={() => handleDelivery(order, false)}
                        disabled={!!processingId}
                        className="flex-1 h-11 bg-background border border-primary text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Clock className="size-4" /> {ta ? 'பாக்கி (Baki)' : 'Add to Baki'}
                      </button>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="h-11 w-11 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-95 border border-border"
                      >
                        <XCircle className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </PhoneShell>
  )
}
