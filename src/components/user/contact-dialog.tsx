'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';

export function ContactDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const phoneNumber = '9561274934'; // Replace with your actual phone number

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card text-foreground border-border/30">
        <DialogHeader className="text-center items-center">
          <Phone className="w-10 h-10 text-primary mb-2" />
          <DialogTitle className="text-2xl font-headline">Contact Us</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            How would you like to get in touch?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
            <Button asChild className="w-full">
                 <a href={`tel:${phoneNumber}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Us
                 </a>
            </Button>
            <Button asChild className="w-full font-bold text-white" style={{ backgroundColor: '#25D366' }}>
                 <a href={`https://wa.me/${phoneNumber}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message on WhatsApp
                 </a>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
