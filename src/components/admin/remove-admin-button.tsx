
'use client';
import { useActionState, useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { removeAdminAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Trash } from 'lucide-react';

export function RemoveAdminButton({ adminId, children, disabled }: { adminId: string, children: React.ReactNode, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(removeAdminAction, null);
  const { toast } = useToast();

  useEffect(() => {
    if(state?.message) {
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

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    setOpen(true);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild onClick={handleTriggerClick}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove the admin account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="adminId" value={adminId} />
            <AlertDialogAction asChild>
                <Button type="submit" variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Yes, remove admin
                </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
