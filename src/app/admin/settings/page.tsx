
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdmins } from '@/lib/data';
import { Admin } from '@/lib/definitions';
import { CredentialsSettings } from '@/components/admin/credentials-settings';
import { SecuritySettings } from '@/components/admin/security-settings';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      router.push('/login');
      return;
    }
    
    getAdmins().then(allAdmins => {
      const loggedInAdmin = allAdmins.find(a => a.id === adminId);
      if (loggedInAdmin?.role === 'Admin') {
        setCurrentAdmin(loggedInAdmin);
        setIsAuthorized(true);
      } else {
        router.push('/admin');
      }
    });
  }, [router]);


  if (!isAuthorized || !currentAdmin) {
    return null; // or a loading spinner
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-0.5">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Settings</h2>
        <p className="text-muted-foreground">
          Manage administrator credentials and critical system settings.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <div className="flex-1 lg:max-w-2xl">
           <CredentialsSettings currentAdmin={currentAdmin} />
           <Separator className="my-6" />
           <SecuritySettings currentAdmin={currentAdmin} />
        </div>
      </div>
    </div>
  );
}
