import httpx

NAGER_API = "https://date.nager.at/api/v3"


async def get_holidays(year: int, country: str = "CO") -> list[dict]:
    url = f"{NAGER_API}/PublicHolidays/{year}/{country}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        raw = resp.json()

    return [
        {
            "date": h["date"],
            "name": h["localName"] or h["name"],
            "global": h.get("global", True),
            "types": h.get("types", []),
        }
        for h in raw
    ]


async def get_country_info(country: str = "CO") -> dict:
    url = f"{NAGER_API}/CountryInfo/{country}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()
