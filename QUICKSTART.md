# Quick Start Guide

## Testing Locally First (Recommended)

Before publishing or using with Claude Desktop, test the server locally:

### Option 1: Test with MCP Inspector

The MCP Inspector lets you interact with the server and test all tools:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This will open a web interface where you can:
- See all available tools
- Test search_services, get_service_details, etc.
- View responses in real-time

### Option 2: Configure Claude Desktop Locally

Use the local build instead of npx:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "berlin-services": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/mcp-dienstleistungen/build/index.js"
      ]
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/mcp-dienstleistungen` with your actual path (use `pwd` to get it).

---

## Using with npx (After Publishing)

Once published to npm, the setup becomes even simpler:

### Configure Claude Desktop (2 steps)

### Step 1: Find your config file

- **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

### Step 2: Add to Claude config

Edit the config file and add:

```json
{
  "mcpServers": {
    "berlin-services": {
      "command": "npx",
      "args": [
        "-y",
        "@ingohinterding/berlin-services-mcp"
      ]
    }
  }
}
```

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop.

That's it! No paths, no installations, no setup.

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

## Development Installation (Optional)

Only needed if you want to modify the code:

```bash
git clone https://github.com/yourusername/berlin-services-mcp.git
cd berlin-services-mcp
npm install
npm run build
```

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx -y @ingohinterding/berlin-services-mcp
```

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
