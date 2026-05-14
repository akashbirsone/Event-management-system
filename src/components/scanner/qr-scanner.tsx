

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { validateQrAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Loader2, AlertTriangle, User, Phone, DollarSign } from 'lucide-react';
import type { User as UserType, AppEvent, Admin } from '@/lib/definitions';
import { Button } from '../ui/button';
import { Alert, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';

type ScanResult = {
  status: 'success' | 'invalid' | 'error' | 'idle' | 'scanning' | 'already_scanned';
  message: string;
  user?: UserType;
  event?: AppEvent;
  eventAdmin?: Admin;
};

export function QrScanner() {
  const [result, setResult] = useState<ScanResult>({ status: 'idle', message: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanningAdminId, setScanningAdminId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  
  const videoPreviewRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    setScanningAdminId(adminId);
    if (!adminId) {
      setResult({ status: 'error', message: 'You must be logged in to scan QR codes.' });
    }
  }, []);


  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner cleanly", err);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isScanning || !scanningAdminId || hasCameraPermission === false || !videoPreviewRef.current) {
      return;
    }
    
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(videoPreviewRef.current.id, {
            verbose: false,
        });
    }

    setIsScanning(true);
    setResult({ status: 'scanning', message: 'Point camera at a QR code' });

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.8);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        },
        async (decodedText, decodedResult) => {
          if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
            await stopScanner();
            const validationResult = await validateQrAction(decodedText, scanningAdminId);
            setResult(validationResult);
          }
        },
        (errorMessage) => { /* ignore non-match errors */ }
      );
    } catch (err) {
      console.error("Scanner start error:", err);
      setResult({ status: 'error', message: 'Failed to start scanner. Please refresh the page.' });
      setIsScanning(false);
    }
  }, [isScanning, scanningAdminId, hasCameraPermission, stopScanner]);

  useEffect(() => {
    // This effect handles permissions and starts the scanner
    if (!scanningAdminId || hasCameraPermission !== null) return;
    
    Html5Qrcode.getCameras()
      .then(() => {
        setHasCameraPermission(true);
      })
      .catch((err) => {
        setHasCameraPermission(false);
         setResult({
          status: 'error',
          message: 'Camera access denied. Please enable camera permissions in your browser settings.',
        });
        console.error("Camera permission error:", err);
      });
  }, [scanningAdminId, hasCameraPermission]);

  useEffect(() => {
    // This effect manages the scanner lifecycle
    if (hasCameraPermission && !isScanning) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [hasCameraPermission, isScanning, startScanner, stopScanner]);

  const handleCloseDialog = () => {
      setResult({ status: 'idle', message: '' });
      // Restart the scanner after a brief delay
      setTimeout(() => {
        setIsScanning(false); // allow startScanner to run again
        startScanner();
      }, 100);
  };

  const ResultIcon = () => {
    switch (result.status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'invalid':
      case 'already_scanned':
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Loader2 className="w-16 h-16 animate-spin text-primary" />;
    }
  };

  const getDialogTitle = () => {
     switch (result.status) {
      case 'success': return result.message.includes('Re-verified') ? 'Pass Re-verified' : 'Pass Verified Successfully';
      case 'invalid': return 'Scan Invalid';
      case 'already_scanned': return 'Already Scanned';
      case 'error': return 'Error';
      default: return 'Scanning';
    }
  };

  const isDialogOpen = result.status === 'success' || result.status === 'invalid' || result.status === 'already_scanned';


  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
        <CardDescription>
          {isScanning ? 'Point camera at a QR code' : 'Scan result below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="w-full aspect-square max-w-[400px] border rounded-lg overflow-hidden bg-black">
            <div id="qr-video-reader" ref={videoPreviewRef} className="w-full h-full" />
        </div>
        
        {hasCameraPermission === false && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDialogDescription>
              Please enable camera permissions in your browser settings to use the scanner.
            </AlertDialogDescription>
          </Alert>
        )}

        <AlertDialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader className="flex flex-col items-center text-center">
              <ResultIcon />
              <AlertDialogTitle className="text-2xl mt-4">
                {getDialogTitle()}
              </AlertDialogTitle>
              <AlertDialogDescription>{result.message}</AlertDialogDescription>
            </AlertDialogHeader>
            {result.user && result.event && (
              <Card className="w-full text-left">
                <CardHeader>
                  <CardTitle>{result.user.name}</CardTitle>
                  <CardDescription>Pass ID: {result.user.uniqueId}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p><strong>Phone:</strong> {result.user.phoneNumber || 'N/A'}</p>
                    <p><strong>Email:</strong> {result.user.email || 'N/A'}</p>
                    <p><strong>Class:</strong> {result.user.standard || 'N/A'}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-1">Event Details</h4>
                    <p><strong>Event:</strong> {result.event.name}</p>
                    {result.event.eventType === 'Paid' && result.event.eventFee && (
                       <div className="flex items-center gap-2 font-semibold text-yellow-600 dark:text-yellow-400">
                          <DollarSign className="h-4 w-4" />
                          <span>Amount Paid: ₹{result.event.eventFee}</span>
                       </div>
                    )}
                    {result.user.entryTime ? 
                        <p><strong>Check-in Time:</strong> {new Date(result.user.entryTime).toLocaleString()}</p>
                        : <p><strong>Status:</strong> Not yet checked-in</p>
                    }
                  </div>
                  {result.eventAdmin && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-1">Event Manager Details</h4>
                        <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground"/>
                           <span>{result.eventAdmin.name}</span>
                        </div>
                        {result.eventAdmin.phoneNumber && (
                          <div className="flex items-center gap-2 mt-1">
                             <Phone className="h-4 w-4 text-muted-foreground"/>
                            <span>{result.eventAdmin.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            <AlertDialogFooter>
              <Button onClick={handleCloseDialog} className="w-full">Scan Again</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
