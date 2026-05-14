

'use client';
import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefundRequest, Admin } from '@/lib/definitions';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, XCircle, Clock, DollarSign, Loader2, FileImage, Phone, MoreHorizontal } from 'lucide-react';
import { updateRefundStatusAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { useFormStatus } from 'react-dom';

function ActionButton({ status, children, variant, disabled, formAction }: { status: RefundRequest['status'], children: React.ReactNode, variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined, disabled?: boolean, formAction?: (payload: FormData) => void }) {
    const { pending } = useFormStatus();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (formAction) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget.form!);
        formData.set('status', status);
        formAction(formData);
      }
    };

    return (
        <Button type={formAction ? 'button' : 'submit'} name="status" value={status} variant={variant} disabled={pending || disabled} onClick={formAction ? handleClick : undefined}>
            {pending ? 'Processing...' : children}
        </Button>
    )
}

export function RefundDetailsDialog({ request, eventManager, currentAdmin, children }: { request: RefundRequest, eventManager?: Admin, currentAdmin: Admin | null, children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(request.rejectionReason || '');
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const { toast } = useToast();

  const [state, formAction] = useActionState(updateRefundStatusAction, null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success',
        description: state.message,
      });
      setOpen(false);
      // No need to reset showRejectionInput, it is handled by component state
    } else if (state?.message) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
     if (state?.updatedStatus) {
      setCurrentStatus(state.updatedStatus);
    }
  }, [state, toast]);

  const DetailRow = ({ label, value, isAmount, children }: { label: string, value?: string | number | null, isAmount?: boolean, children?: React.ReactNode }) => (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label className="text-right text-muted-foreground">{label}</Label>
      <div className="col-span-2 font-medium break-words">
        {isAmount ? `₹${value}` : value || 'N/A'}
        {children}
      </div>
    </div>
  );
  
  const handleUnderReview = () => {
    setCurrentStatus('Under Review');
  }

  const isFormDisabled = currentStatus === 'Paid' || currentStatus === 'Rejected';
  const isAdmin = currentAdmin?.role === 'Admin';


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? 
          <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund Request Details</DialogTitle>
          <DialogDescription>
            Review the user's refund request and take action.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="refundId" value={request.id} />
            <div className="space-y-4 py-4 pr-2">
              <h4 className="text-sm font-semibold text-muted-foreground">User & Event Info</h4>
              <DetailRow label="User Name" value={request.fullName} />
              <DetailRow label="Email/Mobile" value={request.emailOrPhone} />
              <DetailRow label="Event Name" value={request.eventName} />
              <DetailRow label="Pass ID" value={request.passId} />
              {isAdmin && eventManager && (
                <DetailRow label="Event Manager">
                  <div className='flex items-center gap-2'>
                    <span>{eventManager.name}</span>
                    {eventManager.phoneNumber && (
                       <a href={`tel:${eventManager.phoneNumber}`} className="flex items-center gap-1 text-primary hover:underline text-xs">
                          <Phone className="h-3 w-3" />
                          {eventManager.phoneNumber}
                       </a>
                    )}
                  </div>
                </DetailRow>
              )}
              <Separator />
              <h4 className="text-sm font-semibold text-muted-foreground">Payment & Refund Details</h4>
              <DetailRow label="Payment Method" value={request.paymentMethod} />
              <DetailRow label="Transaction ID" value={request.transactionId} />
              <DetailRow label="Payer UPI/Account" value={request.upiIdOrAccount} />
              <DetailRow label="Amount Paid" value={request.amountPaid} isAmount />
              <DetailRow label="Refund Charge" value={request.refundCharge} isAmount />
              <DetailRow label="Final Refund" value={request.finalRefundAmount} isAmount />
              {request.screenshotPath && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right text-muted-foreground">Screenshot</Label>
                  <div className="col-span-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={request.screenshotPath} target="_blank" rel="noopener noreferrer">
                        <FileImage className="mr-2 h-4 w-4" />
                        View Screenshot
                      </a>
                    </Button>
                  </div>
                </div>
              )}
               <Separator />
               <div className="grid grid-cols-3 items-start gap-4">
                <Label className="text-right text-muted-foreground mt-2">Reason</Label>
                <p className="col-span-2 border p-2 rounded-md bg-muted text-sm">{request.reason}</p>
              </div>
                <DetailRow label="Current Status" value={currentStatus} />
                {currentStatus === 'Rejected' && request.rejectionReason && (
                  <div className="grid grid-cols-3 items-start gap-4">
                    <Label className="text-right text-destructive mt-2">Rejection Reason</Label>
                    <p className="col-span-2 border border-destructive/50 p-2 rounded-md bg-destructive/10 text-sm text-destructive-foreground">{request.rejectionReason}</p>
                  </div>
                )}
                {currentStatus === 'Under Review' && (
                     <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="rejectionReason" className='text-destructive'>Reason for Rejection (Required)</Label>
                        <Textarea 
                            id="rejectionReason" 
                            name="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Request timed out, invalid transaction ID."
                        />
                     </div>
                )}
            </div>
            <DialogFooter>
             <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>

                {currentStatus === 'Pending' && (
                    <>
                        <Button type="button" variant="outline" onClick={handleUnderReview}>Reject</Button>
                        <ActionButton status="Approved"><CheckCircle className="mr-2 h-4 w-4" />Approve</ActionButton>
                    </>
                )}
                
                {currentStatus === 'Under Review' && (
                    <ActionButton status="Rejected" variant="destructive" disabled={!rejectionReason}>
                        <XCircle className="mr-2 h-4 w-4" />Confirm Rejection
                    </ActionButton>
                )}
                
                {currentStatus === 'Approved' && (
                     <ActionButton status="Paid" variant="default">
                        <DollarSign className="mr-2 h-4 w-4" />Mark as Paid
                     </ActionButton>
                )}
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    