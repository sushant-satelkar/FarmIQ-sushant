"""
Crop Disease Detection Inference Server
REAL Keras Model Integration - NO MOCK DATA
"""
import os
import sys
import io
import time
import logging
import numpy as np
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import tensorflow as tf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# MODEL LOADING - CRITICAL SECTION
# ============================================================================
BASE_DIR = Path(__file__).parent.absolute()
MODEL_PATH = BASE_DIR / "plant_disease_recog_model_pwp.keras"

logger.info("=" * 70)
logger.info("CROP DISEASE DETECTION INFERENCE SERVER - STARTING")
logger.info("=" * 70)
logger.info(f"Working Directory: {os.getcwd()}")
logger.info(f"Script Directory: {BASE_DIR}")
logger.info(f"Model Path: {MODEL_PATH}")
logger.info(f"Model Exists: {MODEL_PATH.exists()}")

# Verify model file exists
if not MODEL_PATH.exists():
    logger.error("=" * 70)
    logger.error("❌ CRITICAL ERROR: MODEL FILE NOT FOUND!")
    logger.error(f"   Expected at: {MODEL_PATH}")
    logger.error(f"   Current directory: {os.getcwd()}")
    logger.error("=" * 70)
    sys.exit(1)

logger.info(f"Model File Size: {MODEL_PATH.stat().st_size / (1024*1024):.2f} MB")

# Load the Keras model
logger.info("")
logger.info("Loading Keras Model...")
logger.info("-" * 70)

try:
    # Load model with explicit path
    logger.info(f"Calling tf.keras.models.load_model('{MODEL_PATH}')...")
    model = tf.keras.models.load_model(str(MODEL_PATH), compile=False)
    
    logger.info("✅ MODEL LOADED SUCCESSFULLY!")
    logger.info(f"   Model Type: {type(model)}")
    logger.info(f"   Input Shape: {model.input_shape}")
    logger.info(f"   Output Shape: {model.output_shape}")
    
    # Get model details
    num_classes = model.output_shape[1] if model.output_shape else None
    logger.info(f"   Number of Classes: {num_classes}")
    
    # Test model with dummy input to verify it works
    logger.info("")
    logger.info("Testing model with dummy input...")
    test_input = np.random.random((1, 160, 160, 3)).astype(np.float32)
    test_output = model.predict(test_input, verbose=0)
    logger.info(f"   Test Input Shape: {test_input.shape}")
    logger.info(f"   Test Output Shape: {test_output.shape}")
    logger.info(f"   Test Output Sum: {np.sum(test_output):.6f}")
    logger.info("✅ Model test prediction successful!")
    
except Exception as e:
    logger.error("=" * 70)
    logger.error("❌ CRITICAL ERROR: FAILED TO LOAD MODEL!")
    logger.error(f"   Error: {str(e)}")
    logger.error("=" * 70)
    import traceback
    traceback.print_exc()
    sys.exit(1)

logger.info("-" * 70)
logger.info("")

# ============================================================================
# CLASS NAMES DEFINITION
# ============================================================================
CLASS_NAMES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Background_without_leaves',
    'Blueberry___healthy',
    'Cherry___Powdery_mildew',
    'Cherry___healthy',
    'Corn___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn___Common_rust',
    'Corn___Northern_Leaf_Blight',
    'Corn___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# Verify class count
if num_classes and len(CLASS_NAMES) != num_classes:
    logger.warning(f"⚠️ Class count mismatch: Model={num_classes}, List={len(CLASS_NAMES)}")
    if num_classes > len(CLASS_NAMES):
        for i in range(num_classes - len(CLASS_NAMES)):
            CLASS_NAMES.append(f"Unknown_Class_{len(CLASS_NAMES) + 1}")
    else:
        CLASS_NAMES = CLASS_NAMES[:num_classes]

logger.info(f"✅ Configured {len(CLASS_NAMES)} classes")
logger.info("=" * 70)
logger.info("")

# ============================================================================
# IMAGE PREPROCESSING
# ============================================================================
TARGET_SIZE = (160, 160)

# CRITICAL: Use EfficientNet preprocessing (same as training)
# The model was trained with: tf.keras.applications.efficientnet.preprocess_input
preprocess_input = tf.keras.applications.efficientnet.preprocess_input

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess image for model input
    Uses EfficientNet preprocessing (same as training) - NOT simple [0,1] normalization!
    """
    try:
        # Open image
        img = Image.open(io.BytesIO(image_bytes))
        logger.info(f"   Original image: {img.size}, mode: {img.mode}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
            logger.info(f"   Converted to RGB")
        
        # Resize to model input size
        img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        logger.info(f"   Resized to: {TARGET_SIZE}")
        
        # Convert to numpy array (uint8, 0-255 range)
        img_array = np.array(img, dtype=np.uint8)
        logger.info(f"   Array shape: {img_array.shape}, dtype: {img_array.dtype}")
        logger.info(f"   Value range (before preprocessing): [{img_array.min()}, {img_array.max()}]")
        
        # CRITICAL: Apply EfficientNet preprocessing (same as training)
        # This converts to float32 and applies ImageNet normalization [-1, 1] range
        img_array = preprocess_input(img_array)
        logger.info(f"   Value range (after EfficientNet preprocessing): [{img_array.min():.3f}, {img_array.max():.3f}]")
        logger.info(f"   Array dtype (after preprocessing): {img_array.dtype}")
        
        # Log image statistics to verify it's different for each request
        logger.info(f"   Image statistics:")
        logger.info(f"      Mean: {np.mean(img_array):.6f}")
        logger.info(f"      Std: {np.std(img_array):.6f}")
        logger.info(f"      Unique values: {len(np.unique(img_array))}")
        
        # Log a hash of the image to verify different images
        import hashlib
        img_hash = hashlib.md5(img_array.tobytes()).hexdigest()[:8]
        logger.info(f"   Image array hash (first 8 chars): {img_hash}")
        
        # Add batch dimension: (160, 160, 3) -> (1, 160, 160, 3)
        img_array = np.expand_dims(img_array, axis=0)
        logger.info(f"   Final shape with batch: {img_array.shape}")
        
        # Verify the input is not all zeros or all same values
        if np.all(img_array == 0):
            logger.warning("   ⚠️ WARNING: Input image is all zeros!")
        elif len(np.unique(img_array)) < 10:
            logger.warning(f"   ⚠️ WARNING: Input has very few unique values: {len(np.unique(img_array))}")
        
        return img_array
        
    except Exception as e:
        logger.error(f"❌ Image preprocessing error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================
app = FastAPI(
    title="Crop Disease Detection API",
    description="Real-time plant disease detection using Keras deep learning model",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PREDICTION ENDPOINT
# ============================================================================
@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Predict plant disease from uploaded image
    Uses REAL Keras model - NO MOCK DATA
    """
    request_id = f"REQ_{int(time.time() * 1000)}"
    start_time = time.time()
    
    logger.info("")
    logger.info("=" * 70)
    logger.info(f"📥 NEW PREDICTION REQUEST: {request_id}")
    logger.info(f"   File: {file.filename}")
    logger.info(f"   Content Type: {file.content_type}")
    logger.info("-" * 70)
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.error(f"❌ Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Step 1: Read image bytes
        logger.info("Step 1: Reading image bytes...")
        image_bytes = await file.read()
        logger.info(f"   ✅ Read {len(image_bytes)} bytes")
        
        # Step 2: Preprocess image
        logger.info("Step 2: Preprocessing image...")
        processed_image = preprocess_image(image_bytes)
        logger.info(f"   ✅ Preprocessed: {processed_image.shape}")
        
        # Step 3: Make prediction using REAL model
        logger.info("Step 3: Making prediction with Keras model...")
        logger.info("   ⚠️ CALLING model.predict() - THIS IS THE REAL MODEL!")
        logger.info("   ⚠️ NOT USING MOCK DATA!")
        
        prediction_start = time.time()
        
        # CRITICAL: This is the actual model prediction
        # Use predict_on_batch for more control, or ensure we're not caching
        predictions = model.predict(processed_image, verbose=0)
        
        prediction_time = time.time() - prediction_start
        
        logger.info(f"   ✅ Prediction completed in {prediction_time:.3f}s")
        logger.info(f"   Prediction shape: {predictions.shape}")
        logger.info(f"   Prediction array length: {len(predictions[0])}")
        logger.info(f"   Prediction dtype: {predictions.dtype}")
        
        # Step 4: Process prediction results
        logger.info("Step 4: Processing prediction results...")
        pred_array = predictions[0].copy()  # Make a copy to avoid any reference issues
        
        # Check if predictions are logits (need softmax) or probabilities
        # If sum is close to 1, they're already probabilities
        pred_sum = np.sum(pred_array)
        logger.info(f"   Prediction sum (before processing): {pred_sum:.6f}")
        
        # If sum is not close to 1, apply softmax
        if abs(pred_sum - 1.0) > 0.01:
            logger.info("   Applying softmax (predictions appear to be logits)...")
            # Apply softmax
            exp_preds = np.exp(pred_array - np.max(pred_array))  # Subtract max for numerical stability
            pred_array = exp_preds / np.sum(exp_preds)
            logger.info(f"   Prediction sum (after softmax): {np.sum(pred_array):.6f}")
        else:
            logger.info("   Predictions already appear to be probabilities (sum ≈ 1)")
        
        # Log prediction array details for debugging
        logger.info(f"   Prediction array sum: {np.sum(pred_array):.6f}")
        logger.info(f"   Prediction array min: {np.min(pred_array):.6f}")
        logger.info(f"   Prediction array max: {np.max(pred_array):.6f}")
        logger.info(f"   Prediction array mean: {np.mean(pred_array):.6f}")
        
        # Log top 5 predictions for debugging
        top_5_indices = np.argsort(pred_array)[-5:][::-1]
        logger.info("   Top 5 predictions (for debugging):")
        for i, idx in enumerate(top_5_indices, 1):
            if idx < len(CLASS_NAMES):
                logger.info(f"      {i}. Index {idx}: {CLASS_NAMES[idx]} = {pred_array[idx]:.6f}")
        
        # Validate prediction
        if np.isnan(pred_array).any():
            logger.error("   ❌ Prediction contains NaN!")
            raise HTTPException(status_code=500, detail="Model prediction failed: NaN values")
        
        if np.isinf(pred_array).any():
            logger.error("   ❌ Prediction contains Inf!")
            raise HTTPException(status_code=500, detail="Model prediction failed: Inf values")
        
        # Check if all predictions are the same (model might be broken)
        unique_values = len(np.unique(pred_array))
        if unique_values == 1:
            logger.error("   ❌ ALL PREDICTIONS ARE THE SAME! Model might be broken!")
            logger.error(f"   All values are: {pred_array[0]}")
            raise HTTPException(status_code=500, detail="Model prediction failed: All predictions are identical")
        
        # Get top prediction
        top_idx = int(np.argmax(pred_array))
        top_confidence = float(pred_array[top_idx])
        
        # Ensure valid index
        if top_idx >= len(CLASS_NAMES):
            logger.warning(f"   ⚠️ Index {top_idx} >= {len(CLASS_NAMES)}, adjusting...")
            valid_preds = pred_array[:len(CLASS_NAMES)]
            top_idx = int(np.argmax(valid_preds))
            top_confidence = float(valid_preds[top_idx])
        
        class_name = CLASS_NAMES[top_idx]
        
        logger.info(f"   ✅ Top prediction: Index={top_idx}, Class={class_name}, Confidence={top_confidence:.6f}")
        
        # Log input image hash to verify different images are being processed
        import hashlib
        image_hash = hashlib.md5(image_bytes).hexdigest()[:8]
        logger.info(f"   Image hash (first 8 chars): {image_hash}")
        
        # Get top 3
        top_3_indices = np.argsort(pred_array[:len(CLASS_NAMES)])[-3:][::-1]
        top_3_predictions = [
            {
                "class": CLASS_NAMES[i],
                "confidence": float(pred_array[i])
            }
            for i in top_3_indices
        ]
        
        # Step 5: Create response
        total_time = time.time() - start_time
        response = {
            "class_name": class_name,
            "confidence": top_confidence,
            "top_3": top_3_predictions,
            "metadata": {
                "request_id": request_id,
                "timestamp": time.time(),
                "processing_time_ms": round(total_time * 1000, 2),
                "prediction_time_ms": round(prediction_time * 1000, 2),
                "model_file": "plant_disease_recog_model_pwp.keras",
                "model_input_shape": str(processed_image.shape),
                "model_output_shape": str(predictions.shape),
                "is_real_prediction": True,
                "prediction_source": "keras_model"
            }
        }
        
        logger.info("")
        logger.info("=" * 70)
        logger.info(f"✅ PREDICTION SUCCESSFUL!")
        logger.info(f"   Class: {class_name}")
        logger.info(f"   Confidence: {top_confidence:.6f} ({top_confidence*100:.2f}%)")
        logger.info(f"   Total Time: {total_time:.3f}s")
        logger.info(f"   ⚠️ THIS IS REAL PREDICTION FROM KERAS MODEL - NOT MOCK!")
        logger.info("=" * 70)
        
        # Return response
        json_response = JSONResponse(content=response)
        json_response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        json_response.headers["Pragma"] = "no-cache"
        json_response.headers["Expires"] = "0"
        json_response.headers["X-Prediction-Source"] = "keras-model"
        json_response.headers["X-Request-ID"] = request_id
        
        return json_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("")
        logger.error("=" * 70)
        logger.error(f"❌ PREDICTION ERROR: {str(e)}")
        logger.error("=" * 70)
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
        "model_input_shape": str(model.input_shape) if model else None,
        "model_output_shape": str(model.output_shape) if model else None,
        "num_classes": len(CLASS_NAMES),
        "target_image_size": TARGET_SIZE,
        "server_time": time.time(),
        "message": "Model is loaded and ready for REAL predictions"
    }

# ============================================================================
# ROOT ENDPOINT
# ============================================================================
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Crop Disease Detection API",
        "version": "2.0.0",
        "status": "running",
        "model_loaded": model is not None,
        "endpoints": {
            "predict": "/predict (POST)",
            "health": "/health (GET)"
        },
        "model": {
            "loaded": model is not None,
            "file": "plant_disease_recog_model_pwp.keras",
            "classes": len(CLASS_NAMES),
            "input_shape": str(model.input_shape) if model else None,
            "output_shape": str(model.output_shape) if model else None
        }
    }

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    logger.info("")
    logger.info("=" * 70)
    logger.info("Starting FastAPI server...")
    logger.info("Server will be available at: http://0.0.0.0:8000")
    logger.info("=" * 70)
    logger.info("")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
