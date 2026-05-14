
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
import { removeEventAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Trash } from 'lucide-react';

export function RemoveEventDialog({ eventId, children, disabled }: { eventId: string, children: React.ReactNode, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(removeEventAction, null);
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
            This action cannot be undone. This will permanently remove the event and all users associated with it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <AlertDialogAction asChild>
                <Button type="submit" variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Yes, remove event
                </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
