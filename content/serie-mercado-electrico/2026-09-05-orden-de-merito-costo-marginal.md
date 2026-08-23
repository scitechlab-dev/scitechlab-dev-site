---
title: "Mercado mayorista II. Del orden de mérito al precio"
summary: "Cómo se construye la curva de oferta agregada y qué la rompe: un despacho de cuatro unidades resuelto a mano, con mínimo técnico y restricción de transmisión, y el salto del costo marginal al precio del MRS según el Anexo 09 del ROBCP."
date: 2026-09-05
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [costo-marginal, despacho]
estado: en-revision
math: true
---

El precio de la energía en el mercado mayorista no lo fija el costo promedio
de las unidades que operan: lo fija el de la última que entra. Por debajo de
esa frase hay un problema de optimización pequeño, un reglamento que lo
ejecuta hora a hora y una lista corta de restricciones que lo rompen.

## El problema de optimización

Cada día, la UT programa el día siguiente con un único criterio de
eficiencia: cubrir la demanda minimizando el costo total de operación, dadas
las disponibilidades de potencia, los costos variables y las restricciones
operativas y de transmisión. El ROBCP lo enuncia así en el numeral 10.1.1, y
el modelo con que lo resuelve, el Sistema de Administración del Mercado (SAM),
debe programar las inyecciones a mínimo costo y determinar los costos
marginales de operación previstos en cada MRS (10.2.1).

En notación de optimización, el problema de un intervalo es corto de escribir:

$$
\min \sum_{i} c_i \, p_i \quad \text{sujeto a} \quad \sum_{i} p_i = D,
\quad 0 \le p_i \le \bar p_i
$$

donde $c_i$ es el costo variable de la unidad $i$ en USD por MWh, $p_i$ su
inyección, $\bar p_i$ su potencia disponible y $D$ la demanda del intervalo.
El precio sombra de la restricción de balance, lo que cuesta servir un MWh
más, es el costo marginal:

$$
\text{CMg} = \frac{\partial C(D)}{\partial D}
$$

con $C(D)$ el costo total de operación al despacho óptimo. El Anexo 09 del
ROBCP define lo mismo en idioma regulatorio: el costo incremental incurrido
para satisfacer un incremento marginal de la demanda, manteniendo las
condiciones de optimización y la factibilidad del despacho (3.1.1). Teoría y
reglamento dicen lo mismo, y el anexo agrega lo que la teoría no dice: a ese
costo se le paga a todos los que inyectan al MRS, no solo a la unidad
marginal. Ahí nace la renta que hace interesante al mercado.

## La curva de oferta agregada

La curva de oferta del sistema se construye apilando las capacidades de las
unidades en orden creciente de costo variable. Ese orden es el orden de
mérito, y la curva es una escalera: cada escalón mide la capacidad de una
unidad en el eje horizontal y su costo variable en el vertical. Donde la
demanda cruza la escalera queda definida la unidad marginal.

Con un parque de ejemplo de cuatro unidades, la escalera tiene cuatro
escalones:

| Unidad | Tecnología | Capacidad (MW) | Costo variable (USD/MWh) |
|---|---|---|---|
| U1 | hidro de embalse | 100 | 0 |
| U2 | gas, ciclo combinado | 150 | 70 |
| U3 | gas, turbina | 100 | 95 |
| U4 | diésel | 80 | 180 |

En el ejemplo la hidro entra a costo cero para no meter todavía el valor del
agua; la sección sobre lo que rompe el orden de mérito lo incorpora.

<figure class="fig fig-wide">
  <img src="../assets/figures/orden-de-merito.svg"
       alt="Curva de oferta agregada por escalones: U1 de 0 a 100 MW a costo cero, U2 de 100 a 250 a 70 USD/MWh, U3 de 250 a 350 a 95 y U4 de 350 a 430 a 180. La demanda de 260 MW cruza el escalón de U3, y una línea punteada a 95 USD/MWh marca el costo marginal que cobran todas las unidades despachadas."
       width="1200" height="700" loading="lazy" />
  <figcaption>La demanda de 260 MW cae sobre el escalón de U3: esa unidad es
  la marginal y su costo variable, 95 USD/MWh, es el costo marginal del
  sistema. U1, que produce a costo cero, cobra 95 como las demás. <strong>Las
  cifras son ilustrativas y no corresponden a El Salvador</strong>: el parque
  es un ejemplo para mostrar el mecanismo.</figcaption>
</figure>

## Un despacho resuelto a mano

Con la demanda en 260 MW, el orden de mérito despacha primero todo lo gratis,
después lo barato y al final lo caro: U1 inyecta 100, U2 inyecta 150 y U3
cubre los 10 restantes. La unidad marginal es U3 y el costo marginal, 95. El
costo total de operación de la hora:

$$
C = 100 \cdot 0 + 150 \cdot 70 + 10 \cdot 95 = 11\,450 \text{ USD/h}
$$

Nótese lo que el promedio ocultaría: las tres unidades despachadas cobran 95
por cada MWh, aunque dos de ellas producen por debajo de ese costo. La
diferencia entre el costo variable de cada unidad y el precio que cobra es la
renta que el mercado de corto plazo redistribuye, y la razón por la que a
nadie le da igual dónde queda la demanda.

El mismo despacho, repetido con una restricción por vez, es el ejercicio que
muestra por qué el orden de mérito puro es una referencia y no una
descripción.

## Qué rompe el orden de mérito puro

**La generación obligada.** Supongamos que U4 debe inyectar al menos 30 MW
por razones de seguridad, reserva o pruebas, aunque su costo sea el más alto.
El despacho pasa a ser U1 con 100, U2 con 130 y U4 con 30: la unidad marginal
ahora es el diésel, el precio salta de 95 a 180 y el costo total sube a
14 500 USD/h. Romper el orden cuesta 3 050 USD/h en este ejemplo, y ese costo
lo paga la demanda en el precio. El ROBCP conoce el caso espejo, el de la
unidad obligada a operar cuyo costo queda por encima del precio: no se la
deja perder, se le compensa la diferencia entre su costo variable y el costo
marginal, prorrateada entre la demanda (Anexo 09, 3.1.6 y 3.2.2.9). Y si lo
que falta es reserva, el costo marginal se determina con el precio de la
unidad de racionamiento forzado correspondiente al faltante (3.6).

**La transmisión.** Partamos el mismo sistema en dos nodos. Al norte, U1 y U4,
con demanda de 120 MW; al sur, U2 y U3, con demanda de 140 MW; entre ambos,
una línea limitada a 10 MW que fluye de sur a norte. Sin congestión el
despacho óptimo usaría la línea en 20 MW; con el límite activo, el norte
debe encender su diésel: U1 con 100, la línea con 10 y U4 con 10, mientras
el sur opera U2 a su tope de 150 para cubrir sus 140 más la exportación.

<figure class="fig fig-wide">
  <img src="../assets/figures/congestion.svg"
       alt="Dos nodos unidos por una línea congestionada de 10 MW. En el nodo norte, la hidro y el diésel fijan un precio de 180 USD/MWh; en el nodo sur, el gas opera al tope y el precio lo fija la turbina de 95 que quedó en cero. El cargo por congestión es el flujo por la diferencia de precios: 850 USD/h."
       width="1200" height="640" loading="lazy" />
  <figcaption>Con la línea al límite ya no hay un precio sino dos. El precio
  del sur no lo fija la unidad que inyecta, U2, sino la que serviría el
  próximo megavatio: U3, en cero, con 95. El norte paga 180. La diferencia
  por megavatio transportado es el cargo por congestión. <strong>Las cifras
  son ilustrativas</strong>: el mecanismo es el del ROBCP (10.6.3 y Anexo 09,
  num. 3.5), no un caso real.</figcaption>
</figure>

El resultado es el desdoblamiento que el reglamento describe literalmente:
con congestión, el sistema se divide en tantos MRS como haga falta para que
dentro de cada uno no la haya, y cada MRS tiene su propio costo marginal
(10.6.3.1); sin congestión, un solo MRS y un solo precio (10.6.3.2). La Ley
General de Electricidad ya lo anticipa en su artículo 58, y la diferencia de
precios entre MRS da lugar al cobro de cargos por congestión.

**El agua.** En un sistema con embalses, el costo variable de una hidro no es
cero: es el valor marginal del agua, que los modelos determinan como costo
futuro en función del volumen del embalse (Anexo 09, 3.1.8, y numeral 10.1.5).
El agua vale porque turbinarla hoy es no turbinarla mañana, y ese valor
mueve a la hidro dentro del orden de mérito como si fuera un combustible. Dos
reglas del anexo muestran que el mecanismo es fino: si la central está
vertiendo, el valor del agua de ese intervalo es cero (3.1.12), y si el valor
del agua produjera un costo marginal negativo, el costo marginal del sistema
se fija en cero (3.1.13). El despacho hidrotérmico convierte así al orden de
mérito en un problema temporal, no solo económico.

**El compromiso de unidades.** El despacho hora a hora supone a cada unidad
encendida o apagada, pero decidir qué unidades encender es otro problema:
arrancar y detener cuesta combustible y desgaste térmico. El reglamento no
mete ese costo en el orden de mérito como tal: suma al costo variable de toda
unidad en línea la parte variable asociada al costo de arranque y detención,
calculada según el Anexo 17 (3.1.6), y trata el resto mediante compensaciones.
La distinción importa: el costo marginal responde a la operación continua, y
el arranque se recupera por otra vía.

**La demanda que no se puede servir.** Si con todo el parque disponible la
demanda no se cubre, el precio no queda sin cota: el costo marginal en
condición normal no puede superar el precio del primer escalón de la unidad
de racionamiento forzado, y con racionamiento despachado, el del último
escalón despachado (3.1.15). El precio del MRS tiene techo legal incluso en
el déficit.

## Del costo marginal al precio del MRS

El costo marginal no es todavía el precio que la liquidación usa. El Anexo 09
los separa con una suma:

$$
P_{\text{MRS}} = \text{CMO} + \text{Csis}
$$

el precio del MRS es el costo marginal de operación más los cargos del
sistema (3.3.1). Los Csis son el traslado directo a la demanda de lo que el
mercado cuesta por fuera de la energía: el uso del sistema de transmisión, la
administración del mercado, las pérdidas, los servicios auxiliares, las
compensaciones y los cargos regionales (3.2). La energía se paga al costo
marginal; el resto, prorrateado.

Tampoco es el mismo número antes y después de la hora. El costo marginal del
predespacho es ex ante y de carácter indicativo (3.1.14, 10.5.7): sirve para
que cada participante programe sus medios y anticipe su posición comercial.
El que liquida es el ex post, recalculado en el posdespacho diario con las
lecturas reales de inyección y retiro del SIMEC, simulando las condiciones
reales de demanda, vertimiento, generación forzada y transacciones regionales
(3.1.14 y 3.8). Y si durante la hora una falla impide el despacho económico,
el intervalo se parte en dos subperíodos y el precio de cada uno lo fija el
costo variable de la unidad más cara en línea (3.4); en emergencia declarada,
los contratos quedan sin efecto y cada inyección se remunera a su costo
variable (3.7).

Sobre todo eso, la ley. El artículo 112-E de la LGE obliga a que, mientras no
existan condiciones de competencia en el MRS, la metodología se base en costos
marginales de producción, costos fijos y de inversión, y en el valor de
reemplazo del agua para las hidroeléctricas. Los artículos 55 a 57 valoran las
desviaciones contra el despacho programado a los precios que resulten de la
operación del MRS. Y la retribución de la energía no incluye la de la
capacidad: esa va por separado, mediante la capacidad firme del artículo
10-A, como quedó dicho en el primer artículo de la serie.

Un último rasgo merece estudio aparte. Toda la información con la que la UT
corre el predespacho se pone a disposición de los participantes de forma que
cualquiera pueda replicarlo (10.3.7). En un mercado donde el precio sale de
costos declarados, la replicabilidad del despacho es la contraparte operativa
de la auditoría: el mismo diseño que obliga a declarar obliga a que el
resultado se pueda verificar desde afuera.

::: nota El ejercicio de la pizarra
Resolver el despacho de las cuatro unidades en voz alta, primero sin
restricciones, después con el diésel obligado a 30 MW y después con la línea
congestionada, es el ejercicio del módulo. La prueba es que los tres precios
salgan sin notas: 95, 180 y el par 180 con 95. Si hay que mirar la curva, el
mecanismo todavía no está.
:::

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de
  2026. Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP.pdf/129acc69-cb01-7ed4-7080-88be586df4ec?t=1729522985515).
  Capítulo 10, Programación Diaria o Predespacho: objeto de mínimo costo
  (10.1.1), el SAM y sus requisitos (10.2.1), replicabilidad del predespacho
  (10.3.7) y costo marginal por MRS con congestión (10.6). Copia local:
  `normativa/robcp.pdf`. Consultado el 22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 09, Cálculo del Precio en el MRS:
  definición del costo marginal (3.1.1), costos variables por tecnología
  (3.1.5 a 3.1.13), premisas del cálculo (3.1.15), precio igual a costo
  marginal más cargos del sistema (3.3.1), congestión (3.5), reserva faltante
  (3.6) y emergencia (3.7). Copia local: `normativa/robcp-anexos.pdf`.
  Consultado el 22 de agosto de 2026.
- **Ley General de Electricidad (LGE)**, Decreto Legislativo No. 843 del 10 de
  octubre de 1996, con reformas hasta el Decreto No. 548 de abril de 2026.
  Artículos 55 a 58 (MRS, desvíos y congestión), 10-A (capacidad firme) y
  112-E (metodología basada en costos mientras no haya competencia). Copia
  local: `normativa/ley-general-electricidad.pdf`. Consultado el 22 de agosto
  de 2026.

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
