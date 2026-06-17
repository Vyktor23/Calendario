import asyncio
from datetime import date
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from cache import obtener, guardar, TTL_CLIMA, TTL_FESTIVOS, TTL_NASA
from services.moon import moon_phase, next_full_moon
from services.weather import get_weather
from services.holidays import get_holidays, get_country_info
from services.nasa import get_apod, proxy_imagen
from services.ubicacion import obtener_nombre_lugar

app = FastAPI(
    title="Chronos API",
    description="Servidor del calendario Chronos",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def clima_con_cache(lat: float, lon: float, d: date | None = None) -> dict:
    objetivo = d or date.today()
    clave = f"clima:v2:{lat:.2f}:{lon:.2f}:{objetivo.isoformat()}"
    guardado = obtener(clave, TTL_CLIMA)
    if guardado:
        return guardado
    datos = await get_weather(lat, lon, objetivo)
    guardar(clave, datos)
    return datos


async def festivos_con_cache(anio: int, pais: str = "CO") -> list[dict]:
    clave = f"festivos:{pais}:{anio}"
    guardado = obtener(clave, TTL_FESTIVOS)
    if guardado:
        return guardado
    datos = await get_holidays(anio, pais)
    guardar(clave, datos)
    return datos


async def nasa_con_cache(d: date | None = None) -> dict:
    objetivo = d or date.today()
    clave = f"nasa:v2:{objetivo.isoformat()}"
    guardado = obtener(clave, TTL_NASA)
    if guardado:
        return guardado
    datos = await get_apod(objetivo)
    guardar(clave, datos)
    return datos


@app.get("/")
async def inicio():
    return {
        "nombre": "Chronos API",
        "mensaje": "Servidor activo",
        "rutas": ["/api/inicio", "/api/dia", "/api/clima", "/api/festivos", "/api/nasa", "/api/ubicacion"],
    }


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/ubicacion")
async def api_ubicacion(lat: float = Query(...), lon: float = Query(...)):
    nombre = await obtener_nombre_lugar(lat, lon)
    return {"lat": lat, "lon": lon, "nombre": nombre}


@app.get("/api/inicio")
async def datos_inicio(
    lat: float = Query(4.711),
    lon: float = Query(-74.0721),
):
    hoy = date.today()
    clima, festivos, nombre_lugar = await asyncio.gather(
        clima_con_cache(lat, lon, hoy),
        festivos_con_cache(hoy.year),
        obtener_nombre_lugar(lat, lon),
    )
    return {
        "luna": moon_phase(hoy),
        "proxima_luna_llena": next_full_moon(hoy),
        "clima": clima,
        "festivos_hoy": [f for f in festivos if f["date"] == hoy.isoformat()],
        "ubicacion": {"lat": lat, "lon": lon, "nombre": nombre_lugar},
    }


@app.get("/api/luna")
async def api_luna(d: date | None = Query(None)):
    objetivo = d or date.today()
    return {
        "actual": moon_phase(objetivo),
        "proxima_luna_llena": next_full_moon(objetivo),
    }


@app.get("/api/clima")
async def api_clima(
    lat: float = Query(4.711),
    lon: float = Query(-74.0721),
    d: date | None = Query(None),
):
    try:
        return await clima_con_cache(lat, lon, d)
    except Exception as e:
        raise HTTPException(502, f"No se pudo obtener el clima: {e}")


@app.get("/api/festivos/{anio}")
async def api_festivos(anio: int, pais: str = Query("CO"), country: str | None = Query(None)):
    codigo_pais = country or pais
    try:
        festivos = await festivos_con_cache(anio, codigo_pais)
        info_pais = await get_country_info(codigo_pais)
        return {"anio": anio, "pais": info_pais, "festivos": festivos}
    except Exception as e:
        raise HTTPException(502, f"No se pudieron obtener festivos: {e}")


@app.get("/api/nasa")
async def api_nasa(d: date | None = Query(None)):
    try:
        return await nasa_con_cache(d)
    except Exception as e:
        raise HTTPException(502, f"Foto de la NASA no disponible: {e}")


@app.get("/api/nasa/imagen")
async def api_nasa_imagen(url: str = Query(...)):
    try:
        return await proxy_imagen(url)
    except Exception as e:
        raise HTTPException(502, f"No se pudo cargar la imagen: {e}")


@app.get("/api/dia")
async def resumen_dia(
    d: date = Query(...),
    lat: float = Query(4.711),
    lon: float = Query(-74.0721),
    pais: str = Query("CO"),
):
    try:
        clima, festivos = await asyncio.gather(
            clima_con_cache(lat, lon, d),
            festivos_con_cache(d.year, pais),
        )
        return {
            "fecha": d.isoformat(),
            "clima": clima,
            "luna": moon_phase(d),
            "festivos": [f for f in festivos if f["date"] == d.isoformat()],
        }
    except Exception as e:
        raise HTTPException(502, str(e))


# Compatibilidad con rutas anteriores
@app.get("/api/moon")
async def api_moon_legacy(d: date | None = Query(None)):
    r = await api_luna(d)
    return {"current": r["actual"], "next_full_moon": r["proxima_luna_llena"]}


@app.get("/api/weather")
async def api_weather_legacy(lat: float = Query(4.711), lon: float = Query(-74.0721), d: date | None = Query(None)):
    return await api_clima(lat, lon, d)


@app.get("/api/holidays/{year}")
async def api_holidays_legacy(year: int, country: str = "CO"):
    result = await api_festivos(year, country=country)
    return {"year": year, "country": result["pais"], "holidays": result["festivos"]}


@app.get("/api/nasa/apod")
async def api_nasa_legacy(d: date | None = Query(None)):
    return await api_nasa(d)
