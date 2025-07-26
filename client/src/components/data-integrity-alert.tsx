import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Database, Wifi } from "lucide-react";

interface DataIntegrityAlertProps {
  error: {
    type: 'database' | 'service' | 'validation';
    message: string;
    timestamp?: string;
    details?: string[];
  };
}

export function DataIntegrityAlert({ error }: DataIntegrityAlertProps) {
  const getIcon = () => {
    switch (error.type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'service':
        return <Wifi className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case 'database':
        return 'Database Connection Issue';
      case 'service':
        return 'Analysis Service Unavailable';
      default:
        return 'Data Validation Error';
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      {getIcon()}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{error.message}</p>
          {error.details && error.details.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Details:</p>
              <ul className="text-sm list-disc list-inside space-y-1">
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
          {error.timestamp && (
            <p className="text-xs text-muted-foreground">
              Time: {new Date(error.timestamp).toLocaleString()}
            </p>
          )}
          <div className="mt-3 text-sm">
            <p className="font-medium">This is using live database data only.</p>
            <p>Please contact system administrator if the issue persists.</p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}