import { createFileRoute } from '@tanstack/react-router'
import { PhoneShell, TopBar } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { MessageSquare, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/feedback/')({
  component: FeedbackDashboard,
})

type FeedbackItem = {
  id: string
  type: 'feedback' | 'complaint'
  message: string
  status: 'new' | 'resolved'
  created_at: number
  customers: { name: string; phone: string } | null
}

function FeedbackDashboard() {
  const { session } = useAuth()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [session])

  const fetchFeedback = async () => {
    if (!session) return
    setLoading(true)
    const { data } = await supabase
      .from('feedback_complaints')
      .select('*, customers(name, phone)')
      .eq('shop_owner_id', session.user.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const markResolved = async (id: string) => {
    await supabase.from('feedback_complaints').update({ status: 'resolved' }).eq('id', id)
    fetchFeedback()
  }

  return (
    <PhoneShell>
      <TopBar title="புகார்கள் / கருத்துகள்" back="/settings" />
      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
            <MessageSquare className="size-16 mb-4" strokeWidth={1} />
            <p className="font-tamil font-medium">புகார்கள் / கருத்துகள் எதுவும் இல்லை</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-card rounded-[1.25rem] border border-border p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`size-8 rounded-full flex items-center justify-center ${
                    item.type === 'feedback' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}>
                    {item.type === 'feedback' ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}
                  </div>
                  <div>
                    <p className="font-bold font-display text-sm leading-tight">{item.customers?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground font-display">{item.customers?.phone}</p>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-display">
                  {new Date(item.created_at).toLocaleDateString('ta-IN')}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 text-sm font-tamil mb-3">
                {item.message}
              </div>

              {item.status === 'new' ? (
                <button
                  onClick={() => markResolved(item.id)}
                  className="w-full h-10 bg-primary/10 text-primary font-bold font-tamil text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <CheckCircle className="size-4" /> தீர்க்கப்பட்டது (Resolved)
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold font-tamil py-2">
                  <CheckCircle className="size-4" /> தீர்க்கப்பட்டது
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </PhoneShell>
  )
}
