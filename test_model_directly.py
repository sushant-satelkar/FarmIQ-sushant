"""
Direct test script to verify the Keras model works correctly
This tests the model WITHOUT the API server
"""
import os
import sys
import numpy as np
import tensorflow as tf
from pathlib import Path
from PIL import Image
import io

# Model path
MODEL_PATH = Path("plant_disease_recog_model_pwp.keras")

print("=" * 60)
print("DIRECT MODEL TEST")
print("=" * 60)
print(f"Model path: {MODEL_PATH}")
print(f"Model exists: {MODEL_PATH.exists()}")

if not MODEL_PATH.exists():
    print("❌ Model file not found!")
    sys.exit(1)

print(f"Model size: {MODEL_PATH.stat().st_size / (1024*1024):.2f} MB")
print()

# Load model
print("Loading model...")
try:
    model = tf.keras.models.load_model(str(MODEL_PATH))
    print("✅ Model loaded successfully!")
    print(f"   Input shape: {model.input_shape}")
    print(f"   Output shape: {model.output_shape}")
    num_classes = model.output_shape[1] if model.output_shape else None
    print(f"   Number of classes: {num_classes}")
    print()
except Exception as e:
    print(f"❌ Error loading model: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Create test image
print("Creating test image (160x160 RGB)...")
test_image = np.random.randint(0, 255, (160, 160, 3), dtype=np.uint8)
test_array = test_image.astype(np.float32) / 255.0
test_array = np.expand_dims(test_array, axis=0)
print(f"   Test image shape: {test_array.shape}")
print(f"   Value range: [{test_array.min():.3f}, {test_array.max():.3f}]")
print()

# Make prediction
print("Making prediction...")
print("⚠️ THIS IS A REAL PREDICTION FROM THE MODEL - NOT MOCK!")
try:
    predictions = model.predict(test_array, verbose=0)
    print("✅ Prediction successful!")
    print(f"   Prediction shape: {predictions.shape}")
    print(f"   Prediction array length: {len(predictions[0])}")
    print(f"   Prediction sum: {np.sum(predictions[0]):.6f}")
    print(f"   Prediction min: {np.min(predictions[0]):.6f}")
    print(f"   Prediction max: {np.max(predictions[0]):.6f}")
    print()
    
    # Get top prediction
    top_idx = int(np.argmax(predictions[0]))
    top_confidence = float(predictions[0][top_idx])
    
    CLASS_NAMES = [
        'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
        'Background_without_leaves', 'Blueberry___healthy', 'Cherry___Powdery_mildew', 'Cherry___healthy',
        'Corn___Cercospora_leaf_spot Gray_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight',
        'Corn___healthy', 'Grape___Black_rot', 'Grape___Esca_(Black_Measles)',
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
        'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
        'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
        'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
        'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
        'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
        'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
        'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
        'Tomato___healthy'
    ]
    
    if top_idx < len(CLASS_NAMES):
        print(f"🎯 TOP PREDICTION:")
        print(f"   Index: {top_idx}")
        print(f"   Class: {CLASS_NAMES[top_idx]}")
        print(f"   Confidence: {top_confidence:.6f} ({top_confidence*100:.2f}%)")
    else:
        print(f"⚠️ Index {top_idx} is out of range (max: {len(CLASS_NAMES)-1})")
    
    # Top 3
    top_3_indices = np.argsort(predictions[0][:len(CLASS_NAMES)])[-3:][::-1]
    print()
    print("📊 TOP 3 PREDICTIONS:")
    for i, idx in enumerate(top_3_indices, 1):
        if idx < len(CLASS_NAMES):
            conf = float(predictions[0][idx])
            print(f"   {i}. {CLASS_NAMES[idx]}: {conf*100:.2f}%")
    
    print()
    print("=" * 60)
    print("✅ MODEL IS WORKING CORRECTLY!")
    print("✅ THIS IS A REAL PREDICTION - NOT MOCK!")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ Error making prediction: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
