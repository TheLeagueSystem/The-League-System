#!/bin/bash
# Remove node_modules if it exists
rm -rf node_modules

# Remove package-lock.json if it exists
rm -f package-lock.json

# Install with --legacy-peer-deps flag
npm install --legacy-peer-deps

# Build the project
npm run build