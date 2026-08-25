---
title: "Pronósticos en el mercado eléctrico: qué se pronostica y cómo se evalúa"
summary: "Cada horizonte de la programación necesita un pronóstico distinto y tolera un error distinto. Qué exige el reglamento, por qué la función de pérdida sale de la decisión y no del modelo, cómo se evalúa con origen móvil, y por qué un intervalo mal calibrado es peor que no dar intervalo."
date: 2026-08-24
lang: es
topic: Analítica de datos
categories: [analitica]
tags: [pronostico, series-de-tiempo, backtesting, incertidumbre, robcp]
estado: en-revision
math: true
---

La pregunta "qué tan bueno es este pronóstico" no tiene respuesta sin saber qué
decisión alimenta. Un error de 200 MWh en la energía semanal y un error de 200
MWh en la hora pico del martes valen cosas distintas, y ninguna métrica genérica
lo sabe.

Este artículo ordena el problema desde el otro extremo: primero las decisiones
que el reglamento obliga a tomar, después el pronóstico que cada una necesita, y
al final el protocolo de evaluación que hace comparables los resultados. El
[octavo artículo de la serie sobre el mercado](pronostico-demanda-electrica)
aplica todo esto a un caso concreto con código; este fija el método.

## Qué se pronostica, y para decidir qué

El reglamento no pide pronósticos en abstracto: los pide como insumos de
decisiones fechadas. Reconstruir esa correspondencia es el primer paso, porque
determina horizonte, granularidad y tolerancia.

| Decisión | Horizonte | Pronóstico que la alimenta | Grana |
|---|---|---|---|
| Política de operación de embalses | 52 semanas, simulando tres años hidrológicos | Caudales, demanda, disponibilidad | Semanal |
| Programa anual de mantenimientos | 52 semanas desde la semana 20 | Demanda y generación probable con contingencias | Semanal |
| Valor del agua de la semana | 7 días, con costo futuro al final | Caudales y demanda | Horaria |
| Compromiso de unidades | 7 días | Demanda por barra | Horaria |
| Despacho y reserva | 24 horas | Demanda, disponibilidad, exógenas | Horaria |

Dos exigencias concretas del texto vale citarlas porque definen el producto. La
programación semanal necesita una proyección de demanda en **energía semanal y
demanda de potencia horaria por barra** (cuerpo, 9.3.1 a): son dos productos, no
uno, y tienen que ser coherentes entre sí. Y la programación anual necesita,
entre otros insumos, estadística y pronóstico de caudales, proyección de demanda
y tasas de indisponibilidad forzada (8.3.1).

De ahí sale el primer principio: **el horizonte del pronóstico lo fija la
decisión, no la disponibilidad de datos.** Un modelo que pronostica siete días
porque el conjunto de datos alcanza para siete días, y no porque haya una
decisión a siete días, está resolviendo un problema que nadie tiene.

## La función de pérdida sale de la decisión

El error cuadrático medio penaliza igual quedarse corto y quedarse largo. Casi
ninguna decisión de un mercado eléctrico tiene esa simetría.

**Dimensionar reserva.** Subestimar la demanda deja al sistema con menos margen
del necesario, y el reglamento describe qué pasa entonces: si el despacho libre
no alcanza la reserva requerida, la UT puede requerir la entrada de una unidad
no despachada, y si aun así no se cumple, **disminuye el porcentaje de
requerimiento** hasta igualarlo con la reserva disponible, bajando hasta niveles
de emergencia (cuerpo, 12.4.3.6 y 12.4.3.7). Sobreestimar cuesta dinero;
subestimar cuesta margen de seguridad. No son la misma unidad.

**Programar combustible.** Un inventario por debajo del mínimo no se sanciona
con multa sino penalizando la tasa de salida forzada, que es insumo de la
capacidad firme (Anexo 04, 9.4). Subestimar el consumo tiene un costo que
aparece meses después en el ingreso por capacidad.

**Anticipar el precio.** Para un participante, un error hacia arriba y uno hacia
abajo cambian de signo según esté largo o corto contra sus contratos. La misma
serie de errores es buena para uno y mala para otro.

Cuando la pérdida es asimétrica, el objeto correcto no es un pronóstico puntual
sino un cuantil. Minimizar la pérdida pinball en el cuantil $\tau$

$$
L_{\tau}(y, \hat q) =
\begin{cases}
\tau\,(y - \hat q) & \text{si } y \ge \hat q \\
(1-\tau)\,(\hat q - y) & \text{si } y < \hat q
\end{cases}
$$

produce el cuantil $\tau$ de la distribución predictiva, donde $y$ es el valor
observado y $\hat q$ el cuantil pronosticado. Elegir $\tau$ es elegir cuánto más
caro es quedarse corto que quedarse largo: con $\tau = 0.9$, quedarse corto pesa
nueve veces más.

Ese es el puente entre estadística y decisión, y conviene tenerlo explícito: no
se elige un cuantil por convención, se elige por la razón de costos de los dos
errores.

## El protocolo de evaluación

Sin protocolo, dos pronósticos no son comparables. El mínimo defendible tiene
cinco elementos, y ninguno es opcional.

**Origen móvil, nunca partición al azar.** Una partición aleatoria sobre una
serie de tiempo deja días posteriores dentro del entrenamiento y días anteriores
dentro de la prueba: el modelo aprende del futuro y la métrica sale excelente
por la razón equivocada. El origen móvil reajusta el modelo en cada corte y
pronostica hacia adelante, que es lo que ocurre en operación.

**Línea base obligatoria.** La comparación contra un modelo trivial no es una
cortesía metodológica, es el instrumento que detecta que algo se rompió. El
valor del mismo día de la semana anterior es una línea base razonable para
demanda diaria. Un modelo que no le gana no justifica su existencia, y uno que
pierde contra ella por mucho casi siempre tiene un defecto de construcción, no
una limitación de fondo.

**Métricas desagregadas por horizonte.** El promedio sobre los siete días de un
pronóstico semanal esconde la forma de la degradación, que es la información más
útil. Un modelo plano y uno que empieza muy bien y se degrada rápido pueden
tener el mismo promedio y servir para cosas distintas.

**Una métrica adimensional.** El MAE en unidades originales no se puede comparar
contra nada. El MASE, que divide el error por el de la línea base ingenua,
convierte la conversación en una sobre desempeño y no sobre escalas:

$$
\text{MASE} = \frac{\text{MAE}_{\text{modelo}}}{\text{MAE}_{\text{base}}}
$$

Un MASE de 0.4 dice que el modelo se equivoca 60 % menos que la referencia
trivial, y eso significa lo mismo en MWh, en caudales o en precio.

**Evaluación de los intervalos, no solo del punto.** Es el elemento que más se
omite y el que más importa cuando el pronóstico alimenta el dimensionamiento de
un margen.

## Los intervalos son el producto, no el adorno

Un intervalo del 80 % que contiene el valor real el 59 % de las veces no es un
intervalo del 80 % mal hecho: es un objeto distinto presentado con una etiqueta
falsa. Quien lo use para dimensionar reserva va a quedarse corto una de cada
tres veces en vez de una de cada cinco.

Evaluar un intervalo exige dos cosas a la vez, y ninguna alcanza sola.

**Cobertura**: la fracción de veces que el valor real cae dentro. Una cobertura
del 80 % nominal debería observarse cerca del 80 %.

**Ancho**: porque la cobertura se puede comprar. Un intervalo de cero a infinito
tiene cobertura perfecta y no informa nada. La pérdida pinball evaluada en los
dos cuantiles resume ambas cosas en un número y es la métrica correcta para
comparar.

La causa más común de subcobertura en este dominio es específica y vale
conocerla: **el error está autocorrelacionado**. Un modelo que trata cada
intervalo como independiente subestima la varianza acumulada del horizonte,
porque la dispersión condicional que aprende de los datos de entrenamiento no es
la dispersión de un error que se acumula a lo largo de siete días.

Ensanchar la banda hasta que la cobertura cuadre es hacer trampa. Lo correcto es
calibrar sobre un conjunto de datos separado, con calibración conforme o con un
factor estimado fuera de la muestra de entrenamiento. Y mientras eso no se haga,
lo honesto es reportar la cobertura observada junto al intervalo.

## Coherencia entre productos

El reglamento pide dos productos de demanda que deben ser consistentes: energía
semanal y potencia horaria por barra (9.3.1 a). Nada garantiza que un modelo
semanal y setenta modelos horarios por barra produzcan cifras que sumen igual.

Esa es la reconciliación jerárquica, y el problema tiene tres estructuras
posibles:

| Enfoque | Cómo funciona | Cuándo conviene |
|---|---|---|
| De arriba hacia abajo | Pronosticar el total y repartirlo con proporciones históricas | Cuando las proporciones son estables |
| De abajo hacia arriba | Pronosticar cada barra y sumar | Cuando las barras tienen dinámicas propias fuertes |
| Reconciliación óptima | Pronosticar todos los niveles y proyectar sobre el espacio coherente | Cuando ambos niveles tienen señal útil |

En un sistema con generación distribuida creciente el enfoque de arriba hacia
abajo pierde validez rápido, y por una razón que conviene entender: lo que se
mide en la barra ya no es la demanda sino la **demanda neta**, es decir la
demanda menos la generación conectada aguas abajo. Dos barras con la misma
demanda subyacente y distinta penetración solar producen perfiles distintos, así
que las proporciones históricas dejan de describir el presente.

Eso lleva al problema más incómodo del dominio.

## Cuando el dato deja de significar lo mismo

Un modelo aprende de la historia, y la historia de una serie de demanda neta
mezcla dos fenómenos que cambian a ritmos distintos: el consumo, que se mueve
lentamente, y la generación distribuida, que se agrega por proyectos.

Cada instalación nueva cambia la forma de la serie sin cambiar nada del consumo.
Un modelo que no lo sabe interpreta ese cambio como una variación de demanda y
lo proyecta hacia adelante como si fuera a repetirse.

El marco regulatorio ofrece dos anclas para tratarlo. La primera es que la
capacidad de generación distribuida no es un misterio: la DGEHM es responsable
de los estudios de integración que determinan la capacidad máxima por circuito y
para todo el sistema (LGE, art. 32-C), y los generadores distribuidos deben
poner sus señales de registro, monitoreo y control a disposición de la
distribuidora, que a su vez las pone a disposición de la UT (art. 32-D). Es
decir que la información para separar demanda de demanda neta existe dentro del
sistema.

La segunda es que la separación conviene hacerla explícita en el modelo:
pronosticar demanda subyacente y generación distribuida por separado, y
combinarlas, en vez de pronosticar la resta. Cuestan más las dos, y a cambio el
modelo no confunde una decisión de inversión de terceros con un cambio de hábito
de consumo.

::: nota Para retener: el reglamento ya define un monitor de error de pronóstico
Hay un numeral que, leído con ojos de analítica, es exactamente un control de
desempeño de pronóstico con umbral fijado.

La programación semanal se reprograma cuando la generación hidroeléctrica
acumulada desde el inicio de la semana difiere en **más de 5 %** de la
establecida en la programación semanal para el mismo período (cuerpo, 9.2.1).

Eso es un monitor con cuatro elementos que cualquier sistema de pronóstico en
producción debería tener y casi ninguno tiene:

1. **Una magnitud vigilada** concreta, la generación hidroeléctrica acumulada.
2. **Una referencia**, el valor que la programación había establecido.
3. **Un umbral numérico**, 5 %, definido de antemano y no a criterio del turno.
4. **Una acción disparada**, reprogramar, y no solo una alerta.

El cuarto punto es el que distingue un monitor de un tablero. Un umbral que no
dispara ninguna acción es decoración; el del 9.2.1 obliga a rehacer el programa.
:::

## Lista de verificación antes de publicar un pronóstico

| Verificar | Por qué |
|---|---|
| ¿Está declarada la decisión que alimenta? | Sin ella no hay criterio de suficiencia |
| ¿Hay línea base en el informe? | Es lo que detecta que algo se rompió |
| ¿Las métricas están desagregadas por horizonte? | El promedio esconde la forma de la degradación |
| ¿Hay una métrica adimensional? | Sin ella no se compara contra otra serie |
| ¿Se reporta la cobertura observada de los intervalos? | Un intervalo sin cobertura medida no es un intervalo |
| ¿Las exógenas del futuro se tomaron como conocidas? | Si sí, el error reportado es optimista y hay que decirlo |
| ¿La validación usa origen móvil? | Un corte al azar filtra el futuro |
| ¿La serie cruza un cambio estructural conocido? | Habría que estimar por tramos |
| ¿Se pronostica demanda o demanda neta? | Son cosas distintas y se confunden solas |
| ¿Los productos de distinto nivel son coherentes? | El reglamento pide dos que deben sumar igual |

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP.pdf/129acc69-cb01-7ed4-7080-88be586df4ec?t=1729522985515).
  Numerales citados: 8.2.4 (escenarios hidrológicos), 8.3.1 (insumos de la
  programación anual, incluidos pronóstico de caudales, proyección de demanda y
  tasas de indisponibilidad forzada), 9.2.1 (umbral del 5 % que dispara la
  reprogramación semanal), 9.3.1 literal a (proyección de demanda en energía
  semanal y potencia horaria por barra), 9.4.2 y 9.4.3 (las dos fases del valor
  del agua) y 12.4.3.6 y 12.4.3.7 (qué ocurre cuando la reserva disponible no
  alcanza el requerimiento). Copia local: `normativa/robcp.pdf`. Consultado el 22
  de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 04, 9.4: el incumplimiento del
  inventario mínimo se penaliza en la tasa de salida forzada, que es insumo de la
  capacidad firme. Copia local: `normativa/robcp-anexos.pdf`. Consultado el 22 de
  agosto de 2026.
- **Ley General de Electricidad**, Decreto Legislativo No. 843 del 10 de octubre
  de 1996, con reformas hasta el Decreto No. 548 del 9 de abril de 2026.
  Artículos 32-C (estudios de integración y capacidad máxima de generación
  distribuida por circuito) y 32-D (señales de registro, monitoreo y control).
  Copia local: `normativa/ley-general-electricidad.pdf`. Consultado el 22 de
  agosto de 2026.
- **Código**: el protocolo de evaluación descrito acá es el que implementa
  [`proyectos/pronostico-demanda`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/pronostico-demanda),
  y el laboratorio de seis algoritmos sobre tres series está en
  [`proyectos/lab-series-tiempo`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/lab-series-tiempo).
