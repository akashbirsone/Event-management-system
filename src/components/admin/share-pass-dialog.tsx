
'use client';

import { useState } from 'react';
import type { User } from '@/lib/definitions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  intelligentQrPublishing,
  IntelligentQrPublishingOutput,
} from '@/ai/flows/intelligent-qr-publishing';
import { Loader2, Send, Mail, MessageSquare } from 'lucide-react';

export function SharePassDialog({ user, children }: { user: User; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntelligentQrPublishingOutput | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await intelligentQrPublishing({
        userName: user.name,
        userId: user.id,
        eventId: user.eventId,
        secretKey: 'supersecretkey123', // In real app, from event data
        email: user.email,
        phoneNumber: user.phoneNumber,
        whatsappNumber: user.whatsappNumber,
      });
      setResult(res);
    } catch (error) {
      console.error('Failed to get sharing recommendation:', error);
      // Handle error display
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4 mr-2" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'whatsapp':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.523.074-.797.371-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        );
      default:
        return <Send className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Pass for {user.name}</DialogTitle>
          <DialogDescription>
            Use AI to find the best way to send the event pass to this user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!result && (
            <Button onClick={handleShare} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Suggest Delivery Method'
              )}
            </Button>
          )}

          {result && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center font-semibold">
                {getIcon(result.deliveryMethod)}
                Recommended: {result.deliveryMethod.charAt(0).toUpperCase() + result.deliveryMethod.slice(1)}
              </div>
              <p className="text-sm p-3 bg-background rounded-md border">{result.message}</p>
              <Button
                className="w-full"
                onClick={() => {
                  // In a real app, this would integrate with a messaging service API
                  alert(`Message sent via ${result.deliveryMethod}!`);
                }}
              >
                <Send className="mr-2 h-4 w-4" /> Confirm and Send
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
