---
title: Euclidean root systems
---

<script type="module">
    import ReflectionDemonstration from './ReflectionDemonstration.svelte'
    import RootSystem from './RootSystem.svelte'
    import { groups } from 'lielib'

    new ReflectionDemonstration({target: document.getElementById('ReflectionDemonstration')})

    // Render each RootSystem just before the <RootSystem> element, then remove <RootSystem>.
    document.querySelectorAll('RootSystem').forEach(elt => {
        new RootSystem({target: elt.parentElement, anchor: elt, props: {
            width: elt.getAttribute('width'),
            height: elt.getAttribute('height'),
            scale: elt.getAttribute('scale'),
            datum: groups.simplyConn(groups.rootSystems[elt.getAttribute('datum')]),
        }})
        elt.remove()
    })
</script>

# Euclidean root systems



## Orthogonal reflections {#reflections}

A [Euclidean space] is a finite-dimensional real vector space $V$ equipped with an [inner product] $(-, -) \colon V \times V \to \bbR$ (a symmetric positive-definite bilinear form). Given any hyperplane $H \subseteq V$ and vector $v$, the inner product defines an [orthogonal reflection] of $v$ over $H$, by travelling from $v$ to $H$ along the shortest path, and then travelling that distance again. The inner product can also define the hyperplane $H$ as the kernel of the map $v \mapsto (\alpha, v)$ for some fixed vector $\alpha \in V$, in which case we use the notation $H_\alpha$ for the hyperplane.

The following diagram shows the situation in two dimensions, with the vector $\alpha$ defining the hyperplane $H_\alpha$, and $s_\alpha \colon V \to V$ the reflection-over-$H_\alpha$ operator. [Try moving $\alpha$ and $v$ and see how the diagram changes.]

<figure id="ReflectionDemonstration" class="row"></figure>


As illustrated in the diagram, the formula for the reflection $s_\alpha$ is $s_\alpha(v) = v - 2 \frac{(v, \alpha)}{(\alpha, \alpha)}$.

## The rank 1 and 2 root systems {#rootsystems}

A Euclidean root system is a finite set $\Phi$ of nonzero vectors inside a Euclidean space $(V, (-, -))$, which satisfy the two additional properties:

1. ([Reflection invariance]) We have $s_\alpha(\Phi) = \Phi$ for all $\alpha \in \Phi$, and
2. ([Crystallographic]) For every pair $\alpha, \beta \in \Phi$, the number $2 \frac{(\alpha, \beta)}{\alpha, \alpha}$ is an integer.

The vectors in $\Phi$ are called [roots], while $\dim (\span_\bbR \Phi)$ is called the [rank] of the root system.


There are exactly two rank-1 root systems. The $A_1$ root system consists of $\{\pm \alpha\}$ for any nonzero vector $\alpha \in V$, and the $BC_1$ root system consists of $\{\pm \alpha, \pm 2 \alpha\}$.

<figure class="row">
  <figure class="col">
    <RootSystem width="200" height="50" scale="50" datum="A1"></RootSystem>
    <figcaption>$A_1$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="50" scale="50" datum="BC1"></RootSystem>
    <figcaption>$BC_1$</figcaption>
  </figure>
</figure>

A simple application of the crystallographic property shows that if $\alpha$ is a root, then the only multiples of $\alpha$ which could also be roots are $\pm \frac{1}{2} \alpha$, $\pm \alpha$, or $\pm 2 \alpha$, and so indeed $BC_1$ is as complicated as a rank 1 system could get. We call a root $\alpha \in \Phi$ [divisible] if $\frac{1}{2} \alpha$ is also a root, and [indivisible] otherwise. The root system $A_1$ is called [reduced], meaning that every root is indivisible, while the root system $BC_1$ is [non-reduced].

Rank 2 root systems are where the geometry starts getting interesting. There are seven kinds of rank 2 root systems, four of which are reduced. All of these except for $A_2$ and $G_2$ are constructed in the Euclidean space $\bbR^2$, while $A_2$ and $G_2$ are constructed in the plane $Z \subseteq \bbR^3$ defined by $x_1 + x_2 + x_3 = 0$. [Move your mouse over the roots to see their coordinates.]

<figure class="row">
  <figure class="col">
    <RootSystem width="200" height="200" scale="40" datum="A1xA1"></RootSystem>
    <figcaption>$A_1 \times A_1$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="200" scale="40" datum="A1xBC1"></RootSystem>
    <figcaption>$A_1 \times BC_1$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="200" scale="40" datum="BC1xBC1"></RootSystem>
    <figcaption>$BC_1 \times BC_1$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="200" scale="50" datum="A2"></RootSystem>
    <figcaption>$A_2$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="200" scale="50" datum="B2"></RootSystem>
    <figcaption>$B_2$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="200" scale="40" datum="G2"></RootSystem>
    <figcaption>$G_2$</figcaption>
  </figure>
  <figure class="col">
    <RootSystem width="200" height="200" scale="50" datum="BC2"></RootSystem>
    <figcaption>$BC_2$</figcaption>
  </figure>
</figure>


The root systems $A_1 \times A_1$, $A_1 \times BC_1$, and $BC_1 \times BC_1$ are called [reducible] because we can decompose the ambient space into two orthogonal subspaces, each containing a part of the root system. The other root systems $A_2$, $B_2$, $G_2$ and $BC_2$ are called [irreducible] since they cannot be decomposed in this way. (Be careful not to confuse "reduced" with "irreducible"). The rank 2 root systems which are both reduced and irreducible are $A_2$, $B_2$, and $G_2$.


## Building a root system {#builder}

It is not difficult to prove that the only rank 2 root systems are those shown above. In order to give some intuition for this problem, here is a game where the goal is to build a rank 2 root system.

<!-- <figure id="BuilderGame"></figure>

<script>
    new myapp.BuilderGame({target: document.getElementById('BuilderGame'), hydrate: true});
</script> -->


## Positive and simple systems {#positivesystems}

[Planned for this section:]

1. Show and explain gridlines, root lattice, weight lattice.
2. Positive and simple systems
3. Coxeter and Cartan matrices
