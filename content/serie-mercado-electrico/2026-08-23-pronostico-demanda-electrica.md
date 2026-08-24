---
title: "Mercado mayorista VIII. Pronóstico de demanda, comparación honesta de tres enfoques"
summary: "Línea base estacional, SARIMAX y gradient boosting, evaluados con origen móvil sobre 182 pronósticos cada uno. El boosting perdió contra la línea base hasta que encontré un error de alineación en mis propios rasgos, el SARIMAX ganó por una razón que invalida parcialmente la comparación, y los intervalos cubren 59 % cuando deberían cubrir 80 %."
date: 2026-08-23
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [pronostico, series-de-tiempo, backtesting, python]
estado: en-revision
math: false
---

La programación semanal necesita, entre sus insumos, una proyección de demanda:
energía semanal y demanda de potencia horaria por barra (ROBCP 9.3.1 a). Este
artículo compara tres maneras de producir la primera de esas dos cosas y reporta
lo que salió, incluido lo que salió mal.

Digo "comparación honesta" y quiero que signifique algo concreto: reportar la
línea base, evaluar de la única manera que reproduce la situación real, publicar
las métricas desagregadas en vez del promedio que favorece, evaluar también los
intervalos, y decir en qué el ejercicio está sesgado a favor de uno de los
modelos. Los cinco puntos aparecen abajo, y el último es el más incómodo.

El código está en
[`proyectos/pronostico-demanda`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/pronostico-demanda).

## La serie es sintética, la evaluación no

No tengo la serie de demanda de El Salvador. Podría haber inventado números y
presentarlos como resultados, o no publicar números. Elegí una tercera cosa:
generar una serie sintética con la estructura de una demanda real y correr sobre
ella un experimento de verdad.

La serie tiene cuatro años de energía diaria con tendencia, estacionalidad anual
y semanal (con sábado distinto de domingo), feriados de fecha fija con caída
fuerte, una serie exógena de temperatura con su propio ciclo, y ruido
autocorrelacionado AR(1) porque el error de un día se parece al del anterior.

Lo que es real es todo lo demás. Los modelos se ajustan de verdad, el
backtesting corre de verdad, las métricas son las que salieron, y cuando algo
falló quedó en el artículo.

## Por qué origen móvil

<figure class="fig fig-wide">
  <img src="../assets/figures/origen-movil.svg"
       alt="Arriba, una barra de sesenta segmentos donde los de prueba en ámbar están intercalados con los de entrenamiento en gris, ilustrando que una partición al azar deja días futuros dentro del entrenamiento. Abajo, cinco filas donde cada una muestra un bloque de entrenamiento que crece y un bloque de prueba de siete días que se desplaza hacia la derecha, ilustrando el origen móvil."
       width="1200" height="560" loading="lazy" />
  <figcaption>Una partición al azar sobre una serie de tiempo deja días
  posteriores dentro del entrenamiento y días anteriores dentro de la prueba. El
  modelo aprende del futuro y la métrica sale excelente por la razón equivocada.
  El origen móvil cuesta tiempo de cómputo, porque hay que reajustar el modelo
  en cada corte, y es la única evaluación que mide un modelo en vez de medir un
  experimento.</figcaption>
</figure>

Veintiséis orígenes, uno por semana, medio año de prueba. En cada origen los
tres modelos se reajustan con todo lo anterior y pronostican los siete días
siguientes, que es exactamente el horizonte de la programación semanal. Son 182
pronósticos evaluados por modelo.

Una advertencia que hay que hacer y casi nadie hace: **las exógenas del futuro se
toman como conocidas.** En operación no lo son. La temperatura de dentro de siete
días viene de un pronóstico meteorológico que tiene su propio error, y ese error
se suma al del modelo de demanda. El número que reporto abajo es optimista por
esa razón, y quien lo lea tiene derecho a saberlo antes de compararlo con el
error de un sistema en producción.

## Los tres modelos

**Línea base estacional.** El valor del mismo día de la semana anterior. Una
línea de código. Es la que casi nadie reporta, y es contra la que hay que ganar
antes de hablar de cualquier otra cosa: un modelo que no le gana a esto no
justifica su existencia, sin importar cuán sofisticado sea.

**SARIMAX(1,1,1)(1,1,1,7)** con dos exógenas, grados de refrigeración sobre una
base de confort y una bandera de feriado. Se ajusta sobre los últimos dos años,
que bastan para la estacionalidad semanal y mantienen el tiempo en segundos.

**Gradient boosting**, con estrategia directa: un modelo por horizonte, siete en
total, más dos modelos cuantílicos por horizonte para P10 y P90. Los rasgos son
calendario, clima y estructura de la propia serie: rezagos de 1, 2, 3, 7, 14, 28
y 364 días, medias móviles de 7 y 28 y desviación de 7. Usa
`HistGradientBoostingRegressor` de scikit-learn en vez de LightGBM para que el
proyecto corra sin instalar nada.

## El error que casi publico

La primera corrida dio esto: el boosting con un MAE de 1012 MWh por día, contra
754 de la línea base. Un 34 % **peor** que copiar la semana anterior.

Tuve la tentación de escribir el párrafo que ya conocen: "en series de longitud
moderada los modelos simples suelen superar a los complejos". Es una frase
verdadera en general y habría encajado perfecto. Habría sido un error.

Un modelo con rezagos, clima y calendario perdiendo contra la línea base no es
un hallazgo, es un síntoma. Fui a buscar y estaba en mis propios rasgos: los
construía indexados por el origen y desplazaba el objetivo hacia adelante, de
modo que el modelo del horizonte 7 se entrenaba viendo el calendario y la
temperatura del **origen**, pero al predecir le pasaba el calendario y la
temperatura del **día objetivo**. Entrenaba con una relación y predecía con otra.

La corrección fue indexar las filas por el día objetivo y desplazar hacia atrás
los rezagos, de forma que ninguno mire más allá del origen:

```python
def _rasgos(df, objetivo, h):
    """Rasgos para predecir el día d con la información disponible en d - h."""
    x = pd.DataFrame(index=df.index)
    x["dow"] = df.index.dayofweek        # del día objetivo: el almanaque se conoce
    x["cdd"] = df["cdd"].to_numpy()      # del día objetivo: viene del pronóstico
    for r in REZAGOS:
        x[f"lag{r}"] = objetivo.shift(h + r - 1)   # nunca más allá del origen
    base = objetivo.shift(h)
    x["media7"] = base.rolling(7).mean()
    return x
```

Con eso el boosting pasó de 1012 a 429, es decir de un 34 % peor a un 43 % mejor
que la línea base. Nada más cambió: ni un hiperparámetro, ni un rasgo.

Dejo esto acá porque es la lección más útil del ejercicio. Un desalineamiento
entre entrenamiento y predicción **no aparece en ninguna métrica de
entrenamiento**: el modelo ajusta bien lo que le enseñaron, solo que le enseñaron
otra cosa. Lo único que lo delata es una comparación contra una línea base
tonta. Si no hubiera reportado la línea base, habría publicado un modelo roto con
una explicación elegante.

## Los resultados

<figure class="fig fig-wide">
  <img src="../assets/figures/mae-por-horizonte.svg"
       alt="Gráfica de MAE en MWh por día contra el horizonte de uno a siete días. La línea base estacional oscila entre 620 y 900 sin tendencia clara. El gradient boosting sube de 302 en el día uno a 642 en el día siete. El SARIMAX se mantiene entre 175 y 264, casi plano. Abajo, una tabla con las métricas globales: SARIMAX con MAE de 205.8, RMSE 264.4, MAPE 0.64 por ciento y 72.7 por ciento de mejora sobre la base; gradient boosting con MAE 429.1 y 43.1 por ciento de mejora; línea base con MAE 754.2."
       width="1200" height="660" loading="lazy" />
  <figcaption>Las tres curvas se comportan de manera cualitativamente distinta.
  La línea base no se degrada con el horizonte porque no aprende nada: su error
  es el mismo el día uno que el día siete. El boosting parte muy bien y se
  degrada rápido. El SARIMAX es casi plano. Esa forma dice más que el promedio
  de cada uno.</figcaption>
</figure>

El SARIMAX gana con claridad: 205.8 MWh de MAE contra 429.1 del boosting y 754.2
de la línea base. Su degradación con el horizonte es notablemente suave, de 180
en el día uno a 264 en el día siete, mientras el boosting pasa de 302 a 642.

La forma de las curvas es lo interesante. La línea base es plana pero alta, y no
se degrada porque no tiene nada que degradar: predice lo mismo con un día o con
siete. El boosting es el mejor de los tres en el día uno si uno mira solo la
tendencia, pero pierde precisión rápido porque sus rezagos se alejan: para el
horizonte 7, el dato más fresco que ve tiene una semana. El SARIMAX modela la
estructura de la serie en vez de memorizar sus valores recientes, y por eso el
horizonte lo castiga menos.

También vale mirar el sesgo, que la tabla reporta y casi ningún informe incluye.
La línea base tiene sesgo negativo (−152), el boosting positivo (+165) y el
SARIMAX pequeño (−36). Un modelo con sesgo sistemático es corregible con una
constante; uno sin sesgo pero con mucha varianza, no.

## Por qué este resultado no se puede extrapolar

Acá está la parte que hace que esto sea una comparación honesta y no una
demostración.

**El SARIMAX gana en parte porque la serie está hecha a su medida.** Yo la generé
con una tendencia lineal, estacionalidades sinusoidales, efectos aditivos de
calendario y ruido AR(1). Eso es, casi literalmente, la clase de proceso que un
SARIMAX asume. Le pedí a un modelo que recuperara la estructura que yo mismo
usé para construir los datos.

Una demanda real no es así. Tiene quiebres estructurales, respuesta no lineal a
la temperatura, efectos de calendario que interactúan entre sí, y en un sistema
con generación distribuida creciente tiene además una demanda neta que cambia de
forma. En ese terreno el boosting tiene ventajas que acá no se ven, porque acá no
hay ninguna no linealidad interesante que capturar.

Así que la conclusión defendible **no** es "el SARIMAX es mejor". Es esto: en una
serie con estructura lineal fuerte y cuatro años de historia, un modelo
estadístico bien especificado gana, corre en un tercio del tiempo y es
interpretable. Cuál gana en la serie real es una pregunta empírica que se
responde repitiendo este mismo backtesting sobre esa serie, y este proyecto es la
maquinaria para hacerlo, no la respuesta.

## Los intervalos, que es donde de verdad falló

<figure class="fig fig-wide">
  <img src="../assets/figures/intervalos.svg"
       alt="Una barra que muestra 58.8 por ciento de cobertura observada contra una marca vertical en el 80 por ciento nominal, evidenciando que la banda es demasiado angosta. A la derecha, ancho medio de 877 MWh y pérdidas pinball de 113.5 para P10 y 119.4 para P90. Abajo, tres acciones: reportarlo, calibrarlo y sospechar de la causa."
       width="1200" height="480" loading="lazy" />
  <figcaption>Un intervalo con 59 % de cobertura no es un intervalo del 80 %.
  Presentarlo como tal es peor que no dar intervalo, porque quien lo use para
  dimensionar reserva va a quedarse corto una de cada tres veces en vez de una
  de cada cinco.</figcaption>
</figure>

Los modelos cuantílicos del boosting producen una banda P10 a P90 que debería
contener el valor real el 80 % de las veces. Contiene el 58.8 %.

La causa más probable la puse en la figura y la repito porque es general: el
ruido de esta serie está autocorrelacionado, y un modelo que trata cada día como
independiente subestima la varianza acumulada del horizonte. La regresión
cuantílica aprende la dispersión condicional que ve en los datos de
entrenamiento, no la dispersión de un error que se acumula a lo largo de siete
días. Ensanchar la banda arbitrariamente hasta que la cobertura cuadre sería
hacer trampa; calibrarla sobre un conjunto aparte sería lo correcto, y no lo
hice.

Lo reporto sin arreglarlo porque el arreglo no cabía en el alcance de este
artículo y porque un intervalo mal calibrado y declarado como tal es más útil
que uno mal calibrado y presentado como bueno.

## Cómo elegiría, y con qué argumento

Si tuviera que defender una recomendación ante un panel, sería esta.

Empezaría por el SARIMAX, por tres razones que se sostienen fuera de este
experimento: es el que menos se degrada con el horizonte, que es lo que la
programación semanal necesita; corre en un tercio del tiempo, lo que importa
cuando hay que reajustar seguido; y es interpretable, o sea que ante una
desviación grande se puede explicar de dónde vino. En una entidad que tiene que
justificar sus decisiones ante participantes del mercado, la interpretabilidad
no es un lujo estético: es la diferencia entre poder responder una objeción y
tener que decir que el modelo lo dijo.

Mantendría el boosting corriendo en paralelo, sin ponerlo en producción, por dos
motivos. Primero, porque en la serie real puede ganar y la única forma de saberlo
es medirlo. Segundo, porque su patrón de error es distinto al del SARIMAX, y dos
modelos que se equivocan de maneras distintas se pueden combinar; uno que se
equivoca igual, no.

Y mantendría la línea base para siempre, en el informe, como control. El día que
el modelo bueno se degrade por un cambio en la serie, la comparación contra la
línea base es lo que lo va a delatar. A mí me delató un error de código.

Sobre las redes recurrentes, que es la pregunta que siempre aparece: tendrían
sentido con series largas, muchas series relacionadas y alta frecuencia. Acá hay
1461 observaciones y una sola serie. Un LSTM sobre esto es una respuesta cara a
una pregunta que ya contestó un modelo de veinte líneas, y en una entrevista
diría exactamente eso.

## Lo que le falta

Está evaluado a nivel de energía diaria, no de demanda de potencia horaria por
barra, que es la otra mitad de lo que pide el numeral 9.3.1. No hay
reconciliación entre horizontes: nada garantiza que la suma de los siete días
coincida con la energía semanal que produciría un modelo semanal. Los intervalos
no están calibrados. Y las exógenas se asumen conocidas.

::: nota Lo que me llevo
Me llevo el error de alineación, y no por el error sino por cómo lo encontré.

Vengo de trabajar con datos operativos, donde la señal de que algo está mal casi
siempre es física: un valor imposible, un balance que no cierra, una medición
que contradice a otra. En modelado predictivo esa señal no existe. Un modelo mal
entrenado no produce nada imposible: produce números perfectamente razonables,
con un error perfectamente creíble, y ajusta bien sobre sus propios datos de
entrenamiento.

Lo único que lo delató fue tener una referencia tonta al lado. Y eso me cambió
la forma de pensar la línea base: dejé de verla como el punto de partida de una
comparación y empecé a verla como un instrumento de medición. No está ahí para
que le ganemos; está ahí para avisarnos cuando algo se rompió.
:::

## Fuentes

- **Código completo**:
  [`proyectos/pronostico-demanda`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/pronostico-demanda).
  `serie.py` genera la serie sintética con semilla fija, `modelos.py` los tres
  enfoques con interfaz común, `backtest.py` la validación con origen móvil y
  las métricas. `resultados.json` es la corrida que alimenta las figuras de este
  artículo. Requiere numpy, pandas, statsmodels y scikit-learn.
- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones. Numeral 9.3.1 literal a: la proyección de demanda como
  insumo de la programación semanal, en energía semanal y demanda de potencia
  horaria por barra. Copia local: `normativa/robcp.pdf`. Consultado el 22 de
  agosto de 2026.
- **Datos**: sintéticos, generados por `serie.py`. Ninguna cifra corresponde a la
  demanda real de El Salvador ni de ningún otro sistema. Lo que se copia de la
  realidad es la estructura de la serie, y el artículo explica en qué esa
  elección sesga la comparación.

Con este artículo cierra la serie. El registro completo de documentos primarios,
con su estado de verificación, está en [Fuentes primarias](../fuentes).
