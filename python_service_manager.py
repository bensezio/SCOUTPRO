#!/usr/bin/env python3
"""
Python ML Service Manager
Robust service runner with health monitoring and auto-restart
"""

import subprocess
import time
import signal
import sys
import os
import requests
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PythonServiceManager:
    def __init__(self):
        self.process = None
        self.service_url = "http://localhost:5001"
        self.health_endpoint = f"{self.service_url}/api/player-analysis/health"
        self.service_script = "ai-services/player-analysis/player_analysis_service.py"
        self.running = False
        
    def log(self, message):
        logger.info(f"[ServiceManager] {message}")
        
    def start_service(self):
        """Start the Python ML service"""
        try:
            if self.process and self.process.poll() is None:
                self.log("Service already running")
                return True
                
            self.log("Starting Python ML service...")
            
            # Ensure script exists
            if not Path(self.service_script).exists():
                self.log(f"ERROR: Service script not found: {self.service_script}")
                return False
            
            # Start the service process
            self.process = subprocess.Popen(
                [sys.executable, self.service_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            self.log(f"Service started with PID: {self.process.pid}")
            return True
            
        except Exception as e:
            self.log(f"Failed to start service: {e}")
            return False
    
    def check_health(self):
        """Check if the service is responding"""
        try:
            response = requests.get(self.health_endpoint, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return data.get('status') == 'healthy'
            return False
        except Exception:
            return False
    
    def wait_for_startup(self, max_wait=30):
        """Wait for service to be ready"""
        self.log("Waiting for service to be ready...")
        
        for i in range(max_wait):
            if self.check_health():
                self.log("Service is healthy and ready!")
                return True
            
            if self.process and self.process.poll() is not None:
                self.log("Service process died during startup")
                return False
                
            time.sleep(1)
            
        self.log("Service failed to start within timeout")
        return False
    
    def monitor_service(self):
        """Monitor service health and restart if needed"""
        self.log("Starting service monitoring...")
        
        while self.running:
            try:
                # Check if process is still running
                if self.process and self.process.poll() is not None:
                    self.log("Service process died, restarting...")
                    self.start_service()
                    if not self.wait_for_startup():
                        self.log("Failed to restart service")
                        break
                
                # Check service health
                elif not self.check_health():
                    self.log("Service health check failed, restarting...")
                    if self.process:
                        self.process.terminate()
                        time.sleep(2)
                    self.start_service()
                    if not self.wait_for_startup():
                        self.log("Failed to restart service")
                        break
                
                time.sleep(10)  # Check every 10 seconds
                
            except KeyboardInterrupt:
                self.log("Received interrupt signal")
                break
            except Exception as e:
                self.log(f"Monitor error: {e}")
                time.sleep(5)
    
    def shutdown(self):
        """Graceful shutdown"""
        self.running = False
        if self.process:
            self.log("Shutting down service...")
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
            self.log("Service shutdown complete")
    
    def run(self):
        """Main service management loop"""
        self.running = True
        
        # Set up signal handlers
        def signal_handler(signum, frame):
            self.log(f"Received signal {signum}")
            self.shutdown()
            sys.exit(0)
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        try:
            # Start the service
            if not self.start_service():
                self.log("Failed to start service")
                return False
            
            # Wait for startup
            if not self.wait_for_startup():
                self.log("Service failed to become ready")
                return False
            
            self.log("Service is running and healthy")
            self.log(f"Health endpoint: {self.health_endpoint}")
            self.log("Press Ctrl+C to stop")
            
            # Monitor the service
            self.monitor_service()
            
        except Exception as e:
            self.log(f"Service manager error: {e}")
        finally:
            self.shutdown()
            
        return True

if __name__ == "__main__":
    manager = PythonServiceManager()
    success = manager.run()
    sys.exit(0 if success else 1)