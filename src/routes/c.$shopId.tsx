import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/c/$shopId')({
  component: CustomerLayout,
})

function CustomerLayout() {
  return <Outlet />
}
