

'use client';

import type { User, AppEvent, Admin } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash, ThumbsUp, Share2, Eye, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { RemoveUserButton } from './remove-user-button';
import { updateUserStatusAction, updateUserPaymentStatusAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { SharePassDialog } from './share-pass-dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function StatusBadge({ status }: { status: User['status'] }) {
    const variant = {
        'Approved': 'default',
        'Pending': 'secondary',
        'Rejected': 'destructive',
    }[status]  as "default" | "secondary" | "destructive" | null | undefined;

    return <Badge variant={variant}>{status}</Badge>
}

function PaymentStatusBadge({ status }: { status: User['paymentStatus'] }) {
    const variant = {
        'Paid': 'default',
        'Pending': 'secondary',
        'Unpaid': 'destructive',
        'Refunded': 'outline',
        'Refund In Progress': 'secondary',
    }[status] as "default" | "secondary" | "destructive" | "outline" | null | undefined;
    
    const text = {
        'Paid': 'Paid',
        'Pending': 'Pending',
        'Unpaid': 'Not Paid',
        'Refunded': 'Refunded',
        'Refund In Progress': 'Refund In Progress',
    }[status];

    return <Badge variant={variant}>{text}</Badge>
}

function getUpiTransactionLink(transactionId?: string): string | null {
    if (!transactionId || transactionId.length < 12) return null;
    
    // GPay format (seems to be common)
    if (transactionId.startsWith('T') && transactionId.length > 20) {
        return `https://pay.google.com/gp/p/ui/transaction/${transactionId}`;
    }
    // PhonePe format (12 digits, sometimes prefixed)
    if (/^\d{12}$/.test(transactionId) || (transactionId.startsWith('P') && transactionId.length > 12)) {
         return `https://phonepe.com/contact-support/transaction/${transactionId}`;
    }
     // Paytm format
    if (/^\d{16,}$/.test(transactionId)) {
        return `https://paytm.com/care/ticket/transaction/${transactionId}`;
    }
    // Generic search as a fallback
    return `https://www.google.com/search?q=upi+transaction+${transactionId}`;
}


function StatusActionButton({ userId, status, disabled, children }: { userId: string; status: 'Approved' | 'Rejected', disabled?: boolean, children: React.ReactNode }) {
    const { toast } = useToast();
    const [state, formAction, isPending] = useActionState(updateUserStatusAction, null);

    useEffect(() => {
        if (state?.success) {
            toast({
                title: 'Success',
                description: state.message,
            });
            // Re-fetching data is handled by revalidatePath in the action
        } else if (state?.message) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: state.message,
            });
        }
    }, [state, toast]);

    const isDisabled = disabled || isPending;

    return (
        <form action={formAction}>
             <input type="hidden" name="userId" value={userId} />
             <input type="hidden" name="status" value={status} />
             <button type="submit" disabled={isDisabled} className='w-full'>
                <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className={cn("flex items-center cursor-pointer", isDisabled && "cursor-not-allowed text-muted-foreground")}
                    disabled={isDisabled}
                >
                    {children}
                </DropdownMenuItem>
             </button>
        </form>
    );
}

function PaymentStatusActionButton({ userId, status, disabled, children }: { userId: string; status: 'Paid' | 'Unpaid', disabled?: boolean, children: React.ReactNode }) {
    const { toast } = useToast();
    
    const handleClick = async () => {
        if(disabled) return;
        const result = await updateUserPaymentStatusAction(userId, status);
        if (result.success) {
            toast({
                title: 'Success',
                description: result.message,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
    };

    return (
        <DropdownMenuItem 
            onSelect={(e) => { e.preventDefault(); handleClick(); }} 
            className={cn("flex items-center cursor-pointer", disabled && "cursor-not-allowed text-muted-foreground")}
            disabled={disabled}
        >
            {children}
        </DropdownMenuItem>
    );
}


export function UsersTable({ users, events, admins, currentAdmin }: { users: User[], events: AppEvent[], admins: Admin[], currentAdmin: Admin | null }) {
  
  const getUserEvent = (user: User) => {
    return events.find(e => e.id === user.eventId);
  };

  const isAdmin = currentAdmin?.role === 'Admin';


  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Unique ID</TableHead>
            <TableHead>Reg. Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
           {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => {
            const event = getUserEvent(user);
            const canManageUser = isAdmin || (currentAdmin?.role === 'EventsManager' && currentAdmin?.id === event?.adminId);
            const transactionLink = getUpiTransactionLink(user.transactionId);

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                    <div>{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.phoneNumber || 'N/A'}</div>
                </TableCell>
                <TableCell>{user.uniqueId}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell>
                    <PaymentStatusBadge status={user.paymentStatus} />
                    {user.transactionId && (
                        <div className="text-xs text-muted-foreground mt-1">
                           {transactionLink ? (
                             <a href={transactionLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                               ID: {user.transactionId} <ExternalLink className="h-3 w-3"/>
                             </a>
                           ) : (
                             <span>ID: {user.transactionId}</span>
                           )}
                        </div>
                    )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canManageUser}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuLabel>Actions</DropdownMenuLabel>
                       
                       {user.status === 'Approved' && (
                         <DropdownMenuItem asChild>
                           <Link href={`/admin/users/${user.id}/pass`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            View Pass
                           </Link>
                         </DropdownMenuItem>
                       )}

                       {user.status === 'Pending' && (
                           <StatusActionButton userId={user.id} status="Approved" disabled={!canManageUser}>
                               <ThumbsUp className="mr-2 h-4 w-4" />
                               Approve Registration
                           </StatusActionButton>
                       )}
                       
                       {user.paymentStatus === 'Pending' && (
                           <>
                               <DropdownMenuSeparator />
                               <PaymentStatusActionButton userId={user.id} status="Paid" disabled={!canManageUser}>
                                   <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                   Approve Payment
                               </PaymentStatusActionButton>
                               <PaymentStatusActionButton userId={user.id} status="Unpaid" disabled={!canManageUser}>
                                   <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                   Reject Payment
                               </PaymentStatusActionButton>
                               <DropdownMenuSeparator />
                           </>
                       )}


                        {user.status === 'Approved' && (
                            <SharePassDialog user={user}>
                                <div className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                    !canManageUser && "cursor-not-allowed text-muted-foreground hover:bg-transparent"
                                )}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </div>
                            </SharePassDialog>
                        )}
                      <DropdownMenuSeparator />
                      <RemoveUserButton userId={user.id} disabled={!isAdmin}>
                         <div className={cn(
                            'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-destructive-foreground',
                             !isAdmin && "cursor-not-allowed text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                         )}>
                           <Trash className="mr-2 h-4 w-4" />
                           Remove
                        </div>
                      </RemoveUserButton>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
