"""
Test script to verify model integration in inference_server.py
"""
import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

print("=" * 70)
print("TESTING MODEL INTEGRATION")
print("=" * 70)
print()

# Test 1: Check if model file exists
print("Test 1: Checking model file...")
MODEL_PATH = Path("plant_disease_recog_model_pwp.keras")
if MODEL_PATH.exists():
    print(f"   [OK] Model file exists: {MODEL_PATH}")
    print(f"   Size: {MODEL_PATH.stat().st_size / (1024*1024):.2f} MB")
else:
    print(f"   [ERROR] Model file NOT found: {MODEL_PATH}")
    sys.exit(1)

print()

# Test 2: Try importing inference_server
print("Test 2: Importing inference_server module...")
try:
    import inference_server
    print("   [OK] inference_server imported successfully")
    print(f"   Model loaded: {inference_server.model is not None}")
    print(f"   Model type: {type(inference_server.model)}")
    if inference_server.model:
        print(f"   Input shape: {inference_server.model.input_shape}")
        print(f"   Output shape: {inference_server.model.output_shape}")
except Exception as e:
    print(f"   [ERROR] Failed to import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Test 3: Test model prediction
print("Test 3: Testing model prediction...")
try:
    import numpy as np
    test_input = np.random.random((1, 160, 160, 3)).astype(np.float32)
    print(f"   Test input shape: {test_input.shape}")
    
    predictions = inference_server.model.predict(test_input, verbose=0)
    print(f"   [OK] Prediction successful!")
    print(f"   Output shape: {predictions.shape}")
    print(f"   Output sum: {np.sum(predictions):.6f}")
    
    # Get top prediction
    top_idx = int(np.argmax(predictions[0]))
    top_conf = float(predictions[0][top_idx])
    class_name = inference_server.CLASS_NAMES[top_idx] if top_idx < len(inference_server.CLASS_NAMES) else "Unknown"
    
    print(f"   Top prediction: {class_name} (confidence: {top_conf:.6f})")
    
except Exception as e:
    print(f"   [ERROR] Prediction failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print("=" * 70)
print("[OK] ALL TESTS PASSED!")
print("[OK] MODEL INTEGRATION IS WORKING CORRECTLY!")
print("=" * 70)

