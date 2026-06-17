# Chronos — Calendario Inteligente

Calendario web con clima, festivos de Colombia, fases lunares e imágenes del cosmos.  
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4  
**Backend:** Python + FastAPI

---

## ¿Qué hace?

- **Vista mes** — Cuadrícula de días con fase lunar, festivos y eventos personales
- **Vista año** — Los 12 meses en miniatura (4×3 en pantallas grandes)
- **Vista agenda** — Próximos eventos y festivos con paginación
- **Clima** — Temperatura y pronóstico según tu ubicación (geolocalización o Bogotá por defecto)
- **Festivos** — Colombia vía [Nager.Date](https://date.nager.at/)
- **Fase lunar** — Cálculo astronómico con nombres claros (Luna Creciente, Creciente Avanzada, etc.)
- **Cosmos del día** — Imagen de la [NASA Image Library](https://images.nasa.gov/) (sin API key)
- **Temas** — 7 paletas visuales (Cosmos, Aurora, Atardecer, Océano, Bosque, Medianoche, Sakura)
- **Eventos propios** — Se guardan en el navegador (`localStorage`)

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| [Node.js](https://nodejs.org) | 24+ (requerido en Vercel) |
| [Python](https://python.org) | 3.10+ |

Comprobar instalación:

```bash
node --version
python --version
```

---

## Cómo ejecutar (dos terminales)

Abre **dos terminales** en la carpeta del proyecto. El servidor debe estar en **http://localhost:8000** antes de usar la interfaz en **http://localhost:5173**.

### Terminal 1 — Servidor (Python)

```bash
cd server
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 2 — Interfaz (React)

```bash
cd chronos
npm install
npm run dev
```

Abre **http://localhost:5173**.

### Comandos útiles del frontend

```bash
npm run dev      # Desarrollo
npm run build    # Compilar para producción
npm run preview  # Previsualizar el build
```

---

## Estructura del proyecto

```
Calendario/
├── chronos/                 # Frontend (React)
│   ├── src/
│   │   ├── components/    # UI: calendario, panel lateral, modales…
│   │   ├── hooks/         # Eventos, tema, ubicación, carga inicial
│   │   ├── lib/           # API, clima, luna, temas
│   │   ├── types/         # Tipos TypeScript
│   │   ├── index.css      # Estilos base
│   │   ├── responsive.css # Breakpoints 320px → 4K
│   │   └── temas.css      # Variables de los 7 temas
│   ├── package.json
│   └── vite.config.ts     # Proxy /api → localhost:8000
│
├── server/                  # Backend (FastAPI)
│   ├── main.py              # Rutas /api/...
│   ├── cache.py             # Caché en memoria
│   ├── requirements.txt
│   └── services/
│       ├── weather.py       # Open-Meteo
│       ├── holidays.py      # Festivos
│       ├── nasa.py          # NASA Image Library + proxy de imágenes
│       ├── moon.py          # Fases lunares
│       └── ubicacion.py     # Nombre del lugar por coordenadas
│
└── README.md
```

### Flujo de datos

```
Navegador → chronos (localhost:5173) → server (localhost:8000) → APIs externas
```

Vite redirige las peticiones `/api/*` al servidor Python en desarrollo.

---

## Frontend — archivos clave

| Archivo | Función |
|---------|---------|
| `App.tsx` | Componente raíz y vistas |
| `CalendarioMes.tsx` | Cuadrícula del mes |
| `VistaAnio.tsx` / `MiniMes.tsx` | Vista anual |
| `VistaAgenda.tsx` | Agenda paginada |
| `PanelLateral.tsx` | Clima, luna e imagen cosmos |
| `ModalDia.tsx` / `DetalleDia.tsx` | Detalle al seleccionar un día |
| `SelectorTema.tsx` | Cambio de tema visual |
| `hooks/useEvents.ts` | Eventos en `localStorage` |
| `hooks/useUbicacion.ts` | Geolocalización del usuario |
| `lib/luna.ts` | Cálculo de fase lunar en el cliente |

---

## Backend — rutas API

| Ruta | Descripción |
|------|-------------|
| `GET /api/health` | Estado del servidor |
| `GET /api/inicio` | Clima, luna, festivos de hoy y ubicación |
| `GET /api/dia?d=YYYY-MM-DD` | Resumen de un día |
| `GET /api/clima` | Clima por coordenadas y fecha |
| `GET /api/festivos/{anio}` | Festivos del año (país `CO` por defecto) |
| `GET /api/luna` | Fase lunar y próxima luna llena |
| `GET /api/nasa` | Imagen del cosmos del día |
| `GET /api/nasa/imagen?url=...` | Proxy de imágenes NASA |
| `GET /api/ubicacion` | Nombre del lugar por lat/lon |
| `GET /docs` | Documentación Swagger interactiva |

---

## APIs externas

| Dato | Fuente | ¿Requiere clave? |
|------|--------|------------------|
| Clima | [Open-Meteo](https://open-meteo.com/) | No |
| Festivos | [Nager.Date](https://date.nager.at/) | No |
| Imágenes cosmos | [NASA Image Library](https://images.nasa.gov/) | No |
| Ubicación | Open-Meteo Geocoding | No |
| Fase lunar | Cálculo local (Python / TypeScript) | No |

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| Clima muestra "Sin datos" | Verifica que el servidor corra en el puerto 8000 y reinícialo si hace falta |
| Puerto 8000 ocupado | Cierra la terminal del servidor anterior o el proceso que use ese puerto |
| Sin estilos / pantalla en blanco | Usa `npm run dev` desde `chronos`, no abras archivos HTML directamente |
| Error `npm install` | Node.js 18+ instalado y en el PATH |
| Error `pip install` | Python 3.10+ con `pip` funcional |
| Imagen NASA no carga | El servidor hace proxy; confirma que `http://localhost:8000/api/health` responda `{ "ok": true }` |

---

## Publicar en producción

### Frontend en Vercel

**Paso 1 — Dashboard** (proyecto **Calendario** → **Settings** → **Build and Deployment**):

| Opción | Valor |
|--------|--------|
| **Root Directory** | *(vacío — raíz del repo)* |
| **Node.js Version** | **24.x** |
| **Framework Preset** | **Vite** |
| **Build Command** | *(dejar vacío para usar `vercel.json`)* |
| **Output Directory** | *(dejar vacío para usar `vercel.json`)* |

Si **Framework Preset** dice "Other" y el build tarda menos de 5 segundos, está mal: no compiló la app y verás **404**.

**Paso 2 — Subir el código** (debe existir `vercel.json` y `package.json` en la raíz del repo).

**Paso 3 — Redeploy** el último commit.

El `vercel.json` de la raíz compila `chronos/` y publica `chronos/dist/`.

En Vercel **sin backend Python**, la app usa las APIs públicas directamente (Open-Meteo, Nager.Date, NASA). Para usar tu servidor local en producción, despliega `server/` y define `VITE_API_URL` en las variables de entorno de Vercel.

> **Importante:** El frontend en Vercel es estático. Clima, festivos e imágenes NASA necesitan el backend Python desplegado por separado (Railway, Render, etc.) y configurar su URL en el frontend.

### Backend (Railway, Render, etc.)

- Directorio: `server`
- Comando: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Configura la URL del backend en el proxy o variable de entorno del frontend

---

## Tecnologías

- React 19, TypeScript, Vite, Tailwind CSS v4
- date-fns (fechas en español)
- Python, FastAPI, Uvicorn, HTTPX

---

*Proyecto educativo SENA — calendario web.*
