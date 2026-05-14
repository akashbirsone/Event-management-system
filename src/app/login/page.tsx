'use client';
import { LoginForm } from '@/components/auth/login-form';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const adminId = localStorage.getItem('adminId');
        if (adminId) {
            router.replace('/admin');
        }
    }, [router]);


  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] -z-10" />
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 blur-[120px] rounded-full w-[500px] h-[500px] bg-primary/20 -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 blur-[120px] rounded-full w-[500px] h-[500px] bg-blue-500/20 -z-10" />
      
      <div className="absolute top-4 left-4 z-50">
         <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
         </Button>
      </div>
      <div className="absolute top-4 right-4 z-50">
         <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <LoginForm />
      </div>
    </main>
  );
}
