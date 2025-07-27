import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JongPSVDashboard } from "@/components/tableau-dashboard";
import { TrendingUp, Activity, Target, MapPin } from "lucide-react";
import * as d3 from "d3";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Radar, Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface PlayerStats {
  technical: number;
  physical: number;
  mental: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
}

interface PlayerData {
  id: number;
  name: string;
  position: string;
  stats: PlayerStats;
  marketValue?: number;
  nationality: string;
}

interface RadarChartProps {
  data: PlayerStats;
  playerName: string;
  width?: number;
  height?: number;
}

interface ComparisonChartProps {
  players: PlayerData[];
  width?: number;
  height?: number;
}

interface TableauEmbedProps {
  workbookUrl: string;
  title: string;
}

// D3.js Radar Chart Component
export const D3RadarChart: React.FC<RadarChartProps> = ({
  data,
  playerName,
  width = 300,
  height = 300,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const radius =
      Math.min(
        width - margin.left - margin.right,
        height - margin.top - margin.bottom,
      ) / 2;
    const center = { x: width / 2, y: height / 2 };

    // Data preparation
    const attributes = [
      { key: "technical", label: "Technical", value: data.technical },
      { key: "physical", label: "Physical", value: data.physical },
      { key: "mental", label: "Mental", value: data.mental },
      { key: "pace", label: "Pace", value: data.pace },
      { key: "shooting", label: "Shooting", value: data.shooting },
      { key: "passing", label: "Passing", value: data.passing },
      { key: "dribbling", label: "Dribbling", value: data.dribbling },
      { key: "defending", label: "Defending", value: data.defending },
    ];

    const angleSlice = (Math.PI * 2) / attributes.length;

    // Create scales
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${center.x}, ${center.y})`);

    // Grid circles
    const gridLevels = 5;
    for (let level = 1; level <= gridLevels; level++) {
      g.append("circle")
        .attr("r", radius * (level / gridLevels))
        .attr("fill", "none")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1);
    }

    // Grid lines
    attributes.forEach((attr, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(angle))
        .attr("y2", radius * Math.sin(angle))
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1);
    });

    // Labels
    attributes.forEach((attr, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 20;

      g.append("text")
        .attr("x", labelRadius * Math.cos(angle))
        .attr("y", labelRadius * Math.sin(angle))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("fill", "#374151")
        .text(attr.label);
    });

    // Data polygon
    const line = d3
      .line<{ angle: number; value: number }>()
      .x((d) => rScale(d.value) * Math.cos(d.angle - Math.PI / 2))
      .y((d) => rScale(d.value) * Math.sin(d.angle - Math.PI / 2))
      .curve(d3.curveLinearClosed);

    const dataPoints = attributes.map((attr, i) => ({
      angle: angleSlice * i,
      value: attr.value,
    }));

    // Data area
    g.append("path")
      .datum(dataPoints)
      .attr("d", line)
      .attr("fill", "rgba(59, 130, 246, 0.2)")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2);

    // Data points
    dataPoints.forEach((point, i) => {
      const x = rScale(point.value) * Math.cos(point.angle - Math.PI / 2);
      const y = rScale(point.value) * Math.sin(point.angle - Math.PI / 2);

      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", "#3b82f6")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

      // Value labels
      g.append("text")
        .attr("x", x)
        .attr("y", y - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", "#1f2937")
        .text(attributes[i].value);
    });

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .attr("fill", "#111827")
      .text(`${playerName} - Attribute Analysis`);
  }, [data, playerName, width, height]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};

// Interactive Player Comparison Chart
export const InteractiveComparisonChart: React.FC<ComparisonChartProps> = ({
  players,
  width = 600,
  height = 400,
}) => {
  const attributes = [
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physicality",
  ];

  const colors = [
    "rgba(59, 130, 246, 0.8)", // Blue
    "rgba(239, 68, 68, 0.8)", // Red
    "rgba(34, 197, 94, 0.8)", // Green
    "rgba(245, 158, 11, 0.8)", // Yellow
  ];

  const chartData = {
    labels: attributes.map(
      (attr) => attr.charAt(0).toUpperCase() + attr.slice(1),
    ),
    datasets: players.slice(0, 4).map((player, index) => ({
      label: player.name,
      data: attributes.map(
        (attr) => player.stats[attr as keyof PlayerStats] || 0,
      ),
      backgroundColor: colors[index].replace("0.8", "0.2"),
      borderColor: colors[index],
      borderWidth: 2,
      pointBackgroundColor: colors[index],
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: colors[index],
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Player Comparison - Key Attributes",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div style={{ width, height }}>
      <Radar data={chartData} options={options} />
    </div>
  );
};

// Market Value Trend Chart
export const MarketValueTrend: React.FC<{ players: PlayerData[] }> = ({
  players,
}) => {
  const chartData = {
    labels: players.map((p) => p.name),
    datasets: [
      {
        label: "Market Value (€)",
        data: players.map((p) => p.marketValue || 0),
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Market Value Comparison",
        font: {
          size: 14,
          weight: "bold" as const,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return "€" + (value / 1000000).toFixed(1) + "M";
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

// Position Distribution Chart
export const PositionDistribution: React.FC<{ players: PlayerData[] }> = ({
  players,
}) => {
  const positionCounts = players.reduce(
    (acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = {
    labels: Object.keys(positionCounts),
    datasets: [
      {
        data: Object.values(positionCounts),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Position Distribution",
        font: {
          size: 14,
          weight: "bold" as const,
        },
      },
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

// Performance Over Time Chart
export const PerformanceOverTime: React.FC<{ player: PlayerData }> = ({
  player,
}) => {
  // Simulated performance data over seasons
  const seasons = ["2020/21", "2021/22", "2022/23", "2023/24", "2024/25"];
  const performanceData = seasons.map((_, index) => {
    const baseValue = player.stats.technical;
    const variation = Math.random() * 10 - 5; // Random variation
    return Math.max(0, Math.min(100, baseValue + variation + index * 2));
  });

  const chartData = {
    labels: seasons,
    datasets: [
      {
        label: "Overall Performance",
        data: performanceData,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `${player.name} - Performance Trend`,
        font: {
          size: 14,
          weight: "bold" as const,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

// Tableau Public Embed Component
export const TableauEmbed: React.FC<TableauEmbedProps> = ({
  workbookUrl,
  title,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">Tableau Public</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 border rounded-lg overflow-hidden">
          <iframe
            src={workbookUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            title={title}
            className="border-0"
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Interactive dashboard powered by Tableau Public. Click and explore the
          data visualizations above.
        </p>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Data Visualizations Component
interface EnhancedVisualizationsProps {
  playerData?: PlayerData;
  comparisonPlayers?: PlayerData[];
  showTableau?: boolean;
}

export const EnhancedDataVisualizations: React.FC<
  EnhancedVisualizationsProps
> = ({ playerData, comparisonPlayers = [], showTableau = false }) => {
  // Sample data for demonstration
  const samplePlayer: PlayerData = playerData || {
    id: 1,
    name: "Sample Player",
    position: "Central Midfielder",
    nationality: "Nigeria",
    marketValue: 5000000,
    stats: {
      technical: 78,
      physical: 82,
      mental: 85,
      pace: 75,
      shooting: 70,
      passing: 88,
      dribbling: 80,
      defending: 65,
      physicality: 82,
    },
  };

  const sampleComparison: PlayerData[] =
    comparisonPlayers.length > 0
      ? comparisonPlayers
      : [
          samplePlayer,
          {
            id: 2,
            name: "Comparison Player A",
            position: "Central Midfielder",
            nationality: "Ghana",
            marketValue: 3500000,
            stats: {
              technical: 72,
              physical: 78,
              mental: 80,
              pace: 80,
              shooting: 65,
              passing: 82,
              dribbling: 85,
              defending: 60,
              physicality: 78,
            },
          },
          {
            id: 3,
            name: "Comparison Player B",
            position: "Attacking Midfielder",
            nationality: "Morocco",
            marketValue: 7500000,
            stats: {
              technical: 85,
              physical: 70,
              mental: 88,
              pace: 78,
              shooting: 82,
              passing: 90,
              dribbling: 88,
              defending: 45,
              physicality: 70,
            },
          },
        ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced Data Visualizations</h2>
        <div className="flex gap-2">
          {/* <Badge variant="outline">D3.js</Badge>
          <Badge variant="outline">Chart.js</Badge> */}
          <Badge variant="outline">Interactive</Badge>
        </div>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="tableau">Tableau Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>D3.js Radar Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <D3RadarChart
                  data={samplePlayer.stats}
                  playerName={samplePlayer.name}
                  width={400}
                  height={400}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <PerformanceOverTime player={samplePlayer} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(samplePlayer.stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-8">
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Player Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Position</p>
                      <p className="font-semibold">{samplePlayer.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nationality</p>
                      <p className="font-semibold">
                        {samplePlayer.nationality}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Market Value</p>
                      <p className="font-semibold">
                        €
                        {((samplePlayer.marketValue || 0) / 1000000).toFixed(1)}
                        M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Overall Rating</p>
                      <p className="font-semibold">
                        {Math.round(
                          Object.values(samplePlayer.stats).reduce(
                            (a, b) => a + b,
                            0,
                          ) / Object.values(samplePlayer.stats).length,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Player Radar Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveComparisonChart
                  players={sampleComparison}
                  width={500}
                  height={400}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Value Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <MarketValueTrend players={sampleComparison} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Position Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <PositionDistribution players={sampleComparison} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Performance Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(
                        Object.values(samplePlayer.stats).reduce((a, b) => a + b, 0) / 
                        Object.values(samplePlayer.stats).length
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall Rating</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      €{((samplePlayer.marketValue || 0) / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Market Value</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(...Object.values(samplePlayer.stats))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Peak Attribute</div>
                  </div>
                </div>
                
                <div className="h-48">
                  <PerformanceOverTime player={samplePlayer} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Advanced ML Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Player Potential Analysis</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ML-powered future performance prediction</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Target className="h-4 w-4 mr-1" />
                    Analyze
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Tactical Fit Assessment</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Formation and system compatibility</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <MapPin className="h-4 w-4 mr-1" />
                    Assess
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">Injury Risk Modeling</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Predictive health analytics</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Activity className="h-4 w-4 mr-1" />
                    Model
                  </Button>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Recent ML Insights</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Projected 15% performance increase over next season</li>
                    <li>• Optimal fit for 4-3-3 formation</li>
                    <li>• Low injury risk based on physical attributes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(samplePlayer.stats).slice(0, 6).map(([attr, value]) => (
                    <div key={attr} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {attr.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              value >= 80 ? 'bg-green-500' : 
                              value >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-8">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Development Trajectory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Rating</span>
                    <Badge variant="secondary">
                      {Math.round(Object.values(samplePlayer.stats).reduce((a, b) => a + b, 0) / 
                      Object.values(samplePlayer.stats).length)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Projected Peak</span>
                    <Badge variant="default">
                      {Math.round(Object.values(samplePlayer.stats).reduce((a, b) => a + b, 0) / 
                      Object.values(samplePlayer.stats).length) + 5}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak Age</span>
                    <Badge variant="outline">27-29</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Trend</span>
                    <Badge variant="default" className="bg-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Rising
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Position Heat Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-green-100 dark:bg-green-900/20 rounded-lg p-4 h-40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full mx-auto mb-2"></div>
                      <p className="text-xs font-medium">{samplePlayer.position}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Primary Position</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="w-4 h-4 bg-blue-400 rounded-full opacity-60"></div>
                  </div>
                  <div className="absolute bottom-4 left-6">
                    <div className="w-3 h-3 bg-blue-300 rounded-full opacity-40"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tableau" className="space-y-6">
          {showTableau ? (
            <JongPSVDashboard />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tableau Public Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.097 5.095c-.396 0-.719.322-.719.719v5.016c0 .396.322.719.719.719h5.016c.396 0 .719-.322.719-.719V5.814c0-.396-.322-.719-.719-.719h-5.016z" />
                      <path d="M3.625 9.938c-.396 0-.719.322-.719.719v2.687c0 .396.322.719.719.719h2.687c.396 0 .719-.322.719-.719v-2.687c0-.396-.322-.719-.719-.719H3.625z" />
                      <path d="M17.688 9.938c-.396 0-.719.322-.719.719v2.687c0 .396.322.719.719.719h2.687c.396 0 .719-.322.719-.719v-2.687c0-.396-.322-.719-.719-.719h-2.687z" />
                      <path d="M10.656 15.125c-.396 0-.719.322-.719.719v2.687c0 .396.322.719.719.719h2.687c.396 0 .719-.322.719-.719v-2.687c0-.396-.322-.719-.719-.719h-2.687z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Tableau Dashboard Integration
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Tableau Public workbooks for advanced
                    interactive visualizations.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Available Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Interactive player performance dashboards</li>
                      <li>• Advanced statistical analysis and correlations</li>
                      <li>• Market value trend analysis</li>
                      <li>• Position-specific performance metrics</li>
                      <li>• League comparison analytics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDataVisualizations;
