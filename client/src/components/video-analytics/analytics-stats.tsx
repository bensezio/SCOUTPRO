import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Target, Clock, BarChart3, TrendingUp, Users } from "lucide-react";

interface AnalyticsStatsProps {
  stats: any;
}

export function AnalyticsStats({ stats }: AnalyticsStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Analytics Overview</h2>
        <p className="text-muted-foreground">
          Comprehensive statistics from your video analysis sessions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches || 0}</div>
            <p className="text-xs text-muted-foreground">
              Match analyses completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Processed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Video files analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Tags</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTags || 0}</div>
            <p className="text-xs text-muted-foreground">
              Events tagged across all videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tags per Video</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageTagsPerVideo ? Math.round(stats.averageTagsPerVideo) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tagging efficiency metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Quality</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTags > 0 ? "High" : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on tagging completeness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMatches ? `${stats.totalMatches * 2}h` : "0h"}
            </div>
            <p className="text-xs text-muted-foreground">
              vs manual analysis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Insights</CardTitle>
          <CardDescription>
            Key findings from your video analytics data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.totalMatches === 0 ? (
            <div className="text-center py-6">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Start Your First Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Upload a match video and begin tagging to see detailed insights here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Tagging Efficiency</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {stats.averageTagsPerVideo > 50 ? "Excellent" : 
                     stats.averageTagsPerVideo > 25 ? "Good" : 
                     stats.averageTagsPerVideo > 10 ? "Average" : "Basic"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(stats.averageTagsPerVideo || 0)} tags per video
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Analysis Depth</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {stats.totalTags > 200 ? "Comprehensive" :
                     stats.totalTags > 100 ? "Detailed" :
                     stats.totalTags > 50 ? "Standard" : "Basic"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalTags} total events
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}