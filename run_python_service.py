#!/usr/bin/env python3
"""
Python ML Service Runner
Manages the player analysis microservice with proper error handling
"""

import subprocess
import sys
import time
import signal
import os

def start_service():
    """Start the Python ML service"""
    try:
        print("🚀 Starting Platinum Scout Python ML Service...")
        
        # Change to the correct directory
        os.chdir('/home/runner/workspace')
        
        # Start the service
        process = subprocess.Popen(
            [sys.executable, 'player_analysis_service.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        print(f"Python ML service started with PID: {process.pid}")
        
        # Wait for the service to start
        time.sleep(3)
        
        # Check if the process is still running
        if process.poll() is None:
            print("✅ Python ML service is running successfully")
            
            # Test the service health
            import requests
            try:
                response = requests.get('http://localhost:5001/api/player-analysis/health', timeout=5)
                if response.status_code == 200:
                    print("✅ Python ML service health check passed")
                    data = response.json()
                    print(f"Service: {data.get('service', 'unknown')}")
                    print(f"Status: {data.get('status', 'unknown')}")
                    print(f"Version: {data.get('version', 'unknown')}")
                else:
                    print(f"❌ Health check failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Health check error: {e}")
            
            # Keep the service running
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Stopping Python ML service...")
                process.terminate()
                process.wait()
                print("✅ Python ML service stopped")
        else:
            print("❌ Python ML service failed to start")
            stdout, stderr = process.communicate()
            print(f"stdout: {stdout}")
            print(f"stderr: {stderr}")
            
    except Exception as e:
        print(f"❌ Failed to start Python ML service: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    start_service()