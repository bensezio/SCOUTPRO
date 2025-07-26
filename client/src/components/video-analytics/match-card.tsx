import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Video, Calendar, MapPin, Users, Play, Trash2, Edit, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface MatchCardProps {
  match: any;
  onClick: () => void;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  onEdit?: (match: any) => void;
  onReanalyze?: (match: any) => void;
}

export function MatchCard({ match, onClick, showDeleteButton = false, showEditButton = false, onEdit, onReanalyze }: MatchCardProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (matchId: number) => {
      return await apiRequest('DELETE', `/api/video-analytics/matches/${matchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches'] });
      toast({
        title: "Match deleted",
        description: "The match analysis has been deleted successfully.",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete match analysis",
        variant: "destructive",
      });
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async (matchId: number) => {
      return await apiRequest('POST', `/api/video-analytics/matches/${matchId}/reanalyze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches'] });
      toast({
        title: "Re-analysis started",
        description: "The AI analysis is being re-run with updated settings.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start re-analysis",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Video className="h-4 w-4 text-primary flex-shrink-0" />
            <Badge variant={getStatusColor(match.matchStatus)} className="text-xs">
              {match.matchStatus}
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {match.analysisType?.replace('_', ' ')}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight truncate" title={`${match.homeTeamName} vs ${match.awayTeamName}`}>
          {match.homeTeamName} vs {match.awayTeamName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Match Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{new Date(match.matchDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{match.competition}</span>
          </div>
          {match.venue && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{match.venue}</span>
            </div>
          )}
        </div>

        {/* Score & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            {match.homeScore !== null && match.awayScore !== null && (
              <div className="text-lg font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Created {new Date(match.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          {/* Primary Action */}
          <div className="flex items-center gap-1">
            <Button size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <Play className="h-3 w-3" />
              Analyze
            </Button>
            
            {/* Secondary Actions - Only show if needed */}
            {(showEditButton || showDeleteButton) && (
              <div className="flex items-center gap-1">
                {showEditButton && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1 p-2"
                    onClick={(e) => { e.stopPropagation(); onEdit?.(match); }}
                    title="Edit match"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {showEditButton && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="gap-1 p-2"
                    onClick={(e) => { e.stopPropagation(); reanalyzeMutation.mutate(match.id); }}
                    disabled={reanalyzeMutation.isPending}
                    title="Re-analyze match"
                  >
                    <RefreshCw className={`h-3 w-3 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                {showDeleteButton && (
                  <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-1 p-2"
                        onClick={(e) => e.stopPropagation()}
                        title="Delete match"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Match Analysis</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the match analysis for "{match.homeTeamName} vs {match.awayTeamName}"? 
                          This action cannot be undone and will permanently remove all associated videos, analysis data, and reports.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(match.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}