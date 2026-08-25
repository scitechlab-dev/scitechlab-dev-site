---
title: "Mercado mayorista VI. Cómo se conecta El Salvador al mercado regional, y cómo termina todo en una factura"
summary: "Un enlace exportador se modela como demanda inflexible y uno importador como generador inflexible, y por eso el MER mueve el costo marginal nacional sin ninguna regla especial. Además, el piso de precio que impide exportar por debajo del costo validado, y el recorrido completo de un megavatio hora hasta el documento de transacciones económicas."
date: 2026-08-21
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [mer, eor, liquidacion, simec, dte, robcp]
estado: publicado
math: false
---

Una importación barata desde Guatemala no entra al despacho salvadoreño por una
puerta especial. Entra como un generador más, y uno bastante particular: un
generador inflexible, colocado en el nodo del enlace, cuyo valor lo fijó otro
operador en otro país. A partir de ahí el modelo hace lo mismo que haría con
cualquier máquina. Esa sola decisión de modelado explica casi todo lo que pasa
cuando el mercado regional toca el precio nacional.

## Quién manda sobre qué

La UT es la responsable de la coordinación operativa y comercial de las
inyecciones y retiros regionales, y considera al Ente Operador Regional como su
contraparte regional para coordinarlas (ROBCP 11.1.1 y 11.1.2). Para esa
coordinación la UT utiliza la reglamentación regional (11.1.3), mientras que las
transacciones que envían los participantes deben cumplir los procedimientos y la
metodología del reglamento nacional (11.1.4).

Dos cuerpos normativos gobernando la misma transacción es una receta conocida
de conflicto, y el reglamento la resuelve de una manera que dice bastante sobre
la jerarquía real. Si hay contradicción entre la regulación regional y el ROBCP,
**la UT analiza la situación específica y propone al regulador las adecuaciones
al reglamento nacional** para armonizarlo con el regional (11.1.5). No al revés.
El que se mueve es el reglamento de acá.

## El predespacho se corre dos veces

El mecanismo de acoplamiento es un ciclo de cuatro pasos que ya asomó en el
artículo anterior y que ahora vale seguir completo.

<figure class="fig fig-wide">
  <img src="../assets/figures/predespacho-regional.svg"
       alt="Cuatro pasos en fila. Primero el predespacho nacional inicial sin transacciones regionales, que deja ver cuánta energía queda sin requerir por unidad. Segundo, los participantes ofertan lo no requerido al MER con piso de precio, y la UT traslada las ofertas al EOR. Tercero, el EOR casa el mercado regional y devuelve por enlace el programa de importación o exportación, con prioridad de contratos firmes sobre flexibles y de estos sobre oportunidad. Cuarto, el predespacho nacional definitivo vuelve a correr el modelo con los enlaces adentro. Debajo, dos tarjetas muestran que un enlace exportador se modela como demanda inflexible en el nodo y uno importador como generador inflexible."
       width="1200" height="700" loading="lazy" />
  <figcaption>La secuencia importa porque el paso 1 es lo que define qué hay
  para vender. La energía ofertable no es la capacidad instalada ni la
  disponible: es la que el despacho nacional no necesitó. Y en el paso 4 el
  programa que devuelve el EOR entra al modelo como un dato fijo, no como una
  variable a optimizar.</figcaption>
</figure>

Las dos reglas de modelado están escritas casi con las mismas palabras, y
conviene citarlas juntas porque son simétricas. Para cada enlace reportado como
exportador por el EOR, el modelo debe considerar en el nodo de enlace **una
demanda inflexible** igual al valor programado (11.5.4). Para cada enlace
reportado como importador, **un generador inflexible** igual al valor programado
(11.5.5).

De ahí sale, sin necesidad de ninguna regla adicional, la respuesta a cómo
afecta una importación al despacho nacional. Entra un generador que el orden de
mérito no tiene que decidir si despacha: ya está despachado. Ese bloque desplaza
a la unidad más cara que estaba en línea, y como el costo marginal lo fija la
última unidad que entra, el costo marginal baja. Una exportación hace lo
contrario: agrega demanda, obliga a subir por la curva de oferta y empuja el
costo marginal hacia arriba. El país que exporta le vende a un precio regional y
le sube el precio a su propia demanda, y eso no es un defecto del diseño sino su
consecuencia aritmética.

Los retiros regionales asociados a demanda flexible casada en el MER también se
modelan como demanda inflexible en el nodo correspondiente (11.5.2), y las
inyecciones regionales asociadas a demanda flexible que sí fue casada por precio
en el predespacho inicial se modelan como una reducción de la demanda programada
en ese nodo (11.5.3). Todo termina siendo demanda o generación en un nodo.

## El piso que impide exportar barato

Acá está la pieza que amarra este artículo con los tres anteriores, y es la
regla menos evidente del capítulo.

Un participante autorizado en el MER que quiera ofertar al mercado regional la
generación no requerida en el predespacho nacional inicial no puede poner el
precio que quiera. **La oferta debe ser mayor o igual al costo variable de la
unidad, o al valor del agua para las hidráulicas, considerado por la UT en el
predespacho nacional inicial, incrementado en los cargos del sistema promedio
horario del último documento de transacciones económicas publicado**
(11.4.4.1.1).

<figure class="fig fig-wide">
  <img src="../assets/figures/piso-oferta-mer.svg"
       alt="Barra horizontal apilada que construye el piso de una oferta de exportación con tres tramos: el costo variable combustible de 119.64 dólares por MWh, el costo variable no combustible indexado y ajustado de 8.47, y los cargos del sistema de 7.20, que suman un piso de 135.31 dólares por MWh. Una línea vertical marca un precio del MER de 148 dólares y el margen de 12.69 sobre el piso."
       width="1200" height="600" loading="lazy" />
  <figcaption>El piso no lo pone el que oferta: lo pone el costo que el propio
  operador ya le validó. Los tres tramos vienen de los tres artículos
  anteriores, y por eso la cadena de declaración y validación no termina en el
  despacho nacional. <strong>Los cargos del sistema y el precio del MER son
  ilustrativos</strong>; el CVC y el CVNC son los que quedaron resueltos en los
  artículos III y IV.</figcaption>
</figure>

Léase despacio lo que eso significa. El costo variable que se usa como piso no
es el que el generador diga en ese momento: es **el que la UT consideró en el
predespacho inicial**, o sea el que salió del proceso de declaración semanal, de
la curva de consumo específico auditada y del CVNC indexado y ajustado. Todo el
aparato de validación de los artículos III y IV, que parecía existir solo para
ordenar el despacho nacional, resulta que también fija el precio mínimo al que
un generador salvadoreño puede vender afuera.

Y sumarle los cargos del sistema tiene su propia lógica: el que exporta usa la
red, la administración del mercado y los servicios auxiliares igual que
cualquiera, así que el piso incluye lo que le cuesta al sistema sostener esa
inyección.

Tres restricciones más acotan la oferta, y las tres apuntan a lo mismo. La
cantidad ofertada no puede superar la cantidad ofertable que informa la UT, y si
la supera **la oferta se rechaza** (11.4.4.1.2). La oferta no puede provenir de
unidades bajo prueba, en mantenimiento o indisponibles (11.4.4.1.4). Y la
inyección hidráulica al MER solo puede venir de centrales que estén vertiendo o
que, según la programación semanal y diaria, se prevea que llegarán a esa
condición, limitando la UT la cantidad conforme a esos resultados (11.4.4.1.3).
Esa última es el candado que impide vaciar un embalse para vender afuera, y es
coherente con la regla de que el agua vale exactamente lo que ahorra en el
futuro.

Hay incluso una regla de desempate que revela cuánto detalle procedimental
tiene esto. Si varios participantes ofertan sobre la misma unidad y la suma
supera la cantidad ofertable, la UT elimina bloques empezando por los de mayor
precio hacia los de menor hasta cuadrar, y si hay empate en el último bloque a
eliminar se queda con el de la oferta cuya estampa de tiempo de presentación sea
menor (11.4.4.1.5). Llega primero, se queda.

## Importar para no racionar

El caso espejo tiene un precio propio, y es de los más elegantes del reglamento.

Cuando hay déficit nacional, la UT presenta **a nombre de los participantes que
retiran** una oferta de retiro regional para sustitución de déficit, y el precio
de esa oferta es el del último escalón despachado de la unidad de racionamiento
forzado (11.4.6 y 11.4.6.1).

El razonamiento es directo: si el sistema está a punto de racionar, lo que vale
un megavatio hora importado es exactamente lo que cuesta no tenerlo, y eso es el
precio del racionamiento. Ofrecer menos sería no comprar energía que valía la
pena; ofrecer más no tendría sentido porque por encima de ese precio conviene
racionar. Es el único precio que hace la comparación honesta.

Nótese además quién presenta la oferta. No la presenta un comercializador ni el
generador: la presenta el operador, por cuenta de la demanda. En un momento de
escasez la representación del interés de quien retira se centraliza.

## Prioridad, y por qué existe

Las cantidades físicas asociadas a contratos firmes regionales tienen prioridad
sobre las de contratos no firmes físicos flexibles, y estas sobre las ofertas de
oportunidad (11.3.4). Es una jerarquía de tres niveles que ordena qué se atiende
primero cuando el enlace no alcanza para todo.

La diferencia entre un contrato firme y una transacción de oportunidad es esa
prioridad, no el precio. Un contrato firme compra derecho de paso: la certeza de
que, si el enlace se congestiona, lo que se recorta es lo de otro. Una
transacción de oportunidad compra energía barata sin ninguna garantía de que
llegue. Quien planifica suministro necesita lo primero; quien optimiza costo
operativo se conforma con lo segundo.

Los cargos o abonos que surjan dentro del mercado como resultado de las
transacciones regionales se asignan al participante nacional que realiza el
retiro o la inyección bajo el contrato regional (11.3.6). El intermediario no
queda en el medio: el resultado económico aterriza en quien tiene el contrato.

## De la inyección a la factura

Todo lo anterior produce energía física. Falta convertirla en dinero, y ese es
el capítulo 18.

<figure class="fig fig-wide">
  <img src="../assets/figures/recorrido-mwh.svg"
       alt="Seis pasos en fila que trazan el recorrido de un megavatio hora: predespacho, inyección real, medición por el SIMEC, posdespacho con recálculo del costo marginal ex post, conciliación mensual y documento de transacciones económicas. Bajo cada paso se indica el dato que introduce. Debajo, dos bloques contrastan la estimación indicativa de cada día hábil con la liquidación oficial mensual."
       width="1200" height="640" loading="lazy" />
  <figcaption>Dos relojes distintos sobre el mismo dato. Lo diario es
  indicativo y sirve para que cada participante vea su posición; lo mensual es
  lo que se cobra. Entre uno y otro está el posdespacho, que reemplaza el costo
  marginal ex ante por el ex post calculado con las lecturas reales.</figcaption>
</figure>

La base de todo es el Sistema de Medición Comercial, el SIMEC. Cada participante
debe contar con el suyo, y la implementación corre por cuenta de quien lo
requiere (18.2.1). La UT organiza la información recopilada en una Base de Datos
Comercial confiable y auditable, disponible para los participantes, y esa base
es **la información oficial** con la que se determina el resultado de las
transacciones (18.3.1 y 18.3.2).

Dos numerales delimitan la autoridad sobre esos datos con una precisión que
conviene retener. Un participante puede leer los medidores de su propiedad pero
no está autorizado a modificar los valores medidos (18.2.6.1). Y **la UT tampoco
tiene potestad para alterarlos**, salvo cuando la sustitución sea requerida por
errores de medición identificados (18.2.5.3). El dato medido no le pertenece a
nadie de los dos.

Cuando falta medición, hay procedimiento y hay consecuencia. Si la ausencia de
medición del medidor principal o del de respaldo se prolonga por más de 24
horas, la UT puede solicitar la desconexión del nodo hasta recuperar las
mediciones, e incluso requerir la salida de un generador sin medición y
considerarlo indisponible. Con un límite explícito: **no puede hacerlo en
racionamiento, en emergencia, o cuando eso afecte la calidad y seguridad del
sistema** (18.3.5). El participante puede reclamar los valores asumidos ante
medición faltante, pero debe demostrar fehacientemente el error (18.3.6).

El ciclo comercial tiene dos cadencias. Las transacciones se liquidan
mensualmente (18.4.1), y cada día hábil la UT pone a disposición una estimación
indicativa de la energía comprada y vendida y de los cargos que surjan, como los
de congestión y pérdidas, del día anterior (18.4.2). La primera cifra sirve para
gestionar; la segunda para cobrar.

Al cierre del mes la UT integra la información de cada intervalo, determina el
resultado neto de cada participante, y lo clasifica: es deudor si el resultado
neto mensual es negativo y acreedor si es positivo (18.6.1 a 18.6.3). Con eso
emite el **Documento de Transacciones Económicas**, que incluye toda la
información comercial que respalda los resultados, incorpora lo que el EOR le
asigna a la UT por transacciones del MER, y sirve como memoria de cálculo para
los documentos de cobro y pago (18.7.1 a 18.7.3). La UT emite esos documentos
por cuenta y orden de acreedores y deudores (18.9.1).

## El monto remanente, o dónde termina la renta de congestión

El segundo artículo dejó una pregunta a medias: la renta de congestión es de los
usuarios del sistema por mandato del artículo 59 de la ley, pero faltaba ver por
qué mecanismo llega ahí. El mecanismo es el monto remanente.

De las transacciones del MRS por intervalo surge un monto que agrupa el cargo
por congestión, el excedente de las desviaciones asignadas por el EOR, los
resultados netos regionales asignados a la UT, el excedente de los retiros
regionales para sustitución de déficit y los cargos variables de transmisión
netos de instalaciones fuera de la red regional (18.5.1). Ese saldo puede ser
positivo o negativo, y el reglamento tiene un procedimiento para cada caso
(18.5.2).

Si el monto remanente es **déficit**, se asigna a los retiros como un cargo
adicional dentro de los Csis. Si es **superávit**, primero se asigna a la
congestión, hasta el mínimo entre el monto remanente y el producto de la
diferencia de precios entre los MRS que interconecta la línea congestionada por
el flujo de esa línea; y si aún sobra, el excedente se asigna a los retiros como
una **reducción** de los Csis.

Ahí cierra el circuito. La congestión que en el artículo II aparecía como dos
precios distintos en dos nodos, y que en la ley aparecía como un ingreso neto de
la UT que pertenece a los usuarios, viaja hasta la factura como un componente
del cargo del sistema, que puede sumar o restar. Y como los Csis entran al
precio del MRS por la fórmula del Anexo 09, la renta de congestión termina
modificando el precio que todos pagan.

## Cuando alguien no está de acuerdo

Los participantes pueden reclamar las transacciones económicas informadas por la
UT, con justificación, dentro del plazo del Anexo 14. Vencido el plazo, los
datos no observados **se consideran aceptados por todos y no pueden objetarse
después** (18.8.1 y 18.8.2). Mientras un reclamo se resuelve, la UT gestiona
cobros y pagos con los valores del DTE (18.8.3): reclamar no suspende el pago.

Si no hay acuerdo entre el participante y la UT, el reclamo puede elevarse ante
el regulador (18.8.4). Y el texto de ese numeral es, por sí solo, una fotografía
del momento institucional que describió el primer artículo de la serie: dice que
el participante podrá elevarlo **ante la SIGET con copia a la DGEHM**. La
transición está escrita dentro del propio reglamento, en la forma de un trámite
que se presenta en dos lugares a la vez.

## Qué queda fuera de este artículo, y por qué

Todo lo anterior se apoya en el ROBCP, que es fuente primaria y está leído. El
otro lado del acoplamiento no lo está: del Reglamento del Mercado Eléctrico
Regional solo se verificó la portada y su organización en libros, el
Procedimiento de Detalle Complementario que lo acompaña desde 2013 no está
localizado, y del Tratado Marco del Mercado Eléctrico de América Central tampoco
se localizó el texto.

Eso deja tres cosas afuera, y vale enunciarlas en vez de rellenarlas: el
procedimiento con el que el EOR casa el mercado regional, la definición precisa
de las categorías de desviación que el numeral 18.5.1 menciona como normales,
significativas autorizadas o no autorizadas y graves, y las reglas de asignación
de la red de transmisión regional. Todo eso vive del lado regional y está
anotado en el registro de fuentes como pendiente.

::: nota Para retener: dos ideas que reordenan el capítulo
**La validación de costos no termina en la frontera.** Es tentador leer todo el
aparato de declaración y auditoría de los artículos III y IV como contabilidad
regulatoria interna, útil solo para ordenar el despacho nacional. El numeral
11.4.4.1.1 dice otra cosa: ese mismo número validado es el precio mínimo con el
que un generador salvadoreño se presenta a competir en Centroamérica. Un error en
la validación semanal no solo distorsiona el precio nacional, también le da o le
quita competitividad a esa máquina afuera.

**No hay reglas especiales para importar.** No existe un capítulo de excepciones
para las transacciones regionales. Hay dos frases, los numerales 11.5.4 y 11.5.5,
que convierten un enlace en un elemento del modelo: demanda inflexible si exporta,
generador inflexible si importa. A partir de ahí el problema de optimización es el
mismo de siempre. Esa economía de reglas es lo que permite que un sistema
complejo siga siendo explicable, y es la razón por la que este capítulo se
entiende sin memorizar casos.
:::

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP.pdf/129acc69-cb01-7ed4-7080-88be586df4ec?t=1729522985515).
  Capítulo 11, Transacciones Regionales: responsabilidad de la UT y del EOR y
  regla de armonización en caso de contradicción (11.1), presentación de ofertas
  en nodos de la RTR (11.2), contratos regionales y prioridad de firmes sobre
  flexibles y de estos sobre oportunidad (11.3), ofertas de oportunidad al MER
  con su piso de precio, límite de cantidad, exclusión de unidades bajo prueba o
  mantenimiento, restricción de la inyección hidráulica al vertimiento y regla de
  desempate (11.4.4.1), oferta de la UT para sustitución de déficit al precio de
  la URF (11.4.6), y predespacho nacional definitivo con el modelado de enlaces
  exportadores e importadores (11.5). Capítulo 18, Transacciones Económicas:
  SIMEC y sus responsabilidades (18.2), imposibilidad de alterar valores medidos
  (18.2.5.3 y 18.2.6.1), base de datos comercial oficial (18.3.1 y 18.3.2),
  procedimiento y consecuencias por falta de medición (18.3.5 y 18.3.6),
  liquidación mensual y estimación indicativa diaria (18.4.1 y 18.4.2), monto
  remanente y su asignación (18.5), deudores y acreedores (18.6), Documento de
  Transacciones Económicas (18.7), reclamos y plazo de aceptación tácita (18.8) y
  liquidación (18.9). Copia local: `normativa/robcp.pdf`. Consultado el 22 de
  agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 09, Cálculo del Precio en el MRS:
  posdespacho diario y costo marginal ex post (3.8) y precio del MRS como costo
  marginal más cargos del sistema (3.3.1). Copia local:
  `normativa/robcp-anexos.pdf`. Consultado el 22 de agosto de 2026.
- **Ley General de Electricidad**, Decreto Legislativo No. 843 del 10 de octubre
  de 1996. Artículo 59: los ingresos netos por cargos por congestión se
  distribuyen entre los usuarios del sistema. Copia local:
  `normativa/ley-general-electricidad.pdf`. Consultado el 22 de agosto de 2026.
- **Reglamento del Mercado Eléctrico Regional (RMER)**, CRIE, versión
  actualizada al 5 de septiembre de 2025.
  [PDF](https://crie.org.gt/wp-content/uploads/2025/11/RMER-PDF-05092025.pdf).
  **Leída solo la portada y la organización en libros**; el contenido del lado
  regional queda pendiente de verificación y por eso este artículo no lo afirma.
  Consultado el 22 de agosto de 2026.

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
