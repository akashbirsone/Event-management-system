
'use client';
import { useEffect, useState } from 'react';
import { Admin } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '../ui/separator';

export function SecuritySettings({ currentAdmin }: { currentAdmin: Admin }) {
  const { toast } = useToast();
  
  const [isLockdown, setIsLockdown] = useState(false);
  const [disableEventCreation, setDisableEventCreation] = useState(false);
  const [disableUserRegistration, setDisableUserRegistration] = useState(false);
  const [showDevCredit, setShowDevCredit] = useState(false);
  
  useEffect(() => {
    setIsLockdown(localStorage.getItem('systemLockdownActive') === 'true');
    setDisableEventCreation(localStorage.getItem('disableEventCreation') === 'true');
    setDisableUserRegistration(localStorage.getItem('disableUserRegistration') === 'true');
    setShowDevCredit(localStorage.getItem('showDevCredit') === 'true');
  }, []);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, key: string, checked: boolean, label: string) => {
    setter(checked);
    localStorage.setItem(key, String(checked));
    toast({
      title: `${label} ${checked ? 'Enabled' : 'Disabled'}`,
      description: `The setting has been updated.`,
    });
    // Dispatch a storage event so other open tabs can sync state.
    window.dispatchEvent(new Event('storage'));
  }
  
  return (
    <Card className="bg-gray-900/80 dark:bg-black/70 backdrop-blur-sm border-destructive/30 animate-glow-border">
      <CardHeader>
        <CardTitle className="text-destructive animate-glow-text">Emergency Control System</CardTitle>
        <CardDescription className="text-muted-foreground">
          Handle system-wide visibility, protection, and admin overrides.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
            <div className="flex items-center justify-between">
            <Label htmlFor="emergency-mode" className="text-lg font-bold text-destructive">
                Activate System Lockdown
            </Label>
            <Switch
                id="emergency-mode"
                checked={isLockdown}
                onCheckedChange={(checked) => handleToggle(setIsLockdown, 'systemLockdownActive', checked, 'System Lockdown')}
                className="data-[state=checked]:bg-destructive"
            />
            </div>
             <p className="text-sm text-muted-foreground">
                When active, disables all non-admin functionality and shows a global security banner.
            </p>
        </div>
        
        <div className="space-y-4">
            <h3 className="text-md font-semibold text-muted-foreground">Feature Controls</h3>
            <div className="flex items-center justify-between">
                <Label htmlFor="disable-event-creation">Disable Event Creation</Label>
                <Switch 
                    id="disable-event-creation"
                    checked={disableEventCreation}
                    onCheckedChange={(checked) => handleToggle(setDisableEventCreation, 'disableEventCreation', checked, 'Event Creation')}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="disable-user-registration">Disable User Registration</Label>
                <Switch 
                    id="disable-user-registration"
                    checked={disableUserRegistration}
                    onCheckedChange={(checked) => handleToggle(setDisableUserRegistration, 'disableUserRegistration', checked, 'User Registration')}
                />
            </div>
        </div>

        <Separator />
        
        <div className="space-y-4">
            <h3 className="text-md font-semibold text-muted-foreground">Visibility Controls</h3>
             <div className="flex items-center justify-between">
                <Label htmlFor="show-dev-credit">Show Developer Credit Alert</Label>
                <Switch 
                    id="show-dev-credit"
                    checked={showDevCredit}
                    onCheckedChange={(checked) => handleToggle(setShowDevCredit, 'showDevCredit', checked, 'Developer Credit Alert')}
                />
            </div>
            <p className="text-sm text-muted-foreground">
                Toggles the blinking "Created by" message on the public home page.
            </p>
        </div>
        
      </CardContent>
    </Card>
  );
}
