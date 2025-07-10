#!/bin/bash

# Install all supported MCP servers for Claude Code
# Run this script to quickly set up essential MCP capabilities

echo "Installing MCP servers for Claude Code..."

# Install Sequential Thinking MCP
echo "Installing Sequential Thinking MCP..."
claude mcp add sequential-thinking -s user -- npx -y @modelcontextprotocol/server-sequential-thinking

# Install Filesystem MCP (customize directories as needed)
echo "Installing Filesystem MCP..."
claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem ~/Documents ~/Desktop ~/Downloads ~/Projects

# Install Puppeteer MCP for browser automation
echo "Installing Puppeteer MCP..."
claude mcp add puppeteer -s user -- npx -y @modelcontextprotocol/server-puppeteer

# Install Web Fetching MCP
echo "Installing Web Fetching MCP..."
claude mcp add fetch -s user -- npx -y @modelcontextprotocol/server-fetch

# Install Git MCP for version control
echo "Installing Git MCP..."
claude mcp add git -s user -- npx -y @modelcontextprotocol/server-git

# Install Time MCP for date/time operations
echo "Installing Time MCP..."
claude mcp add time -s user -- npx -y @modelcontextprotocol/server-time

echo "Installation complete! Run 'claude mcp' to verify all servers are connected."
echo "You can now use these MCP servers in Claude Code."