import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell, TopBar } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Droplets, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/orders/')({
  component: OrdersDashboard,
})

type Order = {
  id: string
  quantity: number
  delivery_date: number
  status: 'pending' | 'delivered' | 'cancelled'
  amount: number
  created_at: number
  customers: { name: string; phone: string } | null
}

function OrdersDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'delivered' | 'all'>('pending')

  useEffect(() => {
    fetchOrders()
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
    // 1. Update order status
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)

    // 2. Add debit transaction to customer balance
    const { data: cust } = await supabase
      .from('customers')
      .select('id, user_id')
      .eq('id', (order as any).customer_id)
      .single()

    if (cust) {
      await supabase.from('txns').insert({
        customer_id: cust.id,
        user_id: cust.user_id,
        type: 'debit',
        amount: order.amount,
        note: `${order.quantity} தண்ணீர் கேன் டெலிவரி`,
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

  const statusLabel = (status: string) => {
    if (status === 'pending') return 'காத்திருக்கிறது'
    if (status === 'delivered') return 'டெலிவரி ஆனது'
    return 'ரத்து செய்யப்பட்டது'
  }

  return (
    <PhoneShell>
      <div className="flex-1 bg-muted/30 overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-primary px-5 pt-12 pb-5 text-primary-foreground rounded-b-3xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold font-tamil">டெலிவரி ஆர்டர்கள்</h1>
            {pendingCount > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full font-tamil">
                {pendingCount} புதிய ஆர்டர்
              </span>
            )}
          </div>
          <p className="text-sm opacity-75 font-tamil">தண்ணீர் கேன் டெலிவரி நிர்வாகம்</p>
        </div>

        {/* Filter tabs */}
        <div className="px-4 pt-4 pb-2 flex gap-2">
          {(['pending', 'delivered', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all font-tamil ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-background text-muted-foreground border border-border'
              }`}
            >
              {f === 'pending' ? 'காத்திருக்கும்' : f === 'delivered' ? 'டெலிவரி ஆனது' : 'அனைத்தும்'}
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
              <Droplets className="size-16 mb-4" strokeWidth={1} />
              <p className="font-tamil font-medium">ஆர்டர்கள் எதுவும் இல்லை</p>
            </div>
          ) : (
            filtered.map(order => (
              <div key={order.id} className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold font-display text-foreground">{order.customers?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-display">{order.customers?.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(order.status)}
                    <span className="text-xs font-medium font-tamil">{statusLabel(order.status)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-primary/8 text-primary px-3 py-1.5 rounded-xl">
                    <Droplets className="size-4" />
                    <span className="font-bold text-sm font-display">{order.quantity} கேன்</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-display">
                    📅 {new Date(order.delivery_date).toLocaleDateString('ta-IN')}
                  </div>
                  <div className="ml-auto font-bold text-foreground font-display">₹{order.amount}</div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => markDelivered(order)}
                      className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-sm font-bold font-tamil flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-soft"
                    >
                      <CheckCircle className="size-4" />
                      டெலிவரி ஆச்சு
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="h-10 w-10 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-95 transition-transform border border-border"
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
