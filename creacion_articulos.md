# Cómo crear un artículo para scitechlab-dev.com

Este documento es la especificación completa del formato. Está escrito para que
se lo puedas pasar a una IA junto con el contenido que querés publicar, y que te
devuelva un archivo listo para colocar en el repositorio.

> **Instrucción para la IA que reciba este documento:** producí **un solo
> archivo Markdown** que cumpla todo lo de abajo. No inventes datos, cifras,
> números de artículo, resoluciones ni fechas. Si te falta un dato, dejá el
> marcador que se indica en la sección "Cuando falta información" en vez de
> rellenarlo. Al final de tu respuesta, listá aparte los archivos de imagen que
> el artículo referencia y dónde hay que colocarlos.

---

## 1. Dónde va el archivo

```
content/
├── _plantilla.md                    ignorado por el build; copialo para empezar
├── articulos/                       piezas técnicas sueltas
│   └── 2026-08-16-nombre-del-articulo.md
└── serie-mercado-electrico/         la serie sobre el mercado mayorista
    └── 2026-08-22-nombre-del-articulo.md
```

Las subcarpetas son **para ordenar, no para el build**. Nada del comportamiento
de un artículo depende de en cuál esté: la agrupación sale de `categories:` y la
URL sale del nombre del archivo. Eso es a propósito, para poder reorganizar
carpetas sin romper URLs ya publicadas.

**Todo lo que empiece con `_`, archivo o carpeta, se ignora.** Sirve para
plantillas y borradores que todavía no quieras que el build valide.

### Nombre del archivo

```
AAAA-MM-DD-slug-en-minusculas-con-guiones.md
```

El prefijo de fecha ordena en el disco y **no aparece en la URL**. El resto es
el slug: solo minúsculas, dígitos y guiones simples, sin acentos ni eñes.

```
content/serie-mercado-electrico/2026-08-22-orden-de-merito-costo-marginal.md
                        se publica en  →  /articles/orden-de-merito-costo-marginal
```

Si el artículo pertenece a la serie, **el slug tiene que coincidir exactamente
con el que ya está reservado** en `series/mercado-electrico.yml`. Si no coincide,
el artículo se publica igual pero no aparece enlazado en el índice de la serie.

---

## 2. Front matter

Bloque YAML entre `---` al principio del archivo. Es YAML real, así que las
listas van con corchetes.

```yaml
---
title: "Mercado mayorista II. Del orden de mérito al precio"
summary: Cómo se construye la curva de oferta agregada y qué la rompe. Un despacho de cuatro unidades resuelto, con mínimo técnico y restricción de transmisión.
date: 2026-09-05
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [costo-marginal, despacho]
estado: borrador
math: true
---
```

| Campo | ¿Obligatorio? | Qué hace |
|---|---|---|
| `title` | sí | Titular y `<title>` de la pestaña. Entre comillas si lleva `:` |
| `summary` | sí | Meta description, tarjeta de LinkedIn y línea del archivo. Una o dos frases, sin signos de admiración |
| `date` | sí | `AAAA-MM-DD`. Cualquier otro formato hace fallar el build |
| `lang` | no, `en` | `es` o `en`. Cambia el idioma de todo el cascarón, no solo el atributo |
| `topic` | no | Etiqueta corta junto a la fecha en el artículo |
| `categories` | no | Lista. Usá `[mercado-electrico]` para la serie |
| `tags` | no | Lista de etiquetas específicas del artículo |
| `estado` | no | `borrador`, `en-revision` o `publicado`. Lo muestra el índice de la serie |
| `math` | no, `false` | **Obligatorio ponerlo en `true` si hay fórmulas.** Ver sección 4 |
| `slug` | no | Solo si necesitás una URL distinta del nombre del archivo |
| `draft` | no | `true` saca el archivo del build por completo |

Cualquier campo que no esté en esta tabla **se ignora en silencio**. Si inventás
uno, no va a dar error y tampoco va a hacer nada.

---

## 3. Reglas de redacción

Estas son de estilo, y el build no las verifica. Se cumplen igual.

1. **Sin guiones largos.** Nada de `—` en la prosa. Usá coma, dos puntos,
   paréntesis o punto, lo que la frase realmente necesite. Si al cambiarlo la
   frase queda larga, partila en dos. Esta regla no aplica a guiones dentro de
   palabras compuestas ni al signo menos en matemática.
2. **Prosa, no listas.** Las viñetas solo cuando el contenido es genuinamente
   enumerativo.
3. **Sin relleno.** Nada de introducciones que anuncian lo que se va a decir, ni
   conclusiones que repiten lo dicho, ni frases de transición vacías. Si un
   párrafo no agrega información, se borra.
4. **Sin superlativos.** Nada de "es fundamental entender", "cabe destacar",
   "en el vertiginoso mundo de".
5. **El primer párrafo entra directo al asunto.** Nunca "en este artículo
   veremos".
6. **Voz propia, primera persona cuando corresponda.** Es un cuaderno de
   estudio, no un documento corporativo.
7. **Toda cifra o afirmación normativa lleva su fuente.** Ver sección 7.
8. **Líneas de hasta ~80 caracteres** en el archivo fuente. No cambia nada de lo
   publicado, pero hace legible el diff en Git.

---

## 4. Matemática

Sintaxis LaTeX. Se compone **en el build**, así que el HTML publicado ya trae la
fórmula lista: no hay JavaScript en el navegador ni salto de layout.

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

### Cuatro reglas que evitan casi todo problema

1. **`math: true` es obligatorio si hay fórmulas.** Sin él, `$` es un carácter
   normal y las fórmulas saldrían como signos de dólar literales. El build
   detecta ese caso y **falla** en vez de publicarlo mal.
2. **Cuidado con los precios en dólares.** Dos `$` en la misma línea de un
   artículo con `math: true` se interpretan como una fórmula. Escribí
   `70 USD/MWh` en vez de `$70/MWh`, o poné cada cifra en una línea distinta.
3. **Las variables se definen debajo de la fórmula**, en prosa. Una ecuación sin
   sus símbolos definidos no sirve para estudiar.
4. **Texto dentro de una fórmula va en `\text{}`.** `P_{comb}` sale en itálica
   de variable, como si fueran factores multiplicándose; `P_{\text{comb}}` sale
   como corresponde.

Un LaTeX que no parsea **rompe el build**, con el archivo y la fórmula en el
mensaje de error. Es deliberado: una fórmula mal compuesta es peor que una
página que no existe, porque se estudiaría de ella.

El código en línea entre comillas invertidas y los bloques cercados quedan
intactos aunque tengan `$`.

---

## 5. Imágenes y figuras

### Dónde van los archivos

**`assets/figures/`**, nunca en `content/`. La carpeta `content/` se escanea
solo por archivos `.md`, así que una imagen puesta ahí no llega nunca al sitio
publicado.

Nombre del archivo en minúsculas con guiones: `orden-de-merito.svg`.

Formatos: **SVG** para diagramas y gráficas (escala sin perder nitidez y pesa
poco), **PNG** para capturas, **GIF** solo si de verdad necesita animarse.

### Cómo se insertan

Con HTML dentro del Markdown, porque hace falta la leyenda:

```html
<figure class="fig fig-wide">
  <img src="../assets/figures/nombre-del-archivo.svg"
       alt="Descripción de lo que muestra, para quien no puede verla."
       width="1200" height="800" loading="lazy" />
  <figcaption>Qué hay que mirar en la figura y por qué importa. La leyenda
  explica, no repite el título.</figcaption>
</figure>
```

- La ruta empieza con `../assets/` porque el artículo se sirve desde
  `/articles/`.
- `class="fig fig-wide"` hace que la figura se salga de la columna de texto,
  que es de 660px, y use el ancho disponible. Usalo siempre.
- `width` y `height` son las dimensiones reales del archivo. Reservan el espacio
  para que el texto no salte cuando la imagen carga.
- `alt` describe **el mecanismo, no la apariencia**. "Curva de oferta ordenada
  por costo variable, con la demanda cruzando el escalón del gas", no "gráfica".
- `loading="lazy"` si la figura está lejos del inicio.

### Regla sobre las cifras de una figura

Si la figura usa números inventados o de ejemplo, **la leyenda tiene que
decirlo**, en negrita. Un gráfico sin aclaración dentro de un artículo sobre El
Salvador se lee como si fueran datos salvadoreños.

```html
<figcaption>… <strong>Las cifras son ilustrativas y no corresponden a El
Salvador</strong>: es un parque de ejemplo para mostrar el mecanismo.</figcaption>
```

---

## 6. Notas de estudio

Bloque con estilo propio, para la voz personal dentro de un artículo técnico.
Es opcional y va donde tenga sentido, no obligatoriamente al final.

```markdown
::: nota
Lo que sea, en Markdown: listas, código, fórmulas.
:::
```

Con etiqueta propia:

```markdown
::: nota Cómo lo conecté con SCADA
...
:::
```

No le pongas un encabezado `##` encima: la caja ya trae su propia etiqueta, y
para un lector de pantalla ya es una región anunciada.

---

## 7. Fuentes

**El artículo termina con la sección `## Fuentes`.** Nada va después.

Cada entrada lleva el título del documento, quién lo emite, el enlace directo y
la fecha de consulta:

```markdown
## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP)**, versión actualizada a junio de 2026.
  Unidad de Transacciones. [PDF](https://www.ut.com.sv/...). Consultado el 22 de
  agosto de 2026.
- **SIGET**. [Gerencia de Electricidad](https://www.siget.gob.sv/...).
  Definición del mercado mayorista. Consultado el 22 de agosto de 2026.
```

**No pongas dentro del artículo una sección de "pendiente de verificar".** Lo
que quede sin confirmar se reporta por fuera, no al pie de la página.

---

## 8. Cuando falta información

Si te falta un dato, **no lo inventes**. Dejá uno de estos marcadores y seguí:

```
[PENDIENTE NORMATIVA: qué exactamente hay que buscar y en qué documento]
[MI ANÁLISIS: qué se espera desarrollar acá]
[MI EXPERIENCIA: qué caso propio encaja acá]
```

Son buscables con `grep` en el repositorio. **Un artículo con marcadores no se
publica**: se deja con `draft: true` o `estado: borrador` hasta cerrarlos.

Esto vale especialmente para normativa salvadoreña: números de artículo, de
resolución y de acuerdo, fechas de vigencia y títulos de documentos **solo se
escriben si se abrió y se leyó la fuente primaria**. Un resultado de búsqueda no
cuenta.

Si necesitás un número para un ejemplo, usá uno claramente ficticio y decilo:
"supongamos una unidad de 50 MW".

---

## 9. Publicar

```
npm run build     # arma el sitio en dist/ y valida todo
```

El build **falla** si: falta `title`, `summary` o `date`; la fecha no es
`AAAA-MM-DD`; hay fórmulas sin `math: true`; el LaTeX no parsea; el `estado` no
es uno de los tres válidos; el YAML está mal formado; o dos artículos comparten
slug.

Si pasa, `git add`, `git commit` y `git push`. El Worker de Cloudflare corre el
build antes de servir los assets, así que no hay paso manual de despliegue.

---

## 10. Ejemplo mínimo completo

```markdown
---
title: "Mercado mayorista II. Del orden de mérito al precio"
summary: Cómo se construye la curva de oferta agregada y qué la rompe.
date: 2026-09-05
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [costo-marginal, despacho]
estado: borrador
math: true
---

El precio de la energía en el mercado mayorista no lo fija el costo promedio de
las unidades que operan, sino el de la última que entró. Esa distinción parece
menor y decide quién cobra cuánto.

## Cómo se ordena el parque

Cada unidad declara su costo variable y el operador las ordena de menor a mayor.
El punto donde la demanda cruza esa curva define la unidad marginal:

$$
\text{CMg} = \text{CV}_{\text{marginal}}
$$

donde $\text{CMg}$ es el costo marginal del sistema y
$\text{CV}_{\text{marginal}}$ el costo variable de la última unidad despachada.

<figure class="fig fig-wide">
  <img src="../assets/figures/orden-de-merito.svg"
       alt="Curva de oferta agregada por escalones, con la demanda cruzando el escalón del gas."
       width="1200" height="800" loading="lazy" />
  <figcaption>La unidad marginal fija el precio para todas.
  <strong>Cifras ilustrativas, no corresponden a El Salvador</strong>.</figcaption>
</figure>

[PENDIENTE NORMATIVA: numeral del Anexo 09 del ROBCP que define el cálculo del
precio en el MRS]

::: nota
Acá va la lectura personal.
:::

## Fuentes

- **ROBCP**, Anexo 09, Cálculo del Precio en el MRS. Unidad de Transacciones.
  [PDF](https://www.ut.com.sv/marcoregulatorio). Consultado el 5 de septiembre
  de 2026.
```
