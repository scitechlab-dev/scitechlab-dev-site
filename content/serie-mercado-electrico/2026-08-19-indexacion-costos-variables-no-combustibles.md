---
title: "Mercado mayorista IV. Indexación de costos variables no combustibles, paso a paso"
summary: "Por qué el CVNC de una planta cambia todos los meses aunque la planta no cambie. Cómo se separa un costo fijo de uno variable con el ICVNC y una regresión, la fórmula de indexación mensual resuelta a doce meses, y el ajuste por despacho real que mueve más que la inflación."
date: 2026-08-19
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [cvnc, indexacion, arranque-y-detencion, robcp]
estado: en-revision
math: true
---

El costo variable de una unidad térmica tiene dos mitades que se comportan de
manera opuesta. La del combustible se declara cada semana y se valida contra
una referencia internacional pública, que es de lo que trató el artículo
anterior. La otra, la de operación y mantenimiento no combustible, no se
declara nunca: se audita cada dos años, se congela en un valor al 31 de
diciembre del año base y desde ahí la actualiza la UT mes a mes con una
fórmula. Nadie vuelve a preguntarle al generador cuánto gastó.

Eso plantea la pregunta que da título al artículo. Si el valor está congelado y
la planta es la misma, ¿por qué el número cambia todos los meses? Hay dos
causas, y la más grande no es la inflación.

## Qué es exactamente un CVNC

Antes de indexar hay que saber qué se está indexando, y ahí el anexo se toma el
trabajo de definir cinco categorías que en la práctica se confunden.

Un **costo fijo** es aquel cuyo importe total no se ve influido por los cambios
en el volumen de generación, dentro de los límites de capacidad para los que se
programó la planta. Un **costo variable** cambia con las alteraciones del
volumen de generación eléctrica. Y entre los dos vive el **costo híbrido**, el
que no cumple estrictamente ninguna de las dos condiciones: dentro de ciertos
intervalos de actividad se comporta como fijo, pero presenta cambios si el
grado de actividad fluctúa (Anexo 17, 2.1).

Los dos componentes variables tienen nombre propio. El **CVONC**, costo
variable de operación no combustible, es el generado por las acciones
requeridas para producir energía, vinculadas a la operación mecánica, eléctrica
y química del equipamiento. Su rasgo distintivo es que está ligado a un
agregado consumible que puede sustentarse con una función de consumo
relacionada con el volumen de producción, e incluye los costos de mantenimiento
diario. El **CVM**, costo variable de mantenimiento, es el de las
intervenciones programadas de mantenimiento preventivo y predictivo cuyo
alcance y frecuencia recomienda en general el fabricante, y cuya ejecución
genera indisponibilidad operativa. Explícitamente quedan fuera el mantenimiento
diario, que ya está en el CVONC, y el mantenimiento correctivo, que no está en
ninguno.

Que el correctivo quede fuera merece una pausa. Una reparación por falla no
entra al costo variable que remunera el mercado. El riesgo de falla se
retribuye por otra vía, la de la capacidad firme y su tasa de salida forzada,
que es donde una máquina poco confiable paga su costo. Meter el correctivo acá
sería cobrarlo dos veces.

## Cómo se decide si un costo es variable

Ninguna de esas definiciones se aplica a ojo. El anexo monta un procedimiento
de tres filtros encadenados.

<figure class="fig fig-wide">
  <img src="../assets/figures/cvnc-clasificacion.svg"
       alt="Diagrama de decisión. Un rubro de costo de operación entra al método analítico, que le asigna un índice ICVNC con cuatro preguntas ponderadas al 25 por ciento cada una: si solo se genera con la unidad en marcha, si es proporcional a la energía o a las horas, si es un ítem de operación o mantenimiento, y si modifica el estado del equipo. Con ICVNC mayor o igual a 7 el rubro es candidato a CVONC y todavía debe justificar la función consumo. Entre 4 y 7 es costo híbrido y pasa a una regresión lineal contra la energía generada, cuyo coeficiente a es la parte variable solo si el R cuadrado supera 0.9 y el estadístico t supera 2; si no, la parte variable es cero. Bajo 4 es costo fijo. Una rama aparte, el costo variable de mantenimiento, no pasa por el índice."
       width="1200" height="690" loading="lazy" />
  <figcaption>Tres caminos y un solo destino. Lo que hace interesante al diseño
  es el último filtro: un costo híbrido cuya regresión no ajusta no se estima
  con criterio, se declara variable en cero. La carga de la prueba está del lado
  de quien quiere que el costo entre al precio.</figcaption>
</figure>

El primer filtro es el **método analítico**, una matriz de decisiones que
produce un número llamado ICVNC. Son cuatro preguntas, cada una ponderada al
25 %, y cada una se responde con 10 puntos si es afirmativa, 0 si es negativa y
un puntaje intermedio para el resto: si el costo solamente se genera con la
unidad en marcha, si es proporcional a la energía generada o a las horas de
marcha, si es un ítem de operación o mantenimiento, y si es una acción que
modifica el estado o la condición del equipo (4.4.5 y 4.4.8). La clasificación
sale de tres umbrales: con ICVNC mayor o igual a 7 el rubro es CVONC, entre 4 y
7 es híbrido, y por debajo de 4 es costo fijo (4.4.9).

El propio anexo aclara que el primer umbral es condición necesaria pero no
suficiente, porque para calificar como CVONC hace falta además **justificar la
función consumo**: identificar el agregado consumible y la variable explicativa
que explica el gasto, con el desembolso ocurriendo en el mismo ejercicio de la
producción que lo originó (4.3.1). Puntaje alto sin función consumo no alcanza.

El segundo filtro es el **método estadístico**, y se aplica solo a los híbridos.
Se toma la información de un período de estudio de 24 meses, el año base y el
inmediato anterior, con los datos en moneda homogénea ajustados a diciembre del
año base. Sobre la muestra donde la variable explicativa es la energía generada
en MWh y la explicada es el costo híbrido, se ajusta por mínimos cuadrados una
recta

$$
y = a\,x + b
$$

y el coeficiente $a$ es la componente variable del costo híbrido, la que se
suma al CVONC (4.5.3 a 4.5.6).

Acá está el numeral más severo de todo el anexo. Ese coeficiente vale
como parte variable **solo si el ajuste supera dos pruebas de bondad**:
coeficiente de determinación mayor que 0.9 y estadístico t mayor que 2. Si no
se cumplen, la componente variable del costo híbrido **se asume igual a cero**,
porque no existe el ajuste requerido (4.5.6 y 4.5.7). No se estima, no se
promedia, no se negocia. Se pone en cero.

Es una decisión de diseño regulatorio poco común y bastante severa. Un
reglamento que quisiera ser generoso con el generador habría dicho "si el
ajuste es pobre, el auditor estimará". Este dice que un costo que no logra
explicarse estadísticamente por la generación no es un costo variable, con
independencia de lo que intuya cualquiera. Las excepciones son estrechas y
razonables: una unidad recién incorporada al mercado, sin historia suficiente,
asume el híbrido como CVONC en su totalidad hasta reunir datos que aseguren la
bondad del ajuste (4.5.8 y 4.5.9), y si no hay registros por falta de ellos, la
componente variable vuelve a ser cero (4.5.10).

La tercera rama, el CVM, no pasa por el ICVNC. El mantenimiento programado se
calcula por el método del valor presente del flujo de costos sobre el ciclo de
mantenimiento (4.2), y es variable por construcción. El CVNC final es la suma
de las tres: función consumo justificada, parte variable de los híbridos y
mantenimiento programado (3.20.1 e).

## Quién decide, y qué pasa si hay desacuerdo

El generador contrata al auditor del registro autorizado por la UT y le paga
bilateralmente, sin intervención del operador (10.4.1.1 y 10.1.2.6). Entrega un
"Informe de cálculo de los CVNC y CAyD" por unidad, en formato digital, con
todos los cálculos en hojas electrónicas que permitan verificar los datos y
**reproducir el cálculo**, incluidas fórmulas, macros y enlaces (3.5 y 3.10).
Es la misma exigencia de replicabilidad que aparece en el predespacho, aplicada
aguas arriba.

El plazo total previsto es de 55 días hábiles, repartidos así: 30 para que el
auditor emita el informe preliminar, 5 para que el generador exprese
conformidad u observaciones, 5 para que el auditor las acepte o las rechace con
razón, 10 para la revisión de la UT y 5 para incorporar lo que la UT observe
(10.5.1 a 10.5.6). El silencio del generador en su ventana de cinco días vale
como aceptación (10.5.3).

Y la regla de cierre es la que conviene tener memorizada: **en caso de
discrepancia entre los valores informados por la auditoría y el generador, se
adoptan los de la auditoría** (3.16, y en el mismo sentido 10.3.2). Si la
información está incompleta o falta, la auditoría estima los valores (3.17). Si
se detecta que el generador suministró información errónea de forma
intencional, va al régimen de infracciones (3.15). No elegir auditor en el
tiempo solicitado también se penaliza (10.1.2.4).

Los valores nuevos son válidos cuando la UT aprueba el informe final y entran
en vigencia a partir de la siguiente actualización mensual de la programación
anual (3.18).

## La fórmula de indexación

Con el valor auditado en USD/MWh al 31 de diciembre del año base, la UT lo
actualiza **mensualmente** con dos indicadores: el índice de precios al
consumidor que publica la DIGESTYC para El Salvador, y el U.S. Producer Price
Index del Bureau of Labor Statistics, serie PCUOMFG de total manufacturing
industries (9.1.3 y 9.1.4). La fórmula es

$$
\frac{\text{CVNC}(i)}{\text{CVNC}(0)} =
\%\text{IPC}\cdot\frac{\text{IPC}(i)}{\text{IPC}(0)} +
\%\text{PPI}\cdot\frac{\text{PPI}(i)}{\text{PPI}(0)}
$$

donde %IPC es la participación de los insumos nacionales incluyendo la mano de
obra local, %PPI la de los insumos importados, el subíndice 0 corresponde al
mes de diciembre del año base y el subíndice $i$ al último mes calendario del
que se cuente con información oficial al momento del ajuste (9.1.5.3 y
9.1.5.5). Las participaciones no las elige la UT ni las propone libremente el
generador: se determinan y justifican en función de su estructura de costos,
en el formulario F.10 del apéndice 1 y por tipo de combustible, y **quedan
validadas por el informe del auditor** (9.1.5.4).

Vale detenerse en un rasgo que el nombre "indexación encadenada" haría suponer
mal. Esta fórmula **no encadena**: cada mes se compara contra diciembre del año
base, no contra el mes anterior. La consecuencia práctica es que no acumula
error de redondeo ni deriva por composición, y que un mes con un índice
corregido hacia atrás se arregla solo en el siguiente cálculo, sin arrastrar la
corrección. Es más robusta que la alternativa, y por eso conviene no describirla
como un encadenamiento.

<figure class="fig fig-wide">
  <img src="../assets/figures/indexacion-doce-meses.svg"
       alt="Gráfica de doce meses con tres curvas de índice relativo partiendo de 1.00 en diciembre del año base. La curva punteada del IPC sube hasta 1.0275, la punteada del PPI sube hasta 1.0420 con una caída en abril, y la curva sólida del factor combinado, ponderado 35 por ciento IPC y 65 por ciento PPI, termina en 1.0369. Un recuadro muestra la fórmula del factor y al pie se lee que 6.80 dólares por MWh multiplicados por 1.0369 dan 7.05."
       width="1200" height="640" loading="lazy" />
  <figcaption>El factor se pega a la curva del PPI y no a la del medio, porque
  pesa el doble. Marzo y abril dan el mismo factor, 1.0095, pese a que el IPC
  subió en abril: la caída del PPI se lo comió. Elegir mal las participaciones
  distorsiona más el resultado que equivocarse de mes en un índice. <strong>Las
  series son ilustrativas</strong>; la fórmula, las fuentes y la ponderación
  validada por auditoría son las del Anexo 17.</figcaption>
</figure>

Con el ejemplo de la unidad del artículo anterior, cuyo CVNC auditado es de
6.80 USD/MWh repartido en 2.45 de CVONC, 0.85 de parte variable de híbridos y
3.50 de mantenimiento programado, y con participaciones de 35 % nacional y
65 % importado, doce meses de indexación dan:

| Mes | IPC | PPI | Factor | CVNC (USD/MWh) |
|---|---|---|---|---|
| dic, base | 118.40 | 262.10 | 1.0000 | 6.80 |
| mar | 119.10 | 265.10 | 1.0095 | 6.86 |
| abr | 119.44 | 264.70 | 1.0095 | 6.86 |
| jun | 119.95 | 267.30 | 1.0175 | 6.92 |
| sep | 120.81 | 270.05 | 1.0268 | 6.98 |
| dic | 121.66 | 273.10 | 1.0369 | 7.05 |

Veinticinco centavos por MWh en un año entero. Guárdese esa cifra, porque el
siguiente mecanismo la deja pequeña.

## Los costos de arranque y detención

El CAyD sigue el mismo esquema con un término más, y ese término es el puente
con el artículo anterior:

$$
\frac{\text{CAyD}(i)}{\text{CAyD}(0)} =
\%\text{IPC}\cdot\frac{\text{IPC}(i)}{\text{IPC}(0)} +
\%\text{P}_{\text{comb}}\cdot\frac{\text{P}_{\text{comb}}(i)}{\text{P}_{\text{comb}}(0)} +
\%\text{PPI}\cdot\frac{\text{PPI}(i)}{\text{PPI}(0)}
$$

donde el precio del combustible es el vigente según la estructura de costos del
Anexo 04, y su valor mensual se calcula como el promedio de los precios diarios
del mes utilizados en la programación de la operación (9.2.4.1, 9.2.5.3 y
9.2.5.5). Conviene ser preciso con quién produce ese número: no es el declarado
por el generador sino el que calcula la UT aplicando la fórmula aprobada, que
es exactamente la distinción del artículo anterior. Toda la cadena de la
declaración semanal desemboca, promediada sobre el mes, dentro de la
actualización del costo de arranque. Un arranque quema combustible, y el
reglamento no finge que ese combustible cueste lo que costaba en diciembre.

Con una participación de 20 % nacional, 35 % importado y 45 % combustible, y un
precio que pasa de 13.10 a 14.024 USD/MMBtu, el factor del CAyD llega a 1.0519
y un CAyD base de 1.85 USD/MWh queda en 1.95. Subió 5.2 % contra el 3.7 % del
CVNC en el mismo período, es decir cerca de la mitad más, y por una sola razón:
casi la mitad de su composición es un combustible que se encareció un 7 %.

Hay una distinción de unidades que conviene no pasar por alto. Para efectos de
la programación de la operación, los valores vigentes se tratan por separado:
el CVNC como un costo variable en USD/MWh y los costos de arranque y detención
**como costos por cada evento** (3.19). La fórmula de indexación los expresa en
USD/MWh porque así los produce el procedimiento de cálculo, pero el modelo de
programación no los consume como un costo por energía sino como un costo que se
paga al encender la máquina. Esa doble expresión es exactamente lo que hace que
el compromiso de unidades no sea el mismo problema que el despacho económico,
como quedó apuntado en el segundo artículo.

## La segunda causa: el despacho real

Acá está la parte que casi nadie ve venir, y la que responde de verdad la
pregunta del título.

Además de indexar, la UT hace mensualmente un **ajuste** cuyo objeto es
reflejar en el CVNC ponderado el despacho real de los últimos doce meses
(9.3.1 y 9.3.2). Los datos de energía y horas de operación de ese período los
remite el generador durante los primeros diez días hábiles del mes siguiente,
en el formato y medio que la UT establezca (9.3.3). La expresión es

$$
\text{CVNC}_{\text{paj}} = \sum_{ci}
\left( \text{CVONC}_{ci} + \text{CH}_{ci} +
\text{CVM}_{ci}\cdot\frac{E_a}{E_{12}}\cdot\frac{\text{HO}_{12}}{\text{HO}_a}
\right) R12_{ci}
$$

donde los tres componentes son los del año base ya actualizados por indexación,
$E_a$ y $\text{HO}_a$ son la energía neta y las horas de operación anuales del
año base, $E_{12}$ y $\text{HO}_{12}$ las de los últimos doce meses registradas
en el SIMEC, y $R12_{ci}$ la participación de cada combustible en la energía
neta despachada en ese período (9.3.4).

Léase con cuidado dónde está el factor. **Solo el CVM se reescala.** El CVONC y
la parte variable de los híbridos entran sin corregir, y es coherente: los dos
son costos por unidad de energía producida, así que producir menos energía no
cambia su valor unitario. El mantenimiento programado es otra cosa. Su
frecuencia la manda el fabricante en horas de operación, no en megavatios hora
entregados. Si la máquina operó más horas para entregar menos energía, cada MWh
tuvo que cargar con más mantenimiento.

Los dos cocientes dicen exactamente eso, y conviene leerlos juntos. El primero,
energía del año base sobre energía de los últimos doce meses, sube cuando la
unidad entregó menos. El segundo, horas de los últimos doce sobre horas del año
base, sube cuando operó más tiempo. Su producto es el cambio en horas de
operación por megavatio hora entregado, que es la variable física de la que
depende el desgaste.

<figure class="fig fig-wide">
  <img src="../assets/figures/ajuste-despacho.svg"
       alt="Comparación de tres barras apiladas del CVNC. La primera, el año base, suma 6.80 dólares por MWh con 2.45 de CVONC, 0.85 de parte variable de híbridos y 3.50 de mantenimiento. La segunda, indexada al mes doce, suma 7.05. La tercera, ajustada por despacho, suma 8.47 porque el componente de mantenimiento se multiplica por 1.3911. Arriba, dos paneles comparan el año base, 320 gigavatios hora en 6400 horas con carga media de 50 megavatios, contra los últimos doce meses, 248 gigavatios hora en 6900 horas con carga media de 35.9 megavatios."
       width="1200" height="620" loading="lazy" />
  <figcaption>La misma máquina, el mismo año base auditado, y 1.67 USD/MWh de
  diferencia. La inflación puso 0.25; el cambio de régimen de despacho puso
  1.42. Una unidad que pasa de operar en base a operar siguiendo la carga
  encarece su mantenimiento por megavatio hora aunque nadie haya cambiado un
  precio. <strong>Las cifras de energía y horas son ilustrativas</strong>: el
  mecanismo es la fórmula del numeral 9.3.4.</figcaption>
</figure>

En el ejemplo, la unidad entregó 320 GWh en 6 400 horas durante el año base, es
decir 50 MW de carga media, y en los últimos doce meses entregó 248 GWh en
6 900 horas, o sea 35.9 MW de carga media. El factor de ajuste queda en

$$
\frac{E_a}{E_{12}}\cdot\frac{\text{HO}_{12}}{\text{HO}_a}
= 1.2903 \cdot 1.0781 = 1.3911
$$

y el CVNC pasa de 7.05 a 8.47 USD/MWh. La indexación aportó 0.25 en doce meses;
el ajuste por despacho aportó 1.42 de una vez.

Esa es la respuesta a por qué un CVNC cambia mes a mes aunque la planta no haya
cambiado. Cambian los índices, sí, y muy poco. Lo que de verdad lo mueve es que
la planta dejó de operar como operaba, y en un sistema con participación
creciente de solar eso les está pasando a las térmicas de forma sistemática:
menos energía, más ciclado, más horas por megavatio hora entregado. El ajuste
del numeral 9.3.4 es el canal por el que ese cambio físico llega al precio del
mercado sin necesidad de reabrir una auditoría.

Y como el CVNC entra al costo variable que ordena el mérito, el efecto no se
queda en la contabilidad del generador. Una unidad cuyo CVNC sube 1.42 USD/MWh
se corre hacia arriba en la curva de oferta, lo que cambia cuándo se la despacha
y, si resulta marginal, cuánto paga la demanda esa hora.

## Lo que el anexo no contiene, y por qué

Es natural suponer que la indexación mensual tiene su propio "proceso de
elaboración, publicación y conformación con los generadores", con plazos, canal y
tratamiento de discrepancias. Leído el anexo completo, eso no existe, y la
ausencia parece de diseño y no un vacío.

La conformación con el generador ocurre **en la auditoría**, con sus 55 días
hábiles, sus ventanas de observación y su regla de cierre a favor del auditor.
Lo que viene después no es una negociación sino una operación aritmética sobre
índices públicos con ponderaciones ya validadas. No hay nada que conformar
porque no queda nada a criterio: dos índices publicados, dos porcentajes
aprobados, una división y una suma. Ahí está la elegancia del arreglo. Todo el
juicio se concentra en un evento bienal auditable, y los otros veintitrés meses
son ejecución.

Lo que sí sigue pendiente de verificar es dónde publica la UT el resultado
mensual, si es que lo publica de forma general. Para los precios de combustible
el Anexo 04 lo dice con hora y todo; para los CVNC indexados no encontré la
disposición equivalente ni el archivo público. Queda anotado en el registro de
fuentes como una de las cosas que hay que pedir directamente.

::: nota Para retener: dos ideas que se exportan fuera de este anexo
**El desgaste se mide en horas, no en megavatios hora.** El mantenimiento
programado lo manda el fabricante en horas de operación, mientras el mercado paga
por energía. Toda la fracción del numeral 9.3.4 existe para traducir entre esas
dos unidades, y por eso solo el CVM se reescala. Es la misma intuición con la que
se planifica mantenimiento por condición en cualquier instalación, escrita como
una fracción dentro de una fórmula regulatoria y con consecuencias sobre el
precio horario del mercado.

**Si el modelo no explica el dato, el dato no entra.** Eso es el numeral 4.5.7:
cuando la regresión de un costo híbrido no supera las pruebas de bondad, la
componente variable se asume igual a cero. No se estima, no se promedia, no se
negocia. La ausencia de evidencia se resuelve en contra de quien tenía que
aportarla, que es la carga de la prueba puesta donde corresponde. Es un criterio
trasladable a cualquier sistema de validación de datos, y el séptimo artículo de
la serie lo usa como principio de diseño.
:::

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP), Anexos**, versión actualizada a junio
  de 2026. Unidad de Transacciones. Anexo 17, Costos Variables de Operación y
  Mantenimiento No Combustibles (CVNC) y Costos de Arranque y Detención: objeto
  y objetivos específicos, con la referencia cruzada al numeral 3.1.4 del Anexo
  09 (1.1 y 1.2); definiciones de costo fijo, variable, híbrido, CVONC, CVM y
  CVMa (2.1); vigencia bienal de la auditoría y actualización mensual (3.1 a
  3.4); informe de cálculo y reproducibilidad en hoja electrónica (3.5 y 3.10);
  prevalencia de la auditoría en caso de discrepancia (3.16) e información
  incompleta (3.17); vigencia de los valores nuevos (3.18); tratamiento separado
  de CVNC en USD/MWh y CAyD por evento (3.19); secuencia de cálculo (3.20);
  método analítico y matriz del ICVNC (4.4), umbrales de clasificación (4.4.9),
  criterio de función consumo (4.3.1) y método estadístico con sus pruebas de
  bondad de ajuste (4.5.3 a 4.5.10); fórmulas de indexación de CVNC (9.1) y de
  CAyD (9.2) con sus indicadores y fuentes; ajuste por despacho real de los
  últimos doce meses (9.3); alcance, responsabilidades y plazos de la auditoría
  (10.1 a 10.5).
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP-Anexos.pdf/f5ec6c02-8426-4cb6-5a61-e7cba80ff34b?t=1679083382997).
  Copia local: `normativa/robcp-anexos.pdf`. Consultado el 22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 09, Cálculo del Precio en el MRS:
  incremento del costo variable de toda unidad en línea por la parte variable
  del costo de arranque y detención calculada según el Anexo 17, y compensación
  a quien queda por encima del costo marginal (3.1.6).
- **Propuesta de Modificaciones al Anexo 17 del ROBCP**, alojada por SIGET,
  2021. Es una propuesta y no texto vigente, pero expone el razonamiento de
  diseño que el reglamento no explicita.
  [PDF](https://www.siget.gob.sv/wp-content/uploads/2021/11/Propuesta-de-modificaciones-al-Anexo-17-del-ROBCP.pdf).
  Consultado el 22 de agosto de 2026.
- **Fuentes de los indicadores**, citadas por el propio Anexo 17, 9.1.4.2: IPC
  publicado por la Dirección General de Estadística y Censos de El Salvador, y
  PPI publicado por el Bureau of Labor Statistics del Departamento del Trabajo
  de Estados Unidos, serie PCUOMFG, total manufacturing industries.

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
