#!/bin/bash

# This script automates the build process by fetching the package from GitHub and running the build.sh script.
# Run this script as sudo to ensure all necessary permissions.

# Variables
REPO_URL="https://github.com/UnblockVPN/relay"
CLONE_DIR="/opt/relay"
BUILD_SCRIPT="build.sh"

# Ensure the script is running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" >&2
    exit 1
fi

# Update package lists and install git
echo "Updating package lists..."
sudo apt-get update
echo "Installing git..."
sudo apt-get install -y git

# Clone the GitHub repository
if [ ! -d "$CLONE_DIR" ]; then
    echo "Cloning the repository from $REPO_URL to $CLONE_DIR..."
    sudo git clone "$REPO_URL" "$CLONE_DIR"
else
    echo "Repository already cloned. Pulling the latest changes..."
    cd "$CLONE_DIR"
    sudo git pull
fi

# Change to the repository directory
cd "$CLONE_DIR"

# Check if the build script exists
if [ ! -f "$BUILD_SCRIPT" ]; then
    echo "Error: $BUILD_SCRIPT not found in $CLONE_DIR!" >&2
    exit 1
fi

# Make the build script executable
echo "Setting execute permissions on $BUILD_SCRIPT..."
sudo chmod +x "$BUILD_SCRIPT"

# Run the build script
echo "Running $BUILD_SCRIPT..."
sudo ./"$BUILD_SCRIPT"

echo "Build process completed."
