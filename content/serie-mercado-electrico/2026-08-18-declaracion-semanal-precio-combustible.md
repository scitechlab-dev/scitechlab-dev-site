---
title: "Mercado mayorista III. Anatomía de una declaración semanal de precio de combustible"
summary: "El precio que declara un generador térmico se publica pero no despacha; el que despacha lo calcula la UT. Cómo viaja el dato desde la auditoría de consumo de calor hasta el precio de una hora, con el costo puesto en planta armado componente por componente y el inventario mínimo atado a la cota de Cerrón Grande."
date: 2026-08-18
lang: es
topic: Mercado eléctrico
categories: [mercado-electrico]
tags: [costos-variables, combustible, robcp, inventarios]
estado: en-revision
math: true
---

Un jueves antes de las diez de la mañana, un generador térmico salvadoreño
envía a la UT un número: el precio de su combustible puesto en planta. La UT lo
publica a la mañana siguiente, entre las ocho y las nueve, junto con el de todos
los demás generadores térmicos del país.

Y ese número no entra al despacho.

El que entra lo calcula la UT, aplicándole a una cotización internacional una
fórmula que el regulador aprobó hasta dos años antes. Que existan las dos
cifras, que sean distintas y que ambas sean públicas, no es una redundancia
administrativa. Es el mecanismo entero.

## Dos números, dos caminos

El primer artículo dejó planteada la bisagra: si el precio sale de costos
declarados, la integridad del precio depende por completo de la integridad de
las declaraciones. El segundo mostró el mecanismo que consume esos costos, el
orden de mérito, y lo trató como dato de entrada. Este es el artículo donde ese
dato deja de ser dato, y la primera sorpresa es de dónde sale.

El reglamento reparte el trabajo con una claridad que conviene retener. El
cálculo de los costos variables de combustible que se usan en la programación
anual, semanal y diaria **es responsabilidad de la UT**, y para hacerlo
actualiza el precio de compra con base en la referencia reconocida
internacionalmente que propone el generador y aprueba el regulador (Anexo 04,
3.1). El generador no fija su costo variable. Propone una estructura, la somete
a aprobación, y después el operador calcula.

En paralelo corre una obligación distinta, que viene de la ley y no del
reglamento. El artículo 60 de la Ley General de Electricidad manda que la UT
publique diariamente, entre otras cosas, los precios de los combustibles
puestos en planta que los generadores térmicos deben reportarle (art. 60
literal c). Ese es el reporte del jueves y la publicación de cada mañana. Y el
formulario que lo transporta lo dice sin rodeos: **el precio declarado en ese
formulario no será utilizado para la programación de la operación**, sino que
obedece al literal c del artículo 60 de la ley (Anexo 06, 7.4.3.7.1).

Conviene decirlo de una manera que se pueda repetir de memoria. El precio
declarado se publica; el precio calculado se despacha. El primero es un acto de
transparencia con fuerza legal, el segundo es el insumo del modelo, y el
contraste entre ambos, que cualquiera puede hacer con dos páginas del sitio de
la UT, es lo que convierte una declaración en algo verificable desde afuera.

Esa asimetría es todo el diseño. En un mercado por ofertas, el generador dice
un precio y la competencia lo disciplina. Acá el generador entrega insumos
documentados y un tercero calcula, con una fórmula que aprobó un cuarto, sobre
una cotización que publica un quinto.

## Tres relojes que corren a distinta velocidad

Lo que más cuesta al principio es que la cadena no tiene una periodicidad sino
tres, y ninguna coincide con las otras.

<figure class="fig fig-wide">
  <img src="../assets/figures/cadena-costo-combustible.svg"
       alt="Tres bandas horizontales. Arriba, cada dos años: auditoría de consumo de calor por auditor externo con la UT como observador, polinomio de consumo específico ajustado por mínimos cuadrados, y estructura de costos del combustible con su fuente internacional y su fórmula. En el medio, cada semana: el generador reporta su precio puesto en planta el jueves antes de las 10:00 y ese valor se publica pero no entra al despacho, la UT calcula el precio que sí despacha aplicando la fórmula aprobada, y el lunes se reporta la variación de inventarios. Abajo, cada hora: el costo variable se arma como consumo específico por precio, entra al orden de mérito del SAM y produce el precio del MRS."
       width="1200" height="660" loading="lazy" />
  <figcaption>El recorrido completo de un dato. Lo que se aprueba cada dos años
  no es un valor sino una regla: el polinomio que traduce potencia en consumo y
  la fórmula que traduce una cotización internacional en precio puesto en
  planta. Lo semanal solo alimenta esas reglas con cifras nuevas. Por eso una
  declaración no se contrasta contra la declaración anterior sino contra la
  estructura vigente, y por eso el número que despacha lo produce el operador y
  no el participante.</figcaption>
</figure>

**Cada dos años** se fija la maquinaria. Las curvas de consumo específico de
calor y de combustible tienen una vigencia de dos años no prorrogables,
contados desde el vencimiento de la auditoría anterior, y la UT avisa del
vencimiento con al menos cuatro meses de antelación (Anexo 16, 2.2 y 2.3). En
paralelo, la estructura de costos de los combustibles se revisa cada dos años,
y al abrir el proceso la UT le pide a cada generador su estructura por tipo de
combustible con su forma y periodicidad de actualización (Anexo 04, 4.3).

**Cada semana** se alimenta. El generador reporta su precio puesto en planta,
la UT actualiza el precio FOB con la fórmula aprobada sobre la referencia
internacional publicada, y ese resultado, no el reportado, rige los siete días
de la programación semanal (7.1). Los costos de internación se actualizan por
su propia fórmula aprobada (7.2), de modo que las dos mitades del precio no se
mueven por la misma causa ni al mismo ritmo.

**Cada hora** se consume. El costo variable resultante entra al modelo, se
apila en el orden de mérito y sale como costo marginal.

Un detalle de continuidad que evita un error frecuente: mientras el regulador
no apruebe estructuras actualizadas, **la UT sigue aplicando las del período
anterior** (4.7). El vencimiento de la vigencia no deja al generador sin costo
variable. Y un generador puede pedir una estructura nueva antes de que venza la
suya si considera que dejó de ser representativa, del mismo modo que la UT o el
regulador pueden ordenarle que inicie el proceso antes de tiempo (4.8).

## Qué mide realmente la auditoría

La auditoría de consumo de calor no produce un número. Produce una función.

El consumo específico de calor es la cantidad de energía térmica de entrada por
cada unidad de energía eléctrica de salida, es decir el recíproco de la
eficiencia térmica, y varía a lo largo de todo el rango de potencia de la
máquina. El procedimiento obliga a representarlo con una adecuación de segundo
orden:

$$
C_{\text{ESP}} = a + b\,P + c\,P^{2}
$$

donde $C_{\text{ESP}}$ es el consumo específico de calor en Gcal/MWh, GJ/MWh o
MMBtu/MWh y $P$ la potencia neta de salida en MW. Los coeficientes salen de un
ajuste por mínimos cuadrados sobre cinco o más pares de puntos medidos en el
ensayo, seis como mínimo para las configuraciones de ciclo combinado que
involucran el ciclo de recuperación de calor (Anexo 16, apéndice 3, 2.2, 2.3.1
y 3.4). Además del polinomio de calor se determina su equivalente en consumo
específico de combustible, en gal/MWh o Sm³/MWh, también de segundo grado y
también por mínimos cuadrados (2.3.4 y 2.3.5).

La restricción que más se olvida está en el numeral siguiente: **la curva tiene
validez solamente entre el punto de mínima carga ensayado y la potencia máxima
alcanzada durante el ensayo**, y ese punto de mínima carga es el mínimo técnico
declarado a la UT (2.3.3). Fuera de esa banda el polinomio sigue siendo una
parábola perfectamente evaluable y deja de significar algo. Extrapolarlo es el
modo más elegante de producir un costo falso.

<figure class="fig fig-wide">
  <img src="../assets/figures/consumo-especifico.svg"
       alt="Curva de consumo específico de calor de una unidad de 60 MW netos, en MMBtu por MWh, contra potencia neta. Cinco círculos marcan los puntos de ensayo entre 20 y 60 MW y la curva es el polinomio de segundo grado ajustado sobre ellos. Fuera del rango de 20 a 60 MW la curva se dibuja punteada y el fondo gris marca la zona sin validez. Un eje derecho traduce el mismo valor a dólares por MWh usando el precio del combustible. Una marca ámbar señala el punto de 58.2 MW, potencia máxima neta menos el 3 por ciento de reserva rodante, donde el reglamento evalúa el costo, con 119.64 dólares por MWh."
       width="1200" height="700" loading="lazy" />
  <figcaption>La misma curva leída dos veces: a la izquierda como consumo, a la
  derecha como dinero. El punto ámbar no es el de mejor eficiencia ni el de
  plena carga, sino el que el Anexo 09 manda usar. Entre el mínimo técnico y
  ese punto hay 10.36 USD/MWh de diferencia, así que decir "el costo variable de
  la unidad" sin decir a qué potencia no significa nada. <strong>Las cifras son
  ilustrativas y no corresponden a ninguna central salvadoreña</strong>: la
  forma del polinomio y el procedimiento de ajuste sí son los del reglamento.
  </figcaption>
</figure>

El proceso alrededor del ensayo importa tanto como el ensayo. El generador
contrata al auditor, pero no a cualquiera: debe estar en el registro de
auditores aprobados que publica la UT, con más de diez años de experiencia en
generación térmica y participación a nivel de dirección en ensayos de consumo
de calor (Anexo 16, 2.8 y 5.2.1). La UT no ejecuta la auditoría; **participa
como observador** y destaca un representante en sitio para vigilar la correcta
aplicación del procedimiento (2.9). Y todos los informes del auditor deben ser
aprobados por la UT en ese carácter (2.10).

Los plazos de revisión están tasados: 35 días hábiles para que el auditor
emita el informe preliminar, 5 días hábiles para las observaciones del
generador, 5 más para las de la UT, 10 para que el auditor las incorpore
(6.6.8.1 a 6.6.8.7). Si el generador objeta el informe final, prevalece la
opinión del auditor, y lo único que puede hacer es solicitar una auditoría
nueva quedando transitoriamente válidos los valores de la primera (6.6.8.11).
Las curvas entran en vigor en la siguiente ejecución de la programación
semanal (6.6.8.12).

## De qué está hecho el precio puesto en planta

El precio del combustible tiene dos componentes y no uno: el precio de compra
FOB y los costos de internación hasta ponerlo en el sitio de almacenamiento de
la central (Anexo 04, 4.1). Cada generador propone, por cada tipo de
combustible, una fuente internacional de precios, una fórmula para calcular el
FOB a partir de lo que publica esa fuente, los costos de internación con base
en costos comprobables y una fórmula de actualización de esos costos.

El numeral 4.2 desglosa la cadena literal, y vale reconstruirla con cifras para
ver dónde se acumula el dinero. Tomemos una unidad de fuel oil de 60 MW netos:

| Componente | Numeral | USD/bbl |
|---|---|---|
| Precio FOB de la referencia internacional | 4.2 a | 78.40 |
| Flete marítimo, según estándares internacionales | 4.2 b | 4.10 |
| Seguro marítimo | 4.2 c | 0.35 |
| **Precio CIF** | 4.2 d | **82.85** |
| Derechos de internación, como porcentaje del CIF | 4.2 e | 0.83 |
| Gastos de internación, agente de aduana | 4.2 f | 0.22 |
| **Valor CIF internado** | 4.2 g | **83.90** |
| Servicio de descarga, según contrato vigente | 4.2 h | 0.95 |
| Muestreo y análisis | 4.2 i | 0.08 |
| Transporte terrestre | 4.2 j | 1.60 |
| Prima de póliza sobre descarga, transporte y almacenaje | 4.2 k | 0.12 |
| Otros impuestos que no generan crédito fiscal | 4.2 l | 0.30 |
| **Costo puesto en tanques** | 4.2 n | **86.95** |

Ocho dólares y medio por barril, casi el 11 % del FOB, viven fuera de la
cotización internacional. Ninguno de esos ocho aparece en un índice público:
salen de contratos, de comprobantes de facturación y de valores vigentes de
derechos e impuestos. Ahí está el trabajo real de validar una estructura.

Con un poder calorífico inferior de 6.20 MMBtu por barril, el precio puesto en
planta queda en

$$
\text{PCpep} = \frac{86.95\ \text{USD/bbl}}{6.20\ \text{MMBtu/bbl}}
= 14.024\ \text{USD/MMBtu}
$$

y esa conversión es donde se pierde más gente que en ninguna otra parte del
cálculo. El precio se declara y se contrata en unidades de volumen o de masa;
el costo variable se necesita en unidades de energía. El puente es el poder
calorífico, y su definición no es única: el superior y el inferior difieren en
varios puntos porcentuales, más en gas natural que en fuel oil.

El reglamento cierra esa puerta, y conviene saber dónde. El anexo define el
consumo de calor como el producto del flujo másico de combustible **por su
poder calorífico inferior** (Anexo 16, apéndice 1, terminología). Es decir que
todo el ensayo, y por lo tanto todo el polinomio, está construido sobre PCI. La
consecuencia es directa: el precio tiene que convertirse a unidades de energía
con la misma base. Convertir con poder calorífico superior un consumo medido
con inferior produce un costo variable sesgado sin que ninguna de las dos
cifras esté mal por separado, que es la clase de error que ninguna revisión de
documentos detecta porque no hay ningún documento equivocado.

## El costo variable, armado

El resto es multiplicación, y la pregunta interesante no es cómo sino dónde.

$$
\text{CVC}(P) = C_{\text{ESP}}(P) \cdot \text{PCpep}
$$

Para la unidad del ejemplo el polinomio auditado es

$$
C_{\text{ESP}}(P) = 10.53 - 0.078\,P + 0.00075\,P^{2}
$$

en MMBtu/MWh, con $P$ en MW netos. Esa función vale 9.27 en el mínimo técnico
de 20 MW y 8.53 cerca de plena carga. Al multiplicar por 14.024 USD/MMBtu, el
costo variable de combustible pasa de 130.00 a 119.64 USD/MWh. La misma
máquina, el mismo combustible, el mismo precio, y 10.36 USD/MWh de diferencia
según en qué punto de su curva se la evalúe.

El reglamento no deja esa ambigüedad abierta. El costo variable de una unidad
térmica, **para efectos de determinar el costo marginal de operación**, se
calcula con el consumo de combustible correspondiente a la generación a
potencia máxima neta menos el porcentaje de reserva rodante requerida para
servicios auxiliares, más los costos variables de operación y mantenimiento
(Anexo 09, 3.1.5). Con el 3 % de reserva de potencia activa que toda unidad
debe aportar a la regulación primaria de frecuencia (Anexo 11, 2.1), el punto
de evaluación de esta unidad es 58.2 MW:

$$
\begin{aligned}
C_{\text{ESP}}(58.2) &= 8.53\ \text{MMBtu/MWh} \\
\text{CVC} &= 8.53 \cdot 14.024 = 119.64\ \text{USD/MWh} \\
\text{CV} &= 119.64 + \text{CVNC} = 119.64 + 6.80 = 126.44\ \text{USD/MWh}
\end{aligned}
$$

donde CVNC es el costo variable de operación y mantenimiento no combustible,
que tiene su propio procedimiento, su propia auditoría y su propia indexación,
y es el tema del artículo siguiente.

Ese 126.44 es el número que se apila en el orden de mérito. Todo lo anterior
existe para producirlo.

## La semana, hora por hora

<figure class="fig fig-wide">
  <img src="../assets/figures/semana-combustible.svg"
       alt="Línea de tiempo de una semana con cinco hitos. El lunes el generador reporta la variación de inventarios con la existencia a las cero horas, y ese mismo día la UT publica un consolidado y lo remite al regulador. El jueves antes de las 10:00 el generador reporta el precio del combustible puesto en planta en el formulario del Anexo 06, que es transparencia, y ese mismo jueves la UT publica junto con la programación semanal el precio que sí despacha. Todos los días, entre las 8 y las 9 de la mañana, la UT publica los precios reportados por cada participante para el día en curso."
       width="1200" height="510" loading="lazy" />
  <figcaption>Dos obligaciones del generador y tres publicaciones del operador,
  en la misma semana. El reporte del jueves cumple la ley y se publica; el
  precio que ordena el parque lo calcula la UT ese mismo jueves. El reporte del
  lunes alimenta el control de inventarios y, por esa vía, la tasa de salida
  forzada. Son circuitos distintos que se cruzan en el mismo
  participante.</figcaption>
</figure>

Los generadores reportan el precio puesto en planta cada jueves antes de las
diez horas, en el formulario "Precios de los Combustibles" del Anexo 06
(Anexo 04, 10.1). La UT publica en su sitio, entre las ocho y las nueve de cada
día, los precios reportados por cada participante para el día en curso (11.1),
y cada jueves, junto con la programación semanal, el precio calculado con la
aplicación de las fórmulas de actualización (11.2).

Son dos cifras publicadas, no una, y ya vimos que solo la segunda despacha. La
distancia entre ambas es información pura: si el precio que declara un generador
se despega del que resulta de su propia estructura aprobada, eso está a la vista
de cualquiera que abra las dos páginas. Un mercado que publica las dos está
exponiendo su propio control, y le entrega a cada participante los medios para
auditar a los demás.

Queda un cabo suelto que anoto sin resolver. El artículo 60 de la ley habla de
un reporte **diario**, y el régimen de infracciones del anexo sanciona no
proporcionar "los PCpep diarios" en plazo (12.1 a), mientras el numeral que fija
la obligación operativa habla del jueves antes de las diez (10.1). Las dos
lecturas son compatibles si el reporte del jueves cubre los días de la semana
programada, pero el texto no lo dice con esas palabras. Es de las cosas que hay
que confirmar con la UT antes de afirmarlas.

Para la programación anual la UT no usa el dato semanal sino el promedio de los
precios utilizados en la actualización de la programación vigente (10.2). Los
horizontes no comparten insumo, y esa diferencia es materia del quinto artículo
de la serie.

## Cuando la fórmula depende del volumen comprado

Un generador puede proponer que su fórmula de precio FOB dependa también del
volumen de compra, además de los precios de la fuente internacional. Ahí el
reglamento se pone considerablemente más exigente, y por una razón que se
entiende sola: si el precio depende de lo que el generador compró, el precio
depende de un dato que solo el generador conoce.

Las condiciones son cuatro. El FOB resultante debe reflejar el costo del
inventario existente valorizado a precios de la referencia internacional
(4.12.1). Antes de aplicar la fórmula, el generador entrega a la UT el respaldo
del costo del inventario inicial valorizado a precios FOB (4.12.2). En régimen
normal, informa volúmenes adquiridos y precios FOB asociados con documentación,
calcula el FOB semanalmente para que la UT lo verifique, y reporta la variación
de inventarios en forma semanal (4.12.3 a, b, c). Y toda esa información queda
sujeta a auditorías de la UT (4.12.4).

La cuarta condición es la que revela cuánto detalle exige el diseño: los
inventarios de combustibles líquidos deben referenciarse a 60 °F con tablas de
calibración auditadas para los tanques, y los de gas natural a 288.15 K y
101.325 kPa según la norma ISO 13443, con todos los instrumentos de medición
calibrados y certificados (4.12.3 d). Un inventario sin corrección por
temperatura no es un inventario menos preciso: es un inventario que se puede
inflar o desinflar operando la temperatura del tanque.

Hay un caso más, y es el de los participantes con una actividad productiva
adicional a la generación eléctrica. Para ellos, los reportes contables, las
cantidades del informe de inventario y los comprobantes de compra deben ser los
correspondientes a la actividad de generación, y la UT debe definir un
procedimiento estandarizado que garantice que la energía inyectada al sistema
se relaciona directamente con las cantidades de combustible reportadas
(4.12.3 e). Es el problema de asignación de un ingenio o una cementera que
además genera, resuelto por la vía de exigir trazabilidad.

## El inventario y la cota del embalse

Acá aparece la regla más salvadoreña de todo el anexo, y la que mejor muestra
que el reglamento fue escrito para un sistema hidrotérmico concreto y no
copiado de otro país.

<figure class="fig fig-wide">
  <img src="../assets/figures/inventario-minimo.svg"
       alt="Tres filas, una por rango de cota del embalse de Cerrón Grande. Con la cota bajo 235.50 metros sobre el nivel del mar se exigen 10 días de combustible a plena carga a las centrales con factor de planta mayor o igual a 0.75 y 5 días a las de factor menor. Entre 235.50 y 242 metros, 8 y 4 días. Arriba de 242 metros, 7 y 3 días. Las barras se acortan a medida que sube el embalse."
       width="1200" height="560" loading="lazy" />
  <figcaption>El piso de combustible en tanque no depende del combustible sino
  del agua. Cuando el embalse baja, el sistema anticipa que va a apoyarse en lo
  térmico y sube la exigencia de autonomía; cuando sube, la relaja. Es una regla
  de seguridad de suministro escrita como restricción de inventario. Los días
  son los del numeral 9.1 del Anexo 04.</figcaption>
</figure>

Cada participante debe contar con infraestructura de almacenamiento según tres
escenarios de cota del embalse de Cerrón Grande. Con la cota por debajo de
235.50 m.s.n.m., una central cuyo factor de planta en la programación semanal
sea mayor o igual que 0.75 debe mantener combustible suficiente para operar a
plena carga durante diez días; entre 235.50 y 242 m.s.n.m. son ocho días, y por
encima de 242 m.s.n.m., siete (9.1.1 a 9.1.3). Para las centrales con factor
menor que 0.75 el piso es el mayor de dos valores: el equivalente a su
operación según la programación semanal más un 35 %, o combustible para cinco,
cuatro o tres días a plena carga según el mismo escalón de cota.

Que el almacenamiento no quepa en la planta no exime: el participante debe
garantizar el resto fuera de ella, en tanques o buques propios, o mediante
programas de suministro a terceros, contratos take or pay con cronograma anual
o compra spot con ventana de entrega, informando anticipadamente a la UT el
cronograma de recepción (9.3).

Y el incumplimiento no se castiga con una multa sino con algo que muerde más.
Si un generador no cumple el inventario mínimo, la UT le penaliza la **tasa de
salida forzada** determinando horas de indisponibilidad forzada equivalente por
déficit de combustible, calculadas con los inventarios existentes, los mínimos
requeridos y la cota del embalse registrados a las 00:00 del lunes de cada
semana (9.4). La tasa de salida forzada es un insumo de la determinación de
capacidad firme (Anexo 15), que es como el reglamento retribuye la
confiabilidad. Dicho sin rodeos: quedarse corto de combustible le baja al
generador el ingreso por capacidad. La sanción está en la misma moneda que el
riesgo que crea.

## Cómo yo validaría una declaración

Lo que sigue no está en el reglamento como lista. Es mi reconstrucción, en
orden de criticidad, de lo que el propio texto obliga a verificar. La ordené
poniendo primero lo que invalida la declaración entera y al final lo que
solamente merece una alerta.

1. **Vigencia de la estructura.** ¿Cuál es la estructura de costos aprobada que
   aplica a esta central y este combustible? Si venció y no hay una nueva
   aprobada, se sigue aplicando la anterior (4.7). Sin este dato, nada de lo
   que sigue se puede evaluar.
2. **Fuente internacional.** ¿Es la aprobada para esa central por nombre
   (4.9)? Una fuente distinta, aunque sea razonable, no es la fuente.
3. **Período de promedio.** ¿El promedio del FOB corresponde al período que
   fija la fórmula aprobada, con el factor que corresponda en el caso del gas
   natural (4.1 b)? Mover la ventana de promedio es el modo silencioso de mover
   el precio.
4. **Plazo y formato.** ¿Llegó el jueves antes de las 10:00 y en el formulario
   del Anexo 06 (10.1)? El incumplimiento de plazo es causal de infracción por
   sí mismo (12.1 a). Ojo con qué se está verificando acá: es el reporte de
   transparencia, no el insumo del despacho, y por eso su falta no detiene la
   programación pero sí incumple la ley.
5. **Costos de internación.** ¿Se actualizaron con la fórmula aprobada (7.2), o
   se reemplazaron por costos nuevos? Cambiar un componente comprobable es un
   cambio de estructura, no una actualización.
6. **Fórmula por volumen.** Si aplica: ¿el FOB refleja el inventario valorizado
   a la referencia (4.12.1) y se entregaron volúmenes, precios y documentación
   (4.12.3 a, b)?
7. **Referenciación del inventario.** ¿Líquidos a 60 °F con tablas de
   calibración auditadas, gas a las condiciones de ISO 13443, instrumentos
   calibrados y certificados (4.12.3 d)?
8. **Consistencia entre inventario y generación.** ¿La variación de inventarios
   del lunes es compatible con la energía inyectada que registró el SIMEC,
   pasada por el consumo específico vigente? Es la única verificación cruzada
   que no depende de ningún documento que aporte el generador.
9. **Piso de inventario.** ¿El nivel a las 00:00 del lunes cumple el mínimo que
   corresponde a la cota del embalse y al factor de planta de la programación
   semanal (9.1)?
10. **Separación de actividades.** Para participantes con producción adicional:
    ¿los reportes contables y los comprobantes son los de la actividad de
    generación (4.12.3 e)?
11. **Salto contra la semana previa.** Un cambio grande no es una irregularidad.
    La pregunta correcta no es cuánto subió sino si la referencia internacional
    subió lo mismo. Si el FOB se movió y el declarado no, o al revés, hay algo
    que explicar.
12. **Restricciones informadas.** ¿Se informó oportunamente cualquier falta o
    restricción de combustible que impida cubrir la programación (9.2)? No
    informarla es causal de infracción (12.1 f, g), y obliga a la UT a un
    redespacho (10.4).

Las irregularidades tipificadas cierran el círculo: no entregar los precios en
plazo, entregarlos de forma inapropiada o irregular, no contar con la capacidad
útil de almacenamiento, no demostrar el almacenamiento fuera de planta, no
informar la variación de inventarios, no informar restricciones, no informar la
falta de combustible y **reportar datos falsos o erróneos sobre la
disponibilidad** (12.1). La UT informa al regulador y notifica al participante
en un plazo no mayor de cinco días hábiles (12.2 y 12.3).

::: nota Lo que me llevo de leer el anexo completo
El hallazgo que me obligó a reescribir el arranque de este artículo fue el
numeral 7.4.3.7.1 del Anexo 06, una sola frase al pie de un formulario: el
precio que se declara ahí no se usa para la programación. Yo había armado todo
el borrador sobre el supuesto contrario, que es el supuesto natural. Sirve de
recordatorio de que en un cuerpo normativo de mil páginas la frase que cambia
el sentido de un proceso puede estar en la letra chica de un formato, no en el
capítulo que lleva el nombre del proceso.

Venía además con una idea equivocada del plan de estudio con el que empecé: que
la revisión de las estructuras de combustible era anual. El texto dice dos años,
tanto para la estructura de costos (4.3) como para las curvas de consumo de
calor (Anexo 16, 2.2). Lo anual es otra cosa: la actualización de la
programación de la operación, que corre con periodicidad mensual sobre un
horizonte anual. Confundir las dos cadencias hace que todo el encadenamiento se
cuente mal.

Lo segundo que no esperaba es cuánto del diseño descansa en instrumentación y
no en documentos. Las tablas de calibración de tanques, los 60 °F, la norma
ISO 13443 y los instrumentos certificados no son formalismos: son las
condiciones que hacen que un inventario declarado sea una cantidad física y no
una opinión. Viniendo de trabajar con datos de SCADA, esa parte me resulta
familiar de una forma incómoda. Un dato mal referenciado no se ve mal. Se ve
perfectamente normal y está mal.
:::

## Fuentes

- **Reglamento de Operación del Sistema de Transmisión y del Mercado Mayorista
  Basado en Costos de Producción (ROBCP), Anexos**, versión actualizada a junio
  de 2026. Unidad de Transacciones. Anexo 04, Precios de los Combustibles:
  objeto y alcance (1 y 2), responsabilidad de la UT en el cálculo (3.1),
  estructura de costos y su desglose (4.1 y 4.2), revisión bienal y continuidad
  de la estructura vencida (4.3 a 4.8), fórmula en función del volumen de
  compra y referenciación de inventarios (4.12), actualización semanal del FOB
  y de los costos de internación (7.1 y 7.2), control de inventarios (8),
  disponibilidad mínima por cota del embalse y penalización en la tasa de salida
  forzada (9), declaración del jueves y programación anual (10.1 y 10.2),
  publicaciones de la UT (11) e irregularidades (12).
  [PDF](https://www.ut.com.sv/documents/10100/279097/ROBCP-Anexos.pdf/f5ec6c02-8426-4cb6-5a61-e7cba80ff34b?t=1679083382997).
  Copia local: `normativa/robcp-anexos.pdf`. Consultado el 22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 16, Curvas de Consumo Específico de
  Calor: vigencia de dos años y aviso previo (2.2 y 2.3), auditor externo del
  registro de la UT y la UT como observador (2.8 a 2.10), perfil del auditor
  (5.2.1), plazos de revisión del informe y entrada en vigor (6.6.8). Apéndice
  3: forma del polinomio de segundo grado y ajuste por mínimos cuadrados (2.2 y
  2.3.1), rango de validez entre mínimo técnico y potencia máxima ensayada
  (2.3.3), equivalente en consumo específico de combustible (2.3.4 y 2.3.5) y
  número mínimo de puntos de ensayo (3.4). Apéndice 1: definición del consumo
  de calor como flujo másico de combustible por su poder calorífico inferior
  (terminología), y al menos cinco estados de carga en el ensayo (7.2.1).
- **ROBCP, Anexos**, misma versión. Anexo 06, Transacciones del Mercado:
  publicación diaria entre las 8 y las 9 horas de los precios de combustibles
  puestos en planta reportados por los generadores térmicos (5.2); formato del
  formulario "Precios de los Combustibles" y la advertencia de que **el precio
  declarado en él no se usa para la programación de la operación** sino que
  obedece al artículo 60 literal c de la LGE (7.4.3.7 y 7.4.3.7.1).
- **Ley General de Electricidad**, Decreto Legislativo No. 843 del 10 de octubre
  de 1996. Artículo 60: publicidad de los precios del MRS y obligación de la UT
  de publicar diariamente las ofertas horarias, el nivel de los embalses y los
  precios de los combustibles puestos en planta reportados por los generadores
  térmicos (literal c). Copia local: `normativa/ley-general-electricidad.pdf`.
  Consultado el 22 de agosto de 2026.
- **ROBCP, Anexos**, misma versión. Anexo 09, Cálculo del Precio en el MRS:
  costo variable de una unidad térmica evaluado a potencia máxima neta menos la
  reserva rodante requerida (3.1.5). Anexo 11, Servicios Auxiliares: aporte
  obligatorio del 3 % de reserva de potencia activa para regulación primaria de
  frecuencia (2.1). Anexo 15, Determinación de la Capacidad Firme: la tasa de
  salida forzada como insumo (2.1.2, referenciado desde el Anexo 04, 9.4).

El registro completo de documentos primarios de la serie, con su estado de
verificación, está en [Fuentes primarias](../fuentes).
