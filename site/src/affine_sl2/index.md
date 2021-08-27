---
title: Affine SL2
description: A comparison of the root versus weight space in the adjoint realisation of affine SL2.
---

<script type="module">
    import AffineSL2 from './AffineSL2.svelte'

    new AffineSL2({target: document.getElementById('AffineSL2')})
</script>

Let $V$ be the geometric representation of the $\widetilde{A}_2$ root system, with basis the two simple roots $\set{\alpha_1, \alpha_2}$ with $\alpha_2$ the affine root. A convenient alternative basis is $\set{\alpha_1, \delta}$ with $\delta = \alpha_1 + \alpha_2$ the "null root" (not actually a root, just a member of the root lattice). $\delta$ is null in the sense that $\innprod{\alpha^\vee, \delta} = 0$ for all coroots $\alpha^\vee$.

The $W$-orbit of the simple roots is the root system $\Phi \subseteq V$, shown below on the right. The horizontal axis is the hyperplane where the finite roots $\set{\pm \alpha_1}$ live, and the vertical axis is along the null root $\delta$. Whenver a root $\beta$ is selected, its reflecting hyperplane $H_\beta = \set{\mu \in V^* \mid \innprod{\mu, \beta} = 0}$ is shown on the left in red.

In the dual space $V^*$, the coroots $\alpha_1^\vee$ and $\alpha_2^\vee$ are linearly dependent ($\alpha_1^\vee + \alpha_2^\vee = 0$) and so the $W$-action does not generate a root system, but instead of roots we have chamber geometry. Define the fundamental chamber $C = \set{\mu \in V^* \mid \innprod{\mu, \alpha_i} > 0 \text{ for } i=1,2}$, then the $W$-orbit of $C$ is a convex cone $\cC$ called the _Tits cone_, which in this case is the upper half-plane. The chamber $C$ is a fundamental domain for the action of $W$ on $\cC$. By intersecting each $wC$ with the hyperplane $\innprod{-, \delta} = 1$ (written as the equation "$\delta = 1$" for short), we obtain the alternative picture of $W$ as a group of affine reflections acting on the line $\delta = 1$.

The dual space $V^*$ is shown on the left, in the basis dual to $(\alpha_1, \delta)$. Whenever a chamber $wC$ is selected, the root inversion set $\Phi^+(w) = \set{\beta \in \Phi^+ \mid w(\beta) < 0}$ is shown circled on the right on the right. The element $w \alpha_1$ is shown on the right with a light green background. Since every element of $W$ fixes $\bbR \delta$ pointwise, knowing $w \alpha_1$ is enough to determine the action of $w$ on $V$.

<div id="AffineSL2"></div>


## Coordinates

Declare $V$ to be the vector space with basis $(\alpha_1, \alpha_2)$ of simple roots (so the simple roots are linearly independent by definition), then the simple coroots $(\alpha_1^\vee, \alpha_2^\vee)$ are the unique vectors in $V^*$ so that their pairing with the simple roots gives the Cartan matrix of affine $\SL_2$:
$$
\alpha_1^\vee, \alpha_2^\vee \in V^* \text{ satisfy } \innprod{\alpha_i^\vee, \alpha_j^\vee} = a_{ij}, \text{ where } [a_{ij}] = \begin{pmatrix}2 & -2 \\ -2 & 2 \end{pmatrix}.
$$
The simple coroots will be linearly independent if and only if the Cartan matrix $[a_{ij}]$ has full rank, so in this case the simple coroots are dependent. We also get the uniquely determined *fundamental coweights* $\Lambda_1^\vee, \Lambda_2^\vee \in V^*$ by requiring the condition $\innprod{\Lambda_i^\vee, \alpha_j} = \delta_{ij}$. The fundamental coweights are linearly independent, because the matrix $[\delta_{ij}]$ has full rank. Finally note that in this realisation, we cannot define the fundamental weights, since the simple coroots are linearly dependent which is incompatible with the condition $\innprod{\alpha_i^\vee, \Lambda_j} = \delta_{ij}$.

What we have constructed is called the _adjoint_ realisation of affine $\SL_2$: if we were to define a Kac-Moody group using $V = \mathfrak{h}_\bbR$ as the Cartan and $V^* = \mathfrak{h}^*_\bbR$ as the dual Cartan, we would end up with a group of _adjoint type_. By switching the roles of $V$ and $V^*$, we would have the _simply-connected_ realisation.

*Aside:* In the standard construction of Kac-Moody algebras, neither the adjoint nor simply-connected realisations are used. Instead, (in the case of an affine algebra) the dimension of $V$ is enlarged by 1, which gives enough "room" so that the simple roots and simple coroots can be embedded so that both are linearly independent. This means that both the simple coweights and simple weights are defined, and one gets a proper root system and chamber geometry on _both_ sides of the realisation, rather than just on one. If one is only wanting to study the underlying Coxeter group (rather than constructing Kac-Moody groups), then looking at the adjoint realisation is enough, and all the standard root system results apply in this smaller case.

After construction, it is helpful to change basis to $(\alpha_1, \delta)$ where $\delta = \alpha_1 + \alpha_2$ is the null root, so the affine root $\alpha_2 = \delta - \alpha_1$. In general, the coefficients of $\delta$ are the coefficients of a minimal integral linear dependence in the columns of the Cartan matrix $A$, so $\delta$ is a canonical coordinate for any affine algebra. Both simple reflections fix $\bbR \delta$ pointwise, and on $\alpha_1$ we have $s_1(\alpha_1) = - \alpha_1$ and $s_2(\alpha_1) = 2\delta - \alpha_1$. In terms of matrices in the $(\alpha_1, \delta)$-basis,
$$
[s_1] = \begin{pmatrix} -1 & 0 \\ 0 & 1 \end{pmatrix}, \quad
[s_2] = \begin{pmatrix} -1 & 0 \\ 2 & 1 \end{pmatrix}.
$$

To calculate inversion sets, we are using the fact that if $l(sw) > l(w)$ then $\Phi^+(sw) = \Phi^+(w) \cup \set{w^{-1} \alpha_s}$.
