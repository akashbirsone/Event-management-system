import { QrScanner } from '@/components/scanner/qr-scanner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function ScanPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <div className="absolute top-4 left-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <QrScanner />
    </main>
  );
}
