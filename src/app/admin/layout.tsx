
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Ticket,
  Clock,
  Shield,
  CircleDollarSign,
  Settings,
  History,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, useState } from 'react';
import { Admin } from '@/lib/definitions';
import { getAdmins } from '@/lib/data';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { MobileHeader } from '@/components/admin/mobile-header';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const isPageActive = (pathname: string, path: string) => {
  if (path === '/admin') {
      return pathname === path;
  }
  return pathname.startsWith(path);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isLockdown, setIsLockdown] = useState(false);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (adminId) {
      getAdmins().then(admins => {
        const currentAdmin = admins.find(a => a.id === adminId);
        setAdmin(currentAdmin || null);
        if (!currentAdmin) {
          handleLogout();
        }
      });
    } else {
      router.replace('/login');
    }
  }, [router, pathname]);


   useEffect(() => {
    const checkLockdownStatus = () => {
      const lockdownActive = localStorage.getItem('systemLockdownActive') === 'true';
      if (lockdownActive !== isLockdown) {
          setIsLockdown(lockdownActive);
          if (admin && admin.role !== 'Admin') {
            toast({
              variant: lockdownActive ? 'destructive' : 'default',
              title: lockdownActive ? 'System Lockdown Activated' : 'System Lockdown Deactivated',
              description: lockdownActive ? 'All standard functions are temporarily disabled.' : 'System functions have been restored.',
              duration: 5000,
            });
          }
      }
    };
    checkLockdownStatus();
    const interval = setInterval(checkLockdownStatus, 2000); // Check every 2 seconds
    return () => clearInterval(interval);

  }, [admin, toast, isLockdown]);

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    router.replace('/login');
  };
  
  const getRoleBadgeVariant = (role: Admin['role']) => {
    switch (role) {
      case 'Admin':
        return 'destructive';
      case 'EventsManager':
        return 'secondary';
      default:
        return 'default';
    }
  }

  // Fieldset should be disabled if lockdown is on, UNLESS you are the main admin on the settings page.
  const isFieldsetDisabled = isLockdown && (admin?.role !== 'Admin' || pathname !== '/admin/settings');
  // Banner should be shown if lockdown is on, UNLESS you are the main admin on the settings page.
  const showLockdownBanner = isLockdown && (admin?.role !== 'Admin' || pathname !== '/admin/settings');


  return (
    <div className='flex flex-col min-h-screen'>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="py-6 border-b border-border/40">
              <div className="flex items-center justify-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Ticket className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-headline font-bold tracking-tight">EventPass</h1>
              </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarMenu className="space-y-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                  <Link href="/admin">
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/events')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                  <Link href="/admin/events">
                    <Calendar className="w-5 h-5" />
                    Events
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/users')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                  <Link href="/admin/users">
                    <Users className="w-5 h-5" />
                    Users
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/logs')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                  <Link href="/admin/logs">
                    <Clock className="w-5 h-5" />
                    Entry Logs
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/refunds')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                  <Link href="/admin/refunds">
                    <CircleDollarSign className="w-5 h-5" />
                    Refunds
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {admin?.role === 'Admin' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/audit-log')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                          <Link href="/admin/audit-log">
                          <History className="w-5 h-5" />
                          Audit Log
                          </Link>
                      </SidebarMenuButton>
                      </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/admins')} aria-disabled={isLockdown} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <Link href="/admin/admins">
                        <Shield className="w-5 h-5" />
                        Admins
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isPageActive(pathname, '/admin/settings')} className="h-12 px-4 gap-3 text-base font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                          <Link href="/admin/settings">
                          <Settings className="w-5 h-5" />
                          Settings
                          </Link>
                      </SidebarMenuButton>
                      </SidebarMenuItem>
                  </>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/40 hidden md:block">
            <div className="flex flex-col gap-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{admin?.id.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate" title={admin?.id}>{admin?.id}</span>
                    {admin && <Badge variant={getRoleBadgeVariant(admin.role)} className="w-fit text-[10px] px-1.5 py-0 mt-0.5">{admin.role}</Badge>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <ThemeToggle />
                     <span className="hidden xl:inline-block">Theme</span>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will be redirected to the login page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout} variant="destructive">
                            Logout
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="pb-16 md:pb-0"> {/* Padding bottom for mobile nav */}
          <div className="flex flex-col min-h-screen">
            <MobileHeader />
            {showLockdownBanner && (
              <TooltipProvider>
                <div className="sticky top-0 z-40 bg-destructive text-destructive-foreground p-2 text-center text-sm font-bold animate-blink-bg-red flex items-center justify-center gap-2 shadow-md">
                  <Tooltip>
                      <TooltipTrigger>
                          <AlertTriangle className="h-5 w-5" />
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>The Main Admin has activated a system-wide lockdown. All non-essential functions are disabled.</p>
                      </TooltipContent>
                  </Tooltip>
                  SYSTEM LOCKDOWN ACTIVE
                </div>
              </TooltipProvider>
            )}
            <fieldset disabled={isFieldsetDisabled} className="flex-grow overflow-y-auto bg-slate-50/50 dark:bg-black/50">
              {children}
            </fieldset>
          </div>
          
          {/* Mobile Bottom Navigation (Native App Style) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around h-16 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
            <Link href="/admin" className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors", isPageActive(pathname, '/admin') ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/admin/events" className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors", isPageActive(pathname, '/admin/events') ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-medium">Events</span>
            </Link>
            
            {/* Scan / Action Button (Center Floating Style) */}
            <div className="flex flex-col items-center justify-center w-full h-full -mt-6">
               <Button asChild className="w-12 h-12 rounded-full shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all">
                  <Link href="/scan">
                     <QrCode className="w-6 h-6 text-white" />
                  </Link>
               </Button>
               <span className="text-[10px] font-medium text-foreground mt-1.5">Scan</span>
            </div>

            <Link href="/admin/users" className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors", isPageActive(pathname, '/admin/users') ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-medium">Users</span>
            </Link>
            <Link href="/admin/settings" className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors", isPageActive(pathname, '/admin/settings') ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-medium">Settings</span>
            </Link>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
