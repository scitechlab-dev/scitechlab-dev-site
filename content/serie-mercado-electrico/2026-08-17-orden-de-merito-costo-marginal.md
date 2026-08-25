---
title: "Mercado mayorista II. Del orden de mérito al precio"
summary: "Cómo se construye la curva de oferta agregada y qué la rompe: un despacho de cuatro unidades resuelto a mano, con mínimo técnico y restricción de transmisión, y el salto del costo marginal al precio del MRS según el Anexo 09 del ROBCP."
date: 2026-08-17
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

::: nota Qué combustibles hay realmente del otro lado
El parque de arriba es inventado, así que vale decir con qué se trabaja de
verdad acá. El reglamento nombra los combustibles que contempla: el Anexo 16 se
aplica a las unidades térmicas que operan con **Gas Oil, Fuel Oil, Gas Natural y
Carbón Mineral** (1.1), y el formulario de datos de turbinas a gas del Anexo 06
le pide a cada generador declarar si su máquina quema diésel, gas natural,
búnker o combinaciones de ellos. Ese es el universo de lo que un generador
salvadoreño puede declarar, y por eso el artículo siguiente, el de la
declaración semanal, trabaja sobre esos combustibles y no sobre otros.

Cuál de ellos fija el precio en una hora concreta ya no lo decide el reglamento
sino la operación, y cambia con la hidrología, con la hora del día y con lo que
entre por los enlaces regionales. El propio Anexo 09 deja abierta la lista de lo
que puede resultar marginal: una térmica, una geotérmica, una hidroeléctrica,
una cogeneradora, una no convencional, una oferta de retiro de oportunidad o la
unidad de racionamiento forzado (3.1.2).

No pongo acá un porcentaje de horas por tecnología porque no lo verifiqué, y en
esta serie lo que no se leyó no se afirma. Sí anoto que es verificable y con
fuente pública: la ley obliga a la UT a publicar diariamente el nivel de los
embalses que reporta CEL y los precios de los combustibles puestos en planta que
reportan los generadores térmicos (art. 60, literales b y c), y el posdespacho
identifica la unidad marginal de cada intervalo. Contrastar unos meses de esas
publicaciones contra la cota del embalse es un ejercicio que sale como artículo
propio, y me lo anoto.
:::

## Un despacho resuelto a mano

Con la demanda en 260 MW, el orden de mérito despacha primero todo lo gratis,
después lo barato y al final lo caro: U1 inyecta 100, U2 inyecta 150 y U3
cubre los 10 restantes. La unidad marginal es U3 y el costo marginal, 95. El
costo total de operación de la hora:

$$
C = 100 \cdot 0 + 150 \cdot 70 + 10 \cdot 95 = 11\,450 \text{ USD/h}
$$

Ese número es lo que costó producir. No es lo que se pagó. Como todas las
unidades cobran el costo marginal, la liquidación de la hora se separa del costo
de operación, y la separación se ve mejor en una tabla que en una frase:

| Unidad | Inyección (MWh) | Costo variable (USD/MWh) | Lo que le costó producir (USD) | Lo que cobra a 95 (USD) | Renta (USD) |
|---|---|---|---|---|---|
| U1, hidro | 100 | 0 | 0 | 9 500 | 9 500 |
| U2, gas CC | 150 | 70 | 10 500 | 14 250 | 3 750 |
| U3, turbina | 10 | 95 | 950 | 950 | 0 |
| **Total** | **260** | | **11 450** | **24 700** | **13 250** |

La demanda paga 24 700 USD por una hora que costó 11 450 USD producir. Los
13 250 USD de diferencia son la renta inframarginal, y se reparten al revés de
como uno esperaría: **la unidad marginal se lleva cero**. U3, la que fija el
precio, cobra exactamente su costo variable, mientras U1, que no gastó nada en
combustible, se lleva la renta más grande de la hora. Cada unidad gana el ancho
del escalón que la separa del precio, y la marginal no tiene escalón.

Conviene no leer esa renta como utilidad neta, porque no lo es. Es de donde
salen los costos que el costo variable no incluye: personal, seguros,
mantenimiento mayor y, sobre todo, la inversión en la máquina. Una unidad que
solo cobrara su costo variable nunca recuperaría lo que costó construirla, y por
eso el reglamento no le confía toda la retribución al MRS: la capacidad se paga
aparte, por la capacidad firme del artículo 10-A, como quedó dicho en el primer
artículo de la serie.

Nótese también lo que el promedio ocultaría. Las tres unidades despachadas cobran
95 por cada MWh, aunque dos de ellas producen por debajo de ese costo. Esa es la
razón por la que a nadie le da igual dónde queda la demanda: mover la demanda un
megavatio hacia arriba no cambia el costo de nadie, cambia el precio de todos.

El mismo despacho, repetido con una restricción por vez, es el ejercicio que
muestra por qué el orden de mérito puro es una referencia y no una
descripción.

## Qué rompe el orden de mérito puro

**La generación obligada.** Supongamos que U4 debe inyectar al menos 30 MW
por razones de seguridad o pruebas, aunque su costo sea el más alto. El
despacho pasa a ser U1 con 100, U2 con 130 y U4 con 30: la unidad marginal
ahora es el diésel, el precio salta de 95 a 180 y el costo total sube a
14 500 USD/h. Romper el orden cuesta 3 050 USD/h en este ejemplo, y ese costo
lo paga la demanda en el precio.

El caso espejo es el de la unidad que queda en línea con un costo por encima
del precio. El reglamento no la deja perder: todo generador en línea cuyo
costo variable, incluida la parte variable de arranque y detención, resulte
mayor que el costo marginal de operación recibe una compensación por la
diferencia, que viaja a la demanda como cargo del sistema (Anexo 09, 3.1.6 y
3.2.2.9). A las hidroeléctricas se las compensa sobre el costo de oportunidad
del agua. Y hay tres exclusiones que conviene retener porque son
contraintuitivas: los generadores térmicos que venden únicamente excedentes,
los retiros regionales a cargo de participantes, y las unidades despachadas
como generación obligada para suplir déficit de reserva secundaria. Esa
última merece leerse dos veces. La unidad que se enciende precisamente porque
falta reserva no cobra compensación por el diferencial.

Hay además un efecto de segundo orden que el ejemplo esconde. Cuando el modelo
opera sin restricciones activadas, la unidad marginal es identificable y puede
ser térmica, geotérmica, hidroeléctrica, cogeneradora, no convencional, una
oferta de retiro de oportunidad o la propia unidad de racionamiento forzado
(3.1.2). Cuando hay restricciones activadas que impiden señalarla, el
reglamento no abandona el cálculo: se identifica la unidad cuyo costo variable
queda inmediatamente por debajo del costo marginal que arrojó el modelo, y la
UT informa las causas en el posdespacho (3.1.3). De ahí sale la respuesta a
una pregunta que suena imposible, la de cómo el costo marginal puede superar
el costo variable de todas las unidades despachadas: con una restricción
activa, el precio ya no es el costo de ninguna máquina en operación sino el de
servir un megavatio más bajo esa restricción.

**La reserva.** El despacho no programa solo energía. Toda unidad que opera en
el mercado mayorista debe aportar un 3 % de reserva de potencia activa
respecto de su propia inyección, destinada a la regulación primaria de
frecuencia (Anexo 11, 2.1). Eso se cuela dentro de la definición misma del
costo variable: el de una unidad térmica se calcula con el consumo de
combustible correspondiente a la generación a potencia máxima neta **menos**
el porcentaje de reserva rodante requerida para servicios auxiliares, más los
costos variables no combustibles (Anexo 09, 3.1.5). Un requerimiento de
reserva más exigente encarece el sistema por dos vías a la vez: obliga a
mantener máquinas operando fuera de su punto económico y desplaza el punto de
la curva de consumo en el que cada unidad declara su costo. Y si la reserva
programada queda por debajo de la requerida, el reglamento no la ignora: asigna
la reserva faltante a la unidad de racionamiento forzado y determina el costo
marginal a partir del costo de la URF para esa energía (3.6). Escasez de
reserva y escasez de energía terminan en el mismo lugar.

**La transmisión.** Partamos el mismo sistema en dos nodos. Al norte, U1 y U4,
con demanda de 120 MW; al sur, U2 y U3, con demanda de 140 MW; entre ambos,
una línea limitada a 10 MW que fluye de sur a norte. Sin congestión el
despacho óptimo usaría la línea en 20 MW; con el límite activo, el norte
debe encender su diésel: U1 con 100, la línea con 10 y U4 con 10, mientras
el sur opera U2 a su tope de 150 para cubrir sus 140 más la exportación.

Puesto nodo a nodo, con la pregunta que fija cada precio escrita al lado:

```
   NODO NORTE                              NODO SUR
   demanda 120 MW                          demanda 140 MW

   U1 hidro       0 USD/MWh -> 100 MW      U2 gas CC    70 USD/MWh -> 150 MW  (al tope)
   U4 diésel    180 USD/MWh ->  10 MW      U3 turbina   95 USD/MWh ->   0 MW  (en cero)
                                +--- 10 MW ---+
                                |  línea al   |
                                |   límite    |
                       norte <--+-------------+-- sur

   ¿quién daría el próximo MWh?
     en el norte   U4 ya está en línea y es lo único que queda   ->  180 USD/MWh
     en el sur     U2 está al tope, así que arrancaría U3        ->   95 USD/MWh

   precio norte 180  -  precio sur 95  =  85 USD/MWh de diferencia
   cargo por congestión = 10 MW x 85 USD/MWh = 850 USD/h
```

Tres cosas de ese esquema merecen leerse despacio. La primera es que el precio
del sur no lo fija la máquina que está inyectando, U2, sino la que **no** está
inyectando: el precio responde a quién serviría el próximo megavatio hora, y U2
ya no puede dar más. La segunda es que el norte paga 180 aunque la mitad de su
energía venga de una hidro a costo cero, porque el precio nunca es un promedio.

La tercera es la que suele quedar sin respuesta: los 850 USD/h de diferencia no
se los queda nadie de los que aparecen en el dibujo. No son del transmisor cuya
línea se saturó, ni del generador que quedó del lado caro, ni de la UT. Los
recauda la UT como cargo por congestión y **son de la demanda**, por mandato del
artículo 59 de la ley. Cómo llegan hasta la factura, por la vía del monto
remanente, es materia del sexto artículo de la serie.

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
precios entre MRS da lugar al cobro de cargos por congestión. El anexo
convierte eso en cuatro cálculos por intervalo: el costo marginal de cada MRS,
el precio de cada MRS, el flujo en cada línea que conecta dos de ellos y el
cargo por congestión de esa línea (3.5.2).

Vale preguntarse de quién es ese dinero, porque la respuesta no es obvia y no
la da el reglamento sino la ley. Los ingresos netos que obtiene la UT por el
manejo de los cargos por congestión se distribuyen entre los usuarios del
sistema, según el método que fije el regulador (art. 59). La renta de
congestión no le pertenece ni al transmisor cuya línea se saturó ni al
generador que quedó del lado caro: es de la demanda. Eso deja al operador sin
incentivo económico propio en una línea congestionada, que es exactamente la
neutralidad que su papel exige.

**El agua.** En un sistema con embalses, el costo variable de una hidro no es
cero: es el valor marginal del agua, que los modelos determinan como costo
futuro en función del volumen del embalse (Anexo 09, 3.1.8, y numeral 10.1.5).

La forma más rápida de entenderlo es dejar de ver el embalse como una central y
verlo como una cuenta de ahorros que solo recibe depósitos cuando llueve. Sacar
dinero de una cuenta de ahorros no cuesta comisión, y sin embargo nadie diría
que es gratis: cuesta exactamente lo que ese dinero habría servido para comprar
después. Con el agua pasa igual. Turbinar un metro cúbico hoy no consume ningún
combustible, pero obliga a que alguien queme combustible mañana para reponer esa
energía. **Ese combustible futuro es el precio del agua de hoy**, y por eso el
valor del agua se mide en USD/MWh y se apila en el orden de mérito como si fuera
un combustible más.

De ahí se sigue el resto sin esfuerzo. Con el embalse lleno, la cuenta rebosa y
el próximo metro cúbico casi no hace falta guardarlo: el agua vale poco y la
hidro entra primero. Con el embalse bajo, cada metro cúbico es el que va a hacer
falta en la sequía: el agua vale mucho y la hidro se corre hacia el fondo de la
fila, a veces detrás del diésel. La central no cambió, ni el caudal, ni ningún
precio declarado. Cambió cuánto vale lo que queda en la cuenta.

Dos reglas del anexo muestran que el mecanismo es fino, y las dos se leen solas
con la analogía puesta. Si la central está vertiendo, el valor del agua de ese
intervalo es cero (3.1.12): la cuenta se está desbordando y el agua que se iba a
perder de todos modos no tiene ningún valor futuro que proteger. Y si el valor
del agua produjera un costo marginal negativo, el costo marginal del sistema se
fija en cero (3.1.13): el precio puede llegar a cero, pero no se paga por
consumir. El despacho hidrotérmico convierte así al orden de mérito en un
problema temporal, no solo económico.

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
administración del mercado, el monto remanente, las pérdidas, los servicios
auxiliares (regulación de voltaje y reactivo, arranque en cero voltaje,
reserva fría por confiabilidad), las compensaciones relacionadas con la
determinación del costo marginal y el cargo complementario de transmisión
regional (3.2.1). Hay uno más, y es una curiosidad institucional que vale como
recordatorio: la lista abre con el cargo por actualización del registro en la
SIGET, el mismo regulador que desde julio de 2026 dejó de serlo. El texto
todavía dice SIGET y hoy quiere decir DGEHM. La energía se paga al costo
marginal; el resto, prorrateado.

Con el despacho de arriba, y tomando como cargo del sistema el mismo valor
ilustrativo que usa el sexto artículo de esta serie, la suma queda así:

| Componente | USD/MWh | Qué es |
|---|---|---|
| CMO | 95.00 | El costo variable de U3, la unidad marginal |
| Csis | 7.20 | Transmisión, administración del mercado, pérdidas, servicios auxiliares, compensaciones, monto remanente |
| **Precio del MRS** | **102.20** | Lo que paga quien retira esa hora |

En ese ejemplo los cargos del sistema pesan un 7 % del precio final, y esa es
toda la lectura que la cifra soporta. **El 7.20 es ilustrativo y no corresponde
a El Salvador**: no encontré publicado un valor de Csis para citar, uso el mismo
número del artículo VI para que la cadena de ejemplos de la serie cierre con
ella misma, y el valor real cambia hora a hora porque cambian las pérdidas, las
compensaciones y el monto remanente que lo componen.

Lo que sí vale como principio, y no depende del número, es la asimetría entre
los dos sumandos. El CMO se mueve con violencia: en el mismo ejemplo saltó de 95
a 180 por una sola unidad obligada. Los Csis son comparativamente estables y
prorrateados. Cuando el precio del MRS se dispara, casi nunca es por los cargos
del sistema. Y hay un componente que puede tener signo negativo, el monto
remanente, así que los Csis no siempre suman.

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

Y ahí queda abierta la pregunta que ordena el resto de la serie. Todo este
mecanismo toma los costos variables como dato de entrada, y ese dato no lo
mide nadie en tiempo real: lo declara el generador y lo valida la UT contra
una estructura aprobada. Cómo llega ese número, con qué respaldo y contra qué
referencia se contrasta, es el artículo siguiente.


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
- **ROBCP, Anexos**, misma versión. Anexo 11, Servicios Auxiliares: aporte
  obligatorio del 3 % de reserva de potencia activa para regulación primaria de
  frecuencia (2.1). Copia local: `normativa/robcp-anexos.pdf`. Consultado el 22
  de agosto de 2026.
- **Ley General de Electricidad (LGE)**, Decreto Legislativo No. 843 del 10 de
  octubre de 1996, con reformas hasta el Decreto No. 548 de abril de 2026.
  Artículos 55 a 58 (MRS, desvíos y congestión), 59 (destino de los ingresos
  netos por cargos por congestión), 60 (publicidad de los precios), 10-A
  (capacidad firme) y 112-E (metodología basada en costos mientras no haya
  competencia). Copia local: `normativa/ley-general-electricidad.pdf`.
  Consultado el 22 de agosto de 2026.

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
