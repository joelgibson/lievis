---
title: Bases of $\SL_2$ characters
---

<script type="module">
    import SL2Characters from './SL2Characters.svelte'

    new SL2Characters({target: document.getElementById('SL2Characters')})
</script>

<style>
    #SL2Characters { height: min(70vh, 500px); border: 1px solid black; }
</style>

Let $G = \SL_2$ be the special linear group, defined over a field of characteristic $p > 0$.
The character ring of $\SL_2$ consists of *symmetric* Laurent polynomials $p(v)$: symmetric meaning that $p(v) = p(v^{-1})$.
There are several natural bases of this ring, each indexed by the natural numbers, which will be explained further below:

1. The *monomial* (squares) symmetric functions $m_0 = 1$ and $m_n = v^n + v^{-n}$.
2. The *Weyl* (triangles) characters $\chi(n) = \ch \Delta(n) = v^n + v^{n-2} + \cdots + v^{2-n} + v^{-n}$.
3. The *simple* (circles) characters $\ch L(n)$, where $L(n)$ is the simple module with highest weight $n$.
4. The *tilting* (stars) characters $\ch T(n)$, where $T(n)$ is the indecomposable tilting module with highest weight $n$.

The monomial functions and Weyl characters do not depend on the characteristic $p$, but the simple and tilting characters do.
The following visualisation shows the transition matrices between each of these bases.
Blue means positive multiplicity, and red means negative.
A larger absolute value of multiplicity will give a larger shape.

<figure id="SL2Characters"></figure>


## Monomial symmetric functions

Let $X$ be the character lattice, then the character of a representation is valued in $\mathbb{Z}[X]^W$, the $W$-invariant subring of the group algebra $\mathbb{Z}[W]$.
In the case of $\SL_2$, we have $X = \mathbb{Z}$, where we write the basis element of $\mathbb{Z}[X]$ corresponding to $n \in X$ as $v^n$.
The Weyl group $W = \innprod{s} \subseteq \GL_\bbZ(X)$, where $s(n) = -n$ is the reflection over the origin.
It follows that a character (i.e. a Laurent polynomial) $p \in \bbZ[X]$ is invariant under $W$ if and only if $p(v) = p(v^{-1})$.

When a group is acting on a set $X$, then the $W$-invariant subspace inside the free $\bbZ$-module with basis $X$ has an obvious basis: the sum over the orbits.
Hence we define the *monomial* symmetric functions $m_\lambda$ for any $\lambda \in X$ to be
$$ m_\lambda = \sum_{\mu \in W \lambda} v^\mu. $$
The set of all $m_\lambda$ is not linearly independent, for example in our case we have $m_{-3} = m_3 = v^3 + v^{-3}$.
We need to choose a representative from each orbit to narrow the set down to a basis.
The dominant weights
$$
X^+ = \set{\lambda \in X \mid \innprod{\alpha^\vee, \lambda} \geq 0 \text{ for all } \alpha \in \Phi^+} \subseteq X
$$
will work.
In our case, the dominant weights are exactly the natural numbers.
Hence we get our monomial basis $\{m_0, m_1, m_2, \ldots\}$.


## Weyl characters

The Weyl character $\chi(n) = \ch \Delta(n)$ is the character of a Weyl module, which coincides with the simple highest-weight module of a semisimple Lie algebra.
For $\SL_2$ the character $\chi(n)$ is quite simple, starting at $v^n$ and hopping down by $2 = \alpha$ each time until reaching $v^{-n}$:

$$
\chi(n) = v^{n} + v^{n - 2} + \cdots + v^{2-n} + v^{-n}.
$$

The reader may also know this character either by the Weyl character formula, or as a symmetric quantum integer:

$$
\chi(n) =
\frac{\sum_{w \in W} (-1)^w v^{w(n + \rho)}}{\sum_{w \in W} (-1)^w v^{w \rho}}
=
\frac{v^{n + 1} - v^{-n -1}}{v - v^{-1}}
=
[n+1]_v.
$$

One fact we will need about the Weyl characters is that the expression $\chi(n)$ makes sense for $n < 0$, and furthermore satisfies $\chi(-1) = 0$ and $\chi(n) = -\chi(s \bullet n)$ for the simple reflection $s$, where $\bullet$ denotes the shifted group action
$$ w \bullet \lambda = w(\lambda + \rho) - \rho,$$
where $\rho = 1$ is the sum of the fundamental weights.


## Simple characters

The simple module $L(n)$ depends on the characteristic $p$, and can be defined as the head of the Weyl module $\Delta(n)$, or as the socle of the induced module $\nabla(n)$.
It is usually difficult to write down the characters of the simple modules in characteristic $p > 0$, but for $\SL_2$ we can do it.
The simple characters $\ch L(n)$ are determined by the residues of binomial coefficients modulo $p$: we have that $v^{n - i \alpha}$ appears in $\ch L(n)$ if and only if $\binom{n}{i}$ is nonzero modulo $p$.

One way to see this is to calculate the Shapovalov form on the highest-weight module $\Delta(n)$: on the $n - i\alpha$ weight space, the form evaluates as $\binom{n}{i}$.
The radical of this form gives the maximal submodule of $\Delta(n)$ (this is not obvious!), and the result follows.


## Tilting characters

Even less obvious than the characters of simples in characteristic $p$ are the characters of the tilting modules.
We have that $T(n) = \Delta(n)$ for $0 \leq n < p$ (i.e for $n \in \overline{C}_\mathbb{Z}$, this is almost "for free"), and then an $\SL_2$-specific calculation shows that $\ch T(n) = \chi(n) + \chi(t^{(1)} \bullet n)$ for $p \leq n < 2p - 1$, where $t^{(1)}$ is the $p$-dialated affine simple reflection, i.e. $t^{(1)}$ is the affine reflection over the hyperplane through $p$, and $\bullet$ is the $\rho$-shifted action as above.

After this, the rest of the tilting character table can be filled out by using the Donkin tilting tensor product theorem, which states that for $\lambda \in X_1 + (p - 1)\rho$ and any other dominant weight $\mu$ we have $T(\lambda + p \mu) = T(\lambda) \otimes T(\mu)^{(1)}$. (This theorem is somewhat remarkable because the Frobenius twist of a tilting module is not tilting!).

For example, suppose we want to determine $T(10)$ for $p = 3$.
First we subtract $p - 1$ to get $8$, then write $8$ in its base-3 form $22_3$, then add $p-1$ back on to get $10 = 24_3$.
This means that we have $10 = 4 + 2p$, and $p-1 \leq 4 \leq 2p - 2$, so we can apply the Donkin tensor product formula: we need to know $\ch T(4) = \chi(4) + \chi(0)$ and
$$\ch T(2)^{(1)} = \chi(2)^{(1)} = (v^2 + 1 + v^{-2})^{(1)} = v^6 + 1 + v^{-6}.$$
One can multiply $\chi$'s and $v$'s by $\chi(a) v^b = \chi(a + b)$ so long as we're multiplying by a symmetric sum of $v$'s: we have then

$$
\begin{aligned}
\ch T(10)
&= (\chi(4) + \chi(0))(v^6 + 1 + v^{-6}) \\
&= \chi(10) + \chi(-2) + \chi(4) + \chi(0) + \chi(6) + \chi(-6) \\
&= \chi(10) - \chi(0) + \chi(4) + \chi(0) + \chi(6) - \chi(4) \\
&= \chi(10) + \chi(6) \\
\end{aligned}
$$

In the case of $\SL_2$, iterating this rule allows us to get any tilting character just by knowing the first $2p - 1$ tilting characters.
