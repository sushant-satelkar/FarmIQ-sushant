#!/bin/bash
# Quick test script for inference server

echo "Testing inference server health endpoint..."
curl http://localhost:8000/health

echo -e "\n\nTesting prediction endpoint..."
echo "Note: Replace /path/to/test_image.jpg with an actual image path"
curl -F "file=@/path/to/test_image.jpg" http://localhost:8000/predict

echo -e "\n\nDone!"

