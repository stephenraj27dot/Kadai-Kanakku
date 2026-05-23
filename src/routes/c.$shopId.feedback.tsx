import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PhoneShell } from '@/components/PhoneShell'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { MessageSquare, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/c/$shopId/feedback')({
  component: CustomerFeedback,
})

function CustomerFeedback() {
  const { shopId } = Route.useParams()
  const navigate = useNavigate()

  const [type, setType] = useState<'feedback' | 'complaint'>('feedback')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('விவரங்களை உள்ளிடவும்')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate({ to: `/c/${shopId}/login`, replace: true })

    const { data: custRows } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', shopId)
      .eq('auth_user_id', user.id)
      .limit(1)

    const customer = custRows && custRows.length > 0 ? custRows[0] : null

    if (!customer) {
      setError('உங்கள் கணக்கு கிடைக்கவில்லை. கடைக்காரரை தொடர்பு கொள்ளவும்.')
      setLoading(false)
      return
    }

    const { error: submitError } = await supabase.from('feedback_complaints').insert({
      shop_owner_id: shopId,
      customer_id: customer.id,
      type,
      message,
      status: 'new',
      created_at: Date.now(),
    })

    if (submitError) {
      setError('அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.')
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
            <h2 className="text-2xl font-bold font-tamil text-foreground">அனுப்பப்பட்டது!</h2>
            <p className="mt-2 text-sm text-muted-foreground font-tamil">
              உங்கள் {type === 'feedback' ? 'கருத்து' : 'புகார்'} கடைக்காரருக்கு அனுப்பப்பட்டது. நன்றி!
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
        <div className="bg-primary px-6 pt-12 pb-8 text-primary-foreground rounded-b-3xl">
          <button onClick={() => navigate({ to: `/c/${shopId}`, replace: true })} className="mb-4 text-sm opacity-80 font-tamil">← திரும்பு</button>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-tamil">புகார் / கருத்து</h1>
              <p className="text-sm opacity-80 font-tamil">கடைக்காரருக்கு தெரியப்படுத்தவும்</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-6 space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => setType('feedback')}
              className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-tamil font-bold transition-all border ${
                type === 'feedback' ? 'bg-primary text-primary-foreground border-primary shadow-soft' : 'bg-background text-muted-foreground border-border'
              }`}
            >
              <ThumbsUp className="size-4.5" /> கருத்து
            </button>
            <button
              onClick={() => setType('complaint')}
              className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-tamil font-bold transition-all border ${
                type === 'complaint' ? 'bg-red-500 text-white border-red-500 shadow-soft' : 'bg-background text-muted-foreground border-border'
              }`}
            >
              <ThumbsDown className="size-4.5" /> புகார்
            </button>
          </div>

          <div className="bg-background rounded-3xl p-2 border border-border shadow-sm">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'feedback' ? 'உங்கள் கருத்துகளை இங்கே எழுதவும்...' : 'உங்கள் புகாரை இங்கே எழுதவும்...'}
              className="w-full h-40 bg-transparent resize-none p-4 text-base focus:outline-none font-tamil"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium font-tamil text-center border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 pb-8">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl shadow-soft flex items-center justify-center gap-2 font-tamil active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? (
              <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>அனுப்பவும்</>
            )}
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
