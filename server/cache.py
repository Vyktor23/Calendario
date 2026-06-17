"""Caché en memoria para no repetir llamadas lentas a APIs externas."""
import time
from typing import Any

_almacen: dict[str, tuple[float, Any]] = {}

# Tiempos en segundos
TTL_CLIMA = 30 * 60      # 30 minutos
TTL_FESTIVOS = 24 * 3600  # 24 horas
TTL_NASA = 12 * 3600      # 12 horas


def obtener(clave: str, ttl: int) -> Any | None:
    if clave not in _almacen:
        return None
    marca, valor = _almacen[clave]
    if time.time() - marca > ttl:
        del _almacen[clave]
        return None
    return valor


def guardar(clave: str, valor: Any) -> None:
    _almacen[clave] = (time.time(), valor)
