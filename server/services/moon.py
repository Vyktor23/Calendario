import math
from datetime import date, datetime


def _julian_day(dt: date) -> float:
    y, m, d = dt.year, dt.month, dt.day
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524.5


def moon_phase(target: date) -> dict:
    """Calcula fase lunar con algoritmo astronómico simplificado."""
    jd = _julian_day(target)
    days_since_new = (jd - 2451549.5) % 29.530588853
    phase = days_since_new / 29.530588853

    if phase < 0.03 or phase > 0.97:
        name, emoji, illumination = "Luna Nueva", "🌑", 0.0
    elif phase < 0.22:
        name, emoji, illumination = "Luna Creciente", "🌒", phase * 2
    elif phase < 0.28:
        name, emoji, illumination = "Cuarto Creciente", "🌓", 0.5
    elif phase < 0.47:
        name, emoji, illumination = "Creciente Avanzada", "🌔", phase
    elif phase < 0.53:
        name, emoji, illumination = "Luna Llena", "🌕", 1.0
    elif phase < 0.72:
        name, emoji, illumination = "Menguante Avanzada", "🌖", 1 - phase
    elif phase < 0.78:
        name, emoji, illumination = "Cuarto Menguante", "🌗", 0.5
    else:
        name, emoji, illumination = "Luna Menguante", "🌘", 1 - phase * 2

    return {
        "date": target.isoformat(),
        "phase": round(phase, 4),
        "illumination": round(min(1.0, max(0.0, illumination)) * 100, 1),
        "name": name,
        "emoji": emoji,
        "age_days": round(days_since_new, 1),
    }


def next_full_moon(from_date: date) -> dict:
    current = moon_phase(from_date)
    days_ahead = 0
    check = from_date
    while days_ahead < 35:
        p = moon_phase(check)
        if p["name"] == "Luna Llena" and check >= from_date:
            return {"date": check.isoformat(), **p}
        check = date.fromordinal(check.toordinal() + 1)
        days_ahead += 1
    return {"date": from_date.isoformat(), **current}
