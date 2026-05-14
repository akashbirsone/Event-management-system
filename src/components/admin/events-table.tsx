

'use client';

import type { AppEvent, Admin } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { RemoveEventDialog } from './remove-event-dialog';
import { EditEventDialog } from './edit-event-dialog';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateEventStatusAction } from '@/lib/actions';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';

export function EventsTable({ events, currentAdmin }: { events: AppEvent[], currentAdmin?: Admin | null }) {
  const { toast } = useToast();
  const router = useRouter();
  
  const isAdmin = currentAdmin?.role === 'Admin';
  
  const isEventManagerForEvent = (event: AppEvent) => {
    return currentAdmin?.role === 'EventsManager' && event.adminId === currentAdmin?.id;
  }

  const handleStatusChange = async (eventId: string, newStatus: boolean) => {
    const status = newStatus ? 'Open' : 'Closed';
    const result = await updateEventStatusAction(eventId, status);
    if(result.success) {
      toast({
        title: 'Success',
        description: result.message
      });
    } else {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message
      });
    }
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-md border border-dashed">
        <p className="text-muted-foreground">No events found.</p>
      </div>
    );
  }


  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {events.map((event) => {
          const canManage = isAdmin || isEventManagerForEvent(event);
          return (
            <div key={event.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                  <span className="font-medium pr-2">{event.name}</span>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <EditEventDialog event={event} disabled={!canManage}>
                             <button className={cn(
                               'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent',
                               !canManage && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                             )}
                             disabled={!canManage}
                             >
                               <Pencil className="mr-2 h-4 w-4" />
                               Edit
                            </button>
                         </EditEventDialog>
                        <DropdownMenuSeparator />
                        <RemoveEventDialog eventId={event.id} disabled={!isAdmin}>
                           <div className={cn(
                               'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-destructive-foreground',
                               !isAdmin && 'cursor-not-allowed text-muted-foreground hover:bg-transparent hover:text-muted-foreground'
                           )}>
                             <Trash className="mr-2 h-4 w-4" />
                             Remove
                          </div>
                        </RemoveEventDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
              </div>
              <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Type: </span> 
                     <Badge variant={event.eventType === 'Paid' ? 'destructive' : 'secondary'} className="ml-1">
                      {event.eventType === 'Paid' ? `Paid (₹${event.eventFee})` : 'Free'}
                    </Badge>
                  </div>
                   <div>
                    <span className="font-medium text-muted-foreground mr-2">Registration: </span> 
                    <div className='inline-flex items-center gap-2'>
                      <Switch 
                        id={`status-${event.id}-mobile`}
                        checked={event.registrationStatus === 'Open'}
                        onCheckedChange={(checked) => handleStatusChange(event.id, checked)}
                        disabled={!canManage}
                        aria-label="Toggle registration status"
                      />
                       <Label htmlFor={`status-${event.id}-mobile`} className={cn(event.registrationStatus === 'Open' ? 'text-green-600' : 'text-red-600', 'font-medium')}>
                         {event.registrationStatus}
                      </Label>
                    </div>
                  </div>
              </div>
            </div>
          )
        })}
      </div>


      {/* Desktop View */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
               const canManage = isAdmin || isEventManagerForEvent(event);
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    <Badge variant={event.eventType === 'Paid' ? 'destructive' : 'secondary'}>
                      {event.eventType === 'Paid' ? `Paid (₹${event.eventFee})` : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Switch 
                        id={`status-${event.id}`}
                        checked={event.registrationStatus === 'Open'}
                        onCheckedChange={(checked) => handleStatusChange(event.id, checked)}
                        disabled={!canManage}
                        aria-label="Toggle registration status"
                      />
                       <Label htmlFor={`status-${event.id}`} className={cn(event.registrationStatus === 'Open' ? 'text-green-600' : 'text-red-600', 'font-medium')}>
                         {event.registrationStatus}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <EditEventDialog event={event} disabled={!canManage}>
                           <button className={cn(
                             'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent',
                             !canManage && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                           )}
                           disabled={!canManage}
                           >
                             <Pencil className="mr-2 h-4 w-4" />
                             Edit
                          </button>
                         </EditEventDialog>
                        <DropdownMenuSeparator />
                        <RemoveEventDialog eventId={event.id} disabled={!isAdmin}>
                           <div className={cn(
                               'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-destructive-foreground',
                               !isAdmin && 'cursor-not-allowed text-muted-foreground hover:bg-transparent hover:text-muted-foreground'
                           )}>
                             <Trash className="mr-2 h-4 w-4" />
                             Remove
                          </div>
                        </RemoveEventDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
