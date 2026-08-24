# Laboratorio de estadística aplicada

Siete secciones sobre una sola pregunta: cuándo un número que salió de los datos
significa algo. Datos: `statsmodels.datasets.macrodata`, 203 trimestres
(1959Q1 a 2009Q3).

Acompaña al artículo
[Fundamentos de estadística para un analista](https://scitechlab-dev.com/articles/fundamentos-estadistica-analista).

## Correr

```
python lab.py              # las siete secciones
python lab.py --seccion 6  # solo una
```

Requiere numpy, pandas, scipy y statsmodels. Sin descarga: corre sin internet.

## Secciones

    1  centro y dispersión, y medidas robustas
    2  pruebas de normalidad
    3  teorema central del límite, medido en vez de citado
    4  intervalos de confianza: t contra bootstrap, y qué significan
    5  significancia contra tamaño del efecto, y comparaciones múltiples
    6  correlación que existe dentro de cada década y desaparece al juntarlas
    7  regresión, diagnóstico de residuos y errores robustos HAC

La sección 6 es el resultado que ordena el artículo: la curva de Phillips da
r = -0.744 dentro de los sesenta y r = +0.065 al agregar los 203 trimestres.
