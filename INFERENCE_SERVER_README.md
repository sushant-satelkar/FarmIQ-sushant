# Crop Disease Inference Server

FastAPI server for real-time crop disease prediction using a trained Keras model.

## Setup

### 1. Create Virtual Environment (if not already created)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Verify Model File

Ensure `plant_disease_recog_model_pwp.keras` exists in the project root directory.

### 4. Run the Server

```bash
uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on `http://localhost:8000`

## API Endpoints

### POST `/predict`

Predicts crop disease from an uploaded image.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing an image file

**Response:**
```json
{
  "class_name": "Tomato___Late_blight",
  "confidence": 0.87
}
```

**Example using curl:**
```bash
curl -F "file=@/path/to/sample_leaf.jpg" http://localhost:8000/predict
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

## Frontend Integration

The frontend (Vite app) is configured to call this API at `http://localhost:8000/predict`.

To change the API URL, set the environment variable:
```bash
VITE_PREDICTION_API_URL=http://your-api-url:8000
```

## Troubleshooting

### Model Load Errors

- Ensure `plant_disease_recog_model_pwp.keras` exists in the project root
- Check file permissions
- Verify the model file is not corrupted

### CORS Errors

If you see CORS errors in the browser console, add your frontend origin to `ALLOWED_ORIGINS` in `inference_server.py`:

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://your-production-domain.com"  # Add production URL
]
```

### Preprocessing Mismatch

If predictions seem incorrect:
- Verify `TARGET_SIZE` matches training (default: 224x224)
- Check normalization matches training preprocessing
- Ensure `CLASS_NAMES` order matches training label order

### Memory Issues

The Keras model is ~200MB. Ensure your server has sufficient RAM:
- Minimum: 2GB RAM
- Recommended: 4GB+ RAM

For production, consider:
- Using `--reload` only in development
- Running on a dedicated server with adequate resources
- Using model quantization to reduce memory footprint

## Production Deployment

1. Remove `--reload` flag in production
2. Use a production ASGI server like Gunicorn with Uvicorn workers:
   ```bash
   gunicorn inference_server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```
3. Set up proper CORS origins for production
4. Use environment variables for configuration
5. Add proper logging and monitoring
6. Consider using a reverse proxy (nginx) for SSL termination

## Testing

### Manual Test Steps

1. Start the inference server:
   ```bash
   uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload
   ```

2. Test with curl:
   ```bash
   curl -F "file=@/path/to/test_image.jpg" http://localhost:8000/predict
   ```

3. Expected response:
   ```json
   {"class_name":"Tomato___Late_blight","confidence":0.87}
   ```

4. Start the frontend dev server:
   ```bash
   npm run dev
   ```

5. Navigate to the Crop Disease Detection page
6. Upload a test image
7. Verify the prediction appears correctly

## Class Names

The model supports 38 classes including:
- Apple diseases (scab, black rot, cedar apple rust, healthy)
- Corn diseases (gray leaf spot, common rust, northern leaf blight, healthy)
- Grape diseases (black rot, esca, leaf blight, healthy)
- Tomato diseases (bacterial spot, early blight, late blight, leaf mold, etc.)
- And more...

See `inference_server.py` for the complete list of `CLASS_NAMES`.

