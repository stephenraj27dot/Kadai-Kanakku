import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/c/$shopId')({
  beforeLoad: async ({ params, location }) => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session && !location.pathname.includes('/login')) {
      throw redirect({
        to: `/c/${params.shopId}/login`,
        replace: true,
      })
    }
  },
  component: CustomerLayout,
})

function CustomerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <p>Customer Layout</p>
    </div>
  )
}
