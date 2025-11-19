"""MCP server for Berlin administrative services."""

import asyncio
import json
from typing import Any
import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
import mcp.server.stdio

# URL for Berlin services data
BERLIN_SERVICES_URL = "https://service.berlin.de/export/dienstleistungen/json/"

# Cache for the services data
_services_cache: dict[str, Any] | None = None


async def fetch_services_data() -> dict[str, Any]:
    """Fetch and cache the Berlin services data."""
    global _services_cache

    if _services_cache is not None:
        return _services_cache

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(BERLIN_SERVICES_URL)
        response.raise_for_status()
        _services_cache = response.json()
        return _services_cache


def search_services(data: dict[str, Any], query: str) -> list[dict[str, Any]]:
    """Search for services by name or description."""
    query_lower = query.lower()
    results = []

    for service in data.get("data", []):
        name = service.get("name", "").lower()
        description = service.get("description", "").lower()

        if query_lower in name or query_lower in description:
            results.append({
                "id": service.get("id"),
                "name": service.get("name"),
                "description": service.get("description", "")[:200] + "..." if len(service.get("description", "")) > 200 else service.get("description", ""),
                "url": service.get("meta", {}).get("url", ""),
                "fees": service.get("fees", ""),
            })

    return results


def get_service_by_id(data: dict[str, Any], service_id: str) -> dict[str, Any] | None:
    """Get detailed information about a specific service."""
    for service in data.get("data", []):
        if str(service.get("id")) == str(service_id):
            return service
    return None


def format_service_details(service: dict[str, Any]) -> str:
    """Format service details as readable text."""
    lines = [
        f"# {service.get('name', 'N/A')}",
        f"\n**ID:** {service.get('id', 'N/A')}",
        f"**URL:** {service.get('meta', {}).get('url', 'N/A')}",
        f"\n## Description",
        service.get('description', 'N/A'),
        f"\n## Fees",
        service.get('fees', 'N/A'),
        f"\n## Process Time",
        service.get('process_time', 'N/A'),
    ]

    # Add requirements
    requirements = service.get('requirements', [])
    if requirements:
        lines.append("\n## Requirements")
        for req in requirements:
            lines.append(f"\n### {req.get('name', 'N/A')}")
            lines.append(req.get('description', ''))

    # Add prerequisites
    prerequisites = service.get('prerequisites', [])
    if prerequisites and prerequisites[0].get('name') != 'keine':
        lines.append("\n## Prerequisites")
        for prereq in prerequisites:
            lines.append(f"- {prereq.get('name', 'N/A')}")

    # Add forms
    forms = service.get('forms', [])
    if forms:
        lines.append("\n## Forms")
        for form in forms:
            name = form.get('name', 'N/A')
            link = form.get('link', '')
            if link:
                lines.append(f"- [{name}]({link})")
            else:
                lines.append(f"- {name}")

    # Add online processing
    online = service.get('onlineprocessing', {})
    if online.get('link'):
        lines.append(f"\n## Online Processing")
        lines.append(f"[Process online]({online.get('link')})")

    # Add appointment link
    appointment = service.get('appointment', {})
    if appointment.get('link'):
        lines.append(f"\n## Appointment")
        lines.append(f"[Book appointment]({appointment.get('link')})")

    # Add authorities
    authorities = service.get('authorities', [])
    if authorities:
        lines.append("\n## Responsible Authorities")
        for auth in authorities[:5]:  # Limit to first 5
            lines.append(f"- {auth.get('name', 'N/A')}")
        if len(authorities) > 5:
            lines.append(f"- ... and {len(authorities) - 5} more")

    # Add legal references
    legal = service.get('legal', [])
    if legal:
        lines.append("\n## Legal Basis")
        for law in legal:
            name = law.get('name', 'N/A')
            link = law.get('link', '')
            if link:
                lines.append(f"- [{name}]({link})")
            else:
                lines.append(f"- {name}")

    return "\n".join(lines)


def list_all_services(data: dict[str, Any], limit: int = 50) -> list[dict[str, Any]]:
    """List all available services with basic info."""
    services = []

    for service in data.get("data", [])[:limit]:
        services.append({
            "id": service.get("id"),
            "name": service.get("name"),
            "url": service.get("meta", {}).get("url", ""),
        })

    return services


async def main():
    """Run the MCP server."""
    server = Server("berlin-services-mcp")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        """List available tools."""
        return [
            Tool(
                name="search_services",
                description="Search for Berlin administrative services by name or description. Returns a list of matching services with basic information.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query (searches in service name and description)",
                        },
                    },
                    "required": ["query"],
                },
            ),
            Tool(
                name="get_service_details",
                description="Get detailed information about a specific Berlin service by its ID. Returns comprehensive information including requirements, forms, fees, appointments, and more.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "service_id": {
                            "type": "string",
                            "description": "The ID of the service",
                        },
                    },
                    "required": ["service_id"],
                },
            ),
            Tool(
                name="list_services",
                description="List all available Berlin administrative services. Returns a paginated list of services with their names and IDs.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "number",
                            "description": "Maximum number of services to return (default: 50, max: 200)",
                            "default": 50,
                        },
                    },
                },
            ),
            Tool(
                name="get_services_stats",
                description="Get statistics about the Berlin services dataset (total count, last update, etc.)",
                inputSchema={
                    "type": "object",
                    "properties": {},
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: Any) -> list[TextContent]:
        """Handle tool calls."""
        try:
            data = await fetch_services_data()

            if name == "search_services":
                query = arguments.get("query", "")
                if not query:
                    return [TextContent(type="text", text="Error: query parameter is required")]

                results = search_services(data, query)

                if not results:
                    return [TextContent(
                        type="text",
                        text=f"No services found matching '{query}'"
                    )]

                output = f"Found {len(results)} service(s) matching '{query}':\n\n"
                for result in results:
                    output += f"**{result['name']}**\n"
                    output += f"ID: {result['id']}\n"
                    output += f"URL: {result['url']}\n"
                    output += f"Fees: {result['fees']}\n"
                    output += f"Description: {result['description']}\n\n"

                return [TextContent(type="text", text=output)]

            elif name == "get_service_details":
                service_id = arguments.get("service_id", "")
                if not service_id:
                    return [TextContent(type="text", text="Error: service_id parameter is required")]

                service = get_service_by_id(data, service_id)

                if not service:
                    return [TextContent(
                        type="text",
                        text=f"Service with ID '{service_id}' not found"
                    )]

                details = format_service_details(service)
                return [TextContent(type="text", text=details)]

            elif name == "list_services":
                limit = min(arguments.get("limit", 50), 200)
                services = list_all_services(data, limit)

                output = f"Berlin Administrative Services (showing {len(services)} of {data.get('datacount', 0)} total):\n\n"
                for service in services:
                    output += f"- **{service['name']}** (ID: {service['id']})\n"
                    output += f"  {service['url']}\n"

                return [TextContent(type="text", text=output)]

            elif name == "get_services_stats":
                stats = f"""# Berlin Services Statistics

**Total Services:** {data.get('datacount', 'N/A')}
**Last Updated:** {data.get('created', 'N/A')}
**Locale:** {data.get('locale', 'N/A')}
**Data Hash:** {data.get('hash', 'N/A')}
**Error Status:** {data.get('error', False)}

The dataset contains information about {data.get('datacount', 0)} administrative services provided by Berlin authorities.
"""
                return [TextContent(type="text", text=stats)]

            else:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]

        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    # Run the server
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
