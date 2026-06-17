import httpx
from datetime import date
from fastapi import HTTPException
from fastapi.responses import Response

from cache import obtener, guardar, TTL_NASA

NASA_IMAGES_API = "https://images-api.nasa.gov/search"
CLAVE_ULTIMA_IMAGEN = "cosmos:ultimo_ok"

TEMAS_COSMOS = [
    "nebula", "galaxy", "mars", "jupiter", "saturn", "moon",
    "aurora", "spacewalk", "cosmos", "universe", "asteroid",
    "eclipse", "supernova", "milky way", "solar flare",
]

FALLBACK = {
    "date": "2019-11-07",
    "title": "NGC 7714: Galaxia con cola de cometa",
    "explanation": "Imagen del archivo público de la NASA.",
    "url": "https://images-assets.nasa.gov/image/PIA12348/PIA12348~medium.jpg",
    "hdurl": "https://images-assets.nasa.gov/image/PIA12348/PIA12348~orig.jpg",
    "media_type": "image",
    "copyright": "NASA, ESA",
    "thumbnail": "https://images-assets.nasa.gov/image/PIA12348/PIA12348~thumb.jpg",
    "fuente": "nasa_images",
}


def _url_imagen(links: list) -> tuple[str | None, str | None]:
    thumb = medium = large = orig = None
    for link in links:
        href = link.get("href", "")
        if not href.startswith("https"):
            continue
        if "~thumb" in href:
            thumb = href
        elif "~medium" in href:
            medium = href
        elif "~large" in href:
            large = href
        elif "~orig" in href:
            orig = href
        elif link.get("render") == "image" and not medium:
            medium = href
    principal = medium or large or thumb or orig
    hd = orig or large or medium or thumb
    return principal, hd


def _formatear_item(item: dict, target: date) -> dict | None:
    data = item.get("data", [{}])[0]
    titulo = data.get("title")
    if not titulo:
        return None

    principal, hd = _url_imagen(item.get("links", []))
    if not principal:
        return None

    descripcion = data.get("description", "") or ""
    if len(descripcion) > 500:
        descripcion = descripcion[:500] + "…"

    return {
        "date": target.isoformat(),
        "title": titulo,
        "explanation": descripcion,
        "url": principal,
        "hdurl": hd,
        "media_type": "image",
        "copyright": data.get("center", "NASA"),
        "thumbnail": principal if principal != hd else None,
        "fuente": "nasa_images",
        "nasa_id": data.get("nasa_id"),
    }


async def _buscar_imagen(query: str, page: int) -> list[dict]:
    params = {
        "q": query,
        "media_type": "image",
        "page": page,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(NASA_IMAGES_API, params=params)
        resp.raise_for_status()
        return resp.json().get("collection", {}).get("items", [])


async def get_apod(target: date | None = None) -> dict:
    """Imagen del cosmos — NASA Image Library (sin API key ni límites diarios)."""
    objetivo = target or date.today()
    doy = objetivo.timetuple().tm_yday
    tema = TEMAS_COSMOS[doy % len(TEMAS_COSMOS)]
    pagina = (doy % 4) + 1

    try:
        items = await _buscar_imagen(tema, pagina)
        if not items:
            items = await _buscar_imagen("space", 1)

        if items:
            indice = doy % len(items)
            # Probar varios ítems por si alguno no tiene imagen válida
            for offset in range(len(items)):
                candidato = _formatear_item(items[(indice + offset) % len(items)], objetivo)
                if candidato:
                    guardar(CLAVE_ULTIMA_IMAGEN, candidato)
                    return candidato
    except Exception:
        pass

    ultimo = obtener(CLAVE_ULTIMA_IMAGEN, TTL_NASA * 30)
    if ultimo:
        return ultimo

    return {**FALLBACK, "date": objetivo.isoformat()}


async def proxy_imagen(url: str) -> Response:
    if not url.startswith("https://"):
        raise HTTPException(400, "URL inválida")

    headers = {
        "User-Agent": "Chronos-Calendario/1.0",
        "Accept": "image/*,*/*",
    }
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    content_type = resp.headers.get("content-type", "image/jpeg")
    return Response(
        content=resp.content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )
