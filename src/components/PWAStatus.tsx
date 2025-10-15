import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Wifi, Bell, Download } from 'lucide-react';
import { pushNotificationService } from '@/services/pushNotificationService';

const PWAStatus = () => {
  const [status, setStatus] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Get PWA support status
    const supportStatus = pushNotificationService.getSupportStatus();
    setStatus(supportStatus);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setInstallPrompt(null);
    }
  };

  if (!status) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">PWA Installed</span>
            <Badge variant={status.isPWA ? "default" : "secondary"}>
              {status.isPWA ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Standalone Mode</span>
            <Badge variant={status.isStandalone ? "default" : "secondary"}>
              {status.isStandalone ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Device Type</span>
            <Badge variant="outline">
              {status.deviceType}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features Support</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-xs">Service Worker</span>
              <Badge variant={status.serviceWorker ? "default" : "destructive"} className="ml-auto">
                {status.serviceWorker ? "✓" : "✗"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-xs">Push Notifications</span>
              <Badge variant={status.pushManager ? "default" : "destructive"} className="ml-auto">
                {status.pushManager ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </div>

        {installPrompt && (
          <Button onClick={handleInstall} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        )}

        {status.isPWA && (
          <div className="text-xs text-muted-foreground text-center">
            🎉 Running as native app!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PWAStatus;
