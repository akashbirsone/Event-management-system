
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
import { updateEventsManagerAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Admin } from '@/lib/definitions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : (
        'Update Credentials'
      )}
    </Button>
  );
}

export function EditAdminDialog({ admin, loggedInAdminId, children, disabled }: { admin: Admin, loggedInAdminId?: string, children: React.ReactNode, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateEventsManagerAction, null);

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
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit: {admin.name}</DialogTitle>
          <DialogDescription>
            Update the Login ID and/or Password for this Events Manager.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="loggedInAdminId" value={loggedInAdminId || ''} />
          <input type="hidden" name="managerAdminId" value={admin.id} />
          
          <div className="space-y-2">
            <Label htmlFor="newAdminId">New Login ID</Label>
            <Input id="newAdminId" name="newAdminId" defaultValue={admin.id} required/>
            {state?.errors?.newAdminId && <p className="text-xs text-destructive">{state.errors.newAdminId[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" name="newPassword" type="password" placeholder="Leave blank to keep current password"/>
            {state?.errors?.newPassword && <p className="text-xs text-destructive">{state.errors.newPassword[0]}</p>}
          </div>
           {state?.message && !state.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Update Failed</AlertTitle>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
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
