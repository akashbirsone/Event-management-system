
'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs, getAdmins } from '@/lib/data';
import { AuditLog, Admin } from '@/lib/definitions';
import { AuditLogTable } from '@/components/admin/audit-log-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const router = useRouter();

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      router.push('/login');
      return;
    }
    
    getAdmins().then(allAdmins => {
      const admin = allAdmins.find(a => a.id === adminId);
      if (admin?.role !== 'Admin') {
        router.push('/admin');
        return;
      }
      setAdmins(allAdmins);
      getAuditLogs().then(setLogs);
    });
  }, [router]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Audit Log</h2>
          <p className="text-muted-foreground">A record of all critical administrative actions.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Action History</CardTitle>
          <CardDescription>Review all actions performed by administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} admins={admins} />
        </CardContent>
      </Card>
    </div>
  );
}
