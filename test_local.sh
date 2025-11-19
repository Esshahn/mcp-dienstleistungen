#!/bin/bash

# Test script for local MCP server
echo "Testing Berlin Services MCP Server locally..."
echo ""
echo "Starting server... (press Ctrl+C to stop)"
echo "The server communicates via stdio, so you won't see much output here."
echo "To properly test, use the MCP Inspector (see below) or configure Claude Desktop."
echo ""

node build/index.js
