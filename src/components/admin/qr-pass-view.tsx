'use client';

import { useRef } from 'react';
import type { AppEvent, User, Admin } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode.react';
import { Download, MapPin, Calendar, Clock, Phone, Info } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CreatorBadge } from '../user/creator-badge';
import { Badge } from '@/components/ui/badge';

const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString;
}

export function QrPassView({ user, event, eventAdmin }: { user: User; event: AppEvent, eventAdmin: Admin | null }) {
  const passRef = useRef<HTMLDivElement>(null);

  const qrData = `/pass/${user.id}`;
  const googleMapsUrl = event.venue && event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.address}`)}` : '#';

  const handleDownload = () => {
    if (passRef.current) {
      htmlToImage.toPng(passRef.current, { 
        cacheBust: true,
        canvasWidth: 1080,
        canvasHeight: 1920,
        style: { margin: '0', padding: '0' }
      })
        .then(function (dataUrl) {
          const link = document.createElement('a');
          link.download = `EventPass-${user.uniqueId}.png`;
          link.href = dataUrl;
          link.click();
        });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
        <div ref={passRef} className="w-full relative drop-shadow-2xl">
            {/* Top Ticket Section */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-t-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 blur-2xl rounded-full w-48 h-48 bg-white/20 z-0" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <Badge variant="secondary" className="mb-4 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        {event.eventType === 'Paid' ? 'PREMIUM PASS' : 'GENERAL ADMISSION'}
                    </Badge>
                    <h2 className="text-3xl font-bold font-headline tracking-tight mb-1 leading-tight">{user.name}</h2>
                    <p className="text-white/80 font-medium text-lg uppercase tracking-wider mb-4">{event.name}</p>
                    
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="bg-black/20 hover:bg-black/30 transition-colors px-4 py-2 rounded-full text-sm inline-flex items-center gap-2 backdrop-blur-md">
                        <MapPin className='h-4 w-4' /> <span className="line-clamp-1">{event.venue}</span>
                    </a>
                </div>
            </div>

            {/* Cutout / Perforation Area */}
            <div className="h-8 bg-card flex items-center relative z-10 overflow-hidden">
                {/* Left Semi-circle */}
                <div className="absolute left-[-16px] w-8 h-8 bg-muted rounded-full shadow-inner" />
                {/* Dashed Line */}
                <div className="w-full border-t-2 border-dashed border-border/60 mx-6" />
                {/* Right Semi-circle */}
                <div className="absolute right-[-16px] w-8 h-8 bg-muted rounded-full shadow-inner" />
            </div>

            {/* Bottom Ticket Section */}
            <div className="bg-card rounded-b-3xl p-8 pt-4 flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 w-full aspect-square flex items-center justify-center mb-6">
                    <QRCode value={qrData} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} level="Q" />
                </div>
                
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    {event.startDate && (
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Date</span>
                            <div className="flex items-center font-medium">
                                <Calendar className="h-4 w-4 mr-1.5 text-primary" />
                                {format(parseISO(event.startDate), 'MMM dd, yyyy')}
                            </div>
                        </div>
                    )}
                    {event.startTime && (
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Time</span>
                            <div className="flex items-center font-medium">
                                <Clock className="h-4 w-4 mr-1.5 text-primary" />
                                {formatTime(event.startTime)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full bg-muted/50 rounded-xl p-4 flex flex-col items-center justify-center border border-border/50 mb-6">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Ticket ID</span>
                    <p className="text-xl font-mono font-bold tracking-widest text-foreground">
                        {user.uniqueId}
                    </p>
                </div>

                <div className="flex flex-col items-center space-y-4 w-full">
                    <a href={`tel:${event.contactInfo || '9561274934'}`} className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full">
                        <Phone className="h-4 w-4" /> Support: {event.contactInfo || '9561274934'}
                    </a>
                    <div className="opacity-70 scale-90">
                        <CreatorBadge />
                    </div>
                </div>
            </div>
        </div>
        
        <Button onClick={handleDownload} className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
            <Download className="mr-2 h-5 w-5" /> Save Ticket to Device
        </Button>
    </div>
  );
}
