"""Simple test script to verify the server can fetch data."""

import asyncio
from src.berlin_services_mcp.server import fetch_services_data

async def test():
    """Test fetching services data."""
    print("Fetching Berlin services data...")
    data = await fetch_services_data()

    print(f"✓ Successfully fetched data")
    print(f"✓ Total services: {data.get('datacount', 0)}")
    print(f"✓ Last updated: {data.get('created', 'N/A')}")
    print(f"✓ Locale: {data.get('locale', 'N/A')}")

    if data.get('data'):
        first_service = data['data'][0]
        print(f"\n✓ First service example:")
        print(f"  - Name: {first_service.get('name', 'N/A')}")
        print(f"  - ID: {first_service.get('id', 'N/A')}")
        print(f"  - URL: {first_service.get('meta', {}).get('url', 'N/A')}")

    print("\n✓ Server is ready to use!")

if __name__ == "__main__":
    asyncio.run(test())
