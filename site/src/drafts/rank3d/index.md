---
title: Rank 3 root systems
---

<script type="module">
    import {createRootVis} from './rank3d.ts'

    createRootVis('A', 3, document.getElementById('A3'))
    createRootVis('B', 3, document.getElementById('B3'))
    createRootVis('C', 3, document.getElementById('C3'))
</script>

<style>
    figure .model { width: 300px; height: 300px; }
</style>

Each of the models below can be spun and rotated with the mouse.

<figure class="row">
    <figure class="col">
        <div class="model" id="A3"></div>
        <figcaption>$A_3$</figcaption>
    </figure>
    <figure class="col">
        <div class="model" id="B3"></div>
        <figcaption>$B_3$</figcaption>
    </figure>
    <figure class="col">
        <div class="model" id="C3"></div>
        <figcaption>$C_3$</figcaption>
    </figure>
</figure>


# Generating coordinates

Internally, the machinery of LieVis can eat a Cartan matrix and return a list of roots, in either the basis of simple roots, or the basis of fundamental weights. However, the models of the root systems above are Euclidean, i.e. they are drawn in the Euclidean space whose inner product is the unique (up to positive scalar multiple) Weyl-invariant symmetric bilinear form. There are some simple steps we need to perform to transform the root basis into a Euclidean basis.

The first step is finding a matrix describing the $W$-invariant bilinear form. This is the same problem as symmetrising the Cartan matrix, i.e. scaling the rows such that the matrix becomes symmetric. For $A_3$ nothing needs to be done, however $B_3$ has two long simple roots, so two rows need to be scaled by a factor of $2$. Similarly, $C_3$ has one long simple root, so one row needs to be scaled by a factor of 2. After this, we have the so-called Gram matrices listing the inner products $[(\alpha_i, \alpha_j)]_{i, j}$ of the simple roots in the $W$-invariant inner product:

> (Gram matrices here)

As a last step we have a fairly elementary linear algebra problem: given a list of desired inner products $B = [(\alpha_i, \alpha_j)]_{i, j}$, find vectors $\alpha_i \in \bbR^3$ having those dot products. This is more-or-less some kind of matrix square root of $B$. For example, if $C$ is the unique positive-definite symmetric matrix such that $C^2 = B$, then we have $C C^T = B$ and so the rows of $C$ give a solution to this problem. However, finding $C$ requires something like the singular value decomposition. Recognising that the property we actually need from the rows of the matrix is $CC^T = B$ rather than $C^2 = B$, we can see that the [Cholesky decomposition](https://en.wikipedia.org/wiki/Cholesky_decomposition) will do just fine, and is very easy to compute. In fact, it does what we would probably do by hand: let $\alpha_1$ be the appropriate scalar multiple of $e_1$, then let $\alpha_2 = a e_1 + b e_2$ and find $a$ and $b$, etc. A highbrow way of saying this is that the Cholesky decomposition finds a basis of $\mathbb{R}^3$ which is compatible with both the Gram matrix $B$ and the standard flag $\bbR\set{e_1} \subseteq \bbR\set{e_1, e_2} \subseteq \bbR\set{e_1, e_2, e_3}$.
