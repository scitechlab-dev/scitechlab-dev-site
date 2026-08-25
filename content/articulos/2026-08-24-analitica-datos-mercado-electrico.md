---
title: "Analítica de datos del mercado eléctrico: el modelo antes que el modelo"
summary: "Qué datos produce un mercado mayorista por costos, en qué granularidad vive cada uno, y las cuatro trampas que corrompen un análisis antes de que empiece: la grana equivocada, el valor ex ante confundido con el ex post, la unión temporal mal hecha y la identidad que nadie verifica."
date: 2026-08-24
lang: es
topic: Analítica de datos
categories: [analitica]
tags: [datos, pandas, modelado, calidad-de-datos, mercado-electrico]
estado: publicado
math: true
---

Un análisis de mercado eléctrico casi nunca falla en el modelo estadístico.
Falla antes: en un `merge` que duplicó filas, en un promedio de precios que
debía ser ponderado por energía, en una declaración evaluada contra la
estructura de costos equivocada. Nada de eso produce un error visible. Produce
un número plausible.

Este artículo trata la capa que va antes de cualquier modelo: qué datos existe
en un mercado mayorista basado en costos, cómo se relacionan entre sí y cuáles
son las cuatro trampas que hay que cerrar antes de escribir la primera línea de
análisis.

## El inventario de datos

El mercado produce datos en cinco familias, y cada una vive en su propia
cadencia. Confundir cadencias es la primera fuente de error, y por eso conviene
tener el inventario a la vista.

| Familia | Grana | Origen | Cadencia de publicación |
|---|---|---|---|
| Estructuras de costo aprobadas | Por participante, central y combustible | Regulador, sobre auditoría | Bienal (ROBCP, Anexo 04, 4.3) |
| Curvas de consumo específico | Por unidad generadora | Auditor externo, aprueba la UT | Bienal (Anexo 16, 2.2) |
| CVNC y costos de arranque | Por unidad | Auditoría bienal, indexación mensual | Mensual (Anexo 17, 9.1 y 9.3) |
| Declaraciones de combustible | Por participante y combustible | El generador declara | Semanal, jueves antes de las 10:00 (Anexo 04, 10.1) |
| Programación y despacho | Por unidad y hora | La UT calcula | Anual, semanal y diaria (cuerpo, 7.1.2) |
| Medición comercial | Por punto de medición y hora | SIMEC | Continua, liquidación mensual (cuerpo, 18.4.1) |

Dos publicaciones tienen hora fija y son las que permiten construir una serie
histórica sin pedirle nada a nadie: los precios de combustible puestos en planta
que la UT publica **entre las 8 y las 9 de cada día**, y el precio calculado que
publica **cada jueves** junto con la programación semanal (Anexo 04, 11.1 y
11.2). La obligación legal de fondo es el artículo 60 de la Ley General de
Electricidad, que además manda publicar las ofertas horarias y el nivel de los
embalses.

## Trampa 1: la grana equivocada

La grana de una tabla es el conjunto mínimo de columnas que identifica una fila
sin ambigüedad. Escribirla explícitamente antes de tocar los datos evita la
mayoría de los desastres posteriores.

| Tabla | Grana | Consecuencia de equivocarse |
|---|---|---|
| Despacho | unidad + intervalo | Sumar energía dos veces |
| Precio del MRS | MRS + intervalo | Promediar precios de nodos distintos como si fueran uno |
| Declaración de combustible | participante + central + combustible + semana | Contar una central con dos combustibles como dos declaraciones |
| Estructura aprobada | participante + central + combustible + vigencia | Aplicar la estructura de otro período |
| Medición | punto de medición + intervalo | Doble conteo de un punto con medidor principal y de respaldo |

Nótese la fila del precio. **El precio del MRS no es un valor nacional por
hora.** Con congestión, el sistema se divide en tantos MRS como haga falta para
que dentro de cada uno no la haya, y cada uno tiene su propio costo marginal
(cuerpo, 10.6.3.1). Una tabla de precios cuya grana sea solo el intervalo es
correcta la mayor parte del tiempo y silenciosamente falsa exactamente en las
horas que más interesa analizar.

En pandas, la grana se afirma, no se supone:

```python
def afirmar_grana(df, claves):
    """Falla si las claves no identifican una fila única."""
    dup = df.duplicated(subset=claves, keep=False)
    if dup.any():
        raise ValueError(
            f"{dup.sum()} filas duplicadas para la grana {claves}:\n"
            f"{df.loc[dup, claves].head(10)}"
        )
    if df[claves].isna().any().any():
        raise ValueError(f"Hay nulos en las claves de grana {claves}")
    return df

despacho = afirmar_grana(despacho, ["unidad", "intervalo"])
precios = afirmar_grana(precios, ["mrs", "intervalo"])
```

Y en todo `merge`, el argumento que casi nadie usa y que convierte un error
silencioso en una excepción:

```python
df = despacho.merge(
    precios,
    on=["mrs", "intervalo"],
    how="left",
    validate="many_to_one",   # muchas unidades por precio, nunca al revés
)
```

Si `validate` falla, el problema estaba en los datos y se descubre en el
momento. Sin `validate`, el `merge` duplica filas, la energía total sube unos
puntos porcentuales, ningún gráfico se ve raro y el número se usa para decidir
algo.

## Trampa 2: el mismo campo con dos valores

En un mercado eléctrico casi todo existe dos veces: una vez como previsión y
otra como hecho. El reglamento es explícito al respecto y la analítica tiene que
serlo también.

El costo marginal del predespacho es **ex ante** y de carácter indicativo
(Anexo 09, 3.1.14, y cuerpo, 10.5.7). El que liquida es el **ex post**,
recalculado en el posdespacho diario con las lecturas reales de inyección y
retiro del SIMEC (3.1.14 y 3.8). Del mismo lado comercial, la UT pone a
disposición cada día hábil una estimación indicativa, y la liquidación es
mensual (cuerpo, 18.4.1 y 18.4.2).

Eso significa que una serie histórica de precios responde a dos preguntas
distintas según cuál se use, y ninguna de las dos es "el precio":

| Pregunta | Serie correcta |
|---|---|
| ¿Qué señal recibió el participante para programar? | Ex ante, del predespacho |
| ¿Cuánto se pagó realmente? | Ex post, del posdespacho |
| ¿Qué tan buena es la previsión del operador? | Las dos, comparadas |

La única regla que evita el desastre es no permitir que la columna se llame
`precio`. Se llama `precio_ex_ante` y `precio_ex_post`, y el código que las usa
declara cuál necesita. Un nombre ambiguo en una tabla se convierte, tres meses
después, en un análisis que nadie puede auditar.

Lo mismo aplica a la energía: la programada, la despachada y la medida son tres
columnas, no una.

## Trampa 3: la unión temporal

Esta es la más específica del dominio, y la que separa un análisis correcto de
uno que parece correcto.

Una declaración de la semana 34 no se evalúa contra la estructura de costos
vigente hoy. Se evalúa contra **la que estaba vigente en la semana 34**. El
reglamento lo hace explícito de dos maneras: las estructuras se revisan cada dos
años (Anexo 04, 4.3), y mientras el regulador no apruebe estructuras
actualizadas la UT sigue aplicando las del período anterior (4.7). Es decir que
en cualquier momento hay exactamente una estructura vigente por participante,
central y combustible, y esa vigencia tiene fecha de inicio y fecha de fin.

En el vocabulario de almacenes de datos, eso es una dimensión que cambia
lentamente, y el error clásico es unirla por la clave sin la fecha, tomando el
registro más reciente. El resultado valida enero contra una estructura que
empezó en junio.

La unión correcta es asimétrica en el tiempo: para cada declaración, la
estructura cuya vigencia empezó **antes o en** su fecha y no había terminado.

```python
import pandas as pd

# Ambos lados deben venir ordenados por la columna de tiempo.
decl = declaraciones.sort_values("fecha")
estr = estructuras.sort_values("vigencia_desde")

unido = pd.merge_asof(
    decl,
    estr,
    left_on="fecha",
    right_on="vigencia_desde",
    by=["participante", "central", "combustible"],
    direction="backward",          # la última vigente a esa fecha, no la más nueva
    allow_exact_matches=True,
)

# merge_asof no conoce la fecha de fin: hay que verificarla aparte.
vencida = unido["fecha"] > unido["vigencia_hasta"]
unido.loc[vencida, "estructura_id"] = pd.NA
```

Esas dos últimas líneas son la parte que se olvida. `merge_asof` con
`direction="backward"` encuentra la estructura anterior más cercana, pero no
sabe si esa estructura ya había vencido. Sin la verificación explícita, una
declaración de 2026 puede quedar unida a una estructura que expiró en 2024, y el
análisis sigue corriendo.

Conviene además distinguir dos cosas que la vigencia mezcla: **cuándo rige un
dato** y **cuándo se supo**. Un CVNC indexado del mes 6 puede haberse calculado
en el mes 7, porque el ajuste usa el último mes calendario con información
oficial disponible (Anexo 17, 9.1.5.5), y los datos de energía y horas los
remite el generador durante los primeros diez días hábiles del mes siguiente
(9.3.3). Una tabla que solo tiene una fecha no puede responder la pregunta "qué
sabíamos en ese momento", que es exactamente la pregunta de cualquier
reconstrucción posterior.

## Trampa 4: la identidad que nadie verifica

Un dato de mercado eléctrico casi nunca está solo: forma parte de identidades
que tienen que cerrar. Verificarlas es la forma más barata de detectar
corrupción, y la que más rinde, porque no depende de ninguna expectativa sobre
la magnitud.

Las cuatro identidades básicas:

$$
\begin{aligned}
\text{CV}_{\text{total}} &= \text{CVC} + \text{CVNC} \\
P_{\text{MRS}} &= \text{CMO} + \text{Csis} \\
\text{Inv}_{\text{final}} &= \text{Inv}_{\text{inicial}} + \text{Compras} - \text{Consumo} \\
\text{PCpep} &= \frac{\text{Costo puesto en tanques}}{\text{PCI}}
\end{aligned}
$$

donde CVC es el costo variable de combustible, CVNC el no combustible, CMO el
costo marginal de operación, Csis los cargos del sistema, Inv el inventario de
combustible en unidades de volumen o masa, PCpep el precio del combustible
puesto en planta en unidades de energía y PCI el poder calorífico inferior.

La segunda sale del Anexo 09, 3.3.1. La tercera es el balance de inventarios que
sostiene el control del Anexo 04. La cuarta es la conversión que más errores
produce, y no por aritmética sino por unidades: el ensayo de consumo de calor
está construido sobre **poder calorífico inferior** (Anexo 16, apéndice 1), así
que convertir el precio con poder calorífico superior produce un costo variable
sesgado sin que ninguna de las dos cifras esté mal por separado.

A esas cuatro conviene sumarles una verificación cruzada que no depende de
ningún documento que aporte el declarante: el consumo de combustible declarado
debe ser compatible con la energía que registró el SIMEC, pasada por la curva de
consumo específico vigente. Es la más cara de montar y la más difícil de
falsear, porque cruza dos fuentes independientes.

```python
TOLERANCIAS = {          # en un solo lugar, y justificadas
    "precio_relativo": 0.005,     # media de un centavo por dólar
    "balance_inventario": 0.01,   # 1 % del volumen movido
    "consumo_vs_simec": 0.05,     # 5 %, absorbe variación de régimen
}

def verificar_identidad(obs, esperado, tol_rel, etiqueta):
    if esperado == 0:
        return abs(obs) <= tol_rel, etiqueta
    error = abs(obs - esperado) / abs(esperado)
    return error <= tol_rel, f"{etiqueta}: {error:.3%}"
```

Las tolerancias en un diccionario y no repartidas por el código no es cosmética.
Es la diferencia entre poder responder "con qué criterio se aceptó esto" y no
poder.

## Un esquema que aguanta

Con las cuatro trampas cerradas, el modelo dimensional se escribe casi solo. Los
hechos son las tres tablas horarias y la mensual; el resto son dimensiones, y
dos de ellas son versionadas.

```
HECHOS
  fact_despacho          unidad, intervalo -> energia_programada, energia_despachada
  fact_medicion          punto, intervalo  -> energia_medida
  fact_precio            mrs, intervalo    -> cmo_ex_ante, cmo_ex_post, csis
  fact_liquidacion       participante, mes -> cargos, abonos, neto

DIMENSIONES
  dim_unidad             unidad -> central, participante, tecnologia, combustible
  dim_mrs                mrs    -> nodos que agrupa
  dim_estructura_costo   participante, central, combustible, vigencia_desde/hasta
  dim_curva_consumo      unidad, vigencia_desde/hasta -> a, b, c, p_min, p_max
  dim_calendario         intervalo -> fecha, hora, dia_semana, feriado, semana_iso
```

Tres decisiones de ese esquema merecen justificarse.

**`dim_curva_consumo` guarda el rango de validez.** Los coeficientes del
polinomio no bastan: la curva tiene validez solamente entre el mínimo técnico
ensayado y la potencia máxima alcanzada en el ensayo (Anexo 16, apéndice 3,
2.3.3). Fuera de esa banda la parábola sigue siendo evaluable y deja de
significar algo. Guardar `p_min` y `p_max` junto a los coeficientes convierte una
extrapolación silenciosa en un error explícito.

**`fact_precio` tiene tres columnas de precio y no una.** Por la trampa 2.

**`dim_calendario` es una tabla y no una función.** Los feriados, las semanas
ISO y el marcado de días atípicos son datos, no lógica, y tienen que poder
corregirse sin tocar código ni reprocesar.

## El orden de las verificaciones

La secuencia importa, porque una verificación que corre después de una
transformación ya no verifica el dato de origen.

1. **Al ingerir**: grana y nulos en claves. Antes de cualquier transformación.
2. **Al unir**: `validate=` en cada `merge`, y `merge_asof` con verificación de
   vencimiento para las dimensiones versionadas.
3. **Al derivar**: las identidades aritméticas, sobre las columnas ya unidas.
4. **Al agregar**: que la suma de las partes reproduzca el total que venía
   informado, cuando existe.
5. **Al publicar**: que el resultado no cambie respecto de la corrida anterior
   más allá de lo que explique el dato nuevo.

El punto 5 es el que casi nunca se implementa y el único que detecta un cambio
de criterio no documentado aguas arriba.

::: nota Para retener: el promedio de precios casi siempre está mal
Tres formas de promediar un precio horario dan tres números distintos, y solo una
responde la pregunta que suele hacerse.

| Cálculo | Qué responde |
|---|---|
| Media aritmética de los precios horarios | El precio de una hora tomada al azar |
| Media ponderada por energía retirada | Lo que efectivamente pagó la demanda |
| Media ponderada por energía inyectada de una unidad | Lo que efectivamente cobró esa unidad |

En un sistema con solar creciente la diferencia no es menor: las horas baratas
concentran mucha energía y las caras concentran poca, o al revés, según el
perfil. Preguntar "cuál fue el precio del mes" sin decir con qué peso es
preguntar tres cosas a la vez.

La regla práctica: **un precio se promedia ponderado por la cantidad que lo
acompaña**, y si no hay cantidad, el promedio es descriptivo y no económico.
:::

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP.pdf/129acc69-cb01-7ed4-7080-88be586df4ec?t=1729522985515).
  Numerales citados: 7.1.2 (los tres horizontes), 10.5.7 (carácter indicativo del
  predespacho), 10.6.3.1 (varios MRS con congestión), 18.4.1 y 18.4.2 (liquidación
  mensual y estimación diaria). Copia local: `normativa/robcp.pdf`. Consultado el
  22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 04: revisión bienal de estructuras
  (4.3), continuidad de la estructura vencida (4.7), declaración del jueves
  (10.1) y publicaciones de la UT (11.1 y 11.2). Anexo 09: precio del MRS como
  costo marginal más cargos del sistema (3.3.1), y costo marginal ex ante frente a
  ex post (3.1.14 y 3.8). Anexo 16: rango de validez de la curva de consumo
  específico (apéndice 3, 2.3.3) y consumo de calor definido sobre poder
  calorífico inferior (apéndice 1). Anexo 17: mes de referencia de la indexación
  (9.1.5.5) y plazo de remisión de energía y horas (9.3.3). Copia local:
  `normativa/robcp-anexos.pdf`. Consultado el 22 de agosto de 2026.
- **Ley General de Electricidad**, Decreto Legislativo No. 843 del 10 de octubre
  de 1996. Artículo 60: publicidad de los precios del MRS y publicación diaria de
  ofertas horarias, nivel de embalses y precios de combustibles puestos en planta.
  Copia local: `normativa/ley-general-electricidad.pdf`. Consultado el 22 de
  agosto de 2026.
- **Código**: los patrones de validación de este artículo son los que implementa
  [`proyectos/validador-cvc`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/validador-cvc).
