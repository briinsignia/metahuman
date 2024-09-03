#!/bin/bash

# Define Docker image name
image_name="metahuman_webapp"

# Build Docker image
docker build --no-cache -t $image_name .