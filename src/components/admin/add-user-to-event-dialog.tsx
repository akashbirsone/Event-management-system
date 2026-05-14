
'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addUserAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getEvents, getAdmins } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppEvent, Admin } from '@/lib/definitions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        'Add User'
      )}
    </Button>
  );
}

export function AddUserToEventDialog({ children, disabled }: { children: React.ReactNode, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction] = useActionState(addUserAction, null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
      getAdmins().then(admins => setCurrentAdmin(admins.find(a => a.id === adminId) || null));
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      getEvents().then(eventsData => {
          const adminEvents = currentAdmin.role === 'Admin'
              ? eventsData
              : eventsData.filter(e => e.adminId === currentAdmin.id);
          setEvents(adminEvents);
          if (adminEvents.length > 0) {
              setSelectedEventId(adminEvents[0].id);
          }
      });
    }
  }, [currentAdmin]);

  useEffect(() => {
    if (state?.message) {
        if(state.success) {
            toast({
                title: "Success",
                description: state.message,
            });
            setOpen(false);
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: state.message,
            });
        }
    }
  }, [state, toast]);
  
  const handleOpenChange = (isOpen: boolean) => {
    if (disabled) return;
    setOpen(isOpen);
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in the user's details and select an event. An ID will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventId-dialog">Event</Label>
             <Select name="eventId" value={selectedEventId} onValueChange={setSelectedEventId} required>
                <SelectTrigger id="eventId-dialog">
                    <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                    {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                        {event.name}
                    </SelectItem>
                    ))}
                    {events.length === 0 && <SelectItem value="no-events" disabled>No events available</SelectItem>}
                </SelectContent>
            </Select>
            {state?.errors?.eventId && <p className="text-xs text-destructive">{state.errors.eventId[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name-dialog">Full Name</Label>
            <Input id="name-dialog" name="name" required/>
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="standard-dialog">Grade/Class</Label>
            <Input id="standard-dialog" name="standard" required/>
            {state?.errors?.standard && <p className="text-xs text-destructive">{state.errors.standard[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department-dialog">Department</Label>
            <Input id="department-dialog" name="department" required/>
             {state?.errors?.department && <p className="text-xs text-destructive">{state.errors.department[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber-dialog">Contact Number</Label>
            <Input id="phoneNumber-dialog" name="phoneNumber" type="tel" maxLength={10} required/>
             {state?.errors?.phoneNumber && <p className="text-xs text-destructive">{state.errors.phoneNumber[0]}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="email-dialog">Email</Label>
            <Input id="email-dialog" name="email" type="email" required/>
             {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
          </div>
           {selectedEvent?.eventType === 'Paid' && (
             <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select name="paymentStatus" defaultValue="Pending">
                    <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
                 {state?.errors?.paymentStatus && <p className="text-xs text-destructive">{state.errors.paymentStatus[0]}</p>}
              </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
