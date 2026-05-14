
'use client';
import { Analytics } from "@/components/admin/analytics";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { UsersTable } from "@/components/admin/users-table";
import { getUsers, getEvents, getAdmins } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { User, Admin, AppEvent } from "@/lib/definitions";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
      getAdmins().then(allAdmins => {
        const admin = allAdmins.find(a => a.id === adminId);
        setCurrentAdmin(admin || null);
        setAdmins(allAdmins);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      Promise.all([getUsers(), getEvents()]).then(([allUsers, allEvents]) => {
        let relevantEvents;
        if (currentAdmin.role === 'Admin') {
          relevantEvents = allEvents;
        } else {
          relevantEvents = allEvents.filter(e => e.adminId === currentAdmin.id);
        }
        setEvents(relevantEvents);
        
        const relevantEventIds = relevantEvents.map(e => e.id);
        const usersForAdmin = allUsers.filter(u => relevantEventIds.includes(u.eventId));
        setPendingUsers(usersForAdmin.filter(u => u.status === 'Pending').reverse());
      });
    }
  }, [currentAdmin]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <Button variant="outline" asChild>
             <Link href="/scan">
                <QrCode className="mr-2 h-4 w-4" /> Scan QR
             </Link>
          </Button>
        </div>
      </div>
      <Analytics />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Pending Registrations</CardTitle>
            <CardDescription>
              Review and manage pending user registrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable users={pendingUsers} events={events} admins={admins} currentAdmin={currentAdmin} />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
