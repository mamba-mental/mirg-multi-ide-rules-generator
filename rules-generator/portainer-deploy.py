#!/usr/bin/env python3
"""
Multi-IDE Rules Generator - Portainer API Deployment Script
Deploys the application stack to Portainer on NAS server 192.168.86.97
"""

import json
import requests
import sys
import os
from pathlib import Path

# Configuration
PORTAINER_URL = "http://192.168.86.97:9000"
STACK_NAME = "multi-ide-rules-generator"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"  # Default admin password, change if needed
ENDPOINT_ID = 1  # Usually 1 for the local environment

def get_auth_token():
    """Authenticate and get JWT token"""
    try:
        response = requests.post(
            f"{PORTAINER_URL}/api/auth",
            json={
                "Username": ADMIN_USERNAME,
                "Password": ADMIN_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            token = response.json().get("jwt")
            if token:
                return token
            else:
                print("❌ No JWT token in response")
                return None
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return None

def load_docker_compose():
    """Load and return docker-compose content"""
    compose_file = Path("docker-compose.portainer.yml")
    if not compose_file.exists():
        print(f"❌ Docker compose file not found: {compose_file}")
        return None
    
    try:
        with open(compose_file, 'r') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading compose file: {e}")
        return None

def load_environment_variables():
    """Load environment variables from .env file"""
    env_file = Path(".env")
    env_vars = []
    
    if env_file.exists():
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # Remove quotes if present
                        value = value.strip('"').strip("'")
                        env_vars.append({
                            "name": key.strip(),
                            "value": value
                        })
        except Exception as e:
            print(f"⚠️ Warning: Could not read .env file: {e}")
    
    return env_vars

def deploy_stack(token, compose_content, env_vars):
    """Deploy the stack to Portainer"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Prepare the payload
    payload = {
        "Name": STACK_NAME,
        "StackFileContent": compose_content,
        "Env": env_vars
    }
    
    try:
        # First, check if stack already exists
        existing_stacks = requests.get(
            f"{PORTAINER_URL}/api/stacks",
            headers=headers,
            timeout=10
        )
        
        if existing_stacks.status_code == 200:
            stacks = existing_stacks.json()
            for stack in stacks:
                if stack.get("Name") == STACK_NAME:
                    print(f"⚠️ Stack '{STACK_NAME}' already exists with ID: {stack.get('Id')}")
                    response = input("Do you want to update it? (y/N): ")
                    if response.lower() == 'y':
                        return update_stack(token, stack.get("Id"), compose_content, env_vars)
                    else:
                        print("❌ Deployment cancelled")
                        return False
        
        # Create new stack
        response = requests.post(
            f"{PORTAINER_URL}/api/stacks?method=string&type=2&endpointId={ENDPOINT_ID}",
            json=payload,
            headers=headers,
            timeout=60
        )
        
        if response.status_code == 200:
            stack_info = response.json()
            print(f"✅ Stack '{STACK_NAME}' deployed successfully!")
            print(f"📍 Stack ID: {stack_info.get('Id')}")
            return True
        else:
            print(f"❌ Stack deployment failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Deployment error: {e}")
        return False

def update_stack(token, stack_id, compose_content, env_vars):
    """Update an existing stack"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "StackFileContent": compose_content,
        "Env": env_vars,
        "Prune": False
    }
    
    try:
        response = requests.put(
            f"{PORTAINER_URL}/api/stacks/{stack_id}?endpointId={ENDPOINT_ID}",
            json=payload,
            headers=headers,
            timeout=60
        )
        
        if response.status_code == 200:
            print(f"✅ Stack '{STACK_NAME}' updated successfully!")
            return True
        else:
            print(f"❌ Stack update failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Update error: {e}")
        return False

def verify_deployment(token):
    """Verify the deployment by checking stack status"""
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(
            f"{PORTAINER_URL}/api/stacks",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            stacks = response.json()
            for stack in stacks:
                if stack.get("Name") == STACK_NAME:
                    status = stack.get("Status", 0)
                    print(f"📊 Stack Status: {status} (1=active, 2=inactive)")
                    
                    if status == 1:
                        print("✅ Stack is active and running")
                        print("🌐 Service URLs:")
                        print(f"   • Frontend:  http://192.168.86.97:3011")
                        print(f"   • Backend:   http://192.168.86.97:3121")
                        print(f"   • Weaviate:  http://192.168.86.97:8092")
                        return True
                    else:
                        print("⚠️ Stack is not active")
                        return False
            
            print(f"❌ Stack '{STACK_NAME}' not found after deployment")
            return False
        else:
            print(f"❌ Cannot verify deployment: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Verification error: {e}")
        return False

def main():
    print("🚀 Multi-IDE Rules Generator - Portainer Deployment")
    print("=" * 50)
    print(f"📍 Target: {PORTAINER_URL}")
    print(f"📦 Stack: {STACK_NAME}")
    print("")
    
    # Step 1: Authenticate
    print("🔐 Authenticating with Portainer...")
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed. Please check:")
        print("   • Portainer is accessible")
        print("   • Admin credentials are correct")
        return False
    print("✅ Authentication successful")
    
    # Step 2: Load docker-compose content
    print("📄 Loading Docker Compose configuration...")
    compose_content = load_docker_compose()
    if not compose_content:
        return False
    print("✅ Docker Compose loaded")
    
    # Step 3: Load environment variables
    print("🔧 Loading environment variables...")
    env_vars = load_environment_variables()
    print(f"✅ Loaded {len(env_vars)} environment variables")
    
    # Step 4: Deploy the stack
    print("🚢 Deploying stack to Portainer...")
    if not deploy_stack(token, compose_content, env_vars):
        return False
    
    # Step 5: Verify deployment
    print("🔍 Verifying deployment...")
    if verify_deployment(token):
        print("")
        print("🎉 DEPLOYMENT SUCCESSFUL!")
        print("📝 Next steps:")
        print("   1. Wait for services to start (may take 2-3 minutes)")
        print("   2. Check service health:")
        print("      curl http://192.168.86.97:3121/health")
        print("   3. Access the application:")
        print("      http://192.168.86.97:3011")
        return True
    else:
        print("⚠️ Deployment completed but verification failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)