
'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { AppEvent } from '@/lib/definitions';
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
import { Textarea } from "@/components/ui/textarea";
import { updateEventAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

function parseFlexibleDate(dateString?: string): Date | undefined {
  if (!dateString) return undefined;
  
  // The backend now consistently uses 'yyyy-MM-dd'
  const date = new Date(dateString);
  // Add timezone offset to prevent date from being off by one day
  return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
}


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        'Save Changes'
      )}
    </Button>
  );
}

export function EditEventDialog({ event, children, disabled }: { event: AppEvent, children: React.ReactNode, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateEventAction, null);
  
  const [startDate, setStartDate] = useState<Date | undefined>(parseFlexibleDate(event.startDate));
  const [endDate, setEndDate] = useState<Date | undefined>(parseFlexibleDate(event.endDate));
  const [regStartDate, setRegStartDate] = useState<Date | undefined>(parseFlexibleDate(event.registrationStartDate));
  const [regEndDate, setRegEndDate] = useState<Date | undefined>(parseFlexibleDate(event.registrationEndDate));
  const [eventType, setEventType] = useState<'Free' | 'Paid'>(event.eventType || 'Free');


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

  const [defaultStartHour, defaultStartMinute, defaultStartAmPm] = event.startTime ? event.startTime.split(/[\s:]+/) : ["12", "00", "PM"];
  const [defaultRegStartHour, defaultRegStartMinute, defaultRegStartAmPm] = event.registrationStartTime ? event.registrationStartTime.split(/[\s:]+/) : ["12", "00", "AM"];
  const [defaultRegEndHour, defaultRegEndMinute, defaultRegEndAmPm] = event.registrationEndTime ? event.registrationEndTime.split(/[\s:]+/) : ["11", "59", "PM"];

  const handleOpenChange = (isOpen: boolean) => {
    if (disabled) return;
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your event. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="eventId" value={event.id} />
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input id="name" name="name" defaultValue={event.name} required />
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Event Start Date</Label>
               <input type="hidden" name="startDate" value={startDate ? format(startDate, "yyyy-MM-dd") : ''} />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              {state?.errors?.startDate && <p className="text-xs text-destructive">{state.errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label>Event Start Time</Label>
              <div className="grid grid-cols-3 gap-1">
                <Select name="start_time_hr" defaultValue={defaultStartHour}>
                  <SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger>
                  <SelectContent>{Array.from({length: 12}, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent>
                </Select>
                <Select name="start_time_min" defaultValue={defaultStartMinute}>
                   <SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger>
                   <SelectContent>{Array.from({length: 60}, (_, i) => i).map(m => <SelectItem key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</SelectItem>)}</SelectContent>
                </Select>
                <Select name="start_time_ampm" defaultValue={defaultStartAmPm}>
                   <SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              {state?.errors?.startTime && <p className="text-xs text-destructive">{state.errors.startTime}</p>}
            </div>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Event End Date</Label>
               <input type="hidden" name="endDate" value={endDate ? format(endDate, "yyyy-MM-dd") : ''} />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
              <Label>Event End Time</Label>
               <p className='text-xs text-muted-foreground'>Leave blank if it's a single day event.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" name="venue" defaultValue={event.venue} required />
            {state?.errors?.venue && <p className="text-xs text-destructive">{state.errors.venue}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={event.address} required />
            {state?.errors?.address && <p className="text-xs text-destructive">{state.errors.address}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={event.description} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="departments">Available Departments (comma-separated)</Label>
            <Textarea id="departments" name="departments" placeholder="e.g. Computer Science, IT, Electronics" defaultValue={event.departments?.join(', ')} />
            {state?.errors?.departments && <p className="text-xs text-destructive">{state.errors.departments}</p>}
          </div>
          
           <div className="space-y-2">
              <Label>Event Type</Label>
              <RadioGroup name="eventType" defaultValue={eventType} onValueChange={(value: 'Free' | 'Paid') => setEventType(value)} className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Free" id="free-edit" />
                      <Label htmlFor="free-edit">Free</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Paid" id="paid-edit" />
                      <Label htmlFor="paid-edit">Paid</Label>
                  </div>
              </RadioGroup>
          </div>

          {eventType === 'Paid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="eventFee">Event Fee (₹)</Label>
                    <Input id="eventFee" name="eventFee" type="number" min="0" defaultValue={event.eventFee} />
                    {state?.errors?.eventFee && <p className="text-xs text-destructive">{state.errors.eventFee[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" name="upiId" placeholder="e.g. yourname@upi" defaultValue={event.upiId} />
                    {state?.errors?.upiId && <p className="text-xs text-destructive">{state.errors.upiId[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payeeName">Payee Name (for UPI)</Label>
                    <Input id="payeeName" name="payeeName" placeholder="e.g. EventPass Org" defaultValue={event.payeeName} />
                </div>
             </div>
          )}


           <div className="space-y-2">
            <Label htmlFor="registrationStatus">Registration Status</Label>
            <Select name="registrationStatus" defaultValue={event.registrationStatus}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
            </Select>
           </div>


          <Separator />
          <h3 className="text-sm font-medium text-muted-foreground">Registration Window</h3>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>Registration Start</Label>
                  <input type="hidden" name="registrationStartDate" value={regStartDate ? format(regStartDate, "yyyy-MM-dd") : ''} />
                   <Popover>
                      <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !regStartDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {regStartDate ? format(regStartDate, "PPP") : <span>Pick a start date</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={regStartDate} onSelect={setRegStartDate} initialFocus /></PopoverContent>
                  </Popover>
                  <div className="grid grid-cols-3 gap-1">
                      <Select name="reg_start_time_hr" defaultValue={defaultRegStartHour}><SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_start_time_min" defaultValue={defaultRegStartMinute}><SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger><SelectContent>{Array.from({length: 60}, (_, i) => i).map(m => <SelectItem key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_start_time_ampm" defaultValue={defaultRegStartAmPm}><SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Registration End</Label>
                  <input type="hidden" name="registrationEndDate" value={regEndDate ? format(regEndDate, "yyyy-MM-dd") : ''} />
                   <Popover>
                      <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !regEndDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {regEndDate ? format(regEndDate, "PPP") : <span>Pick an end date</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={regEndDate} onSelect={setRegEndDate} initialFocus /></PopoverContent>
                  </Popover>
                   <div className="grid grid-cols-3 gap-1">
                      <Select name="reg_end_time_hr" defaultValue={defaultRegEndHour}><SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_end_time_min" defaultValue={defaultRegEndMinute}><SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger><SelectContent>{Array.from({length: 60}, (_, i) => i).map(m => <SelectItem key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_end_time_ampm" defaultValue={defaultRegEndAmPm}><SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>
                  </div>
              </div>
          </div>
          
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
