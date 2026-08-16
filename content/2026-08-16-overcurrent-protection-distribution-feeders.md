---
title: Overcurrent protection on distribution feeders
summary: The devices, the pickup window and the time-current curves that decide which relay clears a fault first — and what distributed generation breaks.
date: 2026-08-16
topic: Grid operations
---

A distribution feeder is protected by devices in series: a breaker at the
substation, one or more reclosers down the trunk, fuses on the laterals. Every
one of them sees the same fault. Protection engineering is mostly the work of
making sure that only the right one operates, and that it operates before
anything melts.

That reduces to two decisions, and everything else — pickup, curve shape, time
dial, coordination interval — is machinery in service of them:

1. **Is this a fault or is it load?**
2. **Is this fault mine to clear, or does something downstream own it?**

Radial feeders make both decisions tractable. There is one source, so fault
current flows one way and falls off with distance from the substation. Current
magnitude alone carries enough information about *how far away* a fault is that
you can protect the whole feeder with overcurrent elements and never measure
impedance. That single assumption is what the rest of this rests on — and it is
also the first thing distributed generation takes away.

## The devices you actually set

Function numbers come from IEEE C37.2. On a feeder you will keep meeting the
same handful:

| Device | Function | What it is for |
|---|---|---|
| 51 | Time overcurrent | The workhorse. Inverse-time curve on phase current. |
| 50 | Instantaneous overcurrent | No intentional delay, for close-in faults. |
| 51N / 50N | Residual ground | Sees `3I₀`, so it can be set far below load. |
| 67 | Directional overcurrent | Supervises 50/51 by fault direction. |
| 79 | Reclosing | Retries after a trip, because most faults are transient. |
| 52 | Circuit breaker | The thing that actually interrupts. |

The ground element deserves the emphasis. Phase elements must sit above load
current, but the residual element measures `3I₀`, which is near zero on a
balanced feeder. That lets you set ground pickup at a fraction of phase pickup
and catch high-impedance faults — a conductor lying on dry soil — that no phase
element would ever see. Feeder imbalance and single-phase lateral loading set
the practical floor, not the relay.

## Pickup: a window, not a number

Phase pickup has to fit between two moving limits:

```
I_load,max  ×  margin   <   I_pickup   <   I_fault,min  /  reliability
```

The lower bound is not nameplate load. Two effects push it up:

- **Transformer inrush**, several times rated current for a few cycles.
- **Cold load pickup**, which is the harder one. After an extended outage the
  natural diversity of thermostats, motors and compressors is gone, and they all
  restart together. The feeder can draw multiples of its pre-outage load for
  seconds to minutes — long enough to sit inside an inverse-time curve rather
  than being ridden through.

The upper bound is the *minimum* fault current in the protected zone, which
usually means a phase-to-phase or high-impedance ground fault at the far end,
under minimum generation. On a long rural feeder those two bounds converge, and
on a bad one the window closes entirely: the current drawn by a fault at the end
of the line is no longer clearly distinguishable from a heavy cold-load restart.
That is the point at which overcurrent alone stops being sufficient and the
answer becomes voltage-restrained elements, a mid-line recloser to shorten the
zone, or impedance-based protection.

## The curve

Inverse-time characteristics exist because current magnitude is a usable proxy
for electrical distance. One curve gives you two things at once: a close-in
fault clears fast because it draws more current, and a downstream device with
the same shape sits naturally below yours across the whole current range.

Two standards define the shapes, and they are **not** interchangeable.

**IEC 60255-151:**

```
        TMS · k
t = ─────────────────
    (I / Is)^α  −  1
```

| Curve | k | α |
|---|---|---|
| Standard inverse | 0.14 | 0.02 |
| Very inverse | 13.5 | 1 |
| Extremely inverse | 80 | 2 |
| Long time inverse | 120 | 1 |

**IEEE C37.112:**

```
     TD   ⎛       A              ⎞
t = ──── ·⎜ ───────────────  +  B⎟
      7   ⎝ (I / Is)^p − 1       ⎠
```

| Curve | A | B | p |
|---|---|---|---|
| Moderately inverse | 0.0515 | 0.1140 | 0.02 |
| Very inverse | 19.61 | 0.491 | 2 |
| Extremely inverse | 28.2 | 0.1217 | 2 |

An IEC very-inverse curve and an IEEE very-inverse curve share a name and are
different curves. Loading one into a relay when the coordination study assumed
the other is a quiet, common and entirely avoidable error — the settings look
right in the file and the margins are wrong on the feeder.

Choosing a shape is mostly about what you have to coordinate against:

- **Extremely inverse** tracks fuse melting characteristics most closely, so it
  is the usual choice on feeders with fused laterals.
- **Standard / moderately inverse** stays dependable across a wide range of
  fault currents and tolerates uncertainty in the short-circuit model.
- **Definite time** is the honest option where the current-versus-distance
  relationship is too flat for an inverse curve to discriminate anything.

## Coordination is checked at the worst current, not a convenient one

Between two devices in series you need a coordination time interval — commonly
0.2–0.4 s. It is not an arbitrary safety factor; it is a sum:

- **Breaker interrupting time**, roughly 3–5 cycles, so 50–83 ms at 60 Hz.
- **Relay overtravel**, historically about 0.1 s on electromechanical relays
  from disc inertia, effectively zero on numerical relays.
- **Characteristic and instrument tolerance** — the standards define accuracy
  classes, and CT saturation at high current degrades them further.
- **Margin.**

Which is why 0.3 s is inherited practice and 0.2 s is defensible on a fully
numerical scheme, while neither number means anything without the arithmetic
behind it.

The mistake worth naming: verifying coordination at a single current. Two
inverse curves converge as current rises, so a pair that looks comfortably
separated at minimum fault current can cross at maximum fault current — right
where the fault energy is highest. Coordination has to hold across the whole
range of currents both devices can see.

## Fuse saving versus fuse clearing

Most distribution faults — commonly cited as the large majority — are transient:
a branch, an animal, a flashover that does not survive a de-energized interval.
Reclosing exists to exploit that, and it forces a policy choice on every fused
lateral.

**Fuse saving** puts a fast curve on the recloser so it operates before the
lateral fuse melts, then recloses. A transient fault on a lateral costs nobody a
fuse and nobody a truck. The price is that *every* customer on the feeder sees a
momentary interruption for a fault on one lateral.

**Fuse clearing** lets the fuse blow. Only the lateral is lost, the rest of the
feeder never blinks — but the outage is sustained until a crew arrives.

The trade has shifted. Momentary interruptions are far more expensive to
customers with electronics and variable-speed drives than they were when fuse
saving became standard practice, which has moved many utilities toward fuse
clearing on laterals.

## What distributed generation breaks

Everything above assumes one source and unidirectional flow. Add generation
downstream and specific assumptions fail:

- **Direction stops implying location.** A feeder with generation can push fault
  current toward the substation, which is what 67 is for.
- **Infeed causes underreach.** For a fault beyond a DER connection point, the
  substation relay sees only part of the total fault current — the DER supplies
  the rest. The relay reads a smaller current than the fault actually is, and
  its inverse curve therefore trips *slower* than the study predicted.
- **Reclosing can close out of phase.** If DER keeps an island energized through
  the dead time, the reclose is a closure between two unsynchronized sources.
  IEEE 1547 requires DER to cease to energize on an abnormal condition, but the
  timing has to be checked against the actual reclose interval rather than
  assumed.
- **Sympathetic tripping.** Generation on a healthy feeder can contribute enough
  current to a fault on an adjacent one to operate its own protection.

## Standards worth keeping open

| Standard | Covers |
|---|---|
| IEEE C37.2 | Device function numbers |
| IEC 60255-151 | Over/undercurrent protection, curve equations |
| IEEE C37.112 | Inverse-time characteristic equations |
| IEEE C37.230 | Protective relay applications to distribution lines |
| IEEE Std 242 | Protection and coordination (the Buff Book) |
| IEEE 1547 | DER interconnection and interoperability |

The thread running through all of it: coordination is a property of the system,
not a setting on a relay. A device whose settings are individually defensible
can still be wrong, because correctness is defined by what the device upstream
and the device downstream are set to do at the same current, at the same
instant.
