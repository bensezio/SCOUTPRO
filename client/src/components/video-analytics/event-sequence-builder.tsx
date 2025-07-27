import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, ArrowRight, Save } from "lucide-react";

interface EventSequenceBuilderProps {
  events: any[];
  onSequenceCreate: (sequence: any) => void;
}

export function EventSequenceBuilder({ events, onSequenceCreate }: EventSequenceBuilderProps) {
  const [sequenceEvents, setSequenceEvents] = useState<any[]>([]);
  const [sequenceName, setSequenceName] = useState("");

  const addEventToSequence = (event: any) => {
    setSequenceEvents(prev => [...prev, event]);
  };

  const removeEventFromSequence = (index: number) => {
    setSequenceEvents(prev => prev.filter((_, i) => i !== index));
  };

  const createSequence = () => {
    if (sequenceEvents.length === 0 || !sequenceName) return;

    const sequence = {
      name: sequenceName,
      events: sequenceEvents,
      duration: sequenceEvents[sequenceEvents.length - 1]?.timestamp - sequenceEvents[0]?.timestamp || 0
    };

    onSequenceCreate(sequence);
    setSequenceEvents([]);
    setSequenceName("");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Event Sequence Builder
        </CardTitle>
        <CardDescription>
          Create custom event sequences for tactical analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Events */}
        <div className="space-y-2">
          <h4 className="font-medium">Available Events</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {events
              .filter(event => !sequenceEvents.find(se => se.id === event.id))
              .map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                  onClick={() => addEventToSequence(event)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatTime(event.timestamp)}
                    </Badge>
                    <span className="text-sm">Event Type</span>
                  </div>
                  <Plus className="h-3 w-3" />
                </div>
              ))}
          </div>
        </div>

        {/* Sequence Timeline */}
        {sequenceEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Sequence Timeline</h4>
            <div className="space-y-1">
              {sequenceEvents.map((event, index) => (
                <div key={`sequence-${event.id}-${index}`} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(event.timestamp)}
                  </Badge>
                  <span className="text-sm flex-1">Event Type</span>
                  {index < sequenceEvents.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEventFromSequence(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Sequence */}
        {sequenceEvents.length > 1 && (
          <div className="space-y-2 pt-2 border-t">
            <input
              type="text"
              placeholder="Sequence name (e.g., 'Counter Attack Pattern')"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <Button
              onClick={createSequence}
              disabled={!sequenceName}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              Create Sequence
            </Button>
          </div>
        )}

        {sequenceEvents.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select events to build a sequence</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}