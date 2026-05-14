
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addUsersFromCsvAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      ) : (
        'Upload and Add Users'
      )}
    </Button>
  );
}

export function UploadCsvDialog({ children, eventId, disabled }: { children: React.ReactNode, eventId: string, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState(addUsersFromCsvAction, null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formData = new FormData();
        formData.append('csvData', JSON.stringify(results.data));
        formData.append('eventId', eventId);
        formAction(formData);
      },
      error: (error) => {
         toast({
            variant: "destructive",
            title: "CSV Parsing Error",
            description: error.message,
        });
      }
    });
  };

  useEffect(() => {
    if (state?.message) {
        if(state.success) {
            toast({
                title: "Success",
                description: state.message,
            });
            setOpen(false);
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: state.message,
            });
        }
    }
  }, [state, toast]);
  
  const handleOpenChange = (isOpen: boolean) => {
    if (disabled) return;
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: `name`, `standard`, `department`, `phoneNumber`, `email`. A Unique ID will be generated for each user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
