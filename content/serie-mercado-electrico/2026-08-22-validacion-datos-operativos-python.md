---
title: "Mercado mayorista VII. Validación automática de declaraciones, con código que corre"
summary: "Un validador de declaraciones semanales de precio de combustible, escrito como catálogo de reglas y no como cadena de condicionales. Doce reglas atadas a su numeral del ROBCP, cuatro ámbitos, un criterio para separar rechazo de alerta, y la corrida real sobre 48 declaraciones sintéticas con doce defectos sembrados."
date: 2026-08-22
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [python, calidad-de-datos, validacion, trazabilidad]
estado: publicado
math: false
---

Los seis artículos anteriores describieron un mecanismo que descansa sobre una
sola cosa: que los datos declarados sean correctos. Nadie mide en tiempo real el
precio del combustible de una central. Se declara, se valida contra una
estructura aprobada, y el resultado ordena el parque y fija el precio de la
energía.

Validar eso a mano no escala, y no por volumen. Cuatro participantes térmicos
por cincuenta y dos semanas son doscientas declaraciones al año, que una persona
revisa sin problema. No escala por otra razón: **una revisión manual no deja
rastro de qué se revisó**. Seis meses después, cuando alguien pregunte por qué
se aceptó la declaración de la semana 34, la respuesta tiene que ser un registro,
no un recuerdo.

Este artículo es el código de esa validación. Está en el repositorio del sitio,
en [`proyectos/validador-cvc`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/validador-cvc),
corre con la biblioteca estándar de Python y no necesita nada instalado. Las
cifras que aparecen abajo son la salida de correrlo, no un ejemplo escrito a
mano.

## La decisión de diseño que ordena todo

Un validador se puede escribir de dos maneras. La primera es una función que
recibe la declaración y va encadenando condicionales. Funciona, se escribe en
una tarde, y es imposible de auditar: para saber qué valida hay que leer el
código completo, y para agregar una regla hay que meter mano en el medio.

La segunda es tratar cada regla como un objeto declarativo y dejar que un motor
tonto las recorra. Eso cuesta un poco más al principio y devuelve tres cosas que
la primera no da. El catálogo se puede enumerar sin ejecutarlo, se puede
versionar, y cada hallazgo puede decir contra qué numeral se evaluó.

```python
@dataclass(frozen=True)
class Regla:
    id: str
    titulo: str
    ambito: Ambito
    severidad: Severidad
    referencia: str          # el numeral del ROBCP que la obliga
    evaluar: Callable[..., Resultado]
```

El campo `referencia` es el que convierte esto en una herramienta regulatoria y
no en un chequeo de datos. Cuando el validador rechaza una declaración, la
respuesta a "¿por qué?" no puede ser "lo dijo el sistema": tiene que ser
"Anexo 04, numeral 4.9, la fuente internacional no es la aprobada para esa
central".

<figure class="fig fig-wide">
  <img src="../assets/figures/arquitectura-validador.svg"
       alt="Arriba, seis etapas encadenadas: entrada de declaraciones tipadas, contexto con estructuras aprobadas y SIMEC, catálogo de doce reglas declarativas, motor que evalúa cada regla contra cada declaración, hallazgos clasificados en OK, falla o no evaluable, y registro auditable con hash del insumo. Abajo, cuatro tarjetas explican los ámbitos de regla: campo, registro, serie y cruce, con ejemplos y qué pasa cuando falta el insumo de cada uno."
       width="1200" height="660" loading="lazy" />
  <figcaption>El motor no sabe nada de combustibles y las reglas no saben nada
  de recorridos. Esa separación es lo que permite agregar una regla sin tocar el
  motor. Lo que decide qué se puede evaluar con información incompleta es el
  ámbito, y por eso el ámbito es un campo de la regla y no un comentario.
  </figcaption>
</figure>

## Los cuatro ámbitos, y por qué importan

El ámbito de una regla dice qué necesita para decidir, y de ahí se sigue qué
ocurre cuando esa información falta.

Una regla de **campo** mira un solo valor: si la declaración llegó el jueves
antes de las diez, si el inventario está referenciado a 60 °F. Siempre se puede
evaluar.

Una de **registro** cruza campos del mismo registro entre sí: que el precio
puesto en planta declarado sea efectivamente la suma de sus componentes dividida
por el poder calorífico, que el inventario final sea el inicial más compras
menos consumo. También siempre se puede evaluar, y es la clase de regla más
barata y más valiosa que existe, porque verifica una identidad y no una
expectativa.

Una de **serie** necesita al mismo declarante a lo largo de varias semanas:
detectar un salto de precio, detectar un valor congelado. Al inicio de la serie
no hay contra qué comparar.

Una de **cruce** necesita una fuente independiente: la estructura aprobada, el
SIMEC, la referencia internacional. Si la contraparte no llegó, la regla no se
puede evaluar.

Y acá está la decisión de diseño más discutible del catálogo:
**"no evaluable" es un resultado, no un silencio.** Si una regla se salta
porque le faltó el insumo y el informe no lo dice, ese informe no distingue
entre "esto pasó la revisión" y "esto no se revisó". En una corrida limpia esa
diferencia no importa; el día que alguien reclame, es lo único que importa.

Por la misma razón el registro guarda también las reglas que pasaron. Un informe
que solo lista fallas es indistinguible del informe de una corrida que nunca se
hizo.

## Rechazo o alerta

La pregunta que separa las dos severidades es una sola: **¿la discrepancia
admite una explicación legítima?**

<figure class="fig fig-wide">
  <img src="../assets/figures/severidad-criterio.svg"
       alt="Dos columnas. La de rechazo agrupa las reglas cuyo incumplimiento no admite explicación legítima: estructura no vigente, fuente no aprobada, ventana de promedio cambiada, envío fuera de plazo, internación que no siguió la fórmula, aritmética que no cierra, inventario sin referenciar y balance que no cuadra. La de alerta agrupa las que sí la admiten: consumo que no cuadra con lo generado, inventario bajo el piso, salto de precio mayor que la referencia y precio congelado."
       width="1200" height="560" loading="lazy" />
  <figcaption>La regla práctica cabe en una línea: una identidad que no cierra
  rechaza, una magnitud que sorprende alerta. Lo primero significa que el número
  no sirve para calcular nada; lo segundo, que hay que preguntar antes de que se
  repita.</figcaption>
</figure>

Una identidad aritmética que no cuadra no admite explicación. Si el precio
declarado no es la suma de sus componentes dividida por el poder calorífico, o
el declarante se equivocó al llenar el formato o alguno de los cuatro números
está mal, y en cualquiera de los dos casos el valor no se puede usar para
calcular un costo variable. Rechaza.

Un salto de precio del veinte por ciento sí admite explicación: la cotización
internacional se movió. La pregunta correcta no es cuánto subió sino si la
referencia subió lo mismo. Alerta, y con el dato de contraste adentro del
hallazgo para que quien lo lea no tenga que ir a buscarlo.

La regla del inventario mínimo por cota del embalse es alerta y no rechazo por
una razón distinta, que es institucional y no técnica: el incumplimiento del
piso ya tiene su sanción propia en el reglamento, que es la penalización de la
tasa de salida forzada. El validador de la declaración no es el lugar donde eso
se castiga; es el lugar donde se detecta y se reporta.

## Las doce reglas

Son las mismas doce del artículo III de esta serie, convertidas en código. Cada
una lleva su numeral.

| Regla | Qué verifica | Ámbito | Severidad | Referencia |
|---|---|---|---|---|
| R01 | La estructura de costos está vigente | cruce | rechazo | Anexo 04, 4.3 y 4.7 |
| R02 | La fuente internacional es la aprobada | cruce | rechazo | Anexo 04, 4.9 |
| R03 | La ventana de promedio del FOB es la de la fórmula | cruce | rechazo | Anexo 04, 4.1 b |
| R04 | Llegó el jueves antes de las 10:00 | campo | rechazo | Anexo 04, 10.1 y 12.1 a |
| R05 | La internación se actualizó por fórmula, no por valor nuevo | cruce | rechazo | Anexo 04, 7.2 |
| R06 | El PCpep es sus componentes sobre el poder calorífico | registro | rechazo | Anexo 04, 4.2 |
| R07 | El inventario está referenciado y los instrumentos certificados | campo | rechazo | Anexo 04, 4.12.3 d |
| R08 | Inicial más compras menos consumo da el final | registro | rechazo | Anexo 04, 8.2 |
| R09 | El consumo cuadra con la generación medida por el SIMEC | cruce | alerta | Anexo 04, 8.3 con Anexo 16 |
| R10 | El inventario cumple el piso de la cota del embalse | cruce | alerta | Anexo 04, 9.1 y 9.4 |
| R11 | El salto de precio sigue a la referencia internacional | serie | alerta | Anexo 04, 7.1 |
| R12 | El precio no lleva semanas congelado | serie | alerta | criterio propio |

R12 es la única que no sale del reglamento, y por eso su referencia dice
"criterio propio". Detecta un valor idéntico durante tres semanas seguidas
mientras la referencia internacional se movió. No es una irregularidad
tipificada: es una firma de que alguien está copiando la declaración anterior en
vez de calcularla.

R09 merece un párrafo aparte porque es la única del catálogo que **no depende de
ningún documento que aporte el declarante**. Toma la generación que registró el
SIMEC, la multiplica por el consumo específico de la curva auditada vigente y
compara contra el consumo de combustible declarado. Las dos fuentes son
independientes entre sí, así que si no cuadran hay algo que explicar en un lado
o en el otro. Es la verificación más cara de montar y la más difícil de burlar.

## La corrida

Los datos son sintéticos, con estructura realista y sin ninguna cifra atribuida
a un generador real: cuatro participantes, tres combustibles, doce semanas,
cuarenta y ocho declaraciones. Sobre esa base se sembraron doce defectos en
posiciones conocidas.

Que los defectos estén declarados en el código importa, porque permite lo
siguiente:

```
$ python datos_sinteticos.py
self-check: los 12 defectos sembrados fueron detectados
```

Un validador que no encuentra lo que se le sembró no sirve, y eso hay que
probarlo, no suponerlo. Esa línea es lo primero que hay que correr después de
tocar cualquier regla.

<figure class="fig fig-wide">
  <img src="../assets/figures/hallazgos-corrida.svg"
       alt="Barras horizontales, una por regla, con la cantidad de hallazgos de cada una y en gris los casos no evaluables. R01 tiene cinco fallas, R06 cuatro, y R05, R08 y R11 dos cada una; las siete reglas restantes, una cada una. R05, R11 y R12 acumulan además dieciséis casos no evaluables al inicio de las series. Abajo, seis indicadores: 48 declaraciones, 576 evaluaciones, 22 fallas, 16 no evaluables, 17 rechazadas y 64.6 por ciento de aceptación, más el hash del insumo."
       width="1200" height="760" loading="lazy" />
  <figcaption>Esta figura no está dibujada con cifras escritas a mano: el script
  que la genera lee el JSON que produce la corrida y dibuja lo que encuentra. Si
  el validador cambia, la figura cambia sola, y si el archivo no está, el script
  falla en vez de dibujar algo verosímil.</figcaption>
</figure>

Cuarenta y ocho declaraciones por doce reglas dan quinientas setenta y seis
evaluaciones: quinientas treinta y ocho pasaron, veintidós fallaron y dieciséis
no se pudieron evaluar. Diecisiete declaraciones quedaron rechazadas, o sea una
tasa de aceptación del 64.6 %.

## Doce defectos, veintidós hallazgos

Esa diferencia es la parte interesante de la corrida, y no son falsos positivos.
Son tres fenómenos distintos que conviene saber distinguir antes de mirar un
informe real.

**Cascada.** Un solo hecho estructural produce muchos hallazgos. El participante
GAMMA declara desde la semana 1 pero su estructura de costos entra en vigencia
en la semana 6, así que R01 falla cinco veces. Es un defecto, no cinco. Un
informe que ordena por severidad y no por causa raíz hace que quien lo lee crea
que tiene cinco problemas.

**Propagación.** Una regla de serie compara contra la semana anterior, así que
una semana corrupta ensucia también la comparación siguiente. R05 falla en la
semana 6 de ALFA, que es donde se sembró el defecto, y vuelve a fallar en la
semana 7 porque el valor esperado se calcula desde el valor corrupto de la 6.
Lo mismo pasa con R11 en DELTA, que falla en la semana del salto y en la
siguiente, cuando el precio vuelve a su nivel.

**Solapamiento.** Dos reglas independientes atrapan el mismo defecto desde
ángulos distintos, y eso es una virtud y no un ruido. El precio congelado de
ALFA lo detecta R12, que es la regla escrita para eso, pero también lo detecta
R06: un precio que se copia de tres semanas atrás deja de cuadrar con sus
propios componentes. Y el salto de DELTA lo detecta R11 y también R06, porque el
declarante subió el precio sin mover ninguno de los números que lo forman.

Ese solapamiento es la razón para tener reglas de identidad aunque parezcan
triviales. R06 solo verifica una división, y termina atrapando dos defectos que
nadie escribió pensando en ella.

Los dieciséis casos no evaluables son todos estructurales y ninguno es un
problema: R05 y R11 necesitan una semana anterior, R12 necesita tres, y al
principio de cada serie eso no existe. El informe los agrupa por causa en vez de
listarlos uno por uno.

## El registro auditable

Lo que sale de la corrida no es solo una lista de problemas. Es esto:

```json
{
  "corrida": "2026-08-23T16:06:51+00:00",
  "version_catalogo": "2026.08.1",
  "hash_insumo_sha256": "876d7f5a7c17244865495f3dd6edcce5…",
  "declaraciones": 48,
  "reglas": 12,
  "evaluaciones": 576,
  "estructuras_aplicadas": {
    "PM-ALFA/fuel_oil": "EST-2025-014",
    "PM-BETA/diesel": "EST-2025-021",
    "PM-GAMMA/gas_natural": "EST-2026-003",
    "PM-DELTA/fuel_oil": "EST-2024-009"
  },
  "conteo_estado": { "OK": 538, "FALLA": 22, "NO_EVALUABLE": 16 },
  "tasa_aceptacion": 0.6458
}
```

Cinco campos hacen todo el trabajo. El **hash del insumo** fija exactamente qué
datos se validaron, de modo que una discusión posterior no puede ser sobre qué
archivo era. La **versión del catálogo** fija con qué reglas, porque las reglas
cambian y una declaración aceptada en marzo se evaluó con el catálogo de marzo.
Las **estructuras aplicadas** fijan contra qué referencia se comparó cada
participante, que es la pregunta que el Anexo 04 obliga a poder responder. El
**conteo por estado** incluye los OK. Y la **marca de tiempo** dice cuándo.

Eso es un registro auditable. Un log dice qué pasó; un registro auditable dice
contra qué se validó.

## Lo que le falta

Vale enumerarlo, para que no parezca terminado.

No hay persistencia: cada corrida es independiente y no se compara con la
anterior, así que no puede decir "esta regla empeoró respecto del mes pasado".
No hay flujo de resolución: un hallazgo no se puede marcar como revisado, con
quién lo revisó y qué decidió, y sin eso el registro documenta la detección pero
no la gestión. No hay agrupación por causa raíz, que es justamente lo que haría
falta para que la cascada de R01 se lea como un problema y no como cinco. Y las
tolerancias están declaradas en un solo lugar, que es correcto, pero no están
justificadas contra ninguna medición: son un criterio razonable y nada más, y un
sistema en producción debería derivarlas de la dispersión histórica de cada
campo.

::: nota Para retener: validación normativa contra validación física
Validar declaraciones regulatorias es, estructuralmente, el mismo problema que
conciliar datos entre SCADA, un historiador en tiempo real y los sistemas
auxiliares de una red. El esqueleto es idéntico: un dato llega de una fuente que
no se controla, tiene que cuadrar con una referencia independiente, y cuando no
cuadra hay que decidir si se corrige, se alerta o se rechaza, dejando registrada
esa decisión con su fundamento.

Lo que cambia, y es lo que hay que tener claro antes de escribir la primera
regla, es **de dónde sale el fundamento**.

| | Validación física | Validación normativa |
|---|---|---|
| Por qué se rechaza un valor | Es imposible: la red no puede estar en ese estado | Un numeral dice que ese valor no es válido |
| Dónde vive el criterio | En el modelo del proceso | En el texto del reglamento |
| Qué hay que citar | La magnitud o el balance violado | El artículo o numeral |
| Qué cuesta más | Modelar el proceso | Leer el anexo completo |

De esa diferencia sale la decisión de diseño más importante del catálogo: que
cada regla cargue su campo `referencia`. En validación física el hallazgo se
justifica solo; en validación normativa, un hallazgo sin numeral no es un
hallazgo, es una opinión.
:::

## Fuentes

- **Código completo**:
  [`proyectos/validador-cvc`](https://github.com/scitechlab-dev/scitechlab-dev-site/tree/main/proyectos/validador-cvc)
  en el repositorio de este sitio. `reglas.py` es el catálogo, `validador.py` el
  motor y el registro, `datos_sinteticos.py` los datos con sus defectos
  sembrados y el self-check. Solo biblioteca estándar de Python 3.13.
- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP), Anexos**, versión actualizada a junio
  de 2026. Unidad de Transacciones. Anexo 04, Precios de los Combustibles:
  cada regla del catálogo lleva su numeral en el campo `referencia`, y todos
  salen de la lectura documentada en el tercer artículo de esta serie. Anexo 16,
  Curvas de Consumo Específico de Calor: el consumo específico que R09 usa para
  cruzar contra el SIMEC. Copia local: `normativa/robcp-anexos.pdf`. Consultado
  el 22 de agosto de 2026.
- **Datos**: sintéticos, generados por `datos_sinteticos.py` con semilla fija.
  Ninguna cifra corresponde a un generador real de El Salvador. Lo que se copia
  de la realidad es la estructura del proceso, no sus valores.

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
