import AdminDashboard from '@/components/admin/AdminDashboard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Bed, Users, Shield, FileText, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/admin/wards">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wards</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <CardDescription>Hospital ward management</CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/admin/beds">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beds</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <CardDescription>Bed allocation and tracking</CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/admin/users">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <CardDescription>User accounts and access</CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/admin/roles">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <CardDescription>Role permissions</CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/admin/tariffs">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tariffs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <CardDescription>Service pricing</CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/settings">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">System</div>
              <CardDescription>Application settings</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <AdminDashboard />
    </div>
  )
}
