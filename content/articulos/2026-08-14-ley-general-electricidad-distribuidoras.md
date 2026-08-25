---
title: "La Ley General de Electricidad leída desde una distribuidora"
summary: "Qué obliga la LGE a quien opera una red de distribución, artículo por artículo: interconexión, cargos de red calculados sobre una empresa eficiente y no sobre la real, los cien metros del artículo 77-C, los cinco casos en que procede el corte, el mercado minorista que creó el Decreto 548 de 2026, y por qué se sanciona."
date: 2026-08-14
lang: es
topic: Regulación eléctrica
tags: [lge, distribucion, regulacion, generacion-distribuida]
estado: en-revision
math: false
---

Trabajar en una distribuidora es operar dentro de una ley que casi nadie del
lado técnico ha leído completa. Se conocen las normas de calidad porque llegan
como indicadores, y se conoce el pliego tarifario porque llega como precio, pero
el texto que da origen a las dos suele quedar del lado legal.

Esta es una lectura de la Ley General de Electricidad desde el lado de la
distribución: qué obliga, con qué plazo, y qué pasa cuando no se cumple. No es
asesoría legal, es una nota de estudio técnica. Todos los números de artículo
salen del texto de la ley con reformas hasta el Decreto 548 del 9 de abril de
2026, y lo que no se pudo verificar queda dicho como tal.

## Lo primero: no es una sola relación, son cuatro

La confusión de fondo, cuando uno lee la ley por primera vez desde la operación,
es tratar de encontrar "el capítulo de las distribuidoras". No existe. Las
obligaciones están repartidas porque responden a cuatro relaciones distintas,
que ocurren al mismo tiempo y con contrapartes distintas.

<figure class="fig fig-wide">
  <img src="../assets/figures/lge-cuatro-frentes.svg"
       alt="Cuatro columnas. Hacia la red: artículos 27, 28, 30 y 31 sobre la obligación de permitir interconexión, el visto bueno de la DGEHM, quién paga los costos y la responsabilidad por daños. Hacia el mercado: artículos 79, 78, 80 y 67 sobre en qué se basa el pliego, su presentación anual, la fórmula de ajuste y el cálculo de cargos sobre una empresa eficiente. Hacia el usuario: artículos 77-C, 76, 77 y 83 sobre la expansión de cien metros, la separación de cargos en la factura, la prohibición de cobrar por cambio de comercializador y los casos de corte. Hacia el regulador: artículos 32, 67-bis, 29-A y 8 sobre el informe semestral, el sistema auditable de calidad, el envío de resoluciones de interconexión y la contabilidad separada."
       width="1200" height="600" loading="lazy" />
  <figcaption>La misma empresa responde por la red, por sus compras, por sus
  usuarios y por su información, y cada frente tiene su propio artículo. El pie
  señala la conexión que más pesa: como los cargos de red se calculan sobre una
  distribuidora eficiente y no sobre la real, la eficiencia operativa del primer
  frente aparece como margen en el segundo.</figcaption>
</figure>

## El frente que más se subestima: interconectar es obligación

El artículo 27 dice que los transmisores y distribuidores **están obligados** a
permitir la interconexión de sus instalaciones y su utilización para el
transporte de energía, con una sola excepción: cuando eso represente un peligro
para la operación o la seguridad del sistema, de las instalaciones o de las
personas.

Vale detenerse en lo estrecha que es esa excepción. No dice "cuando no sea
conveniente" ni "cuando comprometa la calidad": dice peligro. Y el artículo 105
literal h convierte en infracción **muy grave** negarse a interconectar sin
justa causa, con multa de hasta 57 142.86 USD. Una negativa técnica tiene que
poder sostenerse como riesgo demostrable, no como criterio.

Las condiciones de la interconexión se sujetan a la normativa aplicable y
**necesitan visto bueno previo y expreso de la DGEHM** (art. 28), lo cual es
una de las reformas recientes: antes la relación era bilateral con recurso al
regulador, y ahora hay una aprobación aguas arriba. Si no hay acuerdo,
cualquiera de las partes acude al regulador por la vía del capítulo VII
(art. 29). Los costos de la interconexión los paga el solicitante salvo pacto en
contrario (art. 30), y todo operador responde por los daños que sus
instalaciones causen a los equipos con los que esté interconectado o a terceros
(art. 31).

Y hay una obligación de trazabilidad que es fácil de incumplir por
desorganización más que por voluntad: los distribuidores deben remitir a la
DGEHM copia de **todas** las solicitudes y resoluciones que emitan en cada etapa
de los procesos de interconexión, a más tardar cinco días hábiles después de
recibirlas o emitirlas (art. 29-A).

## Los cargos se calculan sobre una empresa que no existe

Este es el artículo que más conviene entender si uno trabaja del lado técnico,
porque explica de dónde sale la presión por eficiencia.

El artículo 67 fija que los cargos por uso de los sistemas de distribución se
basan en los costos medios de inversión, operación y mantenimiento de **una
empresa de distribución eficiente**, dimensionada de forma que pueda prestar el
servicio a la demanda actual de la distribuidora, a costos eficientes y
cumpliendo las normas de calidad. Como costo de inversión se usa la anualidad
del **valor nuevo de reemplazo** de una red eficiente, calculada con la vida útil
típica, la tasa de descuento de la ley y el efecto de la depreciación.

O sea que el ingreso regulado no remunera la red que la empresa tiene: remunera
la red que una empresa eficiente necesitaría para atender esa misma demanda. La
diferencia entre las dos la absorbe el accionista, y ese es exactamente el
incentivo que el diseño busca.

Tres precisiones del mismo artículo que importan en el día a día. Los costos
medios **no incluyen** mercadeo, comercialización ni servicios al usuario final,
que van por otra vía. Los costos de operación y mantenimiento incluyen el valor
esperado de las **compensaciones por fallas** de una red operada eficientemente,
así que las compensaciones no son una sorpresa que aparece cuando algo sale mal:
están dentro del modelo de costos. Y si la distribuidora recibió subsidios,
donaciones o fondos especiales para expandir su red, el valor de esos aportes se
excluye del valor nuevo de reemplazo (literal c): no se cobra dos veces por el
mismo activo.

La estructura del cargo cambia según el tamaño del usuario. Para mediana y gran
demanda se calcula sobre la **potencia entregada por nivel de tensión**, sin
considerar la energía; para la pequeña demanda, únicamente en función de la
energía consumida (literal b). La tasa real de descuento para estos efectos es
del diez por ciento, y está escrita en la propia ley (art. 68), no en un acuerdo
regulatorio.

El literal d es de las reformas nuevas: la DGEHM debe participar en el cálculo,
la determinación y la aprobación de esos cargos, con visto bueno previo en cada
una de las etapas.

## Lo que le debe la distribuidora al usuario, con número

El artículo 77-C es probablemente el más concreto de toda la ley y el que más
se cita en una oficina comercial. El distribuidor está obligado a expandir sus
líneas **hasta una distancia máxima de cien metros** para dar servicio a quien lo
solicite, y esa extensión corre por su cuenta; solo la acometida y el medidor
son a costo del usuario. Más allá de cien metros, la infraestructura excedente
corre por cuenta del usuario final, y puede desarrollarla el distribuidor con
cargo a él.

Y el mismo artículo agrega una obligación financiera que no siempre se lee: el
distribuidor **debe** ofrecer facilidades de pago para esas extensiones y para
los costos de conexión y reconexión, de hasta doce cuotas mensuales, iguales y
sucesivas, **sin intereses**.

Sobre la factura, dos reglas cortas. Hay que diferenciar los cargos por uso de
la red de los cargos por consumo de energía (art. 76). Y se tiene por no escrita
cualquier disposición contractual que establezca cargos por cambio de
comercializador (art. 77): no es que esté prohibido cobrarlo, es que la cláusula
no existe aunque esté firmada.

El corte del servicio procede en cinco casos, y la lista es taxativa (art. 83):
dos o más meses pendientes de pago; a solicitud del comercializador cuando el
usuario le deba dos o más meses; consumo sin autorización previa o incumplimiento
de las condiciones contractuales; instalaciones del usuario que pongan en peligro
la seguridad de personas o bienes; y negativa del usuario a dar acceso a sus
instalaciones internas.

## Calidad: medir, informar y pagar

El artículo 67-bis reparte el trabajo entre regulador y distribuidora de una
manera que vale tener clara. El regulador establece las normas de calidad, que
comprenden calidad del servicio técnico, del producto técnico y del servicio
comercial, y define la metodología de medición y control, el contenido y la forma
de intercambio de información, pudiendo auditar procesos e información en el
momento que considere necesario.

La distribuidora tiene tres obligaciones enumeradas. Disponer de un **sistema
auditable** que permita el análisis y tratamiento de las mediciones de calidad.
Informar en los períodos que el regulador indique, **indicando los
incumplimientos**. Y pagar a sus usuarios las compensaciones reguladas que
correspondan.

Ese primer literal es el más exigente de los tres, porque no pide un reporte:
pide un sistema auditable. La diferencia entre las dos cosas es toda la
diferencia entre poder mostrar un número y poder demostrar cómo se calculó, con
qué mediciones y con qué tratamiento. Es la misma exigencia que aparece del lado
del mercado mayorista para los costos declarados, y es la que justifica el
validador del séptimo artículo de la serie sobre el mercado.

A eso se suma el informe semestral del artículo 32, que debe contener al menos
la energía entregada por tipo de consumidor, la energía entregada a nombre de
terceros, los precios promedio por tipo de consumidor, las características y
fallas del sistema, el detalle total de las compensaciones por fallas
**diferenciando las atribuibles a la empresa**, y la calidad de los servicios.

## Lo nuevo: el mercado minorista

La reforma de abril de 2026 agregó a la ley una sección entera sobre generación
distribuida y otra sobre la actividad de distribución, y cambia bastante el
trabajo de una distribuidora.

<figure class="fig fig-wide">
  <img src="../assets/figures/lge-generacion-distribuida.svg"
       alt="Tres columnas de responsabilidad. La DGEHM emite lineamientos y fija precios de los contratos de abastecimiento en distribución, es responsable de los estudios de integración que fijan la capacidad máxima por circuito, y regula los cargos de interconexión. La distribuidora es la única compradora posible, debe suscribir los contratos que resulten, pone las señales a disposición de la UT, entrega información de sus redes y revisa sin costo los estudios de terceros. El generador distribuido entrega señales, aporta reserva de regulación, instala medición comercial y puede instalar almacenamiento. Abajo, dos exclusiones: una planta no puede estar en los dos mercados a la vez, y el generador con contrato no participa en capacidad firme."
       width="1200" height="600" loading="lazy" />
  <figcaption>El reparto deja a la distribuidora en una posición peculiar: es la
  única compradora posible de esa energía, pero no fija el precio ni decide si
  contrata. Todo el poder de decisión quedó aguas arriba.</figcaption>
</figure>

El artículo 32-A establece que los generadores distribuidos interconectados en
redes de distribución que participen en el mercado minorista **solo podrán vender
su energía a las distribuidoras**, mediante contratos de abastecimiento en
distribución. Pueden, alternativamente, formar parte del mercado mayorista
cumpliendo los requisitos correspondientes, pero una misma planta **no puede
estar en los dos mercados simultáneamente**.

Los contratos se celebran mediante procesos competitivos y transparentes según
lineamientos que emite la DGEHM por acuerdo, y **los precios los establece la
DGEHM** de forma que promuevan la competencia y trasladen los beneficios a la
tarifa. El cierre del artículo 32-B es la parte que conviene leer dos veces: las
distribuidoras **deberán suscribir** los contratos que se deriven de esos
procesos.

Es una posición de compradora única sin margen de negociación. La distribuidora
no elige el precio, no elige si contrata y no elige con quién: elige, como mucho,
cómo se conecta eso a su red. Y ni siquiera del todo, porque el artículo 32-C
pone en la DGEHM la responsabilidad de los estudios de integración que
determinan **la capacidad máxima de generación por cada circuito de
distribución**, elaborados con la información que proporcionen las distribuidoras
y transmisoras, y con apoyo técnico de la UT.

Las obligaciones operativas nuevas son tres y son de datos. Los generadores
distribuidos deben poner a disposición de las distribuidoras las señales de
registro, monitoreo y control de sus plantas, y **las distribuidoras deben poner
esas señales a disposición de la UT** a través de su sistema de comunicación de
datos (art. 32-D). Las distribuidoras deben proporcionar, actualizada, la
información que requieren los estudios de integración, con la estructura que
defina el Reglamento de Operación (art. 32-K). Y en todo lo relacionado con
generadores del mercado minorista, deben cumplir lo que requiera ese reglamento
(art. 32-J).

Dos exclusiones cierran el diseño. El generador distribuido con contrato de
abastecimiento **no participa en el reconocimiento de capacidad firme**
(art. 32-G), así que su retribución sale entera del contrato. Y está obligado a
proporcionar, por cuenta propia o comprándola, la reserva de regulación primaria
y secundaria de frecuencia cuando el Reglamento de Operación lo determine
(art. 32-E), pudiendo instalar almacenamiento para dársela a sí mismo
(art. 32-H).

Sobre los cargos de interconexión de estos proyectos hay una regla que va a
importar en la práctica: los regula la DGEHM, y si los estudios de interconexión
los desarrolla un tercero, **las empresas distribuidoras deberán revisarlos sin
costo adicional para el solicitante** (art. 28-A).

## Por qué se sanciona

La ley tipifica las infracciones en dos niveles, y conviene mirarlos juntos
porque varias conductas aparecen en los dos: lo que cambia es una palabra.

<figure class="fig fig-wide">
  <img src="../assets/figures/lge-infracciones.svg"
       alt="Dos columnas. Infracciones graves del artículo 104-bis con multa de hasta 5714.29 dólares: no inscribir contratos en plazo, negativa ocasional y aislada a facilitar información, información incompleta o inexacta, contabilidad que no cumple normas, aplicación irregular de normas de calidad y cargos de conexión que no cumplen el método. Infracciones muy graves del artículo 105 con multa de hasta 57142.86 dólares: negarse a interconectar sin justa causa, desconectar sin causa justificada, cargos de red fuera del método, negativa reiterada a informar, datos falsos o manipulados, aplicación irregular reiterada de pliegos y no separar contabilidades. Abajo, la escala por reincidencia, con hasta 17142.86 dólares diarios por incumplir una resolución firme."
       width="1200" height="700" loading="lazy" />
  <figcaption>La negativa a informar es grave si es ocasional y aislada, y muy
  grave si es reiterada. La aplicación irregular de los pliegos, lo mismo. El
  legislador no distinguió por la conducta sino por su persistencia, y eso
  significa que el registro de lo que se hizo y cuándo es lo que define en qué
  columna cae un incumplimiento.</figcaption>
</figure>

Entre las **muy graves** del artículo 105 hay tres que tocan directamente la
operación de red: negarse a interconectar sin justa causa o no permitir el uso
de las redes (literales h e i), desconectar las instalaciones de un operador sin
causa justificada (literal l), e interconectar instalaciones sin acuerdo con el
propietario de la red (literal j). Y dos que tocan la información: la negativa
reiterada a facilitar información que hay obligación de suministrar (literal m) y
**el suministro de datos falsos o indebidamente manipulados** (literal o).

Entre las **graves** del artículo 104-bis aparecen la negativa ocasional y
aislada a facilitar información, proporcionar información incompleta o inexacta o
en forma distinta a la establecida, y la aplicación irregular, intencionada o
negligente, de las normas de calidad de servicio.

Las multas son de hasta 5 714.29 USD para las graves y hasta 57 142.86 USD para
las muy graves (art. 106). Y hay dos escaleras que suben solas. La reincidencia
incrementa el monto en 10 % para la segunda infracción y 25 % para la tercera, y
a la **cuarta reincidencia en el mismo incumplimiento** se inicia el proceso para
declarar la terminación (art. 107). Y si existe una resolución firme que ordena
hacer o dejar de hacer algo y no se cumple en plazo, la multa puede llegar a
17 142.86 USD **diarios** hasta que se cumpla (art. 106).

Una aclaración sobre esas cifras, porque el texto de la ley no las dice así. La
LGE está redactada en colones, y fija cincuenta mil, quinientos mil y ciento
cincuenta mil respectivamente. La conversión que uso acá es la tasa fija e
inalterable de **8.75 colones por dólar** que estableció la Ley de Integración
Monetaria en 2001. El colón sigue siendo moneda de curso legal y por eso la ley
nunca se reescribió, pero como la moneda de uso es el dólar, dejar los montos en
colones hace que uno no dimensione la sanción. Conviene tener presente lo otro
que implica: **son montos nominales de 1996 que nadie indexó en treinta años.**
Cincuenta mil colones eran bastante dinero entonces; 5 714.29 USD hoy, para una
distribuidora, no lo son. Eso explica por qué la parte disuasiva del régimen no
está tanto en el monto como en la multa diaria, en la escala por reincidencia y
en la posibilidad de terminar la concesión.

Los criterios de graduación del artículo 106 incluyen el peligro para la vida y
la salud, el daño causado, los perjuicios a la continuidad y regularidad del
suministro, el beneficio obtenido, la intencionalidad, la reincidencia en tres
años y el efecto sobre terceros.

## Tres cosas que reordenan la lectura

**La contabilidad separada no es un tecnicismo contable.** El artículo 8 permite
que una misma entidad haga generación, transmisión, distribución y
comercialización siempre que establezca sistemas de contabilidad separados por
actividad y esté registrada como tal. No separarlos es infracción **muy grave**
(art. 105 literal d), igual que usar sistemas que no cumplan las normas del
regulador (literal e). El motivo es evidente cuando uno lo piensa desde el
artículo 67: si los cargos de red se calculan sobre costos de la actividad de
distribución, mezclar costos de otra actividad contamina directamente el cálculo
del cargo. La separación contable es lo que hace verificable la tarifa.

**El usuario final elige comercializador, no distribuidora.** El artículo 75
obliga a todo usuario final a contratar con un comercializador, que no puede
cobrarle tarifas mayores que las autorizadas a la distribuidora en cuya red está
conectado. Y el artículo 82 le permite negociar precios y condiciones distintos
de los aprobados, sin intervención del regulador, incluso a través de la Bolsa
de Productos y Servicios. La red es monopolio; el suministro, no.

**La ley prevalece.** El artículo 125 establece que, cuando exista discrepancia,
las disposiciones de la LGE prevalecen sobre lo dispuesto en otras leyes. Es útil
tenerlo presente cuando una obligación de la ley eléctrica choca con otra de
alcance general.

## Lo que queda sin verificar

Vale cerrar con esto antes que dejar la impresión de que la lectura está
completa.

**El Reglamento de la LGE no se pudo abrir.** Está en el catálogo de descargas
del regulador pero la página no lo expone a una petición directa. Eso importa
porque la propia ley delega en él varias cosas de las que hablé: la forma y
condiciones de la compensación por energía no entregada (art. 75), la
metodología de los precios del pliego (art. 79) y el tratamiento del desajuste
financiero (art. 78). Todo eso queda descrito acá solo hasta donde la ley lo
dice.

**Los acuerdos del regulador tampoco.** El método de los cargos por conexión y
reconexión (art. 77-A), las normas de calidad concretas y sus umbrales de
compensación (art. 67-bis) viven en acuerdos que no localicé en un repositorio
público. Sin ellos, lo que hay acá es el marco, no el parámetro.

**Los lineamientos de la DGEHM sobre contratos de abastecimiento en distribución
todavía no los busqué.** El artículo 32-B dice que se emiten por acuerdo, y son
la pieza que convierte toda la sección de generación distribuida en algo
operable.

Y una advertencia de método que vale para cualquiera que use esto: leí un texto
consolidado con reformas hasta abril de 2026, **que no incluye la reforma del 2
de julio de 2026** que trasladó la función reguladora de SIGET a la DGEHM. En
todo lo que cité como SIGET, hay que leer DGEHM para lo eléctrico, con la
transición corriendo. Esa reforma la desarrollé en el primer artículo de la
serie sobre el mercado mayorista.

::: nota Para retener: por qué conviene leer el texto y no solo su traducción
Del lado técnico la ley casi siempre llega traducida: como un indicador de
calidad que hay que cumplir, como un procedimiento de conexión, como un plazo.
Leer el texto directo cambia el orden de las cosas, porque el indicador que se
persigue tiene detrás un artículo que dice para qué existe, y varias decisiones
que parecen criterio interno de la empresa son en realidad el mínimo que la ley
fija.

El artículo 67 es el ejemplo más claro, y no por lo que dice sino por lo que
implica. La eficiencia operativa **no se traduce en más ingreso**: el ingreso ya
está fijado sobre una empresa eficiente teórica. Se traduce en la diferencia
entre ese ingreso regulado y el costo real de operar. Es una manera severa de
alinear incentivos, y explica desde el diseño lo que desde adentro suele leerse
como simple presión presupuestaria.

| Si se mejora | El ingreso regulado | El resultado |
|---|---|---|
| La eficiencia operativa | No cambia | Sube, por menor costo real |
| El cumplimiento de calidad | No cambia | Sube, por menos compensaciones |
| La inversión sobre lo eficiente | No cambia | Baja, la absorbe el accionista |
:::

## Fuentes

- **Ley General de Electricidad**, Decreto Legislativo No. 843 del 10 de octubre
  de 1996, Diario Oficial No. 201, Tomo No. 333, del 25 de octubre de 1996, con
  reformas hasta el Decreto Legislativo No. 548 del 9 de abril de 2026, Diario
  Oficial No. 66, Tomo No. 451, del 13 de abril de 2026. Copia local leída:
  `normativa/ley-general-electricidad.pdf`, 37 páginas, bajada del catálogo de
  SIGET. Artículos citados: 8 (separación de actividades y contabilidad), 9
  (cargos sujetos a regulación), 27 a 31 (interconexión), 29-A y 28-A
  (trazabilidad y cargos de interconexión de generación distribuida), 32
  (informe semestral), 32-A a 32-K (generación distribuida y actividad de
  distribución, incorporados por el Decreto 548), 67 (método de los cargos por
  uso de sistemas de distribución), 67-bis (normas de calidad), 68 (tasa de
  descuento del 10 %), 69 (expansión de la transmisión), 75 a 77-C (usuarios
  finales, factura y expansión de cien metros), 78 a 80 (pliego tarifario), 81 a
  83 (contratos y corte del servicio), 104-bis (infracciones graves), 105
  (infracciones muy graves), 106 y 107 (sanciones y reincidencia), 121 (uso de
  redes de terceros) y 125 (prevalencia de la ley). Consultado el 22 de agosto
  de 2026.
- **Ley de Integración Monetaria**, Decreto Legislativo No. 201 del 30 de
  noviembre de 2000, vigente desde el 1 de enero de 2001. Artículo 1: tipo de
  cambio fijo e inalterable de **8.75 colones por dólar**. Es la tasa con la que
  convertí los montos de las multas, que la LGE fija en colones porque nunca se
  reescribió. **No abrí el texto de esta ley**: la tasa es de conocimiento
  general y verificable en cualquier factura salvadoreña, pero por consistencia
  con el resto de la serie lo digo en vez de presentarla como fuente leída.

Este artículo es previo a la [serie sobre el mercado mayorista](../serie/mercado-electrico),
que entra en el lado de la generación y el despacho. El registro de fuentes
primarias de esa serie está en [Fuentes primarias](../fuentes).
