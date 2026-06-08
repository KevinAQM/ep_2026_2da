# Proyección Electoral Segunda Vuelta Perú 2026 🇵🇪

Este proyecto es una aplicación web interactiva de **Ciencia de Datos** que realiza un análisis estadístico y una extrapolación al **100% de actas contabilizadas** de la segunda vuelta presidencial en Perú (Keiko Fujimori vs. Roberto Sánchez). 

El tablero recopila datos oficiales por departamento en tiempo real, aplica un modelo de proyección proporcional regional y calcula los resultados finales tanto por departamento como a nivel nacional consolidado (excluyendo temporalmente el voto extranjero).

---

## 📐 Metodología y Análisis Estadístico

Dado que la API oficial de la web de origen no desglosa directamente los votos absolutos de cada candidato por región (solo proporciona el porcentaje del candidato líder, la ventaja en puntos, la ventaja en votos absolutos y el total de votos emitidos), el sistema realiza un proceso de ingeniería de datos para reconstruir y proyectar los resultados exactos:

### 1. Reconstrucción de Votos Válidos Actuales
Para cada región $r$, denotamos:
* $P_{lider}$: Porcentaje de votos válidos obtenido por el líder (de la API: `porcentajeLider`).
* $P_{segundo}$: Porcentaje del candidato no líder, calculado como $100\% - P_{lider}$.
* $V_{ventaja}$: Diferencia de votos absolutos entre candidatos (de la API: `ventajaVotos`).
* $P_{ventaja}$: Diferencia de porcentaje de votos (de la API: `ventajaPts`).

Sabemos por definición electoral que la ventaja en votos es proporcional a la diferencia en porcentaje sobre el total de **votos válidos** ($VV_r$):
$$V_{ventaja} = VV_r \times \frac{P_{ventaja}}{100}$$

Por lo tanto, despejamos el número exacto de votos válidos actuales:
$$VV_r = \text{redondear}\left( \frac{V_{ventaja}}{P_{ventaja} / 100} \right)$$

### 2. Cálculo de Votos Actuales por Candidato
Una vez que conocemos los votos válidos totales de la región ($VV_r$), calculamos los votos de cada candidato:
* Si **Keiko Fujimori** es la líder en esa región:
  $$V_{Keiko, r} = V_{segundo, r} + V_{ventaja}$$
  $$V_{Roberto, r} = \text{redondear}\left( V_{ventaja} \times \frac{100 - P_{lider}}{P_{ventaja}} \right)$$
* Si **Roberto Sánchez** es el líder en esa región:
  $$V_{Roberto, r} = V_{segundo, r} + V_{ventaja}$$
  $$V_{Keiko, r} = \text{redondear}\left( V_{ventaja} \times \frac{100 - P_{lider}}{P_{ventaja}} \right)$$

*Nota: Este método corrige las discrepancias de redondeo decimal de porcentajes y nos da la cantidad exacta de votos absolutos depositados.*

### 3. Extrapolación Estadística al 100% de Actas
Para proyectar cómo terminará la votación cuando se contabilice el 100% de las actas de una región, asumimos que **el comportamiento electoral y la proporción de votos válidos en las actas restantes se mantendrá constante** con respecto a las ya contabilizadas.

Sea $A_r$ el porcentaje de actas procesadas en la región (ej. $96.841\%$):
* **Factor de Extrapolación**: $F_r = \frac{100}{A_r}$
* **Votos Extrapolados de Keiko**: $V_{Keiko, r, proyectado} = \text{redondear}(V_{Keiko, r} \times F_r)$
* **Votos Extrapolados de Roberto**: $V_{Roberto, r, proyectado} = \text{redondear}(V_{Roberto, r} \times F_r)$
* **Votos Válidos Extrapolados**: $VV_{r, proyectado} = V_{Keiko, r, proyectado} + V_{Roberto, r, proyectado}$

### 4. Consolidación Nacional (Efecto de Peso Electoral)
La proyección nacional no es simplemente el promedio de los porcentajes regionales, sino la suma ponderada del volumen de votos de cada departamento. Esto genera el **desplazamiento del resultado consolidado** a medida que las regiones con más actas pendientes (que suelen tener tendencias muy marcadas) se acercan al 100%.

Sumamos los votos proyectados de las 25 regiones:
$$V_{Keiko, Nacional, proyectado} = \sum_{r=1}^{25} V_{Keiko, r, proyectado}$$
$$V_{Roberto, Nacional, proyectado} = \sum_{r=1}^{25} V_{Roberto, r, proyectado}$$
$$VV_{Nacional, proyectado} = V_{Keiko, Nacional, proyectado} + V_{Roberto, Nacional, proyectado}$$

Finalmente, el porcentaje nacional final de cada candidato se calcula sobre el consolidado proyectado:
$$P_{Keiko, Nacional, proyectado} = \frac{V_{Keiko, Nacional, proyectado}}{VV_{Nacional, proyectado}} \times 100\%$$
$$P_{Roberto, Nacional, proyectado} = \frac{V_{Roberto, Nacional, proyectado}}{VV_{Nacional, proyectado}} \times 100\%$$

### 5. Registro Histórico de Proyecciones (Evolución Temporal)
Para estudiar la estabilidad de nuestro modelo, la base de datos almacena el histórico de las proyecciones realizadas. Cada vez que se ejecuta el actualizador (`updater.py`), el sistema calcula la proyección nacional de ese momento y, si detecta un cambio en el porcentaje de actas contabilizadas, añade un punto en la línea de tiempo.

Esto permite visualizar en la web:
* **Convergencia del Modelo**: La rapidez con la que la proyección al 100% se estabilizó en torno a un resultado, en contraste con la fluctuación de los resultados actuales.
* **Modos de Gráfica**: Puedes alternar en el gráfico histórico de la web entre ver la evolución de las **proyecciones estimadas** (que se mantuvieron casi estables) versus la de los **votos reportados actuales** (que subieron progresivamente).

---

## 📂 Estructura del Proyecto

* **`index.html`**: Interfaz de usuario responsiva construida con HTML5 semántico. Carga las librerías de visualización (Chart.js) y estilos.
* **`style.css`**: Hoja de estilos con diseño contemporáneo Glassmorphic (desenfoque de fondos con `backdrop-filter`, paleta de colores oscuro-violeta y micro-animaciones en las tarjetas).
* **`app.js`**: El motor del tablero en JavaScript. Realiza la llamada a la API en vivo, ejecuta los cálculos de extrapolación explicados arriba, y gestiona la búsqueda, filtros y gráficos interactivos de evolución temporal.
* **`data.js`**: Base de datos local autogenerada que funciona como fallback de seguridad frente a problemas de CORS o de red en el navegador.
* **`updater.py`**: Script automatizado en Python para descargar los datos más recientes de la API y actualizar `data.js`.

---

## 🚀 Guía de Uso

### 1. Abrir el Tablero en el Navegador
Un servidor local ya está corriendo en segundo plano. Puedes abrir el panel y jugar con los filtros ingresando a:
👉 [**http://localhost:8080**](http://localhost:8080)

### 2. Actualizar a los Últimos Datos Oficiales
Para sincronizar el tablero interactivo con los datos actuales publicados por la ONPE, ejecuta el script de actualización desde tu terminal en Windows:
```powershell
wsl python3 /home/kevinaqm/proyectos-agencia/ep_2026_2da/updater.py
```
Al ejecutarlo, el script se conectará con el servidor backend, guardará la nueva información en `data.js` y, al recargar la web en el navegador, verás los cálculos y la proyección al 100% actualizados instantáneamente.
