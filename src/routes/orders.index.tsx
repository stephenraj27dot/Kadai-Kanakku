import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell, TopBar } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { Droplets, CheckCircle, Clock, XCircle, ChevronRight, CreditCard, Banknote } from 'lucide-react'

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

  const markDelivered = async (order: Order) => {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)
    const { data: cust } = await supabase
      .from('customers')
      .select('id, user_id')
      .eq('id', (order as any).customer_id)
      .single()

    if (cust) {
      // Add debit for the delivery
      await supabase.from('txns').insert({
        customer_id: cust.id,
        user_id: cust.user_id,
        type: 'debit',
        amount: order.amount,
        note: ta ? `${order.quantity} தண்ணீர் கேன் டெலிவரி` : `${order.quantity} Water cans delivered`,
        at: Date.now(),
      })
    }
    fetchOrders()
  }

  const cancelOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    fetchOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  const statusIcon = (status: string) => {
    if (status === 'pending') return <Clock className="size-4 text-amber-500" />
    if (status === 'delivered') return <CheckCircle className="size-4 text-green-600" />
    return <XCircle className="size-4 text-red-400" />
  }

  return (
    <PhoneShell>
      <div className="flex-1 bg-muted/30 overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-primary px-5 pt-12 pb-5 text-primary-foreground rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-xl font-bold ${ta ? 'font-tamil' : ''}`}>
              {ta ? 'டெலிவரி ஆர்டர்கள்' : 'Delivery Orders'}
            </h1>
            {pendingCount > 0 && (
              <span className={`bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full ${ta ? 'font-tamil' : ''}`}>
                {pendingCount} {ta ? 'புதியது' : 'New'}
              </span>
            )}
          </div>
          <p className={`text-sm opacity-75 ${ta ? 'font-tamil' : ''}`}>
            {ta ? 'தண்ணீர் கேன் டெலிவரி நிர்வாகம்' : 'Manage your water deliveries'}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {(['pending', 'delivered', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-sm font-bold shrink-0 transition-all ${ta ? 'font-tamil' : ''} ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-background text-muted-foreground border border-border'
              }`}
            >
              {f === 'pending' ? (ta ? 'காத்திருக்கும்' : 'Pending') : f === 'delivered' ? (ta ? 'டெலிவரி ஆனது' : 'Delivered') : (ta ? 'அனைத்தும்' : 'All')}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="px-4 py-2 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
              <Droplets className="size-16 mb-4 text-primary/30" strokeWidth={1.5} />
              <p className={`font-medium ${ta ? 'font-tamil' : ''}`}>
                {ta ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No orders found'}
              </p>
            </div>
          ) : (
            filtered.map(order => (
              <div key={order.id} className="bg-background rounded-2xl border border-border p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold font-display text-foreground text-base">{order.customers?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-display">+91 {order.customers?.phone}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${order.status === 'pending' ? 'bg-amber-50' : 'bg-green-50'}`}>
                    {statusIcon(order.status)}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${order.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                      {order.status === 'pending' ? (ta ? 'காத்திருக்கிறது' : 'Pending') : (ta ? 'டெலிவரி ஆனது' : 'Delivered')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/10">
                      <Droplets className="size-4" />
                      <span className="font-black text-sm">{order.quantity}</span>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1.5 rounded-lg font-display">
                      📅 {new Date(order.delivery_date).toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-lg text-foreground font-display">₹{order.amount}</div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {order.payment_method === 'upi' ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                          <CreditCard className="size-3" />
                          {ta ? 'ஆன்லைன்' : 'ONLINE'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Banknote className="size-3" />
                          {ta ? 'நேரடி பணம்' : 'CASH'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <button
                      onClick={() => markDelivered(order)}
                      className={`flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-soft ${ta ? 'font-tamil' : ''}`}
                    >
                      <CheckCircle className="size-4" />
                      {ta ? 'டெலிவரி ஆச்சு' : 'Mark Delivered'}
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="h-11 w-11 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-95 transition-all border border-border"
                    >
                      <XCircle className="size-4" />
                    </button>
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
