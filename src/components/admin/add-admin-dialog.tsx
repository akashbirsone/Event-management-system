
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
import { addAdminAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
        'Add Events Manager'
      )}
    </Button>
  );
}

export function AddAdminDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction] = useActionState(addAdminAction, null);

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
  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Events Manager</DialogTitle>
          <DialogDescription>
            Fill in the details for the new manager. They will have limited access to manage events.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value="EventsManager" />
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required/>
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">Login ID</Label>
            <Input id="id" name="id" required/>
            {state?.errors?.id && <p className="text-xs text-destructive">{state.errors.id}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required/>
            {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="phoneNumber">Contact Number</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" maxLength={10} onChange={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }}/>
            {state?.errors?.phoneNumber && <p className="text-xs text-destructive">{state.errors.phoneNumber}</p>}
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
