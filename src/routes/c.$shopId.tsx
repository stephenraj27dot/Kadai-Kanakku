import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/c/$shopId')({
  component: CustomerLayout,
})

function CustomerLayout() {
  return <Outlet />
}
