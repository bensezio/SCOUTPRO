import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Smartphone, Database } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  if (isOnline) {
    // Auto-redirect when back online
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
            {isOnline ? (
              <Database className="h-8 w-8 text-green-600" />
            ) : (
              <WifiOff className="h-8 w-8 text-slate-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isOnline ? (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">
                Great! Your internet connection is back.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Redirecting you to your dashboard...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't worry! You can still access some features while offline.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left">
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Available Offline:
                </h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• View cached player profiles</li>
                  <li>• Access your favorites list</li>
                  <li>• Review saved scouting reports</li>
                  <li>• Browse organization contacts</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleRetry}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again {retryCount > 0 && `(${retryCount})`}
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                  variant="secondary"
                >
                  Continue Offline
                </Button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Your work will be synced automatically when you're back online.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}