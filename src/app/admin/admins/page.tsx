
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdmins } from '@/lib/data';
import { Admin } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminsTable } from '@/components/admin/admins-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddAdminDialog } from '@/components/admin/add-admin-dialog';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      router.push('/login');
      return;
    }
    
    getAdmins().then(allAdmins => {
      const admin = allAdmins.find(a => a.id === adminId);
      if (admin?.role === 'Admin') {
        setCurrentAdmin(admin);
        setAdmins(allAdmins);
        setIsAuthorized(true);
      } else {
        router.push('/admin');
      }
    });
  }, [router]);


  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Admin Management</h2>
          <p className="text-muted-foreground">View and manage all administrator accounts.</p>
        </div>
        <div className="flex items-center space-x-2">
          <AddAdminDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Admin
            </Button>
          </AddAdminDialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Administrators</CardTitle>
          <CardDescription>A list of all admins with access to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminsTable admins={admins} currentAdmin={currentAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
