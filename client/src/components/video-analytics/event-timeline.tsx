import { Badge } from "@/components/ui/badge";
import { FOOTBALL_EVENT_TYPES } from "@shared/video-analytics-constants";

interface EventTimelineProps {
  events: any[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function EventTimeline({ events, duration, currentTime, onSeek }: EventTimelineProps) {
  const getEventType = (eventTypeId: number) => {
    return FOOTBALL_EVENT_TYPES.find(type => type.id === eventTypeId);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No events tagged yet</p>
        <p className="text-sm">Events will appear here as you tag them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Visualization */}
      <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
        {/* Progress indicator */}
        <div 
          className="absolute top-0 bottom-0 bg-primary/20 transition-all duration-300"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Current time indicator */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-primary transition-all duration-300"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Event markers */}
        {events.map((event) => {
          const eventType = getEventType(event.eventTypeId);
          const position = (event.timestamp / duration) * 100;
          
          return (
            <div
              key={event.id}
              className="absolute top-1 bottom-1 w-2 rounded cursor-pointer hover:w-3 transition-all"
              style={{ 
                left: `${position}%`, 
                backgroundColor: eventType?.color || '#6B7280',
                transform: event.isKeyMoment ? 'scale(1.5)' : 'scale(1)'
              }}
              onClick={() => onSeek(event.timestamp)}
              title={`${eventType?.name} at ${formatTime(event.timestamp)}`}
            />
          );
        })}
      </div>

      {/* Time markers */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0:00</span>
        {duration > 0 && (
          <>
            <span>{formatTime(duration / 4)}</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime((duration * 3) / 4)}</span>
            <span>{formatTime(duration)}</span>
          </>
        )}
      </div>

      {/* Event list */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {events
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((event) => {
            const eventType = getEventType(event.eventTypeId);
            return (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => onSeek(event.timestamp)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: eventType?.color || '#6B7280' }}
                  />
                  <Badge variant="outline" className="text-xs">
                    {formatTime(event.timestamp)}
                  </Badge>
                  <span className="text-sm">{eventType?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {event.teamInvolved}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}