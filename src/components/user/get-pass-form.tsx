

'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { getPassAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrPassView } from '../admin/qr-pass-view';
import { AlertCircle, Clock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Admin, AppEvent, User } from '@/lib/definitions';
import { getAdmins } from '@/lib/data';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full btn-gradient hover:scale-105" disabled={pending}>
      {pending ? 'Searching...' : 'Get My Pass'}
    </Button>
  );
}

const initialFormState = {
  user: undefined,
  event: undefined,
  message: null,
  errors: undefined,
  info: null,
};

export function GetPassForm() {
  const [state, formAction, isPending] = useActionState(getPassAction, initialFormState);
  const [showPass, setShowPass] = useState(false);
  const [eventAdmin, setEventAdmin] = useState<Admin | null>(null);
  
  useEffect(() => {
    async function fetchAdmin() {
        if(state?.event?.adminId) {
            const admins = await getAdmins();
            const admin = admins.find(a => a.id === state.event?.adminId);
            setEventAdmin(admin || null);
        }
    }
    // Only show pass if there is user/event data. The action now handles refund logic.
    if (state?.user && state?.event) {
        setShowPass(true);
        fetchAdmin();
    } else {
        setShowPass(false);
    }
  }, [state]);

  const handleBack = () => {
    // Reload the page to reset the component state and allow a new search
    window.location.reload();
  }

  if (showPass && state?.user && state?.event) {
    return (
        <div className="space-y-4 pt-4">
            <QrPassView user={state.user} event={state.event} eventAdmin={eventAdmin} />
            <Button variant="outline" onClick={handleBack} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Find Another Pass
            </Button>
        </div>
    )
  }

  return (
    <form id="get-pass-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">Unique ID</Label>
        <Input id="identifier" name="identifier" placeholder="Enter your Unique ID" required className="form-field" />
        {state?.errors?.identifier && <p className="text-sm text-destructive">{state.errors.identifier}</p>}
      </div>
      
      {!isPending && state?.message && (state.user?.status === 'Pending' || state.user?.paymentStatus === 'Pending') && (
         <Alert variant="warning">
          <Clock className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {!isPending && state?.message && (!state.user || state.user.paymentStatus === 'Refund In Progress') && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {!isPending && state?.message && (state.user?.status === 'Rejected' || state.user?.paymentStatus === 'Unpaid' || state.user?.paymentStatus === 'Refunded' ) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  );
}
