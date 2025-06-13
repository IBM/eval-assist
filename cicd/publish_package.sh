#!/bin/bash

# Navigate to the backend directory
cd ../backend

# Activate the virtual environment
source venv/bin/activate

# Build the package
python -m build

# Upload to Test PyPI
twine upload --repository testpypi dist/*
