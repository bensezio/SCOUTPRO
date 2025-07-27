import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function SessionWarning() {
  const { remainingTime, extendSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  // Show warning when remaining time is 5 minutes or less
  useEffect(() => {
    const fiveMinutes = 5 * 60 * 1000;
    setShowWarning(remainingTime <= fiveMinutes && remainingTime > 0);
  }, [remainingTime]);

  // Format remaining time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Session expiring in {formatTime(remainingTime)}</strong>
              <br />
              Your session will end due to inactivity. Click "Stay Logged In" to continue.
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-2 h-6 w-6 p-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={handleExtendSession}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Stay Logged In
          </Button>
        </div>
      </Alert>
    </div>
  );
}