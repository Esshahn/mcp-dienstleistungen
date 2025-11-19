# Quick Start Guide

## Installation (3 steps)

```bash
# 1. Clone the repository
git clone https://github.com/ingohinterding/berlin-services-mcp.git
cd berlin-services-mcp

# 2. Install dependencies
npm install

# 3. Build the project
npm run build
```

## Configure Claude Desktop

### Step 1: Get the absolute path

In the berlin-services-mcp directory, run:
```bash
pwd
```

Copy the output (e.g., `/Users/yourname/berlin-services-mcp`)

### Step 2: Find your Claude config file

- **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

### Step 3: Add to Claude config

Edit the config file and add:

```json
{
  "mcpServers": {
    "berlin-services": {
      "command": "node",
      "args": [
        "/PASTE/YOUR/PATH/HERE/berlin-services-mcp/build/index.js"
      ]
    }
  }
}
```

**Example** (replace with your actual path):
```json
{
  "mcpServers": {
    "berlin-services": {
      "command": "node",
      "args": [
        "/Users/ingohinterding/github/berlin-services-mcp/build/index.js"
      ]
    }
  }
}
```

### Step 4: Restart Claude Desktop

Completely quit and restart Claude Desktop (Cmd+Q on Mac).

That's it!

## Try It Out!

Ask Claude:
- "Search for services related to Anmeldung"
- "What are the requirements for registering my address in Berlin?"
- "Show me services about passport"
- "How do I apply for a residence permit?"

## Troubleshooting

### Server not appearing in Claude?

1. Make sure the JSON in config file is valid (check for missing commas)
2. Restart Claude Desktop completely (Cmd+Q on Mac)
3. Check Claude Desktop logs for errors

### Want to see debug output?

Look at Claude Desktop's logs:
- **MacOS**: `~/Library/Logs/Claude/`
- **Windows**: `%APPDATA%/Claude/logs/`

---

## Testing with MCP Inspector (Optional)

To test the server interactively before using with Claude:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This opens a web interface where you can:
- See all 4 available tools
- Test them with different inputs
- View responses in real-time

## Example Conversation

**You:** "Search for services about Anmeldung"

**Claude:** (Uses the `search_services` tool)
```
Found 5 service(s) matching 'Anmeldung':

**Anmeldung einer Wohnung**
ID: 120686
Fees: keine
Description: Sie beziehen eine Wohnung in Berlin...
```

**You:** "Tell me more about service 120686"

**Claude:** (Uses the `get_service_details` tool)
```
# Anmeldung einer Wohnung

**URL:** https://service.berlin.de/dienstleistung/120686/

## Description
[Detailed information about the service]

## Requirements
[List of requirements]

## Forms
[Available forms and links]
```

---

**That's all you need!** The npx approach makes this as simple as possible.
