'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GetPassForm } from './get-pass-form';
import { Ticket } from 'lucide-react';

export function GetPassDialog({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md glass-card text-foreground border-border/30">
          <DialogHeader className="text-center items-center">
             <Ticket className="w-10 h-10 text-primary mb-2" />
            <DialogTitle className="text-2xl font-headline">Get Your Pass</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your Unique ID to download your event pass.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <GetPassForm />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    