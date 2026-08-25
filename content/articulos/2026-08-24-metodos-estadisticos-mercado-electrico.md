---
title: "Métodos estadísticos para analizar un mercado eléctrico"
summary: "Por qué la media y la desviación estándar son el resumen equivocado para una serie de precios, qué mide de verdad una curva de duración, cómo no confundir hidrología con causalidad, y qué exige de estadística el propio reglamento salvadoreño en sus anexos 16 y 17."
date: 2026-08-24
lang: es
topic: Analítica de datos
categories: [analitica]
tags: [estadistica, precios, regresion, series-de-tiempo, robcp]
estado: en-revision
math: true
---

Un precio de mercado eléctrico no se comporta como las variables con las que se
enseña estadística. No es simétrico, no tiene una escala característica
estable, sus observaciones no son independientes y su distribución cambia
cuando cambia el parque. Aplicarle el instrumental por defecto produce números
correctos que responden preguntas equivocadas.

Este artículo recorre los métodos que sí aplican, y termina en algo poco
frecuente: un reglamento que fija umbrales estadísticos explícitos y qué
significan realmente esos umbrales.

## Por qué la media y la desviación no sirven

La distribución de precios horarios de un mercado por costos tiene tres rasgos
que rompen el resumen clásico.

**Está acotada por abajo y no por arriba.** El costo marginal no puede ser
negativo: si el valor del agua produjera un costo marginal negativo, el
reglamento lo fija en cero (Anexo 09, 3.1.13). Hacia arriba el techo es mucho
más alto, el precio del primer escalón de la unidad de racionamiento forzado
(3.1.15). La asimetría no es un accidente muestral, está en el diseño.

**Es multimodal por construcción.** El precio lo fija la tecnología marginal, y
las tecnologías son categorías discretas con costos separados. Una curva de
oferta de cuatro escalones produce una distribución de precios con hasta cuatro
concentraciones, no una campana. Cualquier resumen que suponga unimodalidad
promedia entre modas, y el resultado es un valor que casi nunca ocurre.

**Cambia de régimen.** Un embalse lleno y uno vacío producen distribuciones
distintas de la misma serie. Estimar una media sobre un período que mezcla
ambos describe una población que no existe.

La consecuencia práctica es directa:

| En lugar de | Usar | Porque |
|---|---|---|
| Media y desviación | Mediana y rango intercuartílico | Resisten la cola y las horas de escasez |
| Media simple | Media ponderada por energía | Responde la pregunta económica |
| Desviación estándar | Cuantiles P5, P50, P95 | No supone simetría |
| Un solo resumen anual | Un resumen por régimen hidrológico | La población no es una sola |

Vale además una advertencia sobre el coeficiente de variación, que se reporta
mucho en este dominio: sobre una variable con cola pesada y cota inferior es
inestable, porque su numerador depende de unas pocas horas extremas. Dos meses
con el mismo comportamiento típico y distinta cantidad de horas de escasez
producen coeficientes de variación muy distintos sin que haya cambiado nada
estructural.

## La curva de duración, que es el histograma bien mirado

La herramienta descriptiva central de este dominio no es el histograma sino la
curva de duración: los valores ordenados de mayor a menor contra el porcentaje
del tiempo en que se igualan o superan.

$$
D(x) = \frac{1}{T}\sum_{t=1}^{T} \mathbf{1}\{y_t \ge x\}
$$

donde $y_t$ es el valor en el intervalo $t$, $T$ el número total de intervalos y
$\mathbf{1}\{\cdot\}$ vale 1 cuando la condición se cumple. Es, formalmente, la
función de supervivencia empírica, o sea el complemento de la distribución
acumulada.

Su ventaja sobre el histograma es que se lee en el eje que importa: **cuánto
tiempo**. La pregunta operativa nunca es "cuál es la frecuencia relativa del
bin de 90 a 100 USD/MWh", es "cuántas horas al año el precio pasa de 100". La
curva de duración la contesta directamente y sin elegir ancho de bin, que es una
decisión arbitraria que cambia la forma del histograma.

```python
import numpy as np

def curva_duracion(y):
    """Devuelve (porcentaje del tiempo, valor) ordenado de mayor a menor."""
    y = np.sort(np.asarray(y, dtype=float))[::-1]
    pct = np.arange(1, len(y) + 1) / len(y) * 100
    return pct, y

def horas_sobre(y, umbral, horas_por_periodo=1.0):
    return float(np.sum(np.asarray(y) >= umbral) * horas_por_periodo)
```

Lo mismo aplica a la demanda, donde la curva de duración de carga es la que
define cuánta capacidad se usa poco: el área bajo la curva es energía, y la
diferencia entre el máximo y el percentil 95 es la capacidad que existe para
unas pocas horas al año. Esa lectura es la que conecta un gráfico con una
decisión de inversión.

Y hay una tercera aplicación menos obvia, que el propio reglamento sugiere. La
programación anual se hace para hidrología normal, seca y húmeda, definidas como
probabilidad de excedencia de **50 %, 90 % y 20 %** respectivamente (cuerpo,
8.2.4). Eso es exactamente una curva de duración de caudales, leída en tres
puntos. El vocabulario regulatorio y el estadístico coinciden acá, y conviene
notarlo: "hidrología seca" no es un adjetivo, es un percentil.

## Correlación y causalidad, con el caso que siempre aparece

El caso clásico del dominio: el precio del MRS correlaciona fuertemente con el
nivel del embalse. La tentación es leerlo como que el embalse determina el
precio.

Lo que ocurre es más interesante y el reglamento lo explica. El valor del agua
es el costo de oportunidad del agua almacenada frente a usar unidades térmicas,
determinado como costo futuro en función del volumen del embalse (Anexo 09,
3.1.8). Es decir que el nivel del embalse entra al precio **por construcción del
modelo**, no por una relación empírica que haya que estimar. Correr una
regresión de precio contra cota y reportar el coeficiente es estimar un
parámetro de un modelo de optimización que ya está publicado.

De ahí sale la regla general del dominio: antes de estimar una relación, hay que
preguntarse si el reglamento ya la fija. Buena parte de lo que en otro mercado
sería una pregunta empírica, acá es una fórmula publicada. Estimar lo que ya
está escrito produce coeficientes que solo miden qué tan bien se reprodujo el
modelo del operador, y eso no es lo que la mayoría de los informes creen estar
midiendo.

Tres confusiones más que vale desarmar:

**Precio y demanda.** Correlacionan porque más demanda sube por la curva de
oferta. Pero la curva de oferta se mueve con la disponibilidad, así que la
relación no es estable: la misma demanda produce precios distintos según qué
esté disponible. Una regresión de precio contra demanda sin controlar
disponibilidad estima una mezcla de dos cosas.

**Solar y precio.** La entrada de solar desplaza tecnologías caras en horas de
sol, así que baja el precio de esas horas. Pero también cambia el régimen de
operación de las térmicas, lo que sube su CVNC por la vía del ajuste por
despacho real (Anexo 17, 9.3.4), lo que sube su costo variable. El efecto neto
sobre el precio medio anual tiene dos signos y no se resuelve mirando la
correlación.

**Antes y después de una reforma.** Comparar el precio medio antes y después de
un cambio regulatorio es la comparación más publicada y la menos válida, porque
entre los dos períodos también cambiaron la hidrología, los precios
internacionales del combustible y el parque. Sin controlar esas tres cosas, la
diferencia mide todo junto.

## El cambio de régimen es la norma, no la excepción

Una serie de mercado eléctrico acumula quiebres estructurales por razones
identificables y fechables: la entrada de una central grande, una reforma
regulatoria, un cambio de referencia internacional de combustible, una sequía
prolongada.

Eso tiene dos consecuencias metodológicas.

La primera es que **el período de estimación es una decisión analítica, no un
detalle**. Estimar sobre "los últimos cinco años" porque es lo que hay
disponible mezcla poblaciones. La alternativa es fechar los quiebres conocidos
primero, desde el registro documental y no desde los datos, y estimar por
tramos.

La segunda es que un quiebre detectado estadísticamente sin explicación
documental merece desconfianza antes que celebración. En una serie con muchos
puntos, algún test siempre encuentra un quiebre en algún lado. El orden correcto
es: fechar lo que se sabe, y usar los tests para verificar que el quiebre
conocido aparece, no para descubrir quiebres nuevos.

::: nota Para retener: 8760 observaciones no son 8760 datos independientes
Un año de precios horarios tiene 8760 filas. Casi ningún método estadístico
clásico puede tratarlas como 8760 observaciones independientes, y el error de
hacerlo va siempre en la misma dirección: **los intervalos de confianza salen
demasiado angostos y todo parece significativo**.

Las tres fuentes de dependencia, en orden de importancia:

1. **Autocorrelación.** El precio de una hora se parece al de la anterior porque
   la unidad marginal rara vez cambia entre horas contiguas.
2. **Estacionalidad diaria y semanal.** Las horas de un mismo perfil se parecen
   entre sí más que a las demás.
3. **Régimen compartido.** Todas las horas de una misma semana comparten el
   mismo valor del agua, que es un parámetro de la programación semanal.

Ese tercer punto es específico del dominio y el más olvidado: como el valor del
agua se fija por semana (cuerpo, 9.4.2 y 9.4.3), las 168 horas de una semana
comparten un insumo. El número de observaciones efectivamente independientes
está más cerca del número de semanas que del número de horas.

Qué hacer, en orden de esfuerzo: agregar a la grana en que el dato es
razonablemente independiente, usar errores estándar robustos a autocorrelación
al estimar sobre datos horarios, y en validación de modelos usar cortes por
bloques temporales y nunca al azar.
:::

## Regresión: dónde sí y con qué cuidado

Hay dos regresiones que el propio reglamento manda hacer, y estudiarlas enseña
más que cualquier ejemplo inventado.

### La curva de consumo específico

El Anexo 16 obliga a representar el consumo específico de calor con un polinomio
de segundo orden ajustado por mínimos cuadrados:

$$
C_{\text{ESP}}(P) = a + b\,P + c\,P^{2}
$$

sobre **cinco o más** pares de puntos medidos en el ensayo, seis como mínimo
para configuraciones de ciclo combinado que involucran el ciclo de recuperación
de calor (apéndice 3, 2.2, 2.3.1 y 3.4).

Vale mirar eso con ojos de estadística. Con cinco puntos y tres parámetros
quedan dos grados de libertad. Un $R^2$ alto en esas condiciones no es evidencia
de nada: con tres parámetros y cinco puntos, casi cualquier conjunto de
mediciones razonables ajusta bien. La calidad del resultado no descansa en la
bondad del ajuste sino en dos cosas distintas: que los puntos de ensayo estén
bien repartidos a lo largo del rango de potencia, y que la curva **no se use
fuera del rango ensayado**, que es justamente lo que el numeral 2.3.3 prohíbe al
limitar su validez entre el mínimo técnico y la potencia máxima alcanzada.

Es una lección general. Cuando el modelo tiene pocos grados de libertad, el
control de calidad se traslada del ajuste al diseño experimental y al dominio de
validez.

### La separación de costos híbridos

El Anexo 17 hace algo distinto y más exigente. Para clasificar un costo híbrido,
ajusta por mínimos cuadrados una recta sobre 24 meses de datos, con la energía
generada como variable explicativa:

$$
y = a\,x + b
$$

y acepta el coeficiente $a$ como componente variable **solo si el ajuste supera
dos pruebas**: coeficiente de determinación mayor que 0.9 y estadístico t mayor
que 2 (4.5.3 a 4.5.7). Si no se cumplen, la componente variable **se asume igual
a cero**.

Acá los grados de libertad son 22, así que $R^2 > 0.9$ es un umbral genuinamente
exigente y no un trámite. Y el diseño de la regla merece atención por lo que
hace con la carga de la prueba: no estima con incertidumbre alta, no promedia,
no deja el criterio al auditor. **Cuando la evidencia no alcanza, la conclusión
va en contra de quien tenía que aportarla.**

Un detalle técnico que el numeral resuelve sin nombrarlo: exigir las dos pruebas
a la vez, y no solo el $R^2$, cubre el caso de una relación fuerte estimada con
tan pocos datos que el coeficiente no es distinguible de cero. Son dos preguntas
distintas, cuánta varianza se explica y qué tan precisa es la pendiente, y el
reglamento exige las dos.

## Lista de verificación antes de reportar

| Verificar | Por qué |
|---|---|
| ¿El resumen usa mediana y cuantiles, o media y desviación? | La distribución no es simétrica |
| ¿Los promedios de precio están ponderados por energía? | Si no, responden otra pregunta |
| ¿El período de estimación cruza un quiebre conocido? | Mezclaría poblaciones distintas |
| ¿Se está estimando algo que el reglamento ya fija? | Sería reproducir el modelo del operador |
| ¿Los errores estándar consideran la autocorrelación? | Si no, todo parece significativo |
| ¿La validación separa por bloques temporales? | Un corte al azar filtra información del futuro |
| ¿El régimen hidrológico está declarado? | Sin él, un promedio anual no es comparable |
| ¿Se probaron muchas hipótesis y se reporta la que salió? | Es el error más difícil de detectar desde afuera |

La última fila es la más importante y la que no tiene solución técnica. Cuando
se evalúan muchas unidades, muchas reglas o muchas ventanas, alguna va a dar
significativa por azar. La única defensa honesta es declarar cuántas
comparaciones se hicieron antes de mostrar la que se muestra.

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP.pdf/129acc69-cb01-7ed4-7080-88be586df4ec?t=1729522985515).
  Numerales citados: 8.2.4 (hidrología normal, seca y húmeda como probabilidad de
  excedencia de 50 %, 90 % y 20 %) y 9.4.2 y 9.4.3 (el valor del agua se
  determina por semana, en dos fases). Copia local: `normativa/robcp.pdf`.
  Consultado el 22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 09: valor del agua como costo futuro en
  función del volumen del embalse (3.1.8), costo marginal negativo fijado en cero
  (3.1.13) y tope del precio en el escalón de la unidad de racionamiento forzado
  (3.1.15). Anexo 16, apéndice 3: forma del polinomio de segundo grado y ajuste
  por mínimos cuadrados (2.2 y 2.3.1), rango de validez entre mínimo técnico y
  potencia máxima ensayada (2.3.3) y número mínimo de puntos de ensayo (3.4).
  Anexo 17: método estadístico para costos híbridos, con período de estudio de 24
  meses y las dos pruebas de bondad de ajuste (4.5.3 a 4.5.7), y ajuste por
  despacho real de los últimos doce meses (9.3.4). Copia local:
  `normativa/robcp-anexos.pdf`. Consultado el 22 de agosto de 2026.
- **Laboratorio de estadística aplicada** de este sitio, con el código que
  acompaña varios de estos criterios:
  [`proyectos/lab-estadistica`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/lab-estadistica).
