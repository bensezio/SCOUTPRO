interface PlayerHeatMapProps {
  tags: any[];
}

export function PlayerHeatMap({ tags }: PlayerHeatMapProps) {
  // Filter tags that have field position data
  const positionTags = tags.filter(tag => 
    tag.fieldPositionX !== null && 
    tag.fieldPositionY !== null
  );

  if (positionTags.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No position data available</p>
        <p className="text-xs">Position data will appear as you tag events on the field</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-40 bg-green-100 rounded-lg overflow-hidden">
      {/* Football field background */}
      <div className="absolute inset-0">
        {/* Field markings */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white transform -translate-y-0.5" />
        <div className="absolute left-1/2 inset-y-0 w-px bg-white transform -translate-x-0.5" />
        <div className="absolute left-1/2 top-1/2 w-16 h-16 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        
        {/* Goal areas */}
        <div className="absolute left-0 top-1/2 w-4 h-12 border-r border-white transform -translate-y-1/2" />
        <div className="absolute right-0 top-1/2 w-4 h-12 border-l border-white transform -translate-y-1/2" />
      </div>

      {/* Heat map points */}
      {positionTags.map((tag, index) => {
        const x = parseFloat(tag.fieldPositionX.toString());
        const y = parseFloat(tag.fieldPositionY.toString());
        
        return (
          <div
            key={`${tag.id}-${index}`}
            className="absolute w-2 h-2 bg-red-500 rounded-full opacity-60 transform -translate-x-1 -translate-y-1"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            title={`Event at ${Math.round(x)}%, ${Math.round(y)}%`}
          />
        );
      })}
    </div>
  );
}