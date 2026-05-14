'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RegistrationForm } from './registration-form';
import { QrCode } from 'lucide-react';

export function RegisterDialog({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-lg glass-card text-foreground border-border/30 p-0">
          <div className="p-6">
            <DialogHeader className="text-center items-center">
              <QrCode className="w-10 h-10 text-primary mb-2" />
              <DialogTitle className="text-2xl font-headline">Event Registration</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Register here to get your unique ID for the event.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 overflow-y-auto">
            <RegistrationForm />
          </div>
        </DialogContent>
    </Dialog>
  );
}
