---
title: "Mercado mayorista V. Los horizontes de la programación de la operación"
summary: "Son tres, no cuatro: anual, semanal y diaria. Qué decide cada uno y qué ya no puede decidir el siguiente, cómo se calcula el valor del agua en dos fases, por qué el mantenimiento se aprueba con un criterio probabilístico, y qué rompe un programa ya publicado."
date: 2026-08-20
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [programacion, valor-del-agua, mantenimientos, reserva, robcp]
estado: en-revision
math: true
---

Programar el día siguiente sería fácil si el sistema fuera puramente térmico.
Se conoce la demanda, se conocen los costos variables, se ordena el parque y
listo. Lo que impide resolverlo así es un embalse: turbinar hoy es no turbinar
mañana, y decidir cuánta agua gastar esta semana exige saber qué va a pasar en
las próximas ciento cincuenta. Por eso la programación no es un cálculo sino
una cadena de tres cálculos encadenados que corren a distinta velocidad y se
pasan información en las dos direcciones.

## Tres, y el cuarto que no existe

Conviene empezar corrigiendo algo que casi todo el material secundario repite.
El reglamento es explícito: la UT efectúa **tres** tipos de programación según
el horizonte cubierto, una anual, una semanal y una diaria, esta última llamada
también predespacho (ROBCP 7.1.2). No hay un horizonte mensual. Lo mensual es
otra cosa: es la cadencia con que se actualiza la programación anual (8.1.3 y
8.5.1). Confundir una periodicidad de actualización con un horizonte de
decisión lleva a buscar un producto que no existe.

Al lado de los tres está la operación en tiempo real, que no es programación
sino ejecución: las maniobras que la UT imparte para cumplir el plan de la
programación diaria (7.5.1).

El objetivo de los tres es el mismo, y está escrito una sola vez: determinar
los despachos y la operación de la transmisión que minimizan los costos totales
de operación y déficit, preservando seguridad y calidad, **con independencia de
la propiedad de las instalaciones y de los compromisos comerciales de los
participantes en el Mercado de Contratos** (7.6.1). Es la misma separación entre
plano financiero y plano físico que abrió esta serie, ahora enunciada como
mandato de la función objetivo.

<figure class="fig fig-wide">
  <img src="../assets/figures/horizontes.svg"
       alt="Tabla de tres columnas, una por horizonte. La anual cubre 52 semanas con detalle semanal y decide la política de operación de los embalses y el programa anual de mantenimientos mayores. La semanal cubre siete días de lunes a domingo con detalle horario y decide el valor del agua de la semana y el compromiso de unidades. La diaria cubre 24 horas con detalle horario y decide la inyección de cada unidad y los servicios auxiliares. Cada columna lista sus insumos, su producto y su calendario, y una flecha punteada de retorno muestra que la operación real vuelve a la actualización de la anual."
       width="1200" height="740" loading="lazy" />
  <figcaption>Leído de izquierda a derecha, cada horizonte le entrega al
  siguiente una decisión ya tomada que ese siguiente no vuelve a discutir. La
  anual fija la política de embalses y el programa de mantenimientos; la semanal
  fija el valor del agua; la diaria solo reparte potencia hora por hora dentro
  de lo que las otras dos dejaron. La flecha de retorno es la parte que se
  olvida: lo que efectivamente pasó reentra al principio.</figcaption>
</figure>

## La anual decide lo que la semanal ya no puede

La programación anual cubre cincuenta y dos semanas con detalle semanal (7.2.1)
y tiene cuatro objetivos declarados: disponer de una programación indicativa de
mediano plazo, detectar con antelación riesgos que afecten la seguridad de
abastecimiento, entregar una previsión referencial de costos marginales, e
identificar limitaciones de transmisión que puedan provocar congestión (8.1.1).

El calendario es preciso y vale memorizarlo. A más tardar el **1 de mayo** de
cada año la UT publica el informe de la programación anual, que va de la
**semana 20 de ese año a la semana 19 del siguiente** (8.1.2). Y a más tardar
el viernes anterior al inicio de cada mes publica la actualización, sobre las 52
semanas que arrancan el lunes siguiente (8.1.3). El año de la programación no es
el año calendario: es el año hidrológico, y esa es la primera señal de que todo
el diseño gira alrededor del agua.

Tres detalles del modelo anual que explican por qué no se puede replicar con una
hoja de cálculo:

**El horizonte de simulación excede al horizonte del producto.** Para determinar
correctamente la operación de los embalses, la simulación debe extenderse dos
años hidrológicos completos adicionales (8.2.2). Se publica un año y se simulan
tres.

**El resultado no es un número sino tres.** El análisis se hace para hidrología
normal, seca y húmeda, definidas como probabilidad de excedencia de 50 %, 90 % y
20 % respectivamente (8.2.4). Una proyección de costo marginal sin decir a qué
hidrología corresponde no significa nada.

**Los precios de combustible se congelan.** Los precios calculados que rigen al
entrar en vigencia la programación anual se consideran **constantes para todo el
horizonte** (8.3.1.9). Es la contracara exacta del artículo anterior: el mismo
precio que se recalcula cada semana para el despacho se mantiene fijo durante un
año para la planificación. No es una inconsistencia, es una decisión de diseño:
en el mediano plazo lo que se está optimizando es el agua, y meterle ruido de
precio semanal a un modelo de tres años solo agrega varianza sin información.

La lista de insumos del numeral 8.3.1 vale leerla completa una vez, porque
enumera todo lo que hay que tener antes de correr nada: estadística y pronóstico
de caudales, curvas cota-volumen y superficie-cota de los embalses, factor de
producción, evaporación media mensual, consumo específico por nivel de potencia
de cada térmica, tasas de indisponibilidad forzada, topología y capacidad de la
red, proyección de demanda, compromisos regionales firmes, programa de
mantenimientos aprobado, tasa de descuento y costo de déficit aprobados por el
regulador. Cuando falta un dato o la UT tiene objeciones, la UT estima con la
información más reciente de que disponga, sin que eso implique responsabilidad
de su parte (8.3.2).

## El valor del agua, en dos fases

La programación semanal cubre siete días de lunes a domingo con detalle horario,
y su objeto es minimizar el costo total de operación y déficit **considerando la
función de costo futuro al final de la semana** (9.1.1). Esa cláusula final es
todo el problema.

El proceso se hace en dos fases y conviene no mezclarlas. En la primera se
determina una tabla de valor del agua en función de la cota final del embalse,
usando el modelo de mediano plazo en etapas semanales, el mismo con el que se
hace la programación anual (9.4.2 y 9.5.6). En la segunda se determina la
programación semanal en etapas horarias, ya con esa tabla como dato (9.4.3).

El valor del agua es el costo de oportunidad del agua almacenada frente a la
alternativa de usar unidades térmicas, y no es determinístico: es el valor
esperado sobre los distintos escenarios hidrológicos futuros (9.5.1). En
notación, si $C_f(V)$ es la función de costo futuro en función del volumen del
embalse al final de la semana, el valor del agua es su pendiente cambiada de
signo:

$$
\text{VA} = -\frac{\partial C_f(V)}{\partial V}
$$

y esa función de costo futuro es justamente lo que produce el modelo de la
primera fase (9.5.3 y 9.5.7). Guardar un metro cúbico más vale exactamente lo
que ese metro cúbico ahorra de combustible en el futuro esperado.

<figure class="fig fig-wide">
  <img src="../assets/figures/valor-del-agua.svg"
       alt="Curva decreciente del valor del agua en dólares por MWh contra el volumen útil del embalse, de 200 con el embalse vacío a 5 con el embalse lleno. Tres líneas horizontales punteadas marcan los costos variables de las unidades térmicas del parque de ejemplo: 70 el gas de ciclo combinado, 95 la turbina de gas y 180 el diésel. La curva las cruza al 28.4 por ciento, al 20.1 por ciento y al 2.8 por ciento de volumen útil, y bandas de fondo indican en qué posición del orden de mérito queda la hidro en cada tramo. Un recuadro recuerda que si la central está vertiendo el valor del agua es cero sin importar la cota."
       width="1200" height="700" loading="lazy" />
  <figcaption>La hidro de embalse cambia de lugar en el orden de mérito sin que
  nadie declare nada. Con el embalse por encima del 28 % de su volumen útil el
  agua es más barata que el gas y entra primero; por debajo del 3 % es más cara
  que el diésel y el sistema prefiere quemar combustible antes que vaciar el
  embalse. <strong>La curva es ilustrativa</strong>; los costos térmicos son los
  del parque de ejemplo del segundo artículo, no los de El Salvador. El
  mecanismo, la forma de la curva y el tratamiento del vertimiento sí son los del
  reglamento.</figcaption>
</figure>

No todas las centrales hidroeléctricas tienen valor del agua, y la regla que
decide es física. Se determina valor del agua a una central cuyo volumen útil
propio, más el de los embalses aguas arriba, le permita generar **por lo menos
siete días a plena capacidad** (9.5.5). Por debajo de eso no hay transferencia
semanal que valorizar. Las centrales de pasada quedan fuera por la misma razón:
su uso lo determinan restricciones físicas y de economía dentro de la semana o
dentro del día, así que un valor basado en transferencias semanales no aporta
información significativa (9.5.4), y se las modela con caudal determinístico
proyectado (9.8.5).

La reprogramación semanal tiene un umbral numérico, que es de las pocas cifras
duras del capítulo: se entiende que hubo un cambio significativo en generación
hidroeléctrica si la acumulada desde el inicio de la semana difiere en **más de
5 %** de la establecida en la programación semanal para el mismo período
(9.2.1). También se reprograma si el propietario de una central señala riesgo de
vertimiento o de agotamiento no previsto.

## La reserva se descuenta antes de despachar

Un punto que en el papel parece contable y en la práctica mueve el precio: la
potencia máxima despachable de una unidad **no es su potencia máxima**. Es la
potencia máxima menos la reserva rodante, considerando los porcentajes de
reserva primaria y secundaria exigidos según sus características técnicas
(9.8.1). Y el costo variable combustible se calcula con el consumo específico
correspondiente a esa potencia máxima neta menos el porcentaje de reserva
rodante requerida (9.8.3), que es la misma regla que el Anexo 09 aplica al
determinar el costo marginal, y la que ya usamos en el artículo anterior para
fijar el punto donde se evalúa la curva.

El requerimiento de reserva rodante se calcula como un porcentaje de la demanda
de potencia y es la suma del aporte de reserva primaria y de reserva secundaria
bajo control automático de generación (12.4.3.1 y 12.4.3.2). Una unidad aporta
como máximo una reserva igual a la diferencia entre la inyección máxima que
puede entregar dentro del tiempo de respuesta máximo y su inyección real,
descontando restricciones de red y límites técnicos como la velocidad de toma de
carga (12.4.3.5). Ahí está la respuesta a por qué un parque con mucha máquina
lenta puede tener potencia disponible y aun así no tener reserva.

Y hay una escalera de escape que conviene conocer porque explica qué pasa
cuando el sistema no da. Si el despacho libre no alcanza la reserva necesaria,
la UT puede requerir la entrada en operación de una unidad habilitada no
despachada (12.4.3.6). Si aun así no se cumple, **la UT disminuye el porcentaje
de requerimiento** hasta igualarlo con la reserva máxima disponible, bajando
hasta los niveles de condición de emergencia (12.4.3.7). El sistema no se queda
sin programa: se queda con menos margen, y eso se paga después.

Una nota histórica que evita un error de lectura: la Reserva Fría por
Confiabilidad existe en el reglamento pero está en extinción. Los contratos
firmados antes de la entrada en vigencia siguen hasta su término, y **no se
llama a nuevas licitaciones ni se renuevan los existentes** (12.7.1.2). Quien
lea el capítulo 12 hoy está leyendo, en esa sección, un régimen transitorio.

## El mantenimiento se aprueba con una probabilidad

La coordinación de mantenimientos es responsabilidad de la UT (16.1.1), y los
mantenimientos mayores se consolidan en un Programa Anual de Mantenimientos
Mayores. Cada año todo participante informa sus solicitudes para las siguientes
cincuenta y dos semanas a partir de la semana veinte (16.2.2.2), que es
exactamente la ventana de la programación anual.

Vale detenerse en quiénes deben reportar, porque la lista es más ancha de lo que
se supone. Los generadores reportan mantenimientos que restrinjan su capacidad
declarada de inyección; los transmisores, los que limiten la capacidad de
transporte; y **los distribuidores y los usuarios finales, los que afecten la
capacidad de transporte en cualquiera de sus puntos de conexión con la red**
(16.2.1.2). Una subestación de distribución que sale por mantenimiento no es un
asunto interno de la distribuidora: entra al mismo programa nacional que una
central.

El criterio de aprobación no es una regla determinista sino probabilística. Se
considera cumplido si para cada semana del año el riesgo de falla en el
abastecimiento o de falla en el nivel de reserva es menor o igual que la
probabilidad definida en el Anexo de Normas de Calidad y Seguridad Operativa
(16.2.1.4), evaluada sobre escenarios probables construidos con la demanda
informada, los contratos regionales firmes, la estimación de transacciones no
firmes y la generación probable considerando contingencias de disponibilidad,
flexibilidad y **toda la hidrología histórica disponible** (16.2.1.5).

Esto responde con precisión a la pregunta de qué se hace con una solicitud de
mantenimiento que compromete la semana pico. No se rechaza por criterio: se
evalúa si con ese mantenimiento adentro el riesgo semanal sigue por debajo del
umbral, y si no lo está, se reubica la ventana. La conversación con el
participante deja de ser sobre voluntades y pasa a ser sobre un número.

## Del predespacho al redespacho

La programación diaria no vuelve a resolver el problema desde cero. En el
predespacho la UT, con base en la información más reciente, **actualiza la
programación del día siguiente elaborada en la programación semanal**
correspondiente (10.1.3). Y lo hace en dos pasadas: un predespacho nacional
inicial que no considera transacciones regionales, y un predespacho nacional
definitivo que las incorpora una vez coordinadas con el EOR.

Eso ordena la respuesta a qué decide cada horizonte. El valor del agua ya viene
dado de la semanal. El programa de mantenimientos ya viene dado de la anual. Lo
que la diaria resuelve es la asignación horaria dentro de esas dos decisiones,
más los servicios auxiliares necesarios para sostener la calidad y seguridad de
la red (10.1.1 b).

<figure class="fig fig-wide">
  <img src="../assets/figures/disparadores.svg"
       alt="Dos tarjetas comparadas. La izquierda, reprogramación semanal, vale por el resto de la semana y se dispara si la generación hidroeléctrica acumulada difiere en más de 5 por ciento de la programada, si cambian de forma significativa caudales, disponibilidad o transacciones regionales, o si el propietario señala riesgo de vertimiento o agotamiento. La derecha, redespacho, vale para lo que resta del día y se dispara por indisponibilidad de una unidad por tres intervalos o más que represente al menos el margen de reserva rodante, por diferencia entre demanda pronosticada y real mayor que ese margen, por indisponibilidad de un elemento de transmisión por más de cuatro intervalos, o por redespachos regionales. Abajo, un caso que no dispara ninguno."
       width="1200" height="520" loading="lazy" />
  <figcaption>Los dos mecanismos de corrección no son intercambiables y sus
  disparadores están tasados, no quedan a criterio del operador de turno.
  Nótese el caso del pie: una desviación de caudales sin riesgo de vertimiento
  no obliga a nada en tiempo real, y se corrige sola en los predespachos de los
  días siguientes.</figcaption>
</figure>

Hay un disparador que merece leerse aparte porque cambia el precio de forma
inmediata. Si el propietario de una central de embalse prevé vertimientos o
descargas por compuerta no considerados en la planificación, informa a la UT, y
la UT **asigna valor del agua igual a cero a ese embalse**, redespacha dando
prioridad de colocación a esa central, ajusta el plan de generación en tiempo
real y además reprograma la semana (13.10.2). Un vertimiento anunciado mueve la
hidro al fondo del orden de mérito, es decir al frente de la cola, y arrastra el
costo marginal hacia abajo en cuestión de intervalos.

## Cómo se encadena todo esto con lo anterior

El mapa queda así. La anual decide cuánta agua se puede gastar y cuándo se
puede sacar cada máquina a mantenimiento. La semanal traduce esa política en un
número, el valor del agua, y compromete unidades. La diaria reparte potencia
hora por hora dentro de esas decisiones, con los costos variables que salieron
del proceso de declaración y validación de los dos artículos anteriores. La
operación real ejecuta, y lo que efectivamente pasó vuelve como insumo a la
siguiente actualización mensual de la anual.

Un dato validado mal en el proceso semanal no se queda en su casilla. Entra al
predespacho como costo variable, ordena mal el parque, produce un costo marginal
que no correspondía y sale por el otro extremo como una liquidación equivocada.
Ese recorrido completo, desde la programación hasta el documento de
transacciones económicas, y su conexión con el mercado regional, es el artículo
siguiente.

::: nota Para retener: dos ideas del capítulo que no son obvias
**El mantenimiento de distribución es un asunto nacional.** El numeral 16.2.1.2
literal c mete al mismo Programa Anual de Mantenimientos Mayores la salida de una
subestación de distribución que afecte la capacidad de transporte en su punto de
conexión y la de una central de doscientos megavatios, y las evalúa con el mismo
criterio probabilístico de riesgo semanal. Planeamiento de distribución y
programación de la operación no son disciplinas distintas: son la misma con
distinto objeto y con un criterio económico explícito.

**La programación semanal descompone un problema estocástico en uno
determinístico más un parámetro.** Correr un modelo de mediano plazo solo para
producir una tabla que después alimenta a otro modelo es el patrón central del
capítulo: tres años de incertidumbre hidrológica se comprimen en un número por
nivel de embalse, y a partir de ahí la semana se resuelve como si el futuro no
existiera. Toda la dificultad conceptual vive en ese parámetro, y por eso lo que
hay que entender de este capítulo es el valor del agua, no el calendario.
:::

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP.pdf/129acc69-cb01-7ed4-7080-88be586df4ec?t=1729522985515).
  Capítulo 7, Programación de la Operación: objeto (7.1.1), los tres tipos de
  programación (7.1.2), coberturas y detalle de cada horizonte (7.2 a 7.4),
  operación en tiempo real (7.5.1), función objetivo con independencia de la
  propiedad y de los contratos (7.6.1) y coordinación con el planeamiento
  regional (7.8). Capítulo 8, Programación Anual: objetivos (8.1.1), calendario
  del informe anual y de la actualización mensual (8.1.2 y 8.1.3), contenidos y
  horizonte de simulación de dos años hidrológicos adicionales (8.2.1 a 8.2.4),
  información a utilizar incluida la constancia de los precios de combustible
  (8.3.1, en particular 8.3.1.9), resultados publicados (8.4.1), actualización
  mensual (8.5) y requisitos de los modelos (8.6.4). Capítulo 9, Programación
  Semanal: objeto y función de costo futuro (9.1.1), reprogramación y umbral del
  5 % (9.2.1), información requerida (9.3.1), las dos fases (9.4.2 y 9.4.3),
  concepto de valor del agua (9.5), resultados publicados (9.7.1) y
  representación de las centrales, con la potencia despachable neta de reserva
  (9.8). Capítulo 12, Servicios Auxiliares: reserva rodante, su requerimiento y
  la reducción del porcentaje en el límite (12.4.3), y régimen de la Reserva
  Fría por Confiabilidad (12.7.1). Capítulo 13, Operación en Tiempo Real:
  redespachos en el mercado nacional y sus causales (13.10.1), vertimiento no
  previsto (13.10.2) y desviaciones de caudal que no obligan a redespachar
  (13.10.3). Capítulo 16, Coordinación de Mantenimientos: responsabilidad de la
  UT (16.1.1), quiénes reportan (16.2.1.2), criterio probabilístico de
  aprobación (16.2.1.4 a 16.2.1.6) y plazos de envío (16.2.2.2). Copia local:
  `normativa/robcp.pdf`. Consultado el 22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 09, Cálculo del Precio en el MRS:
  costo variable térmico evaluado a potencia máxima neta menos reserva rodante
  (3.1.5) y valor del agua igual a cero en vertimiento (3.1.12). Anexo 11,
  Servicios Auxiliares: aporte del 3 % para regulación primaria de frecuencia
  (2.1). Copia local: `normativa/robcp-anexos.pdf`. Consultado el 22 de agosto
  de 2026.

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
