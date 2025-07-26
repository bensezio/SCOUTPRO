import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BarChart3 } from "lucide-react";

interface TableauDashboardProps {
  title: string;
  description?: string;
  dashboardId: string;
  vizName: string;
  width?: string;
  height?: string;
  className?: string;
}

export const TableauDashboard = ({
  title,
  description,
  dashboardId,
  vizName,
  width = "1200px",
  height = "827px",
  className = ""
}: TableauDashboardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vizRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create unique ID for this dashboard instance
    const uniqueId = `viz_${dashboardId}_${Date.now()}`;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the Tableau placeholder div
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'tableauPlaceholder';
    placeholderDiv.id = uniqueId;
    placeholderDiv.style.position = 'relative';

    // Create noscript fallback
    const noscript = document.createElement('noscript');
    const link = document.createElement('a');
    link.href = '#';
    
    const img = document.createElement('img');
    img.alt = title; // Safe: uses textContent equivalent
    img.src = `https://public.tableau.com/static/images/${dashboardId}/1_rss.png`;
    img.style.border = 'none';
    
    link.appendChild(img);
    noscript.appendChild(link);
    placeholderDiv.appendChild(noscript);

    // Create object element for Tableau viz
    const objectElement = document.createElement('object');
    objectElement.className = 'tableauViz';
    objectElement.style.display = 'none';

    // Set parameters for Tableau visualization
    const params = [
      { name: 'host_url', value: 'https%3A%2F%2Fpublic.tableau.com%2F' },
      { name: 'embed_code_version', value: '3' },
      { name: 'site_root', value: '' },
      { name: 'name', value: vizName },
      { name: 'tabs', value: 'no' },
      { name: 'toolbar', value: 'yes' },
      { name: 'static_image', value: `https://public.tableau.com/static/images/${dashboardId}/1.png` },
      { name: 'animate_transition', value: 'yes' },
      { name: 'display_static_image', value: 'yes' },
      { name: 'display_spinner', value: 'yes' },
      { name: 'display_overlay', value: 'yes' },
      { name: 'display_count', value: 'yes' },
      { name: 'language', value: 'en-US' }
    ];

    params.forEach(param => {
      const paramElement = document.createElement('param');
      paramElement.name = param.name;
      paramElement.value = param.value;
      objectElement.appendChild(paramElement);
    });

    placeholderDiv.appendChild(objectElement);
    containerRef.current.appendChild(placeholderDiv);

    // Load and initialize Tableau viz
    const initializeTableau = () => {
      const vizElement = objectElement;
      vizElement.style.width = width;
      vizElement.style.height = height;
      vizElement.style.display = 'block';

      // Load Tableau JavaScript API with error handling
      if (!document.querySelector('script[src*="viz_v1.js"]')) {
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
        scriptElement.async = true;
        scriptElement.onload = () => {
          try {
            // Wait for Tableau API to be available
            if (typeof window.tableau !== 'undefined') {
              console.log(`✅ Tableau dashboard "${title}" loaded successfully`);
            } else {
              console.warn(`⚠️ Tableau API loaded but not available for "${title}"`);
            }
          } catch (error) {
            console.error(`❌ Error initializing Tableau for "${title}":`, error);
          }
        };
        scriptElement.onerror = (error) => {
          console.error(`❌ Failed to load Tableau API for dashboard "${title}":`, error);
          // Show fallback iframe
          const fallbackIframe = document.createElement('iframe');
          fallbackIframe.src = `https://public.tableau.com/views/${dashboardId}?:embed=yes&:display_count=no&:showVizHome=no`;
          fallbackIframe.width = width;
          fallbackIframe.height = height;
          fallbackIframe.style.border = 'none';
          fallbackIframe.setAttribute('allowfullscreen', 'true');
          containerRef.current?.appendChild(fallbackIframe);
        };
        document.head.appendChild(scriptElement);
      }
    };

    // Initialize after a brief delay to ensure DOM is ready
    setTimeout(initializeTableau, 100);

    // Cleanup function
    return () => {
      if (vizRef.current) {
        try {
          vizRef.current.dispose();
        } catch (error) {
          console.warn('Error disposing Tableau viz:', error);
        }
      }
    };
  }, [dashboardId, vizName, width, height, title]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Tableau Public
            </Badge>
            <Badge variant="secondary">Live Data</Badge>
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="w-full flex justify-center"
          style={{ minHeight: height }}
        />
      </CardContent>
    </Card>
  );
};

// Pre-configured dashboard components for common use cases
export const JongPSVDashboard = () => (
  <TableauDashboard
    title="Jong PSV Performance Dashboard"
    description="Live football performance analytics from Jong PSV featuring player statistics, match analysis, and tactical insights."
    dashboardId="Fo/FootballsoccerPerformanceDashboardJongPSVlive"
    vizName="FootballsoccerPerformanceDashboardJongPSVlive/JongPSV"
    width="1200px"
    height="827px"
  />
);

export default TableauDashboard;