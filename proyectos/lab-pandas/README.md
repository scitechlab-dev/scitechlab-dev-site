# Laboratorio de pandas y visualización

Ocho secciones de pandas y las cuatro bibliotecas de gráficos, sobre 203
trimestres de macroeconomía real de Estados Unidos (`statsmodels.datasets.macrodata`,
1959Q1 a 2009Q3).

Acompaña al artículo
[Análisis de datos con Python](https://scitechlab-dev.com/articles/analisis-datos-python-pandas).

## Correr

```
python lab.py              # las ocho secciones
python lab.py --seccion 5  # solo una
python graficas.py         # las cuatro bibliotecas, a salida/
```

Requiere pandas, numpy, statsmodels, matplotlib, seaborn y plotly. Los datos
vienen empaquetados con statsmodels: **no hay descarga**, así que corre sin
internet y da el mismo resultado en cualquier máquina.

## Archivos

    lab.py         inspección, selección, derivadas, groupby, ventanas,
                   pivoteo, uniones y faltantes
    graficas.py    la misma figura con pandas, matplotlib, seaborn y plotly
    salida.txt     la corrida que cita el artículo
    salida/        las cuatro figuras generadas
