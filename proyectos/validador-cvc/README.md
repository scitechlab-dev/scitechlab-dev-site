# Validador de declaraciones semanales de precio de combustible

Valida declaraciones semanales de precio de combustible puesto en planta contra
las reglas del Anexo 04 del ROBCP salvadoreño. Cada regla lleva el numeral que la
obliga, y la corrida deja un registro auditable, no un log.

Escrito para el séptimo artículo de la serie sobre el mercado mayorista:
[Validación automática de declaraciones](https://scitechlab-dev.com/articles/validacion-datos-operativos-python).

## Correr

Solo biblioteca estándar. Probado en Python 3.13.

```
cd proyectos/validador-cvc

python datos_sinteticos.py            # self-check: ¿encuentra los defectos sembrados?
python validador.py                   # informe legible por consola
python validador.py --json informe.json
```

`informe.json` es lo que lee `scripts/figures/validador.mjs` para dibujar la
figura de resultados del artículo. Si se cambia una regla, hay que volver a
correr las dos cosas.

## Archivos

    reglas.py             el catálogo: 12 reglas declarativas con su numeral
    validador.py          el motor, el registro auditable y el informe
    datos_sinteticos.py   datos con estructura realista y defectos sembrados
    informe.txt           salida de la última corrida, por consola
    informe.json          la misma corrida, para consumo de otras piezas

## Los datos

Sintéticos. Ninguna cifra corresponde a un generador real de El Salvador. Lo que
se copia de la realidad es la estructura del proceso: cuatro participantes, tres
combustibles, doce semanas, una estructura de costos aprobada por participante y
combustible, y una serie de precios internacionales que se mueve como se mueve
una cotización.

Los defectos están declarados en `DEFECTOS` dentro de `datos_sinteticos.py`, y el
self-check falla si el validador no los encuentra todos. Un validador que no
detecta lo que se le sembró no sirve, y eso hay que probarlo.

## Lo que le falta

Sin persistencia entre corridas, sin flujo de resolución de hallazgos, sin
agrupación por causa raíz, y con tolerancias fijadas por criterio propio en vez
de derivadas de la dispersión histórica de cada campo. Está enumerado en el
artículo con más detalle.
