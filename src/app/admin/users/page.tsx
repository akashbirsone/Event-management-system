

'use client';

import { useEffect, useState } from 'react';
import { UsersTable } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import { getEvents, getUsers, getAdmins } from "@/lib/data";
import { PlusCircle, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCsvDialog } from "@/components/admin/upload-csv-dialog";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AppEvent, User, Admin } from '@/lib/definitions';

export default function UsersPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  
  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if(adminId) {
      getAdmins().then(admins => {
        const admin = admins.find(a => a.id === adminId);
        setCurrentAdmin(admin || null);
        setAllAdmins(admins);
      });
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      Promise.all([getEvents(), getUsers()]).then(([eventsData, usersData]) => {
        let adminEvents: AppEvent[];
        if (currentAdmin.role === 'Admin') {
          adminEvents = eventsData;
        } else {
          adminEvents = eventsData.filter(e => e.adminId === currentAdmin.id);
        }
        setEvents(adminEvents);
        setAllUsers(usersData);
        
        if (adminEvents.length > 0 && !selectedEventId) {
          setSelectedEventId(adminEvents[0].id);
        } else if (adminEvents.length === 0) {
          setSelectedEventId(undefined);
        }
      });
    }
  }, [currentAdmin]);

  useEffect(() => {
    if (selectedEventId) {
      const filteredUsers = allUsers.filter(u => u.eventId === selectedEventId);
      setUsers(filteredUsers);
    } else {
      setUsers([]);
    }
  }, [selectedEventId, allUsers]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isAdmin = currentAdmin?.role === 'Admin';
  const canManageUsers = isAdmin || (selectedEvent?.adminId === currentAdmin?.id);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Users</h2>
          <p className="text-muted-foreground">Manage users for your events.</p>
        </div>
        <div className="flex items-center w-full md:w-auto">
           <Select value={selectedEventId || ''} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
               {events.length === 0 && <SelectItem value="no-events" disabled>No events found</SelectItem>}
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedEvent ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>{selectedEvent.name}</CardTitle>
                <CardDescription>
                  {users.length} user(s) assigned to this event.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <UploadCsvDialog eventId={selectedEvent.id} disabled={!canManageUsers}>
                  <Button variant="outline" disabled={!canManageUsers} className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Upload CSV
                  </Button>
                </UploadCsvDialog>
                <AddUserDialog event={selectedEvent} disabled={!canManageUsers}>
                  <Button disabled={!canManageUsers} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </AddUserDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} events={events} admins={allAdmins} currentAdmin={currentAdmin} />
          </CardContent>
        </Card>
      ) : (
         <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg text-center p-4">
            <p className="text-muted-foreground font-semibold">No event selected or available.</p>
            <p className="text-muted-foreground text-sm">Please create an event from the Events page to begin managing users.</p>
         </div>
      )}

    </div>
  );
}
