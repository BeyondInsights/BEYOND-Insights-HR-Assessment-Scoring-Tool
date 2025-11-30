import AdminAuthWrapper from '@/components/admin-auth-wrapper'
import AdminDashboard from '@/components/admin-dashboard'

export const metadata = {
  title: 'Admin Dashboard | Best Companies Survey',
  description: 'Survey administration and monitoring dashboard',
}

export default function AdminPage() {
  return (
    <AdminAuthWrapper>
      <AdminDashboard />
    </AdminAuthWrapper>
  )
}
