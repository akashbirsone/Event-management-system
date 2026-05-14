

'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerUserAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, PartyPopper, Copy, Clock, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEvents } from '@/lib/data';
import { AppEvent } from '@/lib/definitions';
import { format, parse, parseISO } from 'date-fns';


function SubmitButton({ disabled, eventType, eventFee }: { disabled?: boolean, eventType?: 'Free' | 'Paid', eventFee?: number }) {
  const { pending } = useFormStatus();
  
  let buttonText = 'Register';
  if (eventType === 'Paid' && eventFee) {
    buttonText = `Proceed to Pay`;
  }
   if (pending && eventType === 'Paid') {
    buttonText = 'Finalizing Registration...';
   } else if (pending) {
    buttonText = 'Processing...';
   }


  return (
    <Button type="submit" className="w-full btn-accent hover:scale-105" disabled={pending || disabled}>
      {buttonText}
    </Button>
  );
}

export function RegistrationForm() {
  const [state, formAction] = useActionState(registerUserAction, null);
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [allAvailableEvents, setAllAvailableEvents] = useState<AppEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
     getEvents().then(eventsData => {
        setAllAvailableEvents(eventsData);
        const firstOpenEvent = eventsData.find(event => event.registrationStatus === 'Open');
        if (firstOpenEvent) {
            setSelectedEventId(firstOpenEvent.id);
        } else if (eventsData.length > 0) {
            setSelectedEventId(eventsData[0].id);
        }
        setIsLoadingEvents(false);
    }).catch(() => setIsLoadingEvents(false));
  }, []);

  const selectedEvent = allAvailableEvents.find(e => e.id === selectedEventId);

  useEffect(() => {
    if (!selectedEvent) {
        setIsRegistrationClosed(allAvailableEvents.length > 0);
        return;
    };
    
    if (selectedEvent.registrationStatus === 'Closed') {
        setIsRegistrationClosed(true);
        return;
    }

    const checkRegistrationStatus = () => {
      if (selectedEvent.registrationEndDate && selectedEvent.registrationEndTime) {
        const dateTimeString = `${selectedEvent.registrationEndDate} ${selectedEvent.registrationEndTime}`;
        const formatString = "yyyy-MM-dd h:mm a"; 
        
        try {
          const deadline = parse(dateTimeString, formatString, new Date());
          if (new Date() > deadline) {
            setIsRegistrationClosed(true);
          } else {
            setIsRegistrationClosed(false);
          }
        } catch (e) {
          console.error("Error parsing registration deadline:", e);
          setIsRegistrationClosed(false);
        }
      } else {
         setIsRegistrationClosed(false);
      }
    };

    checkRegistrationStatus();
    const interval = setInterval(checkRegistrationStatus, 1000); 

    return () => clearInterval(interval);
  }, [selectedEvent, allAvailableEvents]);


  useEffect(() => {
    if (state?.success && state.uniqueId) {
      setUniqueId(state.uniqueId);
    }
  }, [state]);


  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({
            title: "Copied!",
            description: `The ${type} has been copied to the clipboard.`,
        });
    });
  };


  let upiUri = '';
  if (state?.paymentRequired && state.event?.upiId && state.event?.eventFee) {
      const payeeName = state.event.payeeName || 'EventPass';
      upiUri = `upi://pay?pa=${state.event.upiId}&pn=${encodeURIComponent(payeeName)}&am=${state.event.eventFee}&cu=INR`;
  }


  if (uniqueId) {
    return (
        <div className="space-y-4 text-center">
             <Alert className="bg-green-500/20 border-green-500 text-foreground">
                <PartyPopper className="h-4 w-4" />
                <AlertTitle className="font-bold">Registration Successful!</AlertTitle>
                <AlertDescription>
                    Your Pass ID is:
                    <div className="flex items-center justify-center gap-2 my-2">
                        <p className="font-bold text-2xl tracking-widest">{uniqueId}</p>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(uniqueId, 'Pass ID')} className="h-8 w-8">
                            <Copy className="h-4 w-4"/>
                        </Button>
                    </div>
                     Your registration is now pending admin approval. You will be notified once it's approved.
                </AlertDescription>
             </Alert>
             <Button onClick={() => window.location.reload()} className="w-full">Register Another</Button>
        </div>
    );
  }

  const formRef = useRef<HTMLFormElement>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!state?.event?.eventFee) return;

    const res = await loadRazorpayScript();
    if (!res) {
      toast({ variant: 'destructive', title: 'Error', description: 'Razorpay SDK failed to load. Are you online?' });
      return;
    }

    try {
      // Create Order
      const result = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: state.event.eventFee }),
      });
      const order = await result.json();

      if (!order.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create payment order.' });
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: order.amount,
        currency: order.currency,
        name: 'EventHub',
        description: `Payment for ${state.event.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Verify Payment and Submit Form
          const verifyResult = await fetch('/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          const verifyData = await verifyResult.json();
          if (verifyData.success) {
             // Set the transaction ID in the hidden input
             const txInput = document.getElementById('transactionIdInput') as HTMLInputElement;
             if (txInput) {
               txInput.value = response.razorpay_payment_id;
               // Automatically submit the form
               formRef.current?.requestSubmit();
             }
          } else {
             toast({ variant: 'destructive', title: 'Payment Verification Failed', description: verifyData.error });
          }
        },
        prefill: {
          name: state.user?.name,
          email: state.user?.email,
          contact: state.user?.phoneNumber,
        },
        theme: {
          color: '#0f172a',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong.' });
    }
  };

  if (state?.paymentRequired && state.event) {
     return (
        <form key={`${selectedEventId}-payment`} action={formAction} className="space-y-4" ref={formRef}>
             {/* Pass original form data through hidden inputs */}
            <input type="hidden" name="name" value={state.user?.name} />
            <input type="hidden" name="phoneNumber" value={state.user?.phoneNumber} />
            <input type="hidden" name="standard" value={state.user?.standard} />
            <input type="hidden" name="department" value={state.user?.department} />
            <input type="hidden" name="email" value={state.user?.email} />
            <input type="hidden" name="eventId" value={state.event?.id} />
             <input type="hidden" name="paymentStep" value="true" />
             <input type="hidden" name="transactionId" id="transactionIdInput" />
             
             <div className="space-y-4 text-center">
                <Alert className="bg-blue-500/20 border-blue-500 text-foreground text-left">
                    <CreditCard className="h-4 w-4" />
                    <AlertTitle className="font-bold">Event Registration – Paid Pass</AlertTitle>
                    <AlertDescription>
                        Please proceed to make the payment securely via Razorpay to complete your registration.
                    </AlertDescription>
                </Alert>

                <div className="text-center text-foreground/90 bg-muted/50 rounded-lg p-6 space-y-4">
                    <p className="text-xl font-bold">{state.event?.name}</p>
                    <div>
                        <span className="text-sm">Amount to Pay:</span>
                         <div className="flex items-center justify-center gap-2">
                            <p className="text-3xl font-bold text-primary">₹{state.event?.eventFee}</p>
                        </div>
                    </div>
                </div>
                
                 <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                   Note: Your payment is processed securely. After a successful payment, your pass will be generated automatically.
                </div>
                
                 <Button type="button" onClick={handleRazorpayPayment} className="w-full btn-accent hover:scale-105">
                    Pay with Razorpay
                 </Button>
                 <Button variant="link" onClick={() => window.location.reload()} className="text-muted-foreground">Cancel</Button>
             </div>
        </form>
     )
  }

  return (
    <form key={selectedEventId} action={formAction} className="space-y-3">
      {isLoadingEvents ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Loading events...</p>
          </div>
      ) : allAvailableEvents.length === 0 ? (
        <Alert variant="destructive" className="bg-red-500/10 border-2 border-red-500/50 text-center p-4 space-y-2">
          <AlertTitle className="text-xl font-bold uppercase tracking-wider text-shadow-lg">Registration Closed</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Sorry, there are no events currently open for registration. Please check back later.
          </AlertDescription>
        </Alert>
      ) : (
        <>
            <div className="space-y-1">
            <Label htmlFor="eventId">Event</Label>
            <Select name="eventId" value={selectedEventId} onValueChange={setSelectedEventId} required>
                <SelectTrigger id="eventId" className="form-field">
                <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                {allAvailableEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                    {event.name} {event.registrationStatus === 'Closed' ? '(Closed)' : ''}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        
            <fieldset disabled={isRegistrationClosed} className="space-y-3 transition-opacity duration-300 ease-in-out disabled:opacity-50">
                
                {selectedEvent && (
                    <div className="text-center text-foreground/90 bg-muted/50 rounded-lg p-3 space-y-2">
                        {isRegistrationClosed ? (
                           <p className="text-lg font-bold text-gray-400 dark:text-gray-500">Closed Event</p>
                        ) : selectedEvent.eventType === 'Paid' && selectedEvent.eventFee ? (
                            <div>
                                <span className="text-sm">Event Fee:</span>
                                <p className="text-2xl font-bold">₹{selectedEvent.eventFee}</p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold">Free Event</p>
                        )}
                        {selectedEvent.registrationEndDate && (
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                <span>
                                    Registration {isRegistrationClosed ? 'closed' : 'closes'} on {format(parse(selectedEvent.registrationEndDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                                    {selectedEvent.registrationEndTime ? ` at ${selectedEvent.registrationEndTime}` : ''}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required className="form-field"/>
                    {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="standard">Class</Label>
                        <Input id="standard" name="standard" required className="form-field"/>
                        {state?.errors?.standard && <p className="text-xs text-destructive">{state.errors.standard}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" name="department" required className="form-field"/>
                        {state?.errors?.department && <p className="text-xs text-destructive">{state.errors.department}</p>}
                    </div>
                </div>
                
                <div className="space-y-1">
                        <Label htmlFor="phoneNumber">Contact Number</Label>
                        <Input id="phoneNumber" name="phoneNumber" type="tel" maxLength={10} required className="form-field"/>
                        {state?.errors?.phoneNumber && <p className="text-sm text-destructive">{state.errors.phoneNumber[0]}</p>}
                    </div>

                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required className="form-field"/>
                    {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
                </div>
            </fieldset>
            
            {state?.message && !state.success && !state.paymentRequired && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
            
            <div className="pt-2">
              {isRegistrationClosed ? (
                <div className='text-center space-y-2'>
                    <Alert variant="warning" className="text-center">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-bold">Registration for this event has closed.</AlertTitle>
                    </Alert>
                    <p className="text-xs text-muted-foreground">You can still register for another active event.</p>
                </div>
              ) : (
                <SubmitButton 
                  eventType={selectedEvent?.eventType} 
                  eventFee={selectedEvent?.eventFee}
                  disabled={!selectedEvent}
                />
              )}
            </div>
        </>
      )}
    </form>
  );
}
