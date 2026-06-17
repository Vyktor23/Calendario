import httpx
from datetime import date, timedelta

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
MAX_PRONOSTICO_DIAS = 16
DIAS_PASADO = 7

WEATHER_CODES = {
    0: ("Despejado", "☀️"),
    1: ("Mayormente despejado", "🌤️"),
    2: ("Parcialmente nublado", "⛅"),
    3: ("Nublado", "☁️"),
    45: ("Niebla", "🌫️"),
    48: ("Niebla helada", "🌫️"),
    51: ("Llovizna ligera", "🌦️"),
    53: ("Llovizna", "🌦️"),
    55: ("Llovizna intensa", "🌧️"),
    61: ("Lluvia ligera", "🌧️"),
    63: ("Lluvia", "🌧️"),
    65: ("Lluvia fuerte", "⛈️"),
    71: ("Nieve ligera", "🌨️"),
    73: ("Nieve", "❄️"),
    75: ("Nieve intensa", "❄️"),
    80: ("Chubascos ligeros", "🌦️"),
    81: ("Chubascos", "🌧️"),
    82: ("Chubascos fuertes", "⛈️"),
    95: ("Tormenta", "⛈️"),
    96: ("Tormenta con granizo", "⛈️"),
    99: ("Tormenta severa", "⛈️"),
}

ETIQUETAS_TIPO = {
    "actual": "Temperatura actual en tiempo real",
    "pronostico": "Pronóstico meteorológico",
    "historico": "Registro histórico del clima",
    "indisponible": "Sin datos para esta fecha",
}


def _describir_codigo(code: int) -> tuple[str, str]:
    return WEATHER_CODES.get(code, ("Desconocido", "🌡️"))


def _respuesta_base(
    target: date,
    lat: float,
    lon: float,
    tipo_dato: str,
    code: int,
    temp_max,
    temp_min,
    precip=None,
    temp_actual=None,
    mensaje: str | None = None,
    pronostico_semana: list | None = None,
) -> dict:
    label, emoji = _describir_codigo(code)
    hoy = date.today()
    return {
        "date": target.isoformat(),
        "temp_actual": temp_actual,
        "temp_max": temp_max,
        "temp_min": temp_min,
        "precipitation_probability": precip,
        "weather_code": code,
        "description": label,
        "emoji": emoji,
        "tipo_dato": tipo_dato,
        "etiqueta_tipo": ETIQUETAS_TIPO[tipo_dato],
        "disponible": tipo_dato != "indisponible",
        "mensaje": mensaje,
        "es_hoy": target == hoy,
        "location": {"lat": lat, "lon": lon},
        "forecast": pronostico_semana or [],
    }


def _indisponible(target: date, lat: float, lon: float, mensaje: str) -> dict:
    return _respuesta_base(target, lat, lon, "indisponible", 0, None, None, mensaje=mensaje)


async def _fetch_meteo(lat: float, lon: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "current": "temperature_2m,weather_code",
        "timezone": "auto",
        "forecast_days": MAX_PRONOSTICO_DIAS,
        "past_days": DIAS_PASADO,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(OPEN_METEO, params=params)
        resp.raise_for_status()
        return resp.json()


def _construir_semana(daily: dict, fechas: list[str]) -> list:
    hoy = date.today().isoformat()
    # Semana: desde hoy o primer día disponible
    inicio = fechas.index(hoy) if hoy in fechas else 0
    fin = min(inicio + 7, len(fechas))
    return [
        {
            "date": d,
            "temp_max": daily.get("temperature_2m_max", [])[i],
            "temp_min": daily.get("temperature_2m_min", [])[i],
            "code": daily.get("weather_code", [])[i],
            **dict(zip(["description", "emoji"], _describir_codigo(
                daily.get("weather_code", [0])[i]
            ))),
        }
        for i, d in enumerate(fechas[inicio:fin], start=inicio)
    ]


async def _desde_pronostico(lat: float, lon: float, target: date) -> dict:
    hoy = date.today()
    data = await _fetch_meteo(lat, lon)
    daily = data.get("daily", {})
    fechas = daily.get("time", [])
    target_str = target.isoformat()

    if target_str not in fechas:
        dias_futuro = (target - hoy).days
        if dias_futuro > MAX_PRONOSTICO_DIAS:
            return _indisponible(
                target, lat, lon,
                f"Pronóstico solo hasta {MAX_PRONOSTICO_DIAS} días. "
                f"Faltan {dias_futuro} días.",
            )
        return _indisponible(target, lat, lon, "Sin datos para esta fecha.")

    idx = fechas.index(target_str)
    code = daily.get("weather_code", [0])[idx]
    temp_actual = None
    tipo = "pronostico"

    if target == hoy:
        current = data.get("current", {})
        temp_actual = current.get("temperature_2m")
        if current.get("weather_code") is not None:
            code = current["weather_code"]
        tipo = "actual"
    elif target < hoy:
        tipo = "historico"

    return _respuesta_base(
        target, lat, lon, tipo, code,
        daily.get("temperature_2m_max", [None])[idx],
        daily.get("temperature_2m_min", [None])[idx],
        daily.get("precipitation_probability_max", [None])[idx],
        temp_actual=temp_actual,
        mensaje="Temperaturas registradas ese día." if tipo == "historico" else None,
        pronostico_semana=_construir_semana(daily, fechas),
    )


async def _historico(lat: float, lon: float, target: date) -> dict:
    fecha_str = target.isoformat()
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": fecha_str,
        "end_date": fecha_str,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPEN_METEO_ARCHIVE, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return _indisponible(target, lat, lon, "Sin registros históricos para este día.")

    daily = data.get("daily", {})
    fechas = daily.get("time", [])
    if fecha_str not in fechas:
        return _indisponible(target, lat, lon, "Sin datos históricos.")

    idx = fechas.index(fecha_str)
    code = daily.get("weather_code", [0])[idx]
    return _respuesta_base(
        target, lat, lon, "historico", code,
        daily.get("temperature_2m_max", [None])[idx],
        daily.get("temperature_2m_min", [None])[idx],
        mensaje="Temperaturas máxima y mínima registradas ese día.",
    )


async def get_weather(lat: float, lon: float, target: date | None = None) -> dict:
    objetivo = target or date.today()
    hoy = date.today()

    if objetivo > hoy + timedelta(days=MAX_PRONOSTICO_DIAS):
        return _indisponible(
            objetivo, lat, lon,
            f"Pronóstico solo hasta {MAX_PRONOSTICO_DIAS} días en el futuro.",
        )

    if objetivo < hoy - timedelta(days=DIAS_PASADO):
        return await _historico(lat, lon, objetivo)

    return await _desde_pronostico(lat, lon, objetivo)
