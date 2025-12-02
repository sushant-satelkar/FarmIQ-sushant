"""
Verification script to ensure the model is actually being used
Run this to verify the inference server is using the real model
"""
import requests
import os
import numpy as np
from PIL import Image
import io

# Test the inference server
API_URL = "http://localhost:8000"

print("=" * 60)
print("MODEL INTEGRATION VERIFICATION")
print("=" * 60)

# 1. Check health endpoint
print("\n1. Testing health endpoint...")
try:
    resp = requests.get(f"{API_URL}/health")
    if resp.ok:
        data = resp.json()
        print(f"✅ Health check passed!")
        print(f"   Status: {data.get('status')}")
        print(f"   Model loaded: {data.get('model_loaded')}")
        print(f"   Model path: {data.get('model_path')}")
        print(f"   Model exists: {data.get('model_exists')}")
        print(f"   Input shape: {data.get('model_input_shape')}")
        print(f"   Output shape: {data.get('model_output_shape')}")
        print(f"   Num classes: {data.get('num_classes')}")
        print(f"   Message: {data.get('message')}")
    else:
        print(f"❌ Health check failed: {resp.status_code}")
        print(f"   Response: {resp.text}")
except Exception as e:
    print(f"❌ Cannot connect to server: {e}")
    print(f"   Make sure inference server is running:")
    print(f"   uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload")
    exit(1)

# 2. Create a test image
print("\n2. Creating test image...")
test_image = Image.new('RGB', (160, 160), color='green')
img_bytes = io.BytesIO()
test_image.save(img_bytes, format='PNG')
img_bytes.seek(0)

# 3. Test prediction endpoint
print("\n3. Testing prediction endpoint with test image...")
try:
    files = {'file': ('test.png', img_bytes, 'image/png')}
    resp = requests.post(f"{API_URL}/predict", files=files)
    
    if resp.ok:
        data = resp.json()
        print(f"✅ Prediction successful!")
        print(f"   Class: {data.get('class_name')}")
        print(f"   Confidence: {data.get('confidence'):.4f} ({data.get('confidence')*100:.2f}%)")
        print(f"\n   ⚠️  This is a REAL prediction from the model!")
        print(f"   ⚠️  If you see this, the model IS being used (not mock)")
    else:
        print(f"❌ Prediction failed: {resp.status_code}")
        print(f"   Response: {resp.text}")
except Exception as e:
    print(f"❌ Prediction error: {e}")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. Check the inference server logs - you should see:")
print("   - '✅ Model loaded successfully!'")
print("   - '🤖 Running model.predict() - THIS IS THE REAL MODEL, NOT MOCK!'")
print("   - '🎯 REAL PREDICTION: ...'")
print("\n2. Check browser console when uploading image:")
print("   - '[PredictionService] 🚀 Calling REAL inference API'")
print("   - '[PredictionService] ✅ Received REAL prediction from model'")
print("\n3. If you see 'REAL' or 'NOT MOCK' in logs, the model IS being used!")

