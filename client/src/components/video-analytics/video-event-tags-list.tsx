import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Clock, Edit, Trash2, MapPin, Star, CheckCircle, XCircle } from "lucide-react";
import { FOOTBALL_EVENT_TYPES } from "@shared/video-analytics-constants";

interface VideoEventTagsListProps {
  tags: any[];
  onTagSelect: (tag: any) => void;
  onTagUpdate: () => void;
}

export function VideoEventTagsList({ tags, onTagSelect, onTagUpdate }: VideoEventTagsListProps) {
  const [editingTag, setEditingTag] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    outcome: "",
    quality: 1,
    notes: "",
    isKeyMoment: false
  });
  const [filterEventType, setFilterEventType] = useState<string>("all");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");

  const { toast } = useToast();

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ tagId, updates }: { tagId: number; updates: any }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/video-analytics/tags/${tagId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update tag');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tag updated successfully!" });
      onTagUpdate();
      setEditingTag(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error updating tag", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/video-analytics/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete tag');
    },
    onSuccess: () => {
      toast({ title: "Tag deleted successfully!" });
      onTagUpdate();
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting tag", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const getEventType = (eventTypeId: number) => {
    return FOOTBALL_EVENT_TYPES.find(type => type.id === eventTypeId);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const openEditDialog = (tag: any) => {
    setEditingTag(tag);
    setEditForm({
      outcome: tag.outcome || "successful",
      quality: tag.quality || 3,
      notes: tag.notes || "",
      isKeyMoment: tag.isKeyMoment || false
    });
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;
    
    updateTagMutation.mutate({
      tagId: editingTag.id,
      updates: editForm
    });
  };

  const handleDeleteTag = (tagId: number) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      deleteTagMutation.mutate(tagId);
    }
  };

  // Filter tags
  const filteredTags = tags.filter(tag => {
    if (filterEventType !== "all" && tag.eventTypeId.toString() !== filterEventType) {
      return false;
    }
    if (filterOutcome !== "all" && tag.outcome !== filterOutcome) {
      return false;
    }
    return true;
  });

  // Sort tags by timestamp
  const sortedTags = [...filteredTags].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Event Tags
          <Badge variant="secondary">{sortedTags.length}</Badge>
        </CardTitle>
        <CardDescription>
          Click on any tag to jump to that moment in the video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={filterEventType} onValueChange={setFilterEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {FOOTBALL_EVENT_TYPES.map(type => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="successful">Successful</SelectItem>
              <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
              <SelectItem value="partially_successful">Partially Successful</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No event tags yet</p>
              <p className="text-sm">Start tagging events in the video</p>
            </div>
          ) : (
            sortedTags.map((tag) => {
              const eventType = getEventType(tag.eventTypeId);
              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onTagSelect(tag)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: eventType?.color || '#6B7280' }}
                      />
                      <Badge variant="outline" className="text-xs">
                        {formatTime(tag.timestamp)}
                      </Badge>
                      {tag.isKeyMoment && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {eventType?.name || 'Unknown Event'}
                        </span>
                        {tag.outcome && (
                          <Badge 
                            variant={tag.outcome === 'successful' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {tag.outcome === 'successful' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {tag.outcome === 'unsuccessful' && <XCircle className="h-3 w-3 mr-1" />}
                            {tag.outcome}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Team: {tag.teamInvolved}</span>
                        {tag.quality && (
                          <span>Quality: {tag.quality}/5</span>
                        )}
                        {tag.fieldPositionX && tag.fieldPositionY && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Field position
                          </span>
                        )}
                      </div>
                      
                      {tag.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {tag.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openEditDialog(tag)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Event Tag</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Event Type</Label>
                            <Input 
                              value={eventType?.name || 'Unknown'} 
                              disabled 
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Outcome</Label>
                            <Select 
                              value={editForm.outcome} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, outcome: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="successful">Successful</SelectItem>
                                <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                                <SelectItem value="partially_successful">Partially Successful</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Quality (1-5)</Label>
                            <Select 
                              value={editForm.quality.toString()} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, quality: parseInt(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map(num => (
                                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Add notes about this event..."
                              rows={3}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="keyMoment"
                              checked={editForm.isKeyMoment}
                              onChange={(e) => setEditForm(prev => ({ ...prev, isKeyMoment: e.target.checked }))}
                            />
                            <Label htmlFor="keyMoment">Mark as key moment</Label>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleUpdateTag}
                              disabled={updateTagMutation.isPending}
                              className="flex-1"
                            >
                              {updateTagMutation.isPending ? "Updating..." : "Update Tag"}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingTag(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={deleteTagMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats */}
        {sortedTags.length > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>Total events: {sortedTags.length}</div>
              <div>
                Key moments: {sortedTags.filter(tag => tag.isKeyMoment).length}
              </div>
              <div>
                Successful: {sortedTags.filter(tag => tag.outcome === 'successful').length}
              </div>
              <div>
                Average quality: {
                  sortedTags.filter(tag => tag.quality).length > 0
                    ? (sortedTags.reduce((sum, tag) => sum + (tag.quality || 0), 0) / 
                       sortedTags.filter(tag => tag.quality).length).toFixed(1)
                    : 'N/A'
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}