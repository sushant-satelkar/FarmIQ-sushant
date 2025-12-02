"""
Script to extract actual class names from the model
Run this to see what classes the model actually has
"""
import tensorflow as tf
import os

MODEL_PATH = "plant_disease_recog_model_pwp.keras"

if not os.path.exists(MODEL_PATH):
    print(f"Model not found at {MODEL_PATH}")
    exit(1)

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)

print(f"\nModel input shape: {model.input_shape}")
print(f"Model output shape: {model.output_shape}")
print(f"Number of output classes: {model.output_shape[1]}")

# Try to get class names from model metadata
print("\nChecking model metadata...")
if hasattr(model, 'class_names'):
    print(f"Model has class_names attribute: {model.class_names}")
elif hasattr(model, 'classes_'):
    print(f"Model has classes_ attribute: {model.classes_}")
else:
    print("Model doesn't have class names stored")

# Check model config
print("\nModel config keys:", model.get_config().keys() if hasattr(model, 'get_config') else "N/A")

# Make a test prediction to see output shape
import numpy as np
test_input = np.random.random((1, 160, 160, 3))
pred = model.predict(test_input, verbose=0)
print(f"\nTest prediction shape: {pred.shape}")
print(f"Number of classes in output: {pred.shape[1]}")

print("\n" + "="*60)
print("The model outputs", pred.shape[1], "classes")
print("But CLASS_NAMES has", 38, "items")
print("="*60)
print("\nYou need to add the missing class(es) to CLASS_NAMES array!")

