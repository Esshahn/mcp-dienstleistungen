#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import nodeFetch from "node-fetch";

// Use node-fetch as fallback for older Node versions
const fetchImpl = globalThis.fetch || nodeFetch;

const BERLIN_SERVICES_URL = "https://service.berlin.de/export/dienstleistungen/json/";

// Cache for the services data
let servicesCache: BerlinServicesData | null = null;

interface BerlinServicesData {
  created: string;
  datacount: number;
  locale: string;
  hash: string;
  error: boolean;
  data: Service[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  fees: string;
  process_time: string;
  requirements: Requirement[];
  prerequisites: Prerequisite[];
  forms: Form[];
  authorities: Authority[];
  locations: Location[];
  meta: ServiceMeta;
  responsibility: string;
  responsibility_all: boolean;
  legal: LegalReference[];
  links: Link[];
  onlineprocessing: OnlineProcessing;
  appointment: Appointment;
  [key: string]: any;
}

interface Requirement {
  name: string;
  description: string;
  link?: string;
}

interface Prerequisite {
  name: string;
  description?: string;
  link?: string;
}

interface Form {
  name: string;
  description?: string;
  link?: string;
}

interface Authority {
  id: string;
  name: string;
  webinfo?: string;
}

interface Location {
  location: string;
  url: string;
  appointment: {
    link: string;
    slots: string;
    allowed: boolean;
  };
  responsibility?: string;
  responsibility_hint?: string;
}

interface ServiceMeta {
  lastupdate: string;
  url: string;
  locale: string;
  keywords: string;
  id: string;
  hash: string;
}

interface LegalReference {
  name: string;
  description?: string;
  link?: string;
}

interface Link {
  name: string;
  description?: string;
  link?: string;
}

interface OnlineProcessing {
  description?: string;
  link?: string;
}

interface Appointment {
  link?: string;
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  fees: string;
}

async function fetchServicesData(): Promise<BerlinServicesData> {
  if (servicesCache !== null) {
    return servicesCache;
  }

  try {
    const response = await fetchImpl(BERLIN_SERVICES_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BerlinServicesData = await response.json();
    servicesCache = data;
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch Berlin services data: ${error}`);
  }
}

function searchServices(data: BerlinServicesData, query: string): SearchResult[] {
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const service of data.data) {
    const name = (service.name || "").toLowerCase();
    const description = (service.description || "").toLowerCase();

    if (name.includes(queryLower) || description.includes(queryLower)) {
      const desc = service.description || "";
      results.push({
        id: service.id,
        name: service.name,
        description: desc.length > 200 ? desc.substring(0, 200) + "..." : desc,
        url: service.meta?.url || "",
        fees: service.fees || "",
      });
    }
  }

  return results;
}

function getServiceById(data: BerlinServicesData, serviceId: string): Service | null {
  return data.data.find((service) => service.id === serviceId) || null;
}

function formatServiceDetails(service: Service): string {
  const lines: string[] = [
    `# ${service.name}`,
    `\n**ID:** ${service.id}`,
    `**URL:** ${service.meta?.url || "N/A"}`,
    `\n## Description`,
    service.description || "N/A",
    `\n## Fees`,
    service.fees || "N/A",
    `\n## Process Time`,
    service.process_time || "N/A",
  ];

  // Add requirements
  if (service.requirements && service.requirements.length > 0) {
    lines.push("\n## Requirements");
    for (const req of service.requirements) {
      lines.push(`\n### ${req.name}`);
      lines.push(req.description || "");
    }
  }

  // Add prerequisites
  if (
    service.prerequisites &&
    service.prerequisites.length > 0 &&
    service.prerequisites[0].name !== "keine"
  ) {
    lines.push("\n## Prerequisites");
    for (const prereq of service.prerequisites) {
      lines.push(`- ${prereq.name}`);
    }
  }

  // Add forms
  if (service.forms && service.forms.length > 0) {
    lines.push("\n## Forms");
    for (const form of service.forms) {
      if (form.link) {
        lines.push(`- [${form.name}](${form.link})`);
      } else {
        lines.push(`- ${form.name}`);
      }
    }
  }

  // Add online processing
  if (service.onlineprocessing?.link) {
    lines.push("\n## Online Processing");
    lines.push(`[Process online](${service.onlineprocessing.link})`);
  }

  // Add appointment link
  if (service.appointment?.link) {
    lines.push("\n## Appointment");
    lines.push(`[Book appointment](${service.appointment.link})`);
  }

  // Add authorities
  if (service.authorities && service.authorities.length > 0) {
    lines.push("\n## Responsible Authorities");
    const authoritiesToShow = service.authorities.slice(0, 5);
    for (const auth of authoritiesToShow) {
      lines.push(`- ${auth.name}`);
    }
    if (service.authorities.length > 5) {
      lines.push(`- ... and ${service.authorities.length - 5} more`);
    }
  }

  // Add legal references
  if (service.legal && service.legal.length > 0) {
    lines.push("\n## Legal Basis");
    for (const law of service.legal) {
      if (law.link) {
        lines.push(`- [${law.name}](${law.link})`);
      } else {
        lines.push(`- ${law.name}`);
      }
    }
  }

  return lines.join("\n");
}

function listAllServices(
  data: BerlinServicesData,
  limit: number = 50
): Array<{ id: string; name: string; url: string }> {
  return data.data.slice(0, limit).map((service) => ({
    id: service.id,
    name: service.name,
    url: service.meta?.url || "",
  }));
}

const server = new Server(
  {
    name: "berlin-services-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_services",
        description:
          "Search for Berlin administrative services by name or description. Returns a list of matching services with basic information.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (searches in service name and description)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_service_details",
        description:
          "Get detailed information about a specific Berlin service by its ID. Returns comprehensive information including requirements, forms, fees, appointments, and more.",
        inputSchema: {
          type: "object",
          properties: {
            service_id: {
              type: "string",
              description: "The ID of the service",
            },
          },
          required: ["service_id"],
        },
      },
      {
        name: "list_services",
        description:
          "List all available Berlin administrative services. Returns a paginated list of services with their names and IDs.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of services to return (default: 50, max: 200)",
              default: 50,
            },
          },
        },
      },
      {
        name: "get_services_stats",
        description:
          "Get statistics about the Berlin services dataset (total count, last update, etc.)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ] as Tool[],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const data = await fetchServicesData();

    switch (request.params.name) {
      case "search_services": {
        const query = String(request.params.arguments?.query || "");
        if (!query) {
          return {
            content: [
              {
                type: "text",
                text: "Error: query parameter is required",
              },
            ],
          };
        }

        const results = searchServices(data, query);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No services found matching '${query}'`,
              },
            ],
          };
        }

        let output = `Found ${results.length} service(s) matching '${query}':\n\n`;
        for (const result of results) {
          output += `**${result.name}**\n`;
          output += `ID: ${result.id}\n`;
          output += `URL: ${result.url}\n`;
          output += `Fees: ${result.fees}\n`;
          output += `Description: ${result.description}\n\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "get_service_details": {
        const serviceId = String(request.params.arguments?.service_id || "");
        if (!serviceId) {
          return {
            content: [
              {
                type: "text",
                text: "Error: service_id parameter is required",
              },
            ],
          };
        }

        const service = getServiceById(data, serviceId);

        if (!service) {
          return {
            content: [
              {
                type: "text",
                text: `Service with ID '${serviceId}' not found`,
              },
            ],
          };
        }

        const details = formatServiceDetails(service);
        return {
          content: [
            {
              type: "text",
              text: details,
            },
          ],
        };
      }

      case "list_services": {
        const limit = Math.min(Number(request.params.arguments?.limit || 50), 200);
        const services = listAllServices(data, limit);

        let output = `Berlin Administrative Services (showing ${services.length} of ${data.datacount} total):\n\n`;
        for (const service of services) {
          output += `- **${service.name}** (ID: ${service.id})\n`;
          output += `  ${service.url}\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "get_services_stats": {
        const stats = `# Berlin Services Statistics

**Total Services:** ${data.datacount}
**Last Updated:** ${data.created}
**Locale:** ${data.locale}
**Data Hash:** ${data.hash}
**Error Status:** ${data.error}

The dataset contains information about ${data.datacount} administrative services provided by Berlin authorities.
`;
        return {
          content: [
            {
              type: "text",
              text: stats,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${request.params.name}`,
            },
          ],
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Berlin Services MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
