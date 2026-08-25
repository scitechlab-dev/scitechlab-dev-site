---
title: Plan de estudio
summary: Los dieciocho artículos del sitio organizados como programa de estudio para análisis de mercado eléctrico, con el orden de lectura, qué responde cada uno y qué hay que saber antes de abrirlo.
lang: es
slug: estudio
---

El sitio tiene dieciocho artículos y el archivo los ordena por fecha, que es el
peor orden posible para estudiar. Esta página los ordena por dependencia: qué
hay que entender antes de qué, y qué pregunta responde cada pieza.

El recorrido completo son cuatro bloques. Quien solo quiera la regulación puede
quedarse en los dos primeros; quien venga a la parte analítica necesita el
primero de todos modos, porque el dominio es el que da sentido a los datos.

## Bloque 0. La normativa como referencia

Estos dos no se leen de corrido: se consultan. Conviene abrirlos primero para
saber dónde buscar, y volver a ellos cada vez que aparezca un numeral.

| Artículo | Qué contiene | Cuándo volver |
|---|---|---|
| [El ROBCP, guía de lectura](../articles/robcp-guia-de-lectura) | Mapa de los 21 capítulos y los 21 anexos, con página y propósito. Índice inverso de pregunta a numeral | Cada vez que haya que ubicar un numeral |
| [La Ley General de Electricidad, mapa completo](../articles/ley-general-electricidad-mapa-completo) | Los once capítulos con su rango de artículos, las definiciones del art. 4, el régimen sancionatorio y las doce reformas | Cada vez que haya que ubicar un artículo de la ley |

De los dos, el del ROBCP es el que más rinde al principio, porque su índice
inverso evita el error más caro del estudio: buscar un tema en el capítulo que
lleva su nombre.

## Bloque 1. El mercado mayorista, en orden

Ocho artículos encadenados. Cada uno usa lo que dejó el anterior, así que el
orden no es sugerencia.

**1. [Quién decide qué en El Salvador](../articles/quien-es-quien-mercado-electrico-salvadoreno)**
El mapa institucional: cuatro funciones y sus titulares, la UT por dentro (quién
la posee, quién la manda y de qué vive), los mercados que administra y por qué el
país valoriza a costos de producción y no a ofertas.
*Prerrequisito: ninguno. Es la puerta de entrada.*

**2. [Del orden de mérito al precio](../articles/orden-de-merito-costo-marginal)**
Cómo se forma el costo marginal, un despacho de cuatro unidades resuelto a mano
con su tabla de liquidación, qué rompe el orden de mérito puro, y el salto del
costo marginal al precio del MRS.
*Prerrequisito: el 1, para saber por qué el precio sale de costos declarados.*

**3. [La declaración semanal de precio de combustible](../articles/declaracion-semanal-precio-combustible)**
De dónde sale el costo variable que el artículo 2 consumió como dato: la
auditoría de consumo de calor, el precio puesto en planta armado componente por
componente, y el inventario mínimo atado a la cota del embalse.
*Prerrequisito: el 2. Sin saber qué consume el orden de mérito, este artículo no
tiene destino.*

**4. [Indexación de los costos variables no combustibles](../articles/indexacion-costos-variables-no-combustibles)**
La otra mitad del costo variable, que no se declara nunca: cómo se clasifica un
costo, la fórmula mensual de indexación y el ajuste por despacho real que mueve
más que la inflación.
*Prerrequisito: el 3, que resolvió la mitad del combustible.*

**5. [Los horizontes de la programación](../articles/horizontes-programacion-operacion)**
Son tres, no cuatro. Qué decide cada uno, el valor del agua calculado en dos
fases, el criterio probabilístico con que se aprueba un mantenimiento y qué rompe
un programa ya publicado.
*Prerrequisito: los artículos 3 y 4, porque los costos ya entendidos son insumo
de los tres horizontes.*

**6. [El mercado regional y la liquidación](../articles/mercado-electrico-regional)**
Cómo entra una importación al despacho nacional, el piso que impide exportar por
debajo del costo validado, y el recorrido completo de un megavatio hora hasta el
documento de transacciones económicas.
*Prerrequisito: los artículos 2 a 5. Acá se cierra el circuito.*

**7. [Validación automática de declaraciones](../articles/validacion-datos-operativos-python)**
El catálogo de doce reglas del artículo 3 convertido en código que corre, con la
corrida real sobre 48 declaraciones sintéticas y su registro auditable.
*Prerrequisito: el 3, del que sale la lista de reglas.*

**8. [Pronóstico de demanda, tres enfoques](../articles/pronostico-demanda-electrica)**
Backtesting con origen móvil de una línea base, un SARIMAX y un gradient
boosting, con el error de alineación que casi se publica como hallazgo.
*Prerrequisito: el 5, que dice para qué decisión sirve el pronóstico.*

El registro de las fuentes primarias que sostienen los ocho, con su estado de
verificación, está en [Fuentes primarias](../fuentes).

## Bloque 2. Regulación desde el otro lado

Un artículo que recorre la misma ley desde las obligaciones de una empresa
regulada, en vez de desde el mercado.

**[La LGE leída desde una distribuidora](../articles/ley-general-electricidad-distribuidoras)**
Los cuatro frentes de obligaciones, los cargos calculados sobre una empresa
eficiente teórica, los cien metros del artículo 77-C, los casos en que procede el
corte y el mercado minorista del Decreto 548.
*Prerrequisito: conviene el mapa de la ley del bloque 0.*

## Bloque 3. Analítica, de los fundamentos al dominio

Este bloque tiene dos mitades. Las tres primeras piezas son laboratorios
generales, con código que corre y sin dominio eléctrico. Las tres siguientes
aplican todo eso al mercado.

### Fundamentos con código

| Artículo | Qué enseña |
|---|---|
| [pandas y las cuatro bibliotecas de gráficos](../articles/analisis-datos-python-pandas) | Manipulación de datos y visualización, con el argumento `validate=` como principio de diseño |
| [Fundamentos de estadística para un analista](../articles/fundamentos-estadistica-analista) | Inferencia, significancia y el caso donde la teoría predice una cosa y los datos muestran otra |
| [Laboratorio de series de tiempo](../articles/lab-series-de-tiempo-python) | Seis algoritmos sobre tres series que no se parecen, con MASE como métrica comparable |

### Aplicación al mercado eléctrico

**[Analítica de datos del mercado eléctrico](../articles/analitica-datos-mercado-electrico)**
La capa que va antes de cualquier modelo: el inventario de las seis familias de
datos con su grana, y las cuatro trampas que corrompen un análisis antes de
empezar.
*Prerrequisito: el bloque 1 completo, y el laboratorio de pandas.*

**[Métodos estadísticos para analizar un mercado eléctrico](../articles/metodos-estadisticos-mercado-electrico)**
Por qué la media y la desviación son el resumen equivocado, la curva de duración,
correlación contra causalidad, y las dos regresiones que el propio reglamento
manda hacer.
*Prerrequisito: fundamentos de estadística, y los artículos 2 y 4 del bloque 1.*

**[Metodología de pronósticos](../articles/pronosticos-mercado-electrico-metodologia)**
Qué se pronostica para decidir qué, la función de pérdida que sale de la
decisión, el protocolo de evaluación y la reconciliación entre productos.
*Prerrequisito: el laboratorio de series de tiempo y el artículo 5 del bloque 1.*

## Fuera del programa

**[Coordinating protection without time grading](../articles/overcurrent-protection-distribution-feeders)**
Protecciones de sobrecorriente en alimentadores de distribución. Es de operación
de red y no de mercado, así que no depende de nada de lo anterior ni nada
depende de él.

::: nota Tres recorridos según el tiempo disponible
**Una tarde.** Artículo 1 del bloque 1, y el índice inverso de la guía del ROBCP.
Con eso se puede leer cualquier documento del sector sin perderse.

**Una semana.** Bloque 1 completo, en orden, con la guía del ROBCP abierta al
lado. Es el recorrido que cubre el mecanismo entero, desde quién aprueba una
regla hasta cómo termina en una factura.

**Un mes, para trabajar en esto.** Los cuatro bloques, y además correr el código:
el validador de declaraciones y el backtest de pronóstico están en el repositorio
y corren sin configuración. Leer un mecanismo y ejecutarlo no dejan el mismo
residuo.
:::
