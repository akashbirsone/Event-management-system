

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRefunds, getAdmins, getEvents } from '@/lib/data';
import { RefundRequest, Admin, AppEvent } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefundDetailsDialog } from '@/components/admin/refund-details-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RefundsPage() {
  const [allRefunds, setAllRefunds] = useState<RefundRequest[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [managedEvents, setManagedEvents] = useState<AppEvent[]>([]);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
      getAdmins().then(admins => {
        const admin = admins.find(a => a.id === adminId);
        setCurrentAdmin(admin || null);
        setAllAdmins(admins);
      });
    }
  }, []);

  useEffect(() => {
    if (!currentAdmin) return;

    Promise.all([getRefunds(), getEvents()]).then(([refundsData, eventsData]) => {
      let filteredEvents: AppEvent[];

      if (currentAdmin.role === 'Admin') {
        filteredEvents = eventsData;
        setAllRefunds(refundsData.reverse());
      } else {
        filteredEvents = eventsData.filter(event => event.adminId === currentAdmin.id);
        const managedEventIds = filteredEvents.map(event => event.id);
        const filteredRefunds = refundsData.filter(refund => managedEventIds.includes(refund.eventId));
        setAllRefunds(filteredRefunds.reverse());
      }
      
      setManagedEvents(filteredEvents);
      if(filteredEvents.length > 0) {
        setActiveTab('all');
      }
    });

  }, [currentAdmin]);

  const getStatusVariant = (status: RefundRequest['status']) => {
    switch (status) {
      case 'Pending':
      case 'Under Review':
        return 'secondary';
      case 'Approved':
        return 'default';
      case 'Paid':
        return 'success';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  const renderRefundsList = (refunds: RefundRequest[]) => (
    <div className='space-y-4'>
      {refunds.length === 0 ? (
          <div className="flex items-center justify-center h-24 rounded-md border border-dashed">
             <p className="text-muted-foreground">No refund requests found.</p>
          </div>
      ) : (
        refunds.map(req => {
          const eventManager = allAdmins.find(admin => admin.id === req.eventAdminId);
          return (
            <Card key={req.id} className="w-full">
               <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{req.userName || 'N/A'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{req.eventName}</p>
                  </div>
                  <RefundDetailsDialog request={req} eventManager={eventManager} currentAdmin={currentAdmin}>
                     <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">View Details</span>
                        <MoreHorizontal className="h-4 w-4" />
                     </Button>
                  </RefundDetailsDialog>
               </CardHeader>
               <CardContent className="space-y-2 text-sm">
                  <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                  <p className="text-muted-foreground">Pass ID: {req.passId}</p>
                  <p className="text-muted-foreground text-xs pt-1 border-t">
                    Requested At: {new Date(req.requestedAt).toLocaleString()}
                  </p>
               </CardContent>
            </Card>
          )
        })
      )}
    </div>
  );

  const renderRefundsTable = (refunds: RefundRequest[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Pass ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {refunds.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No refund requests found.
              </TableCell>
            </TableRow>
          ) : (
            refunds.map(req => {
              const eventManager = allAdmins.find(admin => admin.id === req.eventAdminId);
              return (
                <TableRow key={req.id}>
                  <TableCell>{req.userName || 'N/A'}</TableCell>
                  <TableCell>{req.eventName}</TableCell>
                  <TableCell>{req.passId}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(req.requestedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <RefundDetailsDialog request={req} eventManager={eventManager} currentAdmin={currentAdmin} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
  
  const refundsForTab = activeTab === 'all' 
    ? allRefunds
    : allRefunds.filter(r => r.eventId === activeTab);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Refund Requests</h2>
          <p className="text-muted-foreground">Manage and process user refund requests for your events.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline">
              {allRefunds.filter(r => r.status === 'Pending').length} Pending
           </Badge>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Refund Requests</CardTitle>
          <CardDescription>
            {currentAdmin?.role === 'Admin'
              ? 'A list of all refund requests across all events.'
              : 'A list of all refund requests for the events you manage.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full overflow-x-auto h-auto justify-start">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              {managedEvents.map(event => (
                <TabsTrigger key={event.id} value={event.id}>
                  {event.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={activeTab} className="pt-4">
              <div className="md:hidden">{renderRefundsList(refundsForTab)}</div>
              <div className="hidden md:block">{renderRefundsTable(refundsForTab)}</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
