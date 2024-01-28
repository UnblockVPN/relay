#!/bin/bash
# Update server by cloning the current configuration on gh then stop and start the daemon
# Author: David Awatere
# update.sh

# Define the URLs and paths
repository_url="https://github.com/UnblockVPN/relay"
app_directory="/home/unblockvpnio"
clone_directory="/home/unblockvpnio/tmp"
app_name="wgEventHandler.js"  # Change this to match the name in your pm2.config.js

# Copy this script to a temporary location
cat "$0" > "$clone_directory/update.sh"

# Clone the Git repository
git clone "$repository_url" "$clone_directory"

# Check if the clone was successful
if [ $? -eq 0 ]; then
  echo "Git clone successful."
  
  # Copy the files to the app folder
  cp -r "$clone_directory"/* "$app_directory"
  
  # Check if the copy was successful
  if [ $? -eq 0 ]; then
    echo "Files copied to app folder."
    
    # Delete the temporary directory
    rm -rf "$clone_directory"
    echo "Temporary directory deleted."
    
    # Stop the PM2 process
    sudo pm2 stop "$app_name"
    echo "PM2 process stopped."
    
    # Start the PM2 process
    sudo pm2 start "$app_name" --watch --log --env production
    echo "PM2 process started."

    # Show information about the PM2 process
    sudo pm2 show 0

  else
    echo "Error: Failed to copy files to app folder."
  fi
else
  echo "Error: Git clone failed."
fi