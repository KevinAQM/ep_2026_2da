# Proyección Electoral Segunda Vuelta Perú 2026 🇵🇪

Este proyecto es una aplicación web interactiva de **Ciencia de Datos y Análisis Electoral** de última generación, migrada a **Next.js** y **React**, que realiza el seguimiento en tiempo real y la **extrapolación estadística al 100% de actas contabilizadas** de la segunda vuelta presidencial en Perú (Keiko Fujimori vs. Roberto Sánchez).

El tablero recopila datos oficiales en vivo desde los servidores de la ONPE, aplica un modelo dinámico de proyección regional basado en series de tiempo y calcula los resultados estimados consolidados tanto a nivel nacional (25 departamentos) como para el voto en el extranjero (5 continentes).

---

## 📈 Metodología y Análisis Estadístico

El sistema se conecta directamente a la API oficial de la ONPE. A diferencia de versiones anteriores donde la información se reconstruía a partir de diferencias de porcentaje, la aplicación actual recopila de forma directa los votos absolutos declarados por departamento/continente para cada candidato, así como los votos nulos, blancos y el porcentaje de actas contabilizadas.

Con esta base, el modelo aplica una **Proyección Predictiva por Promedio Móvil Exponencial (EMA)** en lugar de una extrapolación proporcional estática. Esto nos permite modelar la tendencia local de los últimos paquetes de actas procesadas en cada región, mejorando significativamente la precisión a medida que avanza el escrutinio.

### 1. Modelo de Proyección Marginal con EMA (Exponential Moving Average)
Para cada departamento o continente $r$, disponemos de una serie histórica de registros capturados en diferentes momentos del conteo. Denotamos los votos válidos en el instante $t$ como:
$$VV_{r,t} = V_{Keiko, r, t} + V_{Roberto, r, t}$$

Para estimar el comportamiento de las actas que aún no han sido procesadas, calculamos los deltas marginales de votos válidos entre capturas sucesivas de la serie:
$$\Delta V_{Keiko} = V_{Keiko, r, t} - V_{Keiko, r, t-1}$$
$$\Delta V_{Roberto} = V_{Roberto, r, t} - V_{Roberto, r, t-1}$$
$$\Delta V_{Valid} = \Delta V_{Keiko} + \Delta V_{Roberto}$$

Si $\Delta V_{Valid} > 0$, la proporción marginal obtenida en ese último tramo es:
$$s_{Keiko} = \frac{\Delta V_{Keiko}}{\Delta V_{Valid}}, \quad s_{Roberto} = \frac{\Delta V_{Roberto}}{\Delta V_{Valid}}$$

Aplicamos un suavizado exponencial sobre los últimos deltas para determinar las tasas de conversión esperadas de los votos restantes ($EMA_{Keiko}$ y $EMA_{Roberto}$):
$$\alpha = \frac{2}{N + 1}$$
$$EMA_{Keiko, t} = \alpha \cdot s_{Keiko} + (1 - \alpha) \cdot EMA_{Keiko, t-1}$$
$$EMA_{Roberto, t} = \alpha \cdot s_{Roberto} + (1 - \alpha) \cdot EMA_{Roberto, t-1}$$
*(donde $N$ es el tamaño de ventana de deltas analizados, limitado a un máximo de 10).*

**Caso Base (Fallback)**: Si no existen deltas históricos registrados en la serie (por ejemplo, en las primeras etapas de recolección de datos), el modelo adopta la proporción acumulada actual:
$$EMA_{Keiko} = \frac{V_{Keiko, r}}{VV_{r}}, \quad EMA_{Roberto} = \frac{V_{Roberto, r}}{VV_{r}}$$

### 2. Extrapolación de Votos Pendientes
Conociendo el porcentaje de actas procesadas en la región ($A_{r}$), calculamos el total de votos válidos proyectados y el volumen de votos faltantes:
$$VV_{r, proyectado} = \frac{VV_{r}}{A_{r} / 100}$$
$$V_{restantes} = \max(0, VV_{r, proyectado} - VV_{r})$$

Los votos finales proyectados al 100% de actas para la región $r$ se estiman sumando el conteo oficial actual más la proyección de los votos restantes usando la tasa EMA calculada:
$$V_{Keiko, r, proyectado} = \text{redondear}\left( V_{Keiko, r} + V_{restantes} \times EMA_{Keiko} \right)$$
$$V_{Roberto, r, proyectado} = \text{redondear}\left( V_{Roberto, r} + V_{restantes} \times EMA_{Roberto} \right)$$

### 3. Consolidación Nacional y del Exterior
El resultado global pondera correctamente el peso electoral de cada región evitando sesgos geográficos (por ejemplo, que las regiones urbanas con mayor velocidad de procesamiento inflen artificialmente una tendencia temprana):
$$V_{Keiko, Total, proyectado} = \sum_{r} V_{Keiko, r, proyectado}$$
$$V_{Roberto, Total, proyectado} = \sum_{r} V_{Roberto, r, proyectado}$$

El porcentaje consolidado final proyectado para cada candidato se calcula sobre el total estimado de votos válidos del ámbito seleccionado:
$$P_{Keiko, proyectado} = \frac{V_{Keiko, Total, proyectado}}{V_{Keiko, Total, proyectado} + V_{Roberto, Total, proyectado}} \times 100\%$$
$$P_{Roberto, proyectado} = \frac{V_{Roberto, Total, proyectado}}{V_{Keiko, Total, proyectado} + V_{Roberto, Total, proyectado}} \times 100\%$$

---

## 📂 Estructura del Proyecto (Organización y Modularización)

El proyecto se ha reestructurado utilizando la arquitectura de **Next.js (App Router)** y **React 19**, aislando el código frontend del backend de automatización y almacenamiento de datos, con la siguiente organización:

* **`app/`**:
  * **`page.js`**: Punto de entrada del servidor. Consulta los datos electorales del almacén de datos (KV/JSON) y los entrega al cliente para el renderizado inicial rápido.
  * **`layout.js`**: Define el envoltorio común de la interfaz, metadatos optimizados para SEO y carga las tipografías modernas.
  * **`DashboardClient.js`**: El corazón del tablero interactivo en el cliente. Maneja la lógica de las pestañas, búsqueda, ordenación por locale, cálculos reactivos de consolidación, renderizado dinámico de gráficos y visibilidad condicional.
  * **`globals.css`**: Hoja de estilos con diseño Glassmorphic (efectos de translúcido con `backdrop-filter`, sombras suaves, fondos degradados oscuros, micro-animaciones y soporte responsivo completo).
  * **`components/`**: Componentes React reutilizables (`NationalSummary`, `RegionGrid`, `RegionCard`, `DetailModal`, `Header`, `Footer`, `Controls`, etc.).
  * **`api/data/route.js`**: Endpoint de API `/api/data`. Realiza la descarga concurrente de las APIs oficiales de la ONPE para optimizar el rendimiento, calcula el modelo EMA, construye las series históricas y actualiza los registros en base de datos.
  * **`lib/db.js`**: Adaptador de base de datos. Se conecta al servicio cloud **Vercel KV** (Redis) y cuenta con un fallback de lectura/escritura en un archivo local `data.json`.
  * **`lib/utils.js`**: Funciones auxiliares para el procesamiento de datos electorales.
* **`scripts/`** (Aislamiento de código Python):
  * **`updater.py`**: Script robusto en Python que descarga la base de datos electoral de la ONPE localmente y actualiza `data.json` / `data.js`.
  * **`export_data.py`**: Script para consultar la base de datos Upstash Redis / Vercel KV, recuperar el historial de las últimas 20 actualizaciones y exportarlas en formatos CSV, XLS y XLSX (con formato numérico a 3 decimales).
* **`reports/`**: Directorio donde se almacenan y organizan los reportes de datos generados.
* **`data.json` / `data.js`**: Fallbacks locales de base de datos para garantizar el funcionamiento continuo del dashboard sin conexión.

---

## 🛠️ Nuevas Características del Tablero

1. **Soporte de Voto Extranjero**: Integración completa para alternar dinámicamente entre el escrutinio de **Perú** (25 departamentos) y el **Extranjero** (5 continentes).
2. **Selector de Vista**: Cambia con un solo clic entre ver los **Votos Oficiales ONPE** (conteo actual acumulado) y la **Proyección Estimada** (extrapolación al 100% mediante EMA).
3. **Consistencia Visual en Candidate Panels**: En la tarjeta principal de estadísticas (`metrics-card`), los candidatos siempre empiezan con **Roberto Sánchez (verde) a la izquierda** y **Keiko Fujimori (naranja) a la derecha**, tanto en los paneles de visualización de datos como en la barra de progreso dividida.
4. **Consistencia Visual en Tarjetas Regionales**: En la grilla de regiones, las tarjetas ahora muestran consistentemente a **Roberto Sánchez (verde) en la parte superior** y **Keiko Fujimori (naranja) en la parte inferior**, con su respectiva barra de progreso dividida (`split-bar`) teniendo la sección verde a la izquierda.
5. **Historial de Actualizaciones (Widget de Flujo)**: Se ha agregado un widget Glassmorphism que muestra las últimas 20 actualizaciones del conteo oficial de la ONPE (ordenadas de más reciente a más antigua) con una barra de scroll vertical responsiva. Muestra:
   * Fecha y hora en formato adaptado para móviles (en dos líneas).
   * Variación absoluta de votos de cada candidato respecto a la actualización anterior ($+$ o $-$).
   * Porcentaje de actas contabilizadas acumulado (calculado dinámicamente como promedio ponderado para el tab consolidado **TODOS**).
   * Porcentaje acumulado y diferencia de margen porcentual.
   Está disponible en las pestañas **PERÚ**, **EXTRANJERO** y **TODOS**.
6. **Esquema de Visibilidad Dinámica para TODOS**:
   * En el modo **Votos Oficiales ONPE**, al seleccionar el tab **TODOS**, la interfaz oculta la barra de búsqueda y la grilla de tarjetas regional, mostrando únicamente las métricas consolidadas, el gráfico de rosca y el historial consolidado de actualizaciones.
   * En el modo **Proyección Estimada**, al seleccionar el tab **TODOS**, se oculta todo elemento posterior a la tarjeta del gráfico de rosca (sección vacía).
7. **Buscador y Ordenamiento con Soporte de Tildes (Accents)**: Corrección del ordenamiento alfabético mediante `localeCompare` en español. Regiones como **ÁNCASH** y continentes como **ÁFRICA** se listan ahora en su orden correcto ("A"), eliminando errores de ordenación Unicode.
8. **Exportación de Reportes**: Automatización de generación de reportes en múltiples formatos Excel a través de `export_data.py`.

---

## 🚀 Guía de Desarrollo e Instalación

### 1. Instalación de Dependencias
Instala los paquetes necesarios definidos en el proyecto:
```bash
npm install
```

Para ejecutar los scripts de reportes en Python, instala sus dependencias adicionales:
```bash
pip install openpyxl pandas requests python-dotenv
```

### 2. Variables de Entorno (.env.development.local / .env.local)
Crea un archivo `.env.development.local` o `.env.local` en la raíz del proyecto:
```env
KV_REST_API_URL=tu_url_de_vercel_kv
KV_REST_API_TOKEN=tu_token_de_vercel_kv
API_SECRET_TOKEN=tu_token_secreto_para_el_endpoint_de_actualizacion
```

### 3. Servidor de Desarrollo
Inicia el servidor local de desarrollo de Next.js:
```bash
npm run dev
```
La aplicación estará disponible de forma interactiva en:
👉 [**http://localhost:3000**](http://localhost:3000)

### 4. Actualización de Datos vía API Endpoint
Realiza una petición GET segura para actualizar la base de datos en tiempo real:
```bash
curl -X GET "http://localhost:3000/api/data?secret=tu_token_secreto_para_el_endpoint_de_actualizacion"
```

### 5. Actualización Manual (Consola Python)
Para ejecutar el script de actualización manual de datos locales:
```bash
python3 scripts/updater.py
```

### 6. Exportación de Reportes de Actualización
Para conectarse a Redis/KV y descargar las últimas 20 actualizaciones históricas a archivos de reporte:
```bash
python3 scripts/export_data.py
```
Los archivos se guardarán en la carpeta `reports/`.
