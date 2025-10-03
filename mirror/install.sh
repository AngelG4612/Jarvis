#!/bin/bash

# MagicMirror Installation and Setup Script
# This script automates the MagicMirror setup process for the J.A.R.V.I.S. project
# MagicMirror is integrated as part of this project and can be modified independently

set -e  # Exit on any error

echo "🪞 Starting MagicMirror setup for J.A.R.V.I.S..."

# Check if MagicMirror directory exists
if [ ! -d "MagicMirror" ]; then
    echo "❌ MagicMirror directory not found. This should not happen as MagicMirror is part of this project."
    echo "Please ensure you're running this script from the mirror/ directory of the J.A.R.V.I.S. project."
    exit 1
fi

# Enter the MagicMirror repository
echo "📁 Entering MagicMirror directory..."
cd MagicMirror

# Install the application
echo "📦 Installing MagicMirror dependencies..."
npm run install-mm

# Make a copy of the config sample file
echo "⚙️ Creating configuration file from sample..."
if [ ! -f "config/config.js" ]; then
    cp config/config.js.sample config/config.js
    echo "✅ Configuration file created successfully"
else
    echo "⚠️ Configuration file already exists, skipping copy"
fi

echo "🎉 MagicMirror setup completed successfully!"
echo ""
echo "To start MagicMirror, run:"
echo "cd MagicMirror && npm run start"
echo ""
echo "Or run this script with 'start' argument to launch immediately:"
echo "$0 start"

# Check if 'start' argument was provided
if [ "$1" = "start" ]; then
    echo ""
    echo "🚀 Starting MagicMirror..."
    npm run start
fi
