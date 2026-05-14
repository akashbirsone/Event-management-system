
'use client';
import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateAdminCredentialsAction } from '@/lib/actions';
import { Admin } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function UpdateSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
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

export function CredentialsSettings({ currentAdmin }: { currentAdmin: Admin }) {
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [verificationUid, setVerificationUid] = useState('');
  const [verificationError, setVerificationError] = useState('');
  
  const [updateState, updateFormAction] = useActionState(updateAdminCredentialsAction, null);

  const FIXED_VERIFICATION_UID = '438408513357';

  useEffect(() => {
    if (updateState?.success) {
      toast({
        title: 'Success',
        description: updateState.message,
      });
      setIsVerified(false);
      setVerificationUid('');
    } else if (updateState?.message && !updateState.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: updateState.message,
      });
    }
  }, [updateState, toast]);

  const handleVerification = () => {
    setVerificationError('');
    if (verificationUid === FIXED_VERIFICATION_UID) {
        setIsVerified(true);
        toast({
            title: 'Verification Successful',
            description: 'You may now update the credentials.',
        });
    } else {
        setVerificationError('The entered UID is incorrect. Please try again.');
    }
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle>Change Main Admin Credentials</CardTitle>
          <CardDescription>
            For security, you must first verify the main admin's current ID. The verification UID is fixed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="verificationUid">Verification UID (enter 12-digit UID)</Label>
              <div className="flex items-center gap-2">
                <Input 
                    id="verificationUid" 
                    value={verificationUid}
                    onChange={(e) => setVerificationUid(e.target.value)}
                    placeholder="Enter the 12-digit UID"
                    maxLength={12}
                    className="w-full tracking-widest"
                    disabled={isVerified}
                />
                <Button onClick={handleVerification} disabled={isVerified || verificationUid.length !== 12}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verify
                </Button>
              </div>
              {verificationError && <p className="text-sm text-destructive">{verificationError}</p>}
            </div>
            
            {isVerified && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="font-bold text-green-500">UID Verified</AlertTitle>
                <AlertDescription>
                  You can now proceed to change the credentials below.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form action={updateFormAction} className="space-y-6 max-w-md mt-6 border-t pt-6">
            <fieldset disabled={!isVerified} className="space-y-6">
              <input type="hidden" name="loggedInAdminId" value={currentAdmin.id} />
               <input type="hidden" name="verificationUid" value={verificationUid} />
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
                {updateState?.errors?.currentPassword && <p className="text-sm text-destructive">{updateState.errors.currentPassword[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newAdminId">New Admin ID</Label>
                <Input id="newAdminId" name="newAdminId" required maxLength={12} />
                {updateState?.errors?.newAdminId && <p className="text-sm text-destructive">{updateState.errors.newAdminId[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
                {updateState?.errors?.newPassword && <p className="text-sm text-destructive">{updateState.errors.newPassword[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input id="confirmNewPassword" name="confirmNewPassword" type="password" required />
                {updateState?.errors?.confirmNewPassword && <p className="text-sm text-destructive">{updateState.errors.confirmNewPassword[0]}</p>}
              </div>

              {updateState?.message && !updateState.success && (
                  <Alert variant={"destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{'Update Failed'}</AlertTitle>
                    <AlertDescription>{updateState.message}</AlertDescription>
                  </Alert>
              )}

              <UpdateSubmitButton disabled={!isVerified} />
            </fieldset>
          </form>
        </CardContent>
      </Card>
  );
}
