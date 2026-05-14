
'use client';

import { useEffect, useState, useMemo } from "react";
import { getUsers, getEvents, getAdmins } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
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
        Promise.all([getEvents(), getUsers()]).then(([eventsData, usersData]) => {
            const adminEvents = currentAdmin.role === 'Admin' 
                ? eventsData 
                : eventsData.filter(event => event.adminId === currentAdmin.id);
            
            setEvents(adminEvents);
            setUsers(usersData);

            if(adminEvents.length > 0 && !selectedEventId) {
                setSelectedEventId(adminEvents[0].id);
            } else if (adminEvents.length === 0) {
                 setSelectedEventId(undefined);
            }
        });
    }
  }, [currentAdmin, selectedEventId]);

  const analyticsData = useMemo(() => {
    const usersForEvent = selectedEventId ? users.filter(user => user.eventId === selectedEventId) : [];
    const totalUsers = usersForEvent.length;
    const totalEntries = usersForEvent.filter(user => user.entered).length;
    const pendingUsers = usersForEvent.filter(user => user.status === 'Pending').length;
    return { totalUsers, totalEntries, pendingUsers };
  }, [selectedEventId, users]);

  return (
    <>
      <div className="mb-4">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
             {events.length === 0 && <SelectItem value="no-events" disabled>No events available</SelectItem>}
            {events.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalEntries}</div>
            <p className="text-xs text-muted-foreground">Users who have entered the event</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Registrations</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Users waiting for approval</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
