---
title: Prueba de renderizado de fórmulas
summary: Banco de pruebas del pipeline de LaTeX y de las notas de estudio. No es un artículo; existe para que un cambio en el renderizador falle de forma visible.
date: 2026-08-22
lang: es
topic: Infraestructura
categories: [infraestructura]
tags: [katex, build]
estado: borrador
draft: true
math: true
---

Esta página es el banco de pruebas del renderizador. Cubre los cuatro casos que
tienen que verificarse antes de dar por bueno cualquier cambio en
`scripts/markdown.mjs`, más los dos que **no** deben tratarse como matemática.

## Caso 1 — fracción

Curva de tiempo inverso de la IEC 60255-151, que hasta ahora vivía como texto
ASCII dentro de un bloque de código:

$$
t = \frac{\text{TMS} \cdot k}{\left( I / I_s \right)^{\alpha} - 1}
$$

donde $t$ es el tiempo de operación en segundos, $\text{TMS}$ el multiplicador
de tiempo, $I$ la corriente de falla, $I_s$ la corriente de arranque, y $k$ y
$\alpha$ las constantes de la familia de curvas.

## Caso 2 — sumatorio con límites

Balance de potencia en el nodo de despacho, sobre $n$ unidades:

$$
\sum_{i=1}^{n} P_i = D + P_{\text{pérdidas}}
$$

## Caso 3 — subíndice y superíndice combinados

Componente de secuencia cero y su cuadrado, que es donde un renderizador
descuidado colapsa los dos niveles en uno:

$$
3I_0 = I_a + I_b + I_c
\qquad\text{y}\qquad
S_{\text{cc}}^{\,3\phi} = \frac{V_{\text{nom}}^{2}}{Z_{\text{th}}}
$$

En línea también: $I_{k}^{\prime\prime}$, $x_{i,j}^{2}$, $P_{\text{gen}}^{\max}$.

## Caso 4 — ecuación multilínea alineada

Costo variable total de una unidad térmica, desglosado:

$$
\begin{aligned}
\text{CV}_{\text{total}} &= \text{CVC} + \text{CVNC} \\
\text{CVC} &= \frac{P_{\text{comb}}}{\text{PCI}} \cdot \text{CE} \\
\text{CVNC} &= \text{CVNC}_{0} \cdot \frac{\text{IPC}_{t}}{\text{IPC}_{0}}
\end{aligned}
$$

## Lo que NO debe volverse matemática

Un precio dentro de código en línea: `$5 por MWh`. Y un bloque cercado entero:

```
El costo marginal fue de $48.20/MWh y el techo de $75.00/MWh.
La declaración se envía con el formato $FECHA-$UNIDAD.
```

Si alguno de esos dos se renderizó como fórmula, la extensión está reclamando
los tokens en el orden equivocado.

## Tabla, para confirmar que sigue envuelta

| Curva | $k$ | $\alpha$ |
|---|---|---|
| Normal inversa | 0.14 | 0.02 |
| Muy inversa | 13.5 | 1 |
| Extremadamente inversa | 80 | 2 |

::: nota
Esta es la caja de nota de estudio: fondo distinto, barra teal al costado y una
etiqueta propia. Se escribe con `::: nota` y se cierra con `:::`.

La matemática también funciona aquí dentro, un poco más chica: $E = P \cdot t$.

- Y las listas.
- Y el código: `git commit`.

Con un título propio se escribe `::: nota Cómo lo conecté con SCADA`.
:::
