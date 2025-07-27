/**
 * Advanced Visualizations Component
 * Modern data visualizations with interactive features for PlatinumEdge Analytics
 */

import React, { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  TrendingUp,
  MapPin,
  Target,
  Activity
} from 'lucide-react';

interface PlayerPosition {
  x: number;
  y: number;
  timestamp: number;
  event?: string;
}

interface HeatmapData {
  playerId: number;
  playerName: string;
  positions: PlayerPosition[];
  matchId: number;
  averagePosition: { x: number; y: number };
  touchMap: Array<{ x: number; y: number; intensity: number }>;
}

interface PassMapData {
  from: { x: number; y: number };
  to: { x: number; y: number };
  success: boolean;
  distance: number;
  timestamp: number;
}

interface ScatterPlotData {
  playerId: number;
  playerName: string;
  x: number;
  y: number;
  value: number;
  position: string;
  nationality: string;
  age: number;
}

interface AdvancedVisualizationsProps {
  playerId?: number;
  matchId?: number;
  comparisonMode?: boolean;
  playerIds?: number[];
}

export const AdvancedVisualizations: React.FC<AdvancedVisualizationsProps> = ({
  playerId,
  matchId,
  comparisonMode = false,
  playerIds = []
}) => {
  const { toast } = useToast();
  const heatmapRef = useRef<SVGSVGElement>(null);
  const passMapRef = useRef<SVGSVGElement>(null);
  const scatterRef = useRef<SVGSVGElement>(null);
  const radarRef = useRef<SVGSVGElement>(null);
  
  const [activeVisualization, setActiveVisualization] = useState<string>('analytics');
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [timeRange, setTimeRange] = useState([0, 90]);
  const [selectedMetric, setSelectedMetric] = useState('touches');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(playerId || null);

  // Fetch players for selection
  const { data: playersData } = useQuery({
    queryKey: ['/api/players'],
  });

  const players = playersData?.players || [];
  const selectedPlayer = players.find((p: any) => p.id === selectedPlayerId);

  // ML Analytics mutations
  const potentialMutation = useMutation({
    mutationFn: async (playerAttributes: any) => {
      const response = await apiRequest("POST", "/api/ai/analyze-potential", { playerAttributes });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Potential Analysis Complete",
        description: `Player potential analyzed successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze player potential",
        variant: "destructive",
      });
    },
  });

  const tacticalMutation = useMutation({
    mutationFn: async ({ playerAttributes, formation }: any) => {
      const response = await apiRequest("POST", "/api/ai/analyze-tactical-fit", { playerAttributes, formation });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Tactical Analysis Complete",
        description: `Tactical fit analyzed successfully`,
      });
    },
  });

  const injuryMutation = useMutation({
    mutationFn: async (playerAttributes: any) => {
      const response = await apiRequest("POST", "/api/ai/analyze-injury-risk", { playerAttributes });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Injury Risk Analysis Complete",
        description: `Injury risk assessed successfully`,
      });
    },
  });

  const marketValueMutation = useMutation({
    mutationFn: async (playerAttributes: any) => {
      const response = await apiRequest("POST", "/api/enhanced-ai/market-value", playerAttributes);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Market Value Prediction Complete",
        description: `Predicted value: €${data.predicted_market_value?.toLocaleString()}`,
      });
    },
  });

  const similarityMutation = useMutation({
    mutationFn: async (playerAttributes: any) => {
      const response = await apiRequest("POST", "/api/enhanced-ai/similarity", playerAttributes);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Similarity Analysis Complete",
        description: `Found ${data.similar_players?.length || 0} similar players`,
      });
    },
  });

  const tacticalFitMutation = useMutation({
    mutationFn: async (playerAttributes: any) => {
      const response = await apiRequest("POST", "/api/enhanced-ai/tactical-fit", playerAttributes);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Tactical Fit Analysis Complete",
        description: `Tactical fit score: ${data.tactical_fit_score}%`,
      });
    },
  });

  const injuryRiskMutation = useMutation({
    mutationFn: async (playerAttributes: any) => {
      const response = await apiRequest("POST", "/api/enhanced-ai/injury-risk", playerAttributes);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Injury Risk Assessment Complete",
        description: `Risk level: ${data.injury_risk_percentage}%`,
      });
    },
  });

  const mockHeatmapData: HeatmapData = {
    playerId: selectedPlayerId || 1,
    playerName: selectedPlayer?.name || 'Select Player',
    positions: generateMockPositions(),
    matchId: matchId || 1,
    averagePosition: { x: 75, y: 40 },
    touchMap: generateMockTouchMap()
  };

  const mockPassMapData: PassMapData[] = generateMockPassMap();
  const mockScatterData: ScatterPlotData[] = generateMockScatterData();

  function generateMockPositions(): PlayerPosition[] {
    const positions: PlayerPosition[] = [];
    for (let i = 0; i < 100; i++) {
      positions.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        timestamp: i * 0.9,
        event: Math.random() > 0.9 ? 'goal' : Math.random() > 0.8 ? 'assist' : undefined
      });
    }
    return positions;
  }

  function generateMockTouchMap(): Array<{ x: number; y: number; intensity: number }> {
    const touchMap: Array<{ x: number; y: number; intensity: number }> = [];
    for (let i = 0; i < 50; i++) {
      touchMap.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        intensity: Math.random() * 100
      });
    }
    return touchMap;
  }

  function generateMockPassMap(): PassMapData[] {
    const passMap: PassMapData[] = [];
    for (let i = 0; i < 30; i++) {
      passMap.push({
        from: { x: Math.random() * 100, y: Math.random() * 100 },
        to: { x: Math.random() * 100, y: Math.random() * 100 },
        success: Math.random() > 0.2,
        distance: Math.random() * 50 + 10,
        timestamp: Math.random() * 90
      });
    }
    return passMap;
  }

  function generateMockScatterData(): ScatterPlotData[] {
    const positions = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
    const nationalities = ['Egypt', 'Nigeria', 'Ghana', 'Senegal', 'Morocco'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      playerId: i + 1,
      playerName: `Player ${i + 1}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      value: Math.random() * 100,
      position: positions[Math.floor(Math.random() * positions.length)],
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      age: Math.floor(Math.random() * 15) + 18
    }));
  }

  // Heatmap visualization
  const renderHeatmap = () => {
    if (!heatmapRef.current) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Create field background
    const field = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#16a34a')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Add field markings
    const fieldGroup = svg.append('g').attr('class', 'field-markings');
    
    // Center line
    fieldGroup.append('line')
      .attr('x1', width / 2)
      .attr('y1', 0)
      .attr('x2', width / 2)
      .attr('y2', height)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Center circle
    fieldGroup.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 50)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Penalty areas
    fieldGroup.append('rect')
      .attr('x', 0)
      .attr('y', height * 0.25)
      .attr('width', width * 0.15)
      .attr('height', height * 0.5)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    fieldGroup.append('rect')
      .attr('x', width * 0.85)
      .attr('y', height * 0.25)
      .attr('width', width * 0.15)
      .attr('height', height * 0.5)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Color scale for heatmap
    const colorScale = d3.scaleSequential(d3.interpolateOrRd)
      .domain([0, d3.max(mockHeatmapData.touchMap, d => d.intensity) || 100]);

    // Create heatmap points
    const heatmapGroup = svg.append('g').attr('class', 'heatmap');
    
    mockHeatmapData.touchMap.forEach(point => {
      heatmapGroup.append('circle')
        .attr('cx', (point.x / 100) * width)
        .attr('cy', (point.y / 100) * height)
        .attr('r', point.intensity / 10 + 5)
        .attr('fill', colorScale(point.intensity))
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
          if (showTooltips) {
            const tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0,0,0,0.8)')
              .style('color', 'white')
              .style('padding', '5px')
              .style('border-radius', '3px')
              .style('pointer-events', 'none')
              .style('opacity', 0);

            tooltip.transition()
              .duration(200)
              .style('opacity', 1);

            tooltip.html(`Intensity: ${point.intensity.toFixed(1)}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 30) + 'px');
          }
        })
        .on('mouseout', function() {
          d3.selectAll('.tooltip').remove();
        });
    });

    // Add average position indicator
    heatmapGroup.append('circle')
      .attr('cx', (mockHeatmapData.averagePosition.x / 100) * width)
      .attr('cy', (mockHeatmapData.averagePosition.y / 100) * height)
      .attr('r', 8)
      .attr('fill', '#facc15')
      .attr('stroke', '#000')
      .attr('stroke-width', 2);

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 100}, 20)`);

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, 100]);

    const legendAxis = d3.axisRight(legendScale);

    legend.append('g')
      .call(legendAxis);

    legend.append('text')
      .attr('x', -10)
      .attr('y', -10)
      .attr('text-anchor', 'end')
      .text('Touch Intensity')
      .style('font-size', '12px')
      .style('fill', 'white');
  };

  // Pass map visualization
  const renderPassMap = () => {
    if (!passMapRef.current) return;

    const svg = d3.select(passMapRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;

    // Create field background (same as heatmap)
    const field = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#16a34a')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Add field markings (simplified)
    const fieldGroup = svg.append('g').attr('class', 'field-markings');
    
    fieldGroup.append('line')
      .attr('x1', width / 2)
      .attr('y1', 0)
      .attr('x2', width / 2)
      .attr('y2', height)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Create pass lines
    const passGroup = svg.append('g').attr('class', 'pass-map');

    mockPassMapData.forEach((pass, i) => {
      const fromX = (pass.from.x / 100) * width;
      const fromY = (pass.from.y / 100) * height;
      const toX = (pass.to.x / 100) * width;
      const toY = (pass.to.y / 100) * height;

      // Pass line
      passGroup.append('line')
        .attr('x1', fromX)
        .attr('y1', fromY)
        .attr('x2', toX)
        .attr('y2', toY)
        .attr('stroke', pass.success ? '#22c55e' : '#ef4444')
        .attr('stroke-width', Math.max(1, pass.distance / 10))
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
          if (showTooltips) {
            const tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0,0,0,0.8)')
              .style('color', 'white')
              .style('padding', '5px')
              .style('border-radius', '3px')
              .style('pointer-events', 'none')
              .style('opacity', 0);

            tooltip.transition()
              .duration(200)
              .style('opacity', 1);

            tooltip.html(`
              Distance: ${pass.distance.toFixed(1)}m<br>
              Success: ${pass.success ? 'Yes' : 'No'}<br>
              Time: ${pass.timestamp.toFixed(1)}'
            `)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 30) + 'px');
          }
        })
        .on('mouseout', function() {
          d3.selectAll('.tooltip').remove();
        });

      // Pass start point
      passGroup.append('circle')
        .attr('cx', fromX)
        .attr('cy', fromY)
        .attr('r', 3)
        .attr('fill', '#ffffff')
        .attr('stroke', '#000')
        .attr('stroke-width', 1);

      // Pass end point (arrow)
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowLength = 8;
      const arrowWidth = 4;

      passGroup.append('polygon')
        .attr('points', `
          ${toX},${toY} 
          ${toX - arrowLength * Math.cos(angle - arrowWidth)},${toY - arrowLength * Math.sin(angle - arrowWidth)} 
          ${toX - arrowLength * Math.cos(angle + arrowWidth)},${toY - arrowLength * Math.sin(angle + arrowWidth)}
        `)
        .attr('fill', pass.success ? '#22c55e' : '#ef4444');
    });

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, 20)`);

    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 20)
      .attr('y2', 0)
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 5)
      .text('Successful Pass')
      .style('font-size', '12px')
      .style('fill', 'white');

    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 20)
      .attr('x2', 20)
      .attr('y2', 20)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 25)
      .text('Failed Pass')
      .style('font-size', '12px')
      .style('fill', 'white');
  };

  // Scatter plot visualization
  const renderScatterPlot = () => {
    if (!scatterRef.current) return;

    const svg = d3.select(scatterRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(mockScatterData, d => d.x) as [number, number])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(mockScatterData, d => d.y) as [number, number])
      .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(['Forward', 'Midfielder', 'Defender', 'Goalkeeper']);

    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(mockScatterData, d => d.value) as [number, number])
      .range([4, 20]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .text('Expected Goals (xG)')
      .style('font-size', '14px');

    svg.append('text')
      .attr('x', -height / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Expected Assists (xA)')
      .style('font-size', '14px');

    // Add data points
    svg.selectAll('.scatter-point')
      .data(mockScatterData)
      .enter()
      .append('circle')
      .attr('class', 'scatter-point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => sizeScale(d.value))
      .attr('fill', d => colorScale(d.position))
      .attr('opacity', 0.7)
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        if (showTooltips) {
          const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

          tooltip.transition()
            .duration(200)
            .style('opacity', 1);

          tooltip.html(`
            <strong>${d.playerName}</strong><br>
            Position: ${d.position}<br>
            Nationality: ${d.nationality}<br>
            Age: ${d.age}<br>
            xG: ${d.x.toFixed(2)}<br>
            xA: ${d.y.toFixed(2)}<br>
            Value: ${d.value.toFixed(1)}
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 30) + 'px');
        }
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 50)`);

    const positions = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
    
    positions.forEach((position, i) => {
      legend.append('circle')
        .attr('cx', 0)
        .attr('cy', i * 25)
        .attr('r', 6)
        .attr('fill', colorScale(position));

      legend.append('text')
        .attr('x', 15)
        .attr('y', i * 25 + 5)
        .text(position)
        .style('font-size', '12px');
    });
  };

  // Dynamic radar chart
  const renderRadarChart = () => {
    if (!radarRef.current) return;

    const svg = d3.select(radarRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;
    const center = { x: width / 2, y: height / 2 };

    const attributes = [
      { name: 'Pace', value: 85 },
      { name: 'Shooting', value: 92 },
      { name: 'Passing', value: 78 },
      { name: 'Dribbling', value: 88 },
      { name: 'Defending', value: 35 },
      { name: 'Physicality', value: 75 }
    ];

    const angleSlice = (Math.PI * 2) / attributes.length;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    const g = svg.append('g')
      .attr('transform', `translate(${center.x}, ${center.y})`);

    // Grid circles
    const gridLevels = 5;
    for (let level = 1; level <= gridLevels; level++) {
      g.append('circle')
        .attr('r', radius * (level / gridLevels))
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);
    }

    // Grid lines
    attributes.forEach((attr, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(angle))
        .attr('y2', radius * Math.sin(angle))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);
    });

    // Labels
    attributes.forEach((attr, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 25;

      g.append('text')
        .attr('x', labelRadius * Math.cos(angle))
        .attr('y', labelRadius * Math.sin(angle))
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text(attr.name)
        .style('font-size', '12px')
        .style('font-weight', 'bold');
    });

    // Data polygon
    const lineGenerator = d3.line()
      .x((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return rScale(d[1]) * Math.cos(angle);
      })
      .y((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return rScale(d[1]) * Math.sin(angle);
      })
      .curve(d3.curveLinearClosed);

    const dataPoints = attributes.map(attr => [attr.name, attr.value]);

    g.append('path')
      .datum(dataPoints)
      .attr('d', lineGenerator)
      .attr('fill', 'rgba(59, 130, 246, 0.3)')
      .attr('stroke', 'rgba(59, 130, 246, 1)')
      .attr('stroke-width', 2);

    // Data points
    attributes.forEach((attr, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = rScale(attr.value) * Math.cos(angle);
      const y = rScale(attr.value) * Math.sin(angle);

      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', 'rgba(59, 130, 246, 1)')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
    });
  };

  // Effects
  useEffect(() => {
    if (activeVisualization === 'heatmap') {
      renderHeatmap();
    } else if (activeVisualization === 'passmap') {
      renderPassMap();
    } else if (activeVisualization === 'scatter') {
      renderScatterPlot();
    } else if (activeVisualization === 'radar') {
      renderRadarChart();
    }
  }, [activeVisualization, showTooltips, selectedMetric, timeRange]);

  const handleExport = () => {
    // Implementation for exporting visualizations
    console.log('Exporting visualization...');
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Implementation for animation playback
  };

  const handleReset = () => {
    setZoomLevel(1);
    setTimeRange([0, 90]);
    setSelectedMetric('touches');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Advanced Player Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeVisualization} onValueChange={setActiveVisualization}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                ML Analytics
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="passmap" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pass Map
              </TabsTrigger>
              <TabsTrigger value="scatter" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Scatter Plot
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Radar Chart
              </TabsTrigger>
            </TabsList>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="tooltips">Show Tooltips</Label>
                <Switch 
                  id="tooltips" 
                  checked={showTooltips} 
                  onCheckedChange={setShowTooltips} 
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="animation">Animation</Label>
                <Switch 
                  id="animation" 
                  checked={animationEnabled} 
                  onCheckedChange={setAnimationEnabled} 
                />
              </div>

              <div className="flex items-center gap-2">
                <Label>Metric:</Label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="touches">Touches</SelectItem>
                    <SelectItem value="passes">Passes</SelectItem>
                    <SelectItem value="shots">Shots</SelectItem>
                    <SelectItem value="tackles">Tackles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Time Range:</Label>
                <div className="w-32">
                  <Slider
                    value={timeRange}
                    onValueChange={setTimeRange}
                    min={0}
                    max={90}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {timeRange[0]}'-{timeRange[1]}'
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePlayPause}
                  disabled={!animationEnabled}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {/* Player Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Player Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="player-select">Select Player</Label>
                        <Select value={selectedPlayerId?.toString() || ""} onValueChange={(value) => setSelectedPlayerId(parseInt(value))}>
                          <SelectTrigger id="player-select">
                            <SelectValue placeholder="Choose a player for analysis" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player: any) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.firstName} {player.lastName} - {player.position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedPlayer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Potential Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Potential Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button 
                            onClick={() => marketValueMutation.mutate({
                              age: selectedPlayer.age,
                              overallRating: selectedPlayer.overallRating,
                              position: selectedPlayer.position,
                              nationality: selectedPlayer.nationality,
                              marketValue: selectedPlayer.marketValue
                            })}
                            disabled={marketValueMutation.isPending}
                            className="w-full"
                          >
                            {marketValueMutation.isPending ? 'Analyzing...' : 'Analyze Market Value'}
                          </Button>
                          
                          {marketValueMutation.data && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Current Value:</span>
                                <Badge variant="outline">€{(selectedPlayer.marketValue || 0).toLocaleString()}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Predicted Value:</span>
                                <Badge variant="secondary">
                                  €{(marketValueMutation.data.predicted_market_value || 0).toLocaleString()}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Confidence: {(marketValueMutation.data.confidence * 100).toFixed(1)}%</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Market Value Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Market Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button 
                            onClick={() => marketValueMutation.mutate({
                              age: selectedPlayer.age,
                              overallRating: selectedPlayer.overallRating,
                              position: selectedPlayer.position,
                              nationality: selectedPlayer.nationality,
                              marketValue: selectedPlayer.marketValue
                            })}
                            disabled={marketValueMutation.isPending}
                            className="w-full"
                          >
                            {marketValueMutation.isPending ? 'Predicting...' : 'Predict Market Value'}
                          </Button>
                          
                          {marketValueMutation.data && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Current Value:</span>
                                <Badge variant="outline">
                                  €{(selectedPlayer.marketValue || 0).toLocaleString()}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Predicted Value:</span>
                                <Badge variant="secondary">
                                  €{(marketValueMutation.data.marketValue?.predicted_value || 0).toLocaleString()}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Confidence: {marketValueMutation.data.marketValue?.confidence || 'N/A'}%</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tactical Fit Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Tactical Fit
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Label>Formation:</Label>
                            <Select defaultValue="4-3-3">
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="4-3-3">4-3-3</SelectItem>
                                <SelectItem value="4-4-2">4-4-2</SelectItem>
                                <SelectItem value="3-5-2">3-5-2</SelectItem>
                                <SelectItem value="5-3-2">5-3-2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={() => tacticalFitMutation.mutate({
                              age: selectedPlayer.age,
                              overallRating: selectedPlayer.overallRating,
                              position: selectedPlayer.position,
                              formation: '4-3-3'
                            })}
                            disabled={tacticalFitMutation.isPending}
                            className="w-full"
                          >
                            {tacticalFitMutation.isPending ? 'Analyzing...' : 'Analyze Tactical Fit'}
                          </Button>
                          
                          {tacticalFitMutation.data && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Formation Fit:</span>
                                <Badge variant="secondary">
                                  {tacticalFitMutation.data.tactical_fit_score}%
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Strengths: {tacticalFitMutation.data.strengths?.join(', ')}</p>
                                <p>Recommendations: {tacticalFitMutation.data.recommendations?.join(', ')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Injury Risk Assessment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Injury Risk
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button 
                            onClick={() => injuryRiskMutation.mutate({
                              age: selectedPlayer.age,
                              physicality: selectedPlayer.physicality,
                              position: selectedPlayer.position
                            })}
                            disabled={injuryRiskMutation.isPending}
                            className="w-full"
                          >
                            {injuryRiskMutation.isPending ? 'Assessing...' : 'Assess Injury Risk'}
                          </Button>
                          
                          {injuryRiskMutation.data && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Risk Level:</span>
                                <Badge variant={
                                  injuryRiskMutation.data.injury_risk_percentage < 20 ? 'default' :
                                  injuryRiskMutation.data.injury_risk_percentage < 40 ? 'secondary' : 'destructive'
                                }>
                                  {injuryRiskMutation.data.injury_risk_percentage < 20 ? 'Low' :
                                   injuryRiskMutation.data.injury_risk_percentage < 40 ? 'Moderate' : 'High'}
                                </Badge>
                              </div>
                              <Progress 
                                value={injuryRiskMutation.data.injury_risk_percentage} 
                                className="w-full" 
                              />
                              <div className="text-sm text-gray-600">
                                <p>Risk Score: {injuryRiskMutation.data.injury_risk_percentage}%</p>
                                <p>Recommendations: {injuryRiskMutation.data.recommendations?.join(', ')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!selectedPlayer && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">Select a player to view advanced ML analytics</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="heatmap" className="mt-6">
              <div className="bg-white rounded-lg border p-4">
                <svg ref={heatmapRef} width="800" height="500" className="w-full h-auto" />
              </div>
            </TabsContent>

            <TabsContent value="passmap" className="mt-6">
              <div className="bg-white rounded-lg border p-4">
                <svg ref={passMapRef} width="800" height="500" className="w-full h-auto" />
              </div>
            </TabsContent>

            <TabsContent value="scatter" className="mt-6">
              <div className="bg-white rounded-lg border p-4">
                <svg ref={scatterRef} width="800" height="500" className="w-full h-auto" />
              </div>
            </TabsContent>

            <TabsContent value="radar" className="mt-6">
              <div className="bg-white rounded-lg border p-4 flex justify-center">
                <svg ref={radarRef} width="400" height="400" className="max-w-full h-auto" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedVisualizations;