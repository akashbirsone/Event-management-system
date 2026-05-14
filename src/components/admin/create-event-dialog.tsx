
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
import { Textarea } from "@/components/ui/textarea";
import { createEventAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Admin } from '@/lib/definitions';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

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
        'Save Event'
      )}
    </Button>
  );
}

export function CreateEventDialog({ children, currentAdmin, disabled }: { children: React.ReactNode, currentAdmin: Admin, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction] = useActionState(createEventAction, null);

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [regStartDate, setRegStartDate] = useState<Date | undefined>();
  const [regEndDate, setRegEndDate] = useState<Date | undefined>();
  const [eventType, setEventType] = useState<'Free' | 'Paid'>('Free');
  const [showPassword, setShowPassword] = useState(false);


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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details for your new event. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="creatorId" value={currentAdmin.id} />
          
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input id="name" name="name" required />
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
          </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>Event Start Date</Label>
                  <input type="hidden" name="startDate" value={startDate ? format(startDate, "yyyy-MM-dd") : ''} />
                   <Popover>
                      <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                  </Popover>
              </div>
              <div className="space-y-2">
                  <Label>Event End Date</Label>
                  <input type="hidden" name="endDate" value={endDate ? format(endDate, "yyyy-MM-dd") : ''} />
                   <Popover>
                      <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                  </Popover>
              </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" name="venue" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="departments">Available Departments (comma-separated)</Label>
            <Textarea id="departments" name="departments" placeholder="e.g. Computer Science, IT, Electronics" />
            {state?.errors?.departments && <p className="text-xs text-destructive">{state.errors.departments}</p>}
          </div>

           <div className="space-y-2">
            <Label>Event Type</Label>
             <RadioGroup name="eventType" defaultValue="Free" onValueChange={(value: 'Free' | 'Paid') => setEventType(value)} className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Free" id="free" />
                    <Label htmlFor="free">Free</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Paid" id="paid" />
                    <Label htmlFor="paid">Paid</Label>
                </div>
            </RadioGroup>
          </div>

          {eventType === 'Paid' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="eventFee">Event Fee (₹)</Label>
                    <Input id="eventFee" name="eventFee" type="number" min="0" placeholder="e.g. 100" />
                    {state?.errors?.eventFee && <p className="text-xs text-destructive">{state.errors.eventFee[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" name="upiId" placeholder="e.g. yourname@upi" />
                     {state?.errors?.upiId && <p className="text-xs text-destructive">{state.errors.upiId[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="payeeName">Payee Name (for UPI)</Label>
                    <Input id="payeeName" name="payeeName" placeholder="e.g. EventPass Org" />
                </div>
             </div>
          )}


           <div className="space-y-2">
            <Label htmlFor="registrationStatus">Registration Status</Label>
            <Select name="registrationStatus" defaultValue="Open">
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
            </Select>
           </div>
           
           <Separator/>

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
                      <Select name="reg_start_time_hr"><SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_start_time_min"><SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger><SelectContent>{Array.from({length: 60}, (_, i) => i).map(m => <SelectItem key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_start_time_ampm"><SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>
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
                      <Select name="reg_end_time_hr"><SelectTrigger><SelectValue placeholder="HH" /></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => i + 1).map(h => <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_end_time_min"><SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger><SelectContent>{Array.from({length: 60}, (_, i) => i).map(m => <SelectItem key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</SelectItem>)}</SelectContent></Select>
                      <Select name="reg_end_time_ampm"><SelectTrigger><SelectValue placeholder="AM/PM" /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>
                  </div>
              </div>
          </div>
            {currentAdmin?.role === 'Admin' && (
             <div className='space-y-4 pt-4 border-t'>
                 <h3 className="text-sm font-medium text-muted-foreground">Assign Events Manager (Optional)</h3>
                <div className="space-y-2">
                    <Label htmlFor="newAdminName">Admin Name</Label>
                    <Input id="newAdminName" name="newAdminName" placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newAdminId">Admin Login ID</Label>
                    <Input id="newAdminId" name="newAdminId" placeholder="e.g. johndoe" />
                </div>
                <div className="relative space-y-2">
                    <Label htmlFor="newAdminPassword">Admin Password</Label>
                    <Input 
                      id="newAdminPassword" 
                      name="newAdminPassword" 
                      type={showPassword ? 'text' : 'password'}
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-6 h-7 px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="newAdminPhone">Admin Contact</Label>
                    <Input id="newAdminPhone" name="newAdminPhone" type="tel" />
                </div>
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
