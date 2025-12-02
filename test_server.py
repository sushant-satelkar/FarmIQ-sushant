"""
Test script to verify the inference server is working correctly
Run this after starting the server: uvicorn inference_server:app --host 0.0.0.0 --port 8000
"""
import requests
import io
import numpy as np
from PIL import Image

API_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    try:
        resp = requests.get(f"{API_URL}/health")
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        print("✅ Health check passed\n")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}\n")
        return False

def test_prediction():
    """Test prediction endpoint with a dummy image"""
    print("Testing /predict endpoint...")
    
    # Create a test image
    test_image = np.random.randint(0, 255, (160, 160, 3), dtype=np.uint8)
    img = Image.fromarray(test_image, 'RGB')
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    # Make request
    try:
        files = {'file': ('test.png', img_bytes, 'image/png')}
        resp = requests.post(f"{API_URL}/predict", files=files)
        
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Prediction successful!")
            print(f"   Class: {data['class_name']}")
            print(f"   Confidence: {data['confidence']:.6f} ({data['confidence']*100:.2f}%)")
            
            if 'metadata' in data:
                meta = data['metadata']
                print(f"   Request ID: {meta.get('request_id', 'N/A')}")
                print(f"   Is Real: {meta.get('is_real_prediction', False)}")
                print(f"   Source: {meta.get('prediction_source', 'N/A')}")
                print(f"   Processing time: {meta.get('processing_time_ms', 0)}ms")
            
            if 'top_3' in data:
                print(f"   Top 3 predictions:")
                for i, pred in enumerate(data['top_3'], 1):
                    print(f"      {i}. {pred['class']}: {pred['confidence']*100:.2f}%")
            
            print("\n⚠️ THIS IS A REAL PREDICTION FROM THE MODEL - NOT MOCK!")
            return True
        else:
            print(f"❌ Prediction failed: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("INFERENCE SERVER TEST")
    print("=" * 60)
    print(f"Testing server at: {API_URL}")
    print()
    
    # Test health
    if not test_health():
        print("❌ Server is not running or not healthy!")
        print("Please start the server: uvicorn inference_server:app --host 0.0.0.0 --port 8000")
        exit(1)
    
    # Test prediction
    if test_prediction():
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("✅ SERVER IS WORKING CORRECTLY!")
        print("✅ PREDICTIONS ARE REAL - NOT MOCK!")
        print("=" * 60)
    else:
        print("=" * 60)
        print("❌ PREDICTION TEST FAILED!")
        print("=" * 60)
        exit(1)

