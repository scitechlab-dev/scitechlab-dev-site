# Laboratorio de series de tiempo

Seis algoritmos comparados sobre tres series elegidas para que **no** se
comporten igual. Un laboratorio donde todos los métodos ganan no enseña a
elegir.

Acompaña al artículo
[Laboratorio de series de tiempo](https://scitechlab-dev.com/articles/lab-series-de-tiempo-python).

## Correr

```
python lab.py                    # las seis secciones
python lab.py --seccion 4        # solo la comparación
python lab.py --json resultados.json
```

Requiere numpy, pandas y statsmodels. Los tres datasets vienen empaquetados con
statsmodels: **no hay descarga**.

## Las series

    co2       Mauna Loa, mensual, 1958-2001. Tendencia y estacionalidad fuertes.
    nile      Caudal anual, 1871-1970. Quiebre estructural en 1899.
    sunspots  Actividad solar anual, 1700-2008. Ciclo no entero de ~11 años.

## Secciones

    1  estacionariedad con ADF, incluido el caso limítrofe de sunspots
    2  descomposición clásica contra STL robusta
    3  ACF y PACF
    4  seis algoritmos comparados con MASE
    5  diagnóstico de residuos con Ljung-Box
    6  quiebre estructural, evaluado en seis ventanas

La sección 6 contradice el titular esperado: el quiebre de 1899 es real y
explica el 43.7 % de la suma de cuadrados, pero entrenar solo con el régimen
vigente gana en 4 de 6 ventanas, no en las seis.
