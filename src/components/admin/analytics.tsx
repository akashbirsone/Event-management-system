'use client';

import { useEffect, useState } from "react";
import { getUsers, getEvents, getAdmins } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, CircleDollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppEvent, User, Admin } from "@/lib/definitions";

export function Analytics() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  
  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
        getAdmins().then(admins => {
            const admin = admins.find(a => a.id === adminId);
            setCurrentAdmin(admin || null);
        });
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
        getEvents().then(eventsData => {
            if (currentAdmin.role === 'Admin') {
                setEvents(eventsData);
            } else {
                const adminEvents = eventsData.filter(event => event.adminId === currentAdmin.id);
                setEvents(adminEvents);
            }

            if(eventsData.length > 0 && !selectedEventId) {
                const adminEvents = currentAdmin.role === 'Admin' ? eventsData : eventsData.filter(event => event.adminId === currentAdmin.id);
                if (adminEvents.length > 0) {
                    setSelectedEventId(adminEvents[0].id);
                }
            }
        });
    }
    getUsers().then(setUsers);
  }, [currentAdmin, selectedEventId]);

  const usersForEvent = selectedEventId ? users.filter(user => user.eventId === selectedEventId) : [];
  const selectedEvent = events.find(e => e.id === selectedEventId);
  
  const totalUsers = usersForEvent.length;
  const totalEntries = usersForEvent.filter(user => user.entered).length;
  const pendingUsers = usersForEvent.filter(user => user.status === 'Pending').length;
  
  // Calculate Revenue
  const approvedPaidUsers = usersForEvent.filter(user => user.status === 'Approved' && user.paymentStatus === 'Paid');
  const totalRevenue = selectedEvent && selectedEvent.eventType === 'Paid' ? approvedPaidUsers.length * Number(selectedEvent.eventFee || 0) : 0;

  return (
    <>
      <div className="mb-6">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full md:w-[320px] h-12 bg-white/50 dark:bg-black/50 backdrop-blur-md border-border/50">
            <SelectValue placeholder="Select an event to view analytics" />
          </SelectTrigger>
          <SelectContent>
            {events.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm bg-white/40 dark:bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
               <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered users</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-white/40 dark:bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
               <UserCheck className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">Users scanned at venue</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-white/40 dark:bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Registrations</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
               <UserX className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold">{pendingUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-white/40 dark:bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
               <CircleDollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold">₹{totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">From approved paid passes</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
