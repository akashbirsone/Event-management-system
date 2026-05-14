
'use client';
import { QrPassView } from '@/components/admin/qr-pass-view';
import { getEvents, getUsers, getAdmins } from '@/lib/data';
import { AppEvent, User, Admin } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { useEffect, useState, use } from 'react';

export default function PublicUserPassPage({ params: paramsPromise }: { params: Promise<{ userId: string }> }) {
  const params = use(paramsPromise);
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [eventAdmin, setEventAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const { userId } = params;
      const users = await getUsers();
      const foundUser = users.find((u) => u.id === userId);
      
      if (!foundUser) {
        return notFound();
      }
      setUser(foundUser);
      
      const events = await getEvents();
      const foundEvent = events.find((e) => e.id === foundUser.eventId);

      if (foundUser && !foundEvent) {
         setLoading(false);
         return;
      }
      
      setEvent(foundEvent || null);

      if (foundEvent?.adminId) {
        const admins = await getAdmins();
        const admin = admins.find(a => a.id === foundEvent.adminId);
        setEventAdmin(admin || null);
      }

      setLoading(false);
    }
    fetchData();
  }, [params.userId]);

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
             <p>Loading your pass...</p>
        </div>
    )
  }

  if (!user) {
    return notFound();
  }
  
  if (user.paymentStatus === 'Refunded') {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-destructive">Pass Invalid</h1>
                <p className="text-sm text-muted-foreground">This pass is invalid because the payment has been refunded. Please contact the event organizer for more information.</p>
            </div>
        </div>
    )
  }

  if (user.paymentStatus === 'Refund In Progress') {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-yellow-500">Pass Under Review</h1>
                <p className="text-sm text-muted-foreground">This pass is temporarily inactive because a refund request is being processed. It cannot be used for entry at this time.</p>
            </div>
        </div>
    )
  }

  if (user.status !== 'Approved') {
    let title = 'Pass Not Available';
    let message = `Your registration is currently '${user.status}'. Please wait for admin approval before accessing your pass.`;

    if (user.status === 'Rejected') {
        title = 'Registration Rejected';
        message = 'Your registration for this event was not approved. Please contact the event organizer for more information.';
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-destructive">{title}</h1>
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    )
  }

  if (!event) {
     return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
                 <h1 className="text-lg font-bold text-destructive">Event Not Found</h1>
                <p className="text-sm text-muted-foreground">The event associated with your pass could not be found. Please contact support.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-muted p-4">
       <header className="w-full max-w-sm text-center p-4 mb-4 rounded-md border bg-card">
        <h1 className="text-lg font-bold text-primary">Your event pass is ready! Thank you for registering.</h1>
      </header>
      <QrPassView user={user} event={event} eventAdmin={eventAdmin} />
    </div>
  );
}
