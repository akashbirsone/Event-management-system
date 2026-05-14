
'use client';

import { useEffect, useState } from 'react';
import { LogsTable } from "@/components/admin/logs-table";
import { getEvents, getLogs, getAdmins } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppEvent, EntryLog, Admin } from '@/lib/definitions';

export default function LogsPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [logs, setLogs] = useState<EntryLog[]>([]);
  const [allLogs, setAllLogs] = useState<EntryLog[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  
  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if(adminId) {
      getAdmins().then(admins => {
        const admin = admins.find(a => a.id === adminId);
        setCurrentAdmin(admin || null);
      });
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      getEvents().then(eventsData => {
        let adminEvents: AppEvent[];
        if (currentAdmin.role === 'Admin') {
          adminEvents = eventsData;
        } else {
          adminEvents = eventsData.filter(event => event.adminId === currentAdmin.id);
        }
        setEvents(adminEvents);
        
        if (adminEvents.length > 0 && !selectedEventId) {
           setSelectedEventId(adminEvents[0].id);
        } else if (adminEvents.length === 0) {
          setSelectedEventId(undefined);
        }
      });
    }
    getLogs().then(setAllLogs);
  }, [currentAdmin, selectedEventId]);

  useEffect(() => {
    const filteredLogs = selectedEventId ? allLogs.filter(log => log.eventId === selectedEventId) : allLogs;
     if (currentAdmin?.role === 'EventsManager') {
        const adminEventIds = events.map(e => e.id);
        const adminLogs = filteredLogs.filter(log => adminEventIds.includes(log.eventId));
        setLogs(adminLogs);
    } else {
        const finalLogs = selectedEventId ? filteredLogs.filter(log => log.eventId === selectedEventId) : filteredLogs;
        setLogs(finalLogs);
    }
  }, [selectedEventId, allLogs, currentAdmin, events]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Entry Logs</h2>
          <p className="text-muted-foreground">Live view of user entries and exits.</p>
        </div>
      </div>
       <div className="mb-4">
        <Select value={selectedEventId || ''} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select an event" />
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
      <LogsTable logs={logs} />
    </div>
  );
}
