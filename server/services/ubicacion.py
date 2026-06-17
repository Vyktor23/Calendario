import httpx

NOMINATIM = "https://nominatim.openstreetmap.org/reverse"


async def obtener_nombre_lugar(lat: float, lon: float) -> str:
    params = {
        "format": "json",
        "lat": lat,
        "lon": lon,
        "zoom": 10,
        "accept-language": "es",
    }
    headers = {"User-Agent": "Chronos-Calendario/1.0"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(NOMINATIM, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            addr = data.get("address", {})
            return (
                addr.get("city")
                or addr.get("town")
                or addr.get("municipality")
                or addr.get("state")
                or addr.get("country")
                or "Tu ubicación"
            )
    except Exception:
        return "Tu ubicación"
