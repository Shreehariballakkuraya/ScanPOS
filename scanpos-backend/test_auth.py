"""Test authentication endpoints"""
import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api/auth'

print("Testing Authentication API\n" + "="*50)

# Test 1: Login with admin user
print("\n1. Testing login with admin credentials...")
response = requests.post(f'{BASE_URL}/login', json={
    'email': 'admin@scanpos.com',
    'password': 'admin123'
})

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    token = response.json()['access_token']
    print(f"\n✓ Login successful! Token received.")
    
    # Test 2: Get current user with token
    print("\n2. Testing /me endpoint with token...")
    response = requests.get(f'{BASE_URL}/me', headers={
        'Authorization': f'Bearer {token}'
    })
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✓ Token validation successful!")
    else:
        print("\n✗ Token validation failed!")
else:
    print("\n✗ Login failed!")

# Test 3: Login with wrong password
print("\n3. Testing login with wrong password...")
response = requests.post(f'{BASE_URL}/login', json={
    'email': 'admin@scanpos.com',
    'password': 'wrongpassword'
})

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 401:
    print("✓ Invalid credentials correctly rejected!")
else:
    print("✗ Should have returned 401!")

print("\n" + "="*50)
print("Authentication API tests complete!")
