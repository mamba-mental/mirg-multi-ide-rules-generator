#!/usr/bin/env python3
"""
Multi-IDE Rules Generator (MIRG) Portainer API Deployment Script
================================================================

This script deploys the MIRG stack to Portainer using the REST API.
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, Optional

class PortainerDeployer:
    def __init__(self, portainer_url: str = "http://192.168.86.97:9000"):
        self.portainer_url = portainer_url.rstrip('/')
        self.api_url = f"{self.portainer_url}/api"
        self.jwt_token = None
        self.endpoint_id = 1  # Default local Docker endpoint
        
    def authenticate(self, username: str = "admin", password: str = "") -> bool:
        """Authenticate with Portainer and get JWT token"""
        try:
            response = requests.post(
                f"{self.api_url}/auth",
                json={"Username": username, "Password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                self.jwt_token = response.json()["jwt"]
                print("✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with JWT token"""
        return {
            "Authorization": f"Bearer {self.jwt_token}",
            "Content-Type": "application/json"
        }
    
    def check_stack_exists(self, stack_name: str) -> Optional[Dict]:
        """Check if stack already exists"""
        try:
            response = requests.get(
                f"{self.api_url}/stacks",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                stacks = response.json()
                for stack in stacks:
                    if stack["Name"] == stack_name:
                        return stack
            return None
        except Exception as e:
            print(f"⚠️ Error checking existing stacks: {e}")
            return None
    
    def delete_stack(self, stack_id: int) -> bool:
        """Delete an existing stack"""
        try:
            response = requests.delete(
                f"{self.api_url}/stacks/{stack_id}?endpointId={self.endpoint_id}",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code in [200, 204]:
                print("✅ Existing stack deleted successfully")
                return True
            else:
                print(f"⚠️ Error deleting stack: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting stack: {e}")
            return False
    
    def deploy_stack(self, stack_name: str, compose_content: str, env_vars: Dict[str, str] = None) -> bool:
        """Deploy stack using Docker Compose content"""
        try:
            # Prepare environment variables
            env_array = []
            if env_vars:
                for key, value in env_vars.items():
                    env_array.append({"name": key, "value": value})
            
            payload = {
                "Name": stack_name,
                "ComposeFile": compose_content,
                "Env": env_array,
                "FromAppTemplate": False,
                "AutoUpdate": {
                    "Enabled": False
                }
            }
            
            print(f"🚀 Deploying stack '{stack_name}'...")
            
            response = requests.post(
                f"{self.api_url}/stacks?type=2&method=string&endpointId={self.endpoint_id}",
                headers=self.get_headers(),
                json=payload,
                timeout=60
            )
            
            if response.status_code in [200, 201]:
                stack_info = response.json()
                print(f"✅ Stack '{stack_name}' deployed successfully!")
                print(f"   Stack ID: {stack_info.get('Id')}")
                return True
            else:
                print(f"❌ Deployment failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Deployment error: {e}")
            return False
    
    def wait_for_services(self, stack_name: str, max_wait: int = 180) -> bool:
        """Wait for all services in the stack to be running"""
        print(f"⏳ Waiting for services to start (max {max_wait}s)...")
        
        start_time = time.time()
        while time.time() - start_time < max_wait:
            try:
                # Get containers for the stack
                response = requests.get(
                    f"{self.api_url}/endpoints/{self.endpoint_id}/docker/containers/json?all=true",
                    headers=self.get_headers(),
                    timeout=10
                )
                
                if response.status_code == 200:
                    containers = response.json()
                    stack_containers = []
                    
                    for container in containers:
                        labels = container.get("Labels", {})
                        if labels.get("com.docker.compose.project") == stack_name:
                            stack_containers.append({
                                "name": container["Names"][0].lstrip("/"),
                                "state": container["State"],
                                "status": container["Status"]
                            })
                    
                    if stack_containers:
                        all_running = all(c["state"] == "running" for c in stack_containers)
                        
                        print(f"📊 Container status:")
                        for container in stack_containers:
                            status_icon = "✅" if container["state"] == "running" else "⏳" if "starting" in container["status"].lower() else "❌"
                            print(f"   {status_icon} {container['name']}: {container['status']}")
                        
                        if all_running:
                            print("✅ All services are running!")
                            return True
                    
                time.sleep(5)
                
            except Exception as e:
                print(f"⚠️ Error checking service status: {e}")
                time.sleep(5)
        
        print("⚠️ Timeout waiting for services to start")
        return False
    
    def verify_endpoints(self, endpoints: Dict[str, str]) -> Dict[str, bool]:
        """Verify service endpoints are accessible"""
        print("🔍 Verifying service endpoints...")
        results = {}
        
        for service, url in endpoints.items():
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    print(f"✅ {service}: {url} - OK")
                    results[service] = True
                else:
                    print(f"⚠️ {service}: {url} - HTTP {response.status_code}")
                    results[service] = False
            except Exception as e:
                print(f"❌ {service}: {url} - Error: {e}")
                results[service] = False
        
        return results

def load_compose_file(file_path: str) -> str:
    """Load Docker Compose file content"""
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading compose file: {e}")
        sys.exit(1)

def main():
    print("🚀 MIRG Portainer API Deployment")
    print("=" * 40)
    
    # Configuration
    STACK_NAME = "mirg"
    COMPOSE_FILE = "docker-compose.portainer-fixed.yml"
    
    # Service endpoints to verify
    ENDPOINTS = {
        "Frontend": "http://192.168.86.97:3011",
        "Backend API": "http://192.168.86.97:3121/health",
        "Weaviate": "http://192.168.86.97:8093/v1/.well-known/ready"
    }
    
    # Load environment variables from .env if it exists
    env_vars = {}
    if os.path.exists('.env'):
        print("📝 Loading environment variables from .env file...")
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    
    # Initialize deployer
    deployer = PortainerDeployer()
    
    # Check if authentication is needed
    print("🔑 Checking Portainer authentication...")
    if not deployer.authenticate():
        print("⚠️ Authentication failed. Please check Portainer credentials.")
        sys.exit(1)
    
    # Check for existing stack
    existing_stack = deployer.check_stack_exists(STACK_NAME)
    if existing_stack:
        print(f"⚠️ Stack '{STACK_NAME}' already exists (ID: {existing_stack['Id']})")
        response = input("Do you want to delete and redeploy? (y/N): ")
        if response.lower() == 'y':
            if not deployer.delete_stack(existing_stack['Id']):
                print("❌ Failed to delete existing stack")
                sys.exit(1)
            time.sleep(5)  # Wait for deletion to complete
        else:
            print("❌ Deployment aborted")
            sys.exit(1)
    
    # Load compose content
    print("📂 Loading Docker Compose file...")
    compose_content = load_compose_file(COMPOSE_FILE)
    
    # Deploy stack
    if not deployer.deploy_stack(STACK_NAME, compose_content, env_vars):
        sys.exit(1)
    
    # Wait for services to start
    if deployer.wait_for_services(STACK_NAME):
        # Verify endpoints
        time.sleep(10)  # Additional wait for services to fully initialize
        results = deployer.verify_endpoints(ENDPOINTS)
        
        # Summary
        print("\n" + "=" * 50)
        print("🎉 DEPLOYMENT SUMMARY")
        print("=" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        if success_count == total_count:
            print("✅ ALL SERVICES DEPLOYED SUCCESSFULLY!")
            print("\n🌐 Access URLs:")
            for service, url in ENDPOINTS.items():
                if service == "Backend API":
                    print(f"   - {service}: http://192.168.86.97:3121")
                else:
                    print(f"   - {service}: {url}")
        else:
            print(f"⚠️ PARTIAL DEPLOYMENT: {success_count}/{total_count} services accessible")
            print("\nPlease check Portainer logs for troubleshooting.")
    
    else:
        print("❌ Service startup verification failed")
        print("Please check Portainer dashboard for details.")

if __name__ == "__main__":
    main()