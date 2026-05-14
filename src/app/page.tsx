'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { QrCode, Ticket, LogIn, UserPlus, CircleDollarSign, AlertTriangle, Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { RegisterDialog } from '@/components/user/register-dialog';
import { GetPassDialog } from '@/components/user/get-pass-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { getEvents } from '@/lib/data';
import { AppEvent } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type DialogType = 'register' | 'getPass' | null;

export default function Home() {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [isLockdown, setIsLockdown] = useState(false);
  const [disableRegistration, setDisableRegistration] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const checkLockdownStatus = () => {
      const lockdownActive = localStorage.getItem('systemLockdownActive') === 'true';
      const registrationDisabled = localStorage.getItem('disableUserRegistration') === 'true';
      const creditVisible = localStorage.getItem('showDevCredit') === 'true';
      
      setIsLockdown(lockdownActive);
      setDisableRegistration(lockdownActive || registrationDisabled);
      setShowCredit(creditVisible);
    };

    checkLockdownStatus();
    window.addEventListener('storage', checkLockdownStatus);

    getEvents().then(data => {
      setEvents(data.filter(e => e.registrationStatus === 'Open'));
      setIsLoadingEvents(false);
    }).catch(() => setIsLoadingEvents(false));

    return () => window.removeEventListener('storage', checkLockdownStatus);
  }, []);
  
  const isAnyButtonDisabled = isLockdown || disableRegistration;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0A0A0A] text-foreground font-sans">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/70 dark:bg-black/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <QrCode className="w-6 h-6 text-primary" strokeWidth={2} />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight">EventPass</span>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
               <Link href="#events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link>
               <Link href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">Refunds</Link>
            </nav>
            <div className="flex items-center gap-2">
               <ThemeToggle />
               <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-full border-border/50">
                  <Link href="/login">Admin Login</Link>
               </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] -z-10" />
           <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 blur-[120px] rounded-full w-[600px] h-[600px] bg-primary/20 -z-10" />
           <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 blur-[120px] rounded-full w-[600px] h-[600px] bg-blue-500/20 -z-10" />

           <div className="container mx-auto px-4 text-center max-w-4xl">
              {showCredit && (
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-6">
                  Platform created by Akash Birsone
                </div>
              )}
              {isLockdown && (
                <Alert variant="destructive" className="mb-8 max-w-xl mx-auto text-left shadow-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>System Temporarily Disabled</AlertTitle>
                  <AlertDescription>The system is currently under maintenance. Registrations are paused.</AlertDescription>
                </Alert>
              )}
              
              <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight mb-6 leading-tight">
                Your Smart Event <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                  Management Solution
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
                Seamlessly discover, register, and manage your event passes with our modern, frictionless platform. Built for the future of experiences.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <RegisterDialog open={activeDialog === 'register'} onOpenChange={(isOpen) => !isAnyButtonDisabled && setActiveDialog(isOpen ? 'register' : null)}>
                  <Button size="lg" disabled={isAnyButtonDisabled} onClick={() => setActiveDialog('register')} className="w-full sm:w-auto rounded-full h-14 px-8 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Register Now
                  </Button>
                </RegisterDialog>
                
                <GetPassDialog open={activeDialog === 'getPass'} onOpenChange={(isOpen) => !isAnyButtonDisabled && setActiveDialog(isOpen ? 'getPass' : null)}>
                  <Button variant="outline" size="lg" disabled={isAnyButtonDisabled} onClick={() => setActiveDialog('getPass')} className="w-full sm:w-auto rounded-full h-14 px-8 text-base bg-background/50 backdrop-blur-sm hover:-translate-y-1 transition-all border-border/50">
                      <Ticket className="mr-2 h-5 w-5"/>
                      Get Your Pass
                  </Button>
                </GetPassDialog>
              </div>
           </div>
        </section>

        {/* Featured Events Section */}
        <section id="events" className="py-24 bg-white/50 dark:bg-black/20 border-t border-border/40 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-headline font-bold tracking-tight mb-2">Featured Events</h2>
                <p className="text-muted-foreground">Discover and register for upcoming events and workshops.</p>
              </div>
            </div>

            {isLoadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1, 2, 3].map(i => (
                   <Card key={i} className="overflow-hidden border-0 shadow-lg dark:bg-secondary/20">
                      <Skeleton className="h-48 w-full rounded-none" />
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-1/2" />
                           <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-2xl bg-muted/20">
                 <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">No Upcoming Events</h3>
                 <p className="text-muted-foreground max-w-md mx-auto">There are currently no open events. Please check back later or contact the administrator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {events.map(event => (
                   <Card key={event.id} className="group overflow-hidden border-border/40 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 dark:bg-card/40 backdrop-blur-md flex flex-col rounded-[24px]">
                      <div className="h-56 bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 relative overflow-hidden flex items-center justify-center">
                         <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                         <Ticket className="w-16 h-16 text-primary/30 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500" />
                         <div className="absolute top-4 right-4 z-20">
                            {event.eventType === 'Paid' ? (
                               <Badge variant="default" className="bg-white/90 text-black hover:bg-white backdrop-blur-md shadow-sm font-semibold px-3 py-1">
                                 ₹{event.eventFee}
                               </Badge>
                            ) : (
                               <Badge variant="secondary" className="bg-white/90 dark:bg-black/90 text-black dark:text-white backdrop-blur-md shadow-sm font-semibold px-3 py-1">
                                 Free
                               </Badge>
                            )}
                         </div>
                      </div>
                      <CardHeader className="px-6 pt-6 pb-4">
                        <CardTitle className="font-headline text-2xl line-clamp-1 group-hover:text-primary transition-colors">{event.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm leading-relaxed mt-2">{event.description || "No description available."}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 px-6 pb-6">
                        <div className="space-y-3 text-sm font-medium">
                          {event.startDate && (
                            <div className="flex items-center text-muted-foreground bg-muted/30 p-2 rounded-lg">
                              <Calendar className="w-4 h-4 mr-3 text-primary/70" />
                              <span>{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              {event.startTime && <span className="ml-1">• {event.startTime}</span>}
                            </div>
                          )}
                          {event.venue && (
                            <div className="flex items-center text-muted-foreground bg-muted/30 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 mr-3 text-primary/70" />
                              <span className="line-clamp-1">{event.venue}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0 border-none">
                        <RegisterDialog open={activeDialog === 'register'} onOpenChange={(isOpen) => !isAnyButtonDisabled && setActiveDialog(isOpen ? 'register' : null)}>
                          <Button disabled={isAnyButtonDisabled} onClick={() => setActiveDialog('register')} className="w-full font-semibold rounded-xl h-12 hover:scale-[1.02] transition-transform">
                            Register Now
                          </Button>
                        </RegisterDialog>
                      </CardFooter>
                   </Card>
                 ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-white/80 dark:bg-black/80 backdrop-blur-lg py-12 text-center md:text-left">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="bg-primary/10 p-1.5 rounded-md">
               <QrCode className="w-5 h-5 text-primary" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight">EventPass</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EventPass System. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
             <Link href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link>
             <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
