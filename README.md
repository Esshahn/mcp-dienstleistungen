# Berlin Services MCP Server

A Model Context Protocol (MCP) server that provides access to Berlin's administrative services (Dienstleistungen) data. This server allows AI assistants like Claude to search and retrieve information about over 1,000 public services offered by Berlin authorities.

## Features

- **Search Services**: Search for services by name or description
- **Service Details**: Get comprehensive information about specific services including:
  - Requirements and prerequisites
  - Fees and processing times
  - Required forms and documents
  - Online processing options
  - Appointment booking links
  - Responsible authorities
  - Legal references
- **List Services**: Browse all available services
- **Statistics**: Get dataset information and statistics

## Installation

### Clone and Setup (3 steps)

```bash
# 1. Clone the repository
git clone https://github.com/ingohinterding/berlin-services-mcp.git
cd berlin-services-mcp

# 2. Install dependencies
npm install

# 3. Build the project
npm run build
```

That's it! The server is now ready to use.

## Usage

### With Claude Desktop

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "berlin-services": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/berlin-services-mcp/build/index.js"
      ]
    }
  }
}
```

**Important**: Replace `/ABSOLUTE/PATH/TO/berlin-services-mcp` with the actual path where you cloned the repo.

To get the path, run `pwd` in the berlin-services-mcp directory.

**Example**:
```json
{
  "mcpServers": {
    "berlin-services": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/berlin-services-mcp/build/index.js"
      ]
    }
  }
}
```

After adding this, restart Claude Desktop completely (Cmd+Q on Mac, then reopen).

### With MCP Inspector

For testing and development:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This opens a web interface where you can test all the tools interactively.

## Available Tools

### 1. `search_services`
Search for services by name or description.

**Parameters:**
- `query` (string, required): Search query

**Example:**
```json
{
  "query": "Anmeldung"
}
```

### 2. `get_service_details`
Get detailed information about a specific service.

**Parameters:**
- `service_id` (string, required): The service ID

**Example:**
```json
{
  "service_id": "120335"
}
```

### 3. `list_services`
List all available services.

**Parameters:**
- `limit` (number, optional): Maximum number of services to return (default: 50, max: 200)

**Example:**
```json
{
  "limit": 100
}
```

### 4. `get_services_stats`
Get statistics about the dataset.

**Parameters:** None

## Example Queries with Claude

Once configured, you can ask Claude questions like:

- "Search for services related to residence registration"
- "What are the requirements for Anmeldung einer Wohnung?"
- "Show me all services related to passport"
- "What documents do I need for service ID 120335?"
- "How much does it cost to register my address in Berlin?"

## Data Source

This server fetches data from the official Berlin services API:
https://service.berlin.de/export/dienstleistungen/json/

The data includes:
- 1,000+ administrative services
- Information in German language
- Real-time appointment availability
- Links to online processing when available
- Responsible authorities for each service

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run watch
```

### Project Structure

```
berlin-services-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Inspired by the [Garmin MCP](https://github.com/Taxuspt/garmin_mcp) project
- Data provided by [Service Berlin](https://service.berlin.de/)
- Built with the [Model Context Protocol](https://modelcontextprotocol.io/)
