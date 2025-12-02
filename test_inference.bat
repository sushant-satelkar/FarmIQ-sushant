@echo off
REM Quick test script for inference server (Windows)

echo Testing inference server health endpoint...
curl http://localhost:8000/health

echo.
echo.
echo Testing prediction endpoint...
echo Note: Replace C:\path\to\test_image.jpg with an actual image path
curl -F "file=@C:\path\to\test_image.jpg" http://localhost:8000/predict

echo.
echo.
echo Done!

