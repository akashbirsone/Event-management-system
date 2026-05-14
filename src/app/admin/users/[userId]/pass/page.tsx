
'use client';

import { QrPassView } from '@/components/admin/qr-pass-view';
import { getEvents, getUsers, getAdmins } from '@/lib/data';
import { AppEvent, User, Admin } from '@/lib/definitions';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';

export default function UserPassPage({ params: paramsPromise }: { params: Promise<{ userId: string }> }) {
  const params = use(paramsPromise);
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [eventAdmin, setEventAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setAuthorized] = useState(false);
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      const { userId } = params;
      const loggedInAdminId = localStorage.getItem('adminId');

      if (!loggedInAdminId) {
        router.push('/login');
        return;
      }
      
      const [allUsers, allEvents, allAdmins] = await Promise.all([
          getUsers(),
          getEvents(),
          getAdmins()
      ]);
      
      const loggedInAdmin = allAdmins.find(a => a.id === loggedInAdminId);
      const foundUser = allUsers.find((u) => u.id === userId);

      if (!foundUser) {
        notFound();
        return;
      }
      
      const foundEvent = allEvents.find((e) => e.id === foundUser.eventId);
      
      if (!foundEvent) {
         notFound();
         return;
      }

      // Authorization Check
      const canViewPass = loggedInAdmin?.role === 'Admin' || loggedInAdmin?.id === foundEvent.adminId;
      
      if (!canViewPass) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setUser(foundUser);
      setEvent(foundEvent);
      
      if (foundEvent.adminId) {
        const adminForEvent = allAdmins.find(a => a.id === foundEvent.adminId);
        setEventAdmin(adminForEvent || null);
      }

      setLoading(false);
    }
    fetchData();
  }, [params, router]);

  if (loading) {
    return <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">Loading...</div>;
  }
  
  if (!isAuthorized) {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-destructive">Access Denied</h1>
                <p className="text-sm text-muted-foreground">You are not authorized to view this pass.</p>
            </div>
        </div>
    )
  }
  
  if (!user || !event) {
    return notFound();
  }

  if (user.paymentStatus === 'Refund In Progress') {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-yellow-500">Pass Under Review</h1>
                <p className="text-sm text-muted-foreground">This pass is temporarily inactive as a refund request is being processed. It cannot be used for entry.</p>
            </div>
        </div>
    )
  }
  
  if (user.status !== 'Approved') {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-destructive">Pass Not Available</h1>
                <p className="text-sm text-muted-foreground">This user's registration is currently '{user.status}'. An 'Approved' status is required to view the pass.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
      <header className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
        <h1 className="text-lg font-bold text-primary">Event Pass Admin View</h1>
        <p className="text-sm text-muted-foreground">This is the admin view for the user's pass.</p>
      </header>
      <QrPassView user={user} event={event} eventAdmin={eventAdmin} />
    </div>
  );
}
