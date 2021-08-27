---
title: Simple $\SL_2$ characters
---

<script type="module">
    import SL2Chars from './SL2Chars.svelte'

    new SL2Chars({target: document.getElementById('SL2Chars')})
</script>

<style>
    #SL2Chars { height: min(70vh, 500px); border: 1px solid black; }
</style>

The characters of irreducible representations of $\SL_2$ over a field of characteristic zero are very simple to write down: for each $\lambda \geq 0$ there is a module $\nabla_\lambda$ with character
$$
\ch \nabla_\lambda = v^{\lambda} + v^{\lambda - 2} + \cdots + v^{2 - \lambda} + v^{-\lambda}.
$$
For example, the dimension 1 irrep (the trivial representation) has character $\ch \nabla_0 = 1$, the dimension 2 irrep (the natural representation) has character $\ch \nabla_1 = v + v^{-1}$, the dimension 3 irrep (the adjoint representation) has character $\ch \nabla_2 = v^2 + 1 + v^{-2}$, and so on.

When working over a field of characteristic $p > 0$, the modules $\nabla_\lambda$ still exist but are no longer irreducible in general.
The simple modules are still parametrised by integers $\lambda \geq 0$, with $\ch L_\lambda = v^\lambda + (\text{something}) + v^{-\lambda}$.
The problem of describing the (something) is hard for general algebraic groups, but has a lovely description in the case of $\SL_2$: the $(\lambda - 2i)$-weight space in $L_\lambda$ is nonzero if and only if $\binom{n}{i} \neq 0$ modulo $p$, so
$$
\ch L_\lambda = \sum_{p \nmid \binom{n}{i} \neq 0} v^{\lambda - 2i}.
$$
It is still somewhat difficult to write down a nice *formula* for the value of $\binom{n}{i}$ modulo $p$, but these values are easy to calculate by drawing Pascal's triangle, reducing each row modulo $p$.
The diagram below shows the nonzero values of Pascal's triangle modulo any number (not just primes).
Each dot is coloured by its residue class mod $p$ (keep in mind that the colours of the dots are not relevant for the simple characters, only the dots vs the blanks).

<figure id="SL2Chars"></figure>

The prime values of $p$ give the "simplest" fractals, while composite values of $p$ look similar to the prime fractals for the factors, laid over the top of each other.

There are two "dodgy values" of $p$.
For $p = 0$ I have defined all entries to be 1, which gives the correct pattern of nonzero dots for representations over a field of characteristic zero, but the wrong values of the binomial coefficients.
This is partly for implementation reasons: the values of binomial coefficients grow quite fast, so that by row 34 the values start exeeding what can fit inside a 32-bit integer.

For $p = 1$ I have defined $\binom{\lambda}{0} = \binom{\lambda}{\lambda} = 1$, with $\binom{\lambda}{i} = 0$ with $0 < i < \lambda$.
This naturally falls out of how the triangle is programmed, and might be the correct "field with one element" interpretation of the simple character, but have not looked into this further.
