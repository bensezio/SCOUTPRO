#!/bin/bash
# Quick start script for Python ML service demonstration

echo "🚀 Starting Python ML Service for demonstration..."

cd /home/runner/workspace

# Kill any existing Python services
pkill -f "player_analysis_service.py" 2>/dev/null || true

# Start the Python service
echo "Starting Python ML service on port 5001..."
python3 ai-services/player-analysis/player_analysis_service.py &
PYTHON_PID=$!

echo "Python service started with PID: $PYTHON_PID"
echo "Waiting for service to initialize..."

# Wait for service to be ready
for i in {1..15}; do
    if curl -s http://localhost:5001/api/player-analysis/health >/dev/null 2>&1; then
        echo "✅ Python ML service is now running and healthy!"
        echo "🔗 Health endpoint: http://localhost:5001/api/player-analysis/health"
        echo ""
        echo "📊 Now you can test the Player Analysis features:"
        echo "   - Go to Analytics > Player Analysis tab"
        echo "   - Select a player (e.g., Mohamed Salah)"
        echo "   - Click 'Analyze Player' to see the ML analysis"
        echo ""
        echo "ℹ️  The service will run until this terminal is closed"
        echo "   or you can stop it with: pkill -f player_analysis_service.py"
        
        # Keep the service running
        wait $PYTHON_PID
        exit 0
    fi
    echo "Waiting for service to start... ($i/15)"
    sleep 1
done

echo "❌ Service failed to start properly"
exit 1