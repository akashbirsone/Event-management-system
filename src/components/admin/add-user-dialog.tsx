
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
import { AppEvent } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

export function AddUserDialog({ children, event, disabled }: { children: React.ReactNode, event: AppEvent, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction] = useActionState(addUserAction, null);

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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User to {event.name}</DialogTitle>
          <DialogDescription>
            Fill in the user's details. A Pass ID will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="eventId" value={event.id} />
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required/>
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standard">Grade/Class</Label>
              <Input id="standard" name="standard" required/>
              {state?.errors?.standard && <p className="text-xs text-destructive">{state.errors.standard}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" required/>
              {state?.errors?.department && <p className="text-xs text-destructive">{state.errors.department}</p>}
            </div>
           </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Contact Number (10 digits)</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" maxLength={10} pattern="\d{10}" title="Please enter a 10-digit phone number" onChange={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }}/>
            {state?.errors?.phoneNumber && <p className="text-xs text-destructive">{state.errors.phoneNumber[0]}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required/>
             {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email}</p>}
          </div>

          {event.eventType === 'Paid' && (
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
                 {state?.errors?.paymentStatus && <p className="text-xs text-destructive">{state.errors.paymentStatus}</p>}
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
