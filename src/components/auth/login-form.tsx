'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { cn } from '@/lib/utils';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:-translate-y-0.5 transition-all" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Signing In...
        </>
      ) : (
        'Sign In'
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.adminId) {
      localStorage.setItem('adminId', state.adminId);
      router.push('/admin');
    }
  }, [state, router]);

  return (
    <Card className="w-full border-border/40 bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pt-8 pb-6 px-8">
        <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-2xl">
                <QrCode className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
        </div>
        <CardTitle className="text-3xl font-headline font-bold tracking-tight text-foreground">Welcome Back</CardTitle>
        <CardDescription className="text-base mt-2">Log in to the Admin Portal</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form action={formAction} className="space-y-6">
           <div className="space-y-2.5">
            <Label htmlFor="role" className="font-medium">Select Role</Label>
            <Select name="role" required>
              <SelectTrigger id="role" className={cn("h-12 bg-background/50", state?.errors?.role && "border-destructive")}>
                <SelectValue placeholder="Select a role to login" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="EventsManager">Events Manager</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.role && <p className="text-sm text-destructive">{state.errors.role}</p>}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="adminId" className="font-medium">Login ID</Label>
            <Input id="adminId" name="adminId" required placeholder="name@company.com" className={cn("h-12 bg-background/50", state?.message && !state?.success && "border-destructive")} />
             {state?.errors?.adminId && <p className="text-sm text-destructive">{state.errors.adminId}</p>}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="font-medium">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required className={cn("h-12 bg-background/50", state?.message && !state?.success && "border-destructive")} />
            {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password}</p>}
          </div>

           {state?.message && !state.success && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          
          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
