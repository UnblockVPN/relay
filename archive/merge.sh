#!/bin/bash

# Directory containing JavaScript files
input_dir="./"

# Output JavaScript file
output_file="combined.dump"

# Concatenate all JavaScript files into the output file
cat "$input_dir"/*.js > "$output_file"

echo "JavaScript files have been combined into $output_file"
