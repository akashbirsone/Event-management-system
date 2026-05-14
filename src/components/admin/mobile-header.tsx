'use client';

import { Ticket, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

export function MobileHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    router.replace('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-white/80 dark:bg-black/80 backdrop-blur-xl px-4 md:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
                <Ticket className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-headline font-semibold tracking-tight">EventPass</h1>
        </div>
        
        <div className="flex items-center gap-1">
            <ThemeToggle />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                    You will need to log in again to access the admin portal.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row justify-end gap-2 sm:gap-0 mt-4">
                    <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} variant="destructive">
                    Logout
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </header>
  )
}
