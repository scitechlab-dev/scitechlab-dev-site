# Cómo escribir un artículo

Referencia de sintaxis para `content/*.md`, `pages/*.md` y `series/*.yml`. Está
en la raíz del repositorio a propósito: es lo que se consulta al escribir, no al
desplegar. El README documenta la infraestructura; esto documenta el dialecto.

## Front matter

Es **YAML de verdad** desde que la serie necesitó listas. Antes era un parser
artesanal de `clave: valor` que guardaba `tags: [a, b]` como la cadena literal
`"[a, b]"` sin avisar.

```yaml
---
title: Anatomía de una declaración semanal
summary: Una línea, sin signos de admiración, sin marketing.
date: 2026-08-22
lang: es
categories: [mercado-electrico]
tags: [costos-variables, combustible]
estado: borrador
math: true
---
```

| Campo | ¿Obligatorio? | Qué hace |
|---|---|---|
| `title` | sí | Titular del artículo y `<title>` de la pestaña |
| `summary` | sí | Meta description, `og:description` y la línea del archivo. `excerpt` se acepta como sinónimo |
| `date` | sí (artículos) | `YYYY-MM-DD`. El build falla con cualquier otro formato |
| `lang` | no (`en`) | Idioma del artículo. **Poné `es` en todo lo de la serie** |
| `math` | no (`false`) | Enciende `$…$`. Ver abajo — no es opcional si hay fórmulas |
| `estado` | no | `borrador`, `en-revision` o `publicado`. Lo lee el índice de la serie |
| `categories` / `tags` | no | Lista YAML, o una cadena suelta si es una sola |
| `topic` | no | La etiqueta que sale junto a la fecha en el artículo |
| `slug` | no | La URL. Por defecto, el nombre del archivo sin el prefijo `YYYY-MM-DD-` |
| `draft` | no | `true` saca el archivo del build por completo |

**Convención de nombres:** el archivo puede llevar prefijo de fecha para que
ordene en el disco (`2026-08-22-declaracion-semanal.md`); la URL nunca lo lleva
(`/articles/declaracion-semanal`). El slug se valida: minúsculas, dígitos y
guiones.

## Idioma

`lang:` no es solo el atributo `<html lang>`. También **cambia el cascarón**: el
nav, el enlace de salto y el «volver» salen en el idioma de la página. Por
defecto `en`; un valor desconocido cae a `en` en vez de dejar el nav vacío.

Cada artículo vive en **un solo idioma**. No hay pares traducidos, ni selector,
ni `hreflang`, y es deliberado: un selector implica que cada artículo exista dos
veces y se mantenga sincronizado para siempre, y un botón que a veces no tiene a
dónde llevarte es peor que no tenerlo.

El archivo muestra un chip con el idioma en cada fila, para que se sepa antes de
hacer clic. Los strings viven en el objeto `T` de `scripts/build.mjs`; agregar un
idioma es agregar una entrada ahí.

Para el lector que quiera el otro idioma está la traducción automática del
navegador, que funciona precisamente porque el `lang` es correcto por página.
Sirve como respaldo, no como estrategia: destroza la terminología normativa.

## Matemática

Sintaxis LaTeX estándar. Se renderiza **en el build**, no en el navegador: el
HTML que sale ya trae la fórmula compuesta, así que no hay salto de layout y el
scraper de LinkedIn ve contenido real.

En línea, con un signo de dólar a cada lado:

```markdown
El residual mide $3I_0$, que es casi cero en condición balanceada.
```

En bloque y centrada, con dos, cada uno en su propia línea:

```markdown
$$
t = \frac{\text{TMS} \cdot k}{\left( I / I_s \right)^{\alpha} - 1}
$$
```

Varias líneas alineadas, con `aligned` y `\\` al final de cada una:

```markdown
$$
\begin{aligned}
\text{CV}_{\text{total}} &= \text{CVC} + \text{CVNC} \\
\text{CVC} &= \frac{P_{\text{comb}}}{\text{PCI}} \cdot \text{CE}
\end{aligned}
$$
```

Tres reglas que evitan casi todos los problemas:

1. **`math: true` es obligatorio si hay fórmulas.** Sin él, `$` es un carácter
   normal y las fórmulas saldrían como signos de dólar literales. El build
   detecta ese caso y **falla** en vez de publicarlo mal. También avisa (sin
   fallar) si ponés el campo y no hay ninguna fórmula, porque cargaría una hoja
   de estilos para nada.
2. **Las variables se definen debajo de la fórmula**, en prosa. Una ecuación sin
   sus símbolos definidos no sirve para estudiar.
3. **Texto dentro de una fórmula va en `\text{}`.** `P_{comb}` sale en itálica
   de variable, como si `c`, `o`, `m` y `b` fueran factores multiplicándose;
   `P_{\text{comb}}` sale como corresponde.

Un LaTeX que no parsea **rompe el build**, con el archivo y la fórmula en el
mensaje. Es deliberado: una fórmula mal compuesta es peor que una página que no
existe, porque estudiarías de ella.

**Lo que no se toca:** el código en línea (`` `$5 por MWh` ``) y los bloques
cercados quedan intactos aunque tengan `$`. El lexer camina posición por
posición, así que en un backtick la extensión de matemática no compite.

## Notas de estudio

La segunda voz del artículo. Se escribe como contenedor, no como HTML:

```markdown
::: nota
Lo que sea, en markdown: listas, código, fórmulas.
:::
```

Con etiqueta propia en vez de la que trae por defecto:

```markdown
::: nota Cómo lo conecté con SCADA
...
:::
```

Sale como un `<aside role="note">` con su etiqueta adentro. **No le pongas un
`##` encima**: el encabezado y la etiqueta dirían lo mismo dos veces, y para un
lector de pantalla la nota ya es una región anunciada.

## Páginas sueltas

`pages/*.md` se publica en `/<slug>` — no lleva `date`, no aparece en el archivo
y no se lista como artículo. Ahí vive `fuentes.md`. Mismo front matter menos la
fecha, mismo dialecto, mismo `math`.

## Índice de una serie

`series/*.yml` se publica en `/serie/<slug>`. El manifiesto define **qué** trae
la serie y en qué orden; no define qué está escrito. El build cruza cada `slug`
contra `content/`: si encuentra el artículo, la entrada enlaza y muestra su
`estado` real; si no, sale como *sin escribir* y sin enlace.

Por eso el manifiesto no puede mentir. Para marcar un artículo como publicado
hay que publicarlo.

```yaml
slug: mercado-electrico
title: Mercado eléctrico mayorista de El Salvador
lang: es
summary: >-
  Una o dos líneas.
articulos:
  - slug: declaracion-semanal-precio-combustible
    titulo: Anatomía de una declaración semanal
    resumen: >-
      Una línea.
```

## Publicar

Soltar el archivo, commit, push. El Worker corre `npm run build` antes de leer
los assets, así que no hay paso manual. Para ver el sitio localmente:

```
npm run build
```

y abrir `dist/`. `dist/` está en `.gitignore`; se arma en cada despliegue.
