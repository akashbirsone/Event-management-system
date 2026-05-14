

'use client';

import { EventsTable } from "@/components/admin/events-table";
import { CreateEventDialog } from "@/components/admin/create-event-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getEvents, getAdmins } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppEvent, Admin } from "@/lib/definitions";
import { useEffect, useState } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
      Promise.all([getAdmins(), getEvents()]).then(([allAdmins, allEvents]) => {
        const admin = allAdmins.find(a => a.id === adminId);
        setCurrentAdmin(admin || null);
        
        const isAdmin = admin?.role === 'Admin';

        // Admin sees all events, EventsManager sees only their own.
        const filteredEvents = isAdmin
            ? allEvents 
            : allEvents.filter(event => event.adminId === admin?.id);

        setEvents(filteredEvents);
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, []);

  const isAdmin = currentAdmin?.role === 'Admin';

  if (loading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">Loading events...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Events</h2>
            <p className="text-muted-foreground">Create, view, and manage all your events.</p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          {currentAdmin && isAdmin && (
            <CreateEventDialog currentAdmin={currentAdmin} disabled={!isAdmin}>
              <Button disabled={!isAdmin} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </CreateEventDialog>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
             A list of all events you have access to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventsTable events={events} currentAdmin={currentAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
