import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FeatureGate } from "@/components/feature-gate";
import { FOOTBALL_POSITIONS } from "@shared/constants";
import { 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Crown, 
  Plus,
  Save,
  X,
  AlertTriangle
} from "lucide-react";

interface Player {
  name: string;
  position: string;
  number: number;
}

interface TeamSheet {
  id: number;
  team: 'home' | 'away';
  startingXI: Player[];
  substitutes: Player[];
  formation: string;
  captain: string;
  createdAt: string;
}

interface TeamSheetManagerProps {
  matchId: number;
  matchData: {
    homeTeamName: string;
    awayTeamName: string;
  };
}

export function TeamSheetManager({ matchId, matchData }: TeamSheetManagerProps) {
  return (
    <FeatureGate feature="team_sheets">
      <TeamSheetManagerContent matchId={matchId} matchData={matchData} />
    </FeatureGate>
  );
}

function TeamSheetManagerContent({ matchId, matchData }: TeamSheetManagerProps) {
  const [editingTeam, setEditingTeam] = useState<'home' | 'away' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<'home' | 'away' | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TeamSheet>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team sheets
  const { data: teamSheetsData, isLoading } = useQuery({
    queryKey: ['/api/video-analytics/matches', matchId, 'team-sheets'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/video-analytics/matches/${matchId}/team-sheets`);
      return response.json();
    }
  });

  const teamSheets = teamSheetsData?.teamSheets || [];
  const homeTeamSheet = teamSheets.find((sheet: TeamSheet) => sheet.team === 'home');
  const awayTeamSheet = teamSheets.find((sheet: TeamSheet) => sheet.team === 'away');

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ teamType, data }: { teamType: string, data: any }) => {
      const response = await apiRequest('PUT', `/api/video-analytics/matches/${matchId}/team-sheets/${teamType}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Team sheet updated",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches', matchId, 'team-sheets'] });
      setEditingTeam(null);
      setEditFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update team sheet",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (teamType: string) => {
      const response = await apiRequest('DELETE', `/api/video-analytics/matches/${matchId}/team-sheets/${teamType}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Team sheet deleted",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-analytics/matches', matchId, 'team-sheets'] });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete team sheet",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (teamType: 'home' | 'away') => {
    const sheet = teamType === 'home' ? homeTeamSheet : awayTeamSheet;
    if (sheet) {
      setEditFormData(sheet);
      setEditingTeam(teamType);
    }
  };

  const handleSave = () => {
    if (editingTeam && editFormData) {
      updateMutation.mutate({
        teamType: editingTeam,
        data: editFormData
      });
    }
  };

  const handleDelete = (teamType: 'home' | 'away') => {
    setDeleteConfirm(teamType);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm);
    }
  };

  const updatePlayer = (listType: 'startingXI' | 'substitutes', index: number, field: keyof Player, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [listType]: prev[listType]?.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  const renderTeamSheet = (sheet: TeamSheet | undefined, teamType: 'home' | 'away') => {
    if (!sheet) {
      return (
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team sheet available</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const teamName = teamType === 'home' ? matchData.homeTeamName : matchData.awayTeamName;

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {teamName}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(teamType)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(teamType)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{sheet.formation}</Badge>
            {sheet.captain && (
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {sheet.captain}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Starting XI</h4>
              <div className="grid grid-cols-2 gap-2">
                {sheet.startingXI.map((player, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="w-6 h-6 text-xs">
                      {player.number}
                    </Badge>
                    <span className="flex-1">{player.name || 'TBD'}</span>
                    <span className="text-xs text-muted-foreground">
                      {player.position.substring(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Substitutes</h4>
              <div className="grid grid-cols-2 gap-2">
                {sheet.substitutes.map((player, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="w-6 h-6 text-xs">
                      {player.number}
                    </Badge>
                    <span className="flex-1">{player.name || 'TBD'}</span>
                    <span className="text-xs text-muted-foreground">
                      {player.position.substring(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEditDialog = () => (
    <Dialog open={editingTeam !== null} onOpenChange={() => setEditingTeam(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {editingTeam === 'home' ? matchData.homeTeamName : matchData.awayTeamName} Team Sheet
          </DialogTitle>
          <DialogDescription>
            Update player information and formation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formation and Captain */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formation">Formation</Label>
              <Select
                value={editFormData.formation || ''}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, formation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select formation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-4-2">4-4-2</SelectItem>
                  <SelectItem value="4-3-3">4-3-3</SelectItem>
                  <SelectItem value="3-5-2">3-5-2</SelectItem>
                  <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                  <SelectItem value="5-3-2">5-3-2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="captain">Captain</Label>
              <Input
                id="captain"
                value={editFormData.captain || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, captain: e.target.value }))}
                placeholder="Captain name"
              />
            </div>
          </div>

          <Tabs defaultValue="starting">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="starting">Starting XI</TabsTrigger>
              <TabsTrigger value="substitutes">Substitutes</TabsTrigger>
            </TabsList>

            <TabsContent value="starting" className="space-y-4">
              <div className="grid gap-4">
                {editFormData.startingXI?.map((player, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-center">
                    <div>
                      <Label className="text-xs">Number</Label>
                      <Input
                        type="number"
                        value={player.number || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updatePlayer('startingXI', index, 'number', value);
                        }}
                        min="1"
                        max="99"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer('startingXI', index, 'name', e.target.value)}
                        placeholder="Player name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Position</Label>
                      <Select
                        value={player.position}
                        onValueChange={(value) => updatePlayer('startingXI', index, 'position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOOTBALL_POSITIONS.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="substitutes" className="space-y-4">
              <div className="grid gap-4">
                {editFormData.substitutes?.map((player, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-center">
                    <div>
                      <Label className="text-xs">Number</Label>
                      <Input
                        type="number"
                        value={player.number || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updatePlayer('substitutes', index, 'number', value);
                        }}
                        min="1"
                        max="99"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer('substitutes', index, 'name', e.target.value)}
                        placeholder="Player name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Position</Label>
                      <Select
                        value={player.position}
                        onValueChange={(value) => updatePlayer('substitutes', index, 'position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOOTBALL_POSITIONS.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingTeam(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Delete
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {deleteConfirm} team sheet? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Sheets</h3>
        <div className="text-sm text-muted-foreground">
          {teamSheets.length} of 2 teams configured
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderTeamSheet(homeTeamSheet, 'home')}
        {renderTeamSheet(awayTeamSheet, 'away')}
      </div>

      {renderEditDialog()}
      {renderDeleteDialog()}
    </div>
  );
}