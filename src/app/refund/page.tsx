

'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, Home, LogIn, PartyPopper, Search, ShieldCheck, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useActionState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormStatus } from 'react-dom';
import { requestRefundAction, checkRefundStatusAction } from '@/lib/actions';
import { AppEvent, RefundRequest, User } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Countdown } from '@/components/user/countdown';

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full btn-gradient" disabled={pending || disabled}>
      {pending ? 'Submitting...' : 'Submit Request'}
    </Button>
  );
}

function CheckStatusButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      <Search className="mr-2 h-4 w-4" />
      {pending ? 'Checking...' : 'Check Status'}
    </Button>
  )
}

function getStatusVariant(status: RefundRequest['status']) {
    switch (status) {
      case 'Pending':
      case 'Under Review':
        return 'secondary'; // Yellow-ish
      case 'Approved':
        return 'default'; // Blue
      case 'Paid':
        return 'success'; // Custom Green
      case 'Rejected':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
}

function getRefundCharge(amount: number): { percentage: number; charge: number; finalAmount: number } {
  let percentage = 0;
  if (amount >= 100 && amount <= 200) percentage = 10;
  else if (amount >= 201 && amount <= 500) percentage = 7;
  else if (amount >= 501 && amount <= 1000) percentage = 5;
  else if (amount > 1000) percentage = 2;

  const charge = (amount * percentage) / 100;
  const finalAmount = amount - charge;
  return { percentage, charge, finalAmount };
}

export default function RefundPage() {
  const [requestState, requestFormAction, isRequestPending] = useActionState(requestRefundAction, null);
  const [checkState, checkFormAction, isCheckPending] = useActionState(checkRefundStatusAction, null);

  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  
  useEffect(() => {
    const checkLockdownStatus = () => {
      const lockdownActive = localStorage.getItem('systemLockdownActive') === 'true';
      setIsLockdown(lockdownActive);
    };

    checkLockdownStatus();
    window.addEventListener('storage', checkLockdownStatus);
    return () => {
      window.removeEventListener('storage', checkLockdownStatus);
    };
  }, []);

  const refundDetails = useMemo(() => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event || !event.eventFee) return null;
    return getRefundCharge(event.eventFee);
  }, [selectedEventId, events]);

  useEffect(() => {
    if (checkState?.user && checkState.events && !checkState.cooldown) {
      setUser(checkState.user);
      setEvents(checkState.events);
      if (checkState.events.length > 0) {
        setSelectedEventId(checkState.events[0].id);
      }
    }
  }, [checkState]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const showRefundForm = user && !checkState?.cooldown && !checkState?.paymentReturned;


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4">
       <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
           <Link href="/">
             <Home className="mr-2 h-4 w-4" />
              Home
           </Link>
        </Button>
      </div>
      <div className="absolute top-4 right-4">
         <Button asChild variant="outline" className="w-auto bg-transparent border-primary/50 text-primary dark:text-blue-300 hover:bg-primary/10 hover:text-primary dark:hover:text-white transition-all duration-300">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Admin Login
            </Link>
          </Button>
      </div>
      <Card className="w-full max-w-lg glass-card text-foreground">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
            <CircleDollarSign className="w-12 h-12 text-yellow-400" />
          </div>
          <CardTitle className="text-3xl font-headline">Refund Request</CardTitle>
          <CardDescription className="text-muted-foreground">
            Submit a new request or check the status of an existing one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLockdown && (
            <Alert variant="destructive" className="mb-4 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>System Temporarily Disabled</AlertTitle>
              <AlertDescription>
                This feature is currently unavailable due to system maintenance. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          <fieldset disabled={isLockdown}>
            <Tabs defaultValue="new-request" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-request">New Request</TabsTrigger>
                <TabsTrigger value="check-status">Check Status</TabsTrigger>
              </TabsList>
              <TabsContent value="new-request">
                {requestState?.success ? (
                  <div className="space-y-4 text-center pt-4">
                      <Alert className="bg-green-500/20 border-green-500 text-foreground">
                          <PartyPopper className="h-4 w-4" />
                          <AlertTitle className="font-bold">Request Submitted!</AlertTitle>
                          <AlertDescription>
                              {requestState.message}
                          </AlertDescription>
                      </Alert>
                      <Button onClick={() => window.location.reload()} className="w-full btn-gradient">
                          Submit Another Request
                      </Button>
                  </div>
                ) : checkState?.paymentReturned ? (
                  <div className="space-y-4 text-center pt-4">
                      <Alert className="bg-green-500/20 border-green-500 text-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle className="font-bold">Payment Returned Successfully</AlertTitle>
                          <AlertDescription>
                              {checkState.message}
                              {checkState.paidAt && <p className="text-xs mt-1">Paid on: {new Date(checkState.paidAt).toLocaleString()}</p>}
                          </AlertDescription>
                      </Alert>
                      <Button onClick={() => window.location.reload()} className="w-full">
                          Check Another ID
                      </Button>
                  </div>
                ) : checkState?.cooldown && checkState.lastRequestTimestamp ? (
                  <div className="space-y-4 text-center pt-4">
                      <Alert variant="warning">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="font-bold">Cooldown Period Active</AlertTitle>
                          <AlertDescription>
                              {checkState.message}
                              <Countdown lastRequestTimestamp={checkState.lastRequestTimestamp} />
                          </AlertDescription>
                      </Alert>
                      <Button onClick={() => window.location.reload()} className="w-full">
                          Try with Another ID
                      </Button>
                  </div>
                ) : !showRefundForm ? (
                  <form action={checkFormAction} className="space-y-4 pt-4">
                      <input type="hidden" name="context" value="refund" />
                      <div className="space-y-2">
                          <Label htmlFor="checkPassIdMain">Your Unique Pass ID</Label>
                          <Input id="checkPassIdMain" name="passId" required className="form-field" placeholder="e.g., F12345" />
                          {checkState?.errors?.passId && <p className="text-xs text-destructive">{checkState.errors.passId[0]}</p>}
                      </div>
                      {checkState?.message && !checkState.user && !checkState.cooldown && (
                          <Alert variant="destructive">{checkState.message}</Alert>
                      )}
                      <CheckStatusButton />
                  </form>
                ) : (
                  <form action={requestFormAction} className="space-y-4 pt-4">
                      <input type="hidden" name="passId" value={user.uniqueId} />
                      <input type="hidden" name="eventId" value={selectedEventId} />
                      <input type="hidden" name="fullName" value={user.name} />
                      <input type="hidden" name="emailOrPhone" value={user.email || user.phoneNumber || ''} />
                      <input type="hidden" name="transactionId" value={user.transactionId} />
                      {selectedEvent && <input type="hidden" name="amountPaid" value={selectedEvent.eventFee} />}

                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={user.name} disabled className="form-field" />
                        </div>
                        <div className="space-y-2">
                            <Label>Registered Email / Mobile</Label>
                            <Input value={user.email || user.phoneNumber} disabled className="form-field" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventId">Event Name</Label>
                        <Select name="eventId" value={selectedEventId} onValueChange={setSelectedEventId} required>
                          <SelectTrigger className="form-field">
                            <SelectValue placeholder="Select a paid event" />
                          </SelectTrigger>
                          <SelectContent>
                            {events.map(event => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.name} (Paid: ₹{event.eventFee})
                              </SelectItem>
                            ))}
                            {events.length === 0 && <SelectItem value="no-events" disabled>No paid events found for this Pass ID</SelectItem>}
                          </SelectContent>
                        </Select>
                        {requestState?.errors?.eventId && <p className="text-xs text-destructive">{requestState.errors.eventId[0]}</p>}
                      </div>

                      {refundDetails && (
                          <Alert className="text-foreground bg-primary/10 border-primary/50">
                              <ShieldCheck className="h-4 w-4" />
                              <AlertTitle>Refund Calculation</AlertTitle>
                              <AlertDescription>
                                  A processing fee of **{refundDetails.percentage}%** (₹{refundDetails.charge}) will be deducted. You will receive **₹{refundDetails.finalAmount}**.
                              </AlertDescription>
                          </Alert>
                      )}

                      <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <RadioGroup name="paymentMethod" className="grid grid-cols-2 sm:grid-cols-3 gap-2" required>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="GPay" id="gpay" /><Label htmlFor="gpay">GPay</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="PhonePe" id="phonepe" /><Label htmlFor="phonepe">PhonePe</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Paytm" id="paytm" /><Label htmlFor="paytm">Paytm</Label></div>
                          </RadioGroup>
                          {requestState?.errors?.paymentMethod && <p className="text-xs text-destructive">{requestState.errors.paymentMethod[0]}</p>}
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="upiIdOrAccount">UPI ID for Refund</Label>
                          <Input id="upiIdOrAccount" name="upiIdOrAccount" required className="form-field" placeholder="your-upi-id@okhdfcbank" />
                          {requestState?.errors?.upiIdOrAccount && <p className="text-xs text-destructive">{requestState.errors.upiIdOrAccount[0]}</p>}
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="reason">Reason for Refund</Label>
                          <Textarea id="reason" name="reason" required className="form-field" placeholder="Please provide a brief reason for your request." />
                          {requestState?.errors?.reason && <p className="text-xs text-destructive">{requestState.errors.reason[0]}</p>}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))} name="agreedToTerms"/>
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I have read and agree to the Terms &amp; Conditions.
                        </label>
                      </div>
                      {requestState?.errors?.agreedToTerms && <p className="text-xs text-destructive">{requestState.errors.agreedToTerms[0]}</p>}
                      
                      <Separator className="bg-border/50"/>

                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                        <p className="font-bold">Summary & T&C:</p>
                        <ul className="list-disc list-inside pl-2">
                          {selectedEventId && events.find(e => e.id === selectedEventId) && (
                            <li>Event: **{events.find(e => e.id === selectedEventId)?.name}**</li>
                          )}
                          {refundDetails && (
                              <>
                                <li>Paid Amount: **₹{events.find(e => e.id === selectedEventId)?.eventFee}**</li>
                                <li>Refund Charge ({refundDetails.percentage}%): **- ₹{refundDetails.charge}**</li>
                                <li>Final Refundable Amount: **₹{refundDetails.finalAmount}**</li>
                              </>
                          )}
                          <li>Refund will be processed to the original payment method.</li>
                          <li>Processing may take 24-48 working hours after approval.</li>
                        </ul>
                      </div>

                      {requestState && !requestState.success && requestState.message && (
                          <Alert variant="destructive">{requestState.message}</Alert>
                      )}

                      <SubmitButton disabled={!agreedToTerms} />
                  </form>
                )}
              </TabsContent>
              <TabsContent value="check-status">
                <form action={checkFormAction} className="space-y-4 pt-4">
                  <input type="hidden" name="context" value="status" />
                  <div className="space-y-2">
                      <Label htmlFor="checkPassId">Unique Pass ID</Label>
                      <Input id="checkPassId" name="passId" required className="form-field" placeholder="e.g., F12345" />
                      {checkState?.errors?.passId && <p className="text-xs text-destructive">{checkState.errors.passId[0]}</p>}
                  </div>

                  <CheckStatusButton />

                  {checkState?.message && !checkState.cooldown && (
                    <Alert variant={checkState.requests ? 'default' : 'destructive'} className="mt-4">
                      <AlertTitle>{checkState.requests ? 'Results' : 'Error'}</AlertTitle>
                      <AlertDescription>
                        {checkState.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {checkState?.requests && checkState.requests.length > 0 && (
                    <div className="space-y-2 pt-4">
                      <h3 className="font-semibold">Your Refund Requests:</h3>
                      {checkState.requests.map(req => (
                        <div key={req.id} className="border rounded-md p-3 text-sm bg-background/20 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{req.eventName}</p>
                                    <p className="text-xs text-muted-foreground">Submitted: {new Date(req.requestedAt).toLocaleString()}</p>
                                </div>
                                <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="space-y-1 text-xs">
                              <p><span className="font-semibold">Refund Amount:</span> ₹{req.finalRefundAmount} (after ₹{req.refundCharge} charge)</p>
                              {req.approvedAt && <p className="text-green-400"><span className="font-semibold">Approved:</span> {new Date(req.approvedAt).toLocaleString()}</p>}
                              {req.paidAt && <p className="text-blue-400"><span className="font-semibold">Paid:</span> {new Date(req.paidAt).toLocaleString()}</p>}
                              {req.rejectionReason && <p className="text-destructive"><span className="font-semibold">Reason:</span> {req.rejectionReason}</p>}
                            </div>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </fieldset>
        </CardContent>
      </Card>
    </div>
  );
}
