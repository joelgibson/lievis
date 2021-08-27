---
title: Representations of Rank 2 Reductive Groups
created: 2020-01-24
updated: 2021-07-01
---

<script type="module">
    import WeylCharacters from './WeylCharacters.svelte'
    import WeylOrbits from './WeylOrbits.svelte'
    import JantzenFiltration from './JantzenFiltration.svelte'
    import SimpleCharacters from './SimpleCharacters.svelte'

    new WeylCharacters({target: document.getElementById('WeylCharacters')})
    new WeylOrbits({target: document.getElementById('WeylOrbits')})
    new JantzenFiltration({target: document.getElementById('JantzenFiltration')})
    new SimpleCharacters({target: document.getElementById('SimpleCharacters')})
</script>

<style>
    section > figure {
        height: min(90vh, 800px);
    }
</style>

A set of **interactive visualisations** of concepts in the representation theory of algebraic groups.

Most of the explanations here are very high-level, since I wrote them as I was following along the book *Representations of algebraic groups* by Jantzen. I have some very terse [notes](notes.html) on the parts that were needed for this.


## Weyl characters {#weylcharacters}

Fix a pinning $T \subseteq B \subseteq G$ of a reductive group $G$ so that we can talk about the weight lattice $X(T) = \Hom(T, \bbG_m)$. For each weight $\lambda \in X(T)$ there is a natural way of constructing a $G$-module via induction: let $k$ be the base field and denote by $k_\lambda$ the one-dimensional $B$-representation with weight $\lambda$, then we say that $H^0(\lambda) := \ind_B^G(k_\lambda)$ is the [induced module]{.defn} for weight $\lambda$. (Ignore the strange notation $H^0$ for a moment). It turns out that the induced module is nonzero precisely when $\lambda$ is a dominant weight, and in this case we define the [Weyl module]{.defn} $V(\lambda) = H^0(- w_0 \lambda)^*$ and the [Weyl character]{.defn} $\chi(\lambda) = \ch H^0(\lambda) = \ch V(\lambda)$.

There is a way to extend the definition of $\chi(\lambda)$ to non-dominant $\lambda$. Since the induction functor $\ind_B^G \colon B\dashmod \to G\dashmod$ is left exact, we can form its right derived functors $H^i(\lambda) := R^i \ind_B^G(k_\lambda)$. Note that $H^0(\lambda) = \ind_B^G(k_\lambda)$ is the induced module, explaining the strange notation choice from the previous paragraph. We then may define $\chi(\lambda)$ for any $\lambda \in X(T)$ by taking an alternating sum across all of the derived functors: $\chi(\lambda) = \sum_{i \geq 0} (-1)^i \ch H^i(\lambda)$. This agrees with the previous definition by Kempf's vanishing theorem, which states that $H^i(\lambda) = 0$ for $i > 0$ and dominant $\lambda$.

The following visualisation shows the Weyl character of the selected weight. The blue dots show positive contributions, while the orange dots show negative contributions. The larger the dot, the larger the magnitude of the contribution. You can pan by [clicking and dragging]{.instructions}, and zoom by [holding shift and scrolling]{.instructions}. You can [click once]{.instructions} to freeze a weight in place, and [double-click anywhere else]{.instructions} to unfreeze.

<figure id="WeylCharacters"></figure>

The computation of each Weyl character is done using the Demazure character formula (which works without modification for non-dominant weights). For each simple root $\alpha \in S$, the [isobaric Demazure operator $\pi_\alpha$]{.defn} is a linear endomorphism on the space $\bbZ[X(T)]$ of characters, defined as the following geometric series:
    $$ \pi_\alpha(e^\lambda) = \frac{e^\lambda - e^{s_\alpha \lambda - \alpha}}{1 - e^{-\alpha}}.$$
There are essentially three cases in the expansion, depending on whether $\innprod{\lambda, \alpha^\vee}$ is greater than, less than, or equal to $-1$. You can look at the effect of the $\pi_\alpha$ operator by switching the visualisation above to show Demazure characters. It might be handy to also turn on the "Show Weyl orbit" option...


## Orbits under the (Affine) Weyl group {#weylorbits}

The Weyl group $W$ associated to a root system $\Phi$ consists of all reflections over the hyperplanes $H_\alpha = \ker \innprod{-, \alpha^\vee}$ where $\alpha$ is a root. Another group which often arises is the $p$-dialated [affine Weyl group]{.defn}, consisting of all reflections over the hyperplanes $H_{\alpha, p} = \ker(\innprod{-, \alpha^\vee} - p)$. There are two different actions of the (affine) Weyl group of interest to us: the usual action just stated, and the [$\rho$-shifted]{.defn} action $w \bullet \lambda = w(\lambda + \rho) - \rho$, where $\rho$ is half the sum of the positive roots. Note that the $\bullet$ action depends on a choice of simple system.

In the visualisation, the groups acting are all of the form $W_p = p \bbZ \Phi \rtimes W$, where $\bbZ \Phi$ is the root lattice and $W$ is the Weyl group of the root system. Note that $W_0$ is the usual Weyl group, and $W_1$ is the affine Weyl group for the dual root system (using the Bourbaki definition of the affine Weyl group).

The thin grey lines mark the hyperplanes defined by those weights $\mu$ such that $\innprod{\mu, \alpha^\vee} \in \mathbb{Z}$ for all coroots $\alpha^\vee$. The thick black lines mark the weights where $\innprod{\mu, \alpha^\vee} = 0$, and the blue lines mark the weights where $\innprod{\mu, \alpha^\vee} \in p \bbZ$. When the $\rho$-shifted action is selected, the blue lines instead mark the weights $\mu$ where $\innprod{\mu + \rho, \alpha^\vee} \in p \bbZ$. Therefore when the shifted action is selected, the small blue chambers are the [facets]{.defn} of the $W_p \bullet$ action.

[Move your mouse]{.instructions} over the diagram to select a weight $\lambda$ (shown in green). The red points will be the orbit of the green point under the group $W_p$. [Clicking a weight]{.instructions} will freeze the selection, and [double-clicking anywhere else]{.instructions} will un-freeze the selection.

<figure id="WeylOrbits"></figure>


## The Jantzen Filtration {#jantzen}

The Jantzen filtration is a certain filtration of a Weyl module $V(\lambda)$ into $G$-modules. There is a sum which overcounts the character of the first proper submodule occuring in this filtration, and by "getting lucky" with this sum (for example, when the sum just happens to be multiplicity-free), we can compute some simple representations in positive characteristic.

Fix a dominant weight $\lambda \in X(T)_+$. Then there exists a filtration
$$
    V(\lambda) = V(\lambda)^0 \supseteq V(\lambda)^1 \supseteq V(\lambda)^2 \supseteq \cdots
$$
of the Weyl module $V(\lambda)$, such that $V(\lambda)^0 / V(\lambda)^1 \cong L(\lambda)$, and furthermore such that the sum of the characters of the filtered pieces is
$$
    \sum_{i > 0} \ch V(\lambda)^i = \sum_{\alpha \in R^+} \sum_{0 < mp < \innprod{\lambda + \rho, \alpha^\vee}} \nu_p(mp) \chi(s_{\alpha, mp} \bullet \lambda).
$$
The notation here is:

1. The characteristic of the underlying field is $p > 0$.
2. $L(\lambda)$ is the simple module with highest weight $\lambda$.
3. $\chi(\lambda)$ is the Weyl character for the weight $\lambda$. Even though the $\lambda$ appearing in the sum are not dominant, we can use $\chi(w \bullet \lambda) = \det(w) \chi(\lambda)$ to restate the sum in terms of dominant $\lambda$ – see the [reflect to dominant]{.instructions} option in the visualisation.
4. $\nu_p(a)$ is the largest $n$ such that $p^n \mid a$.
5. $s_{\alpha, mp}$ is the affine reflection in the hyperplane $\innprod{-, \alpha^\vee} = mp$, or alternatively $\lambda \mapsto s_\alpha(\lambda) + mp \alpha$. (Note that this appears in the formula with the $\bullet$ action, not as just written).


The visualisation below shows the various terms $\chi(\mu)$ appearing in the sum $\sum_{i > 0} \ch V(\lambda)^i$. You can pan by [clicking and dragging]{.instructions}, and zoom by [holding shift and scrolling]{.instructions}. You can [click once]{.instructions} to freeze a weight in place, and [double-click anywhere else]{.instructions} to unfreeze.

<figure id="JantzenFiltration"></figure>

Since $V(\lambda) / V(\lambda)^1 \cong L(\lambda)$ and $\ch V(\lambda)$ is known, a formula for the character of the first proper submodule $V^1(\lambda)$ would give a formula for the character of $L(\lambda)$. Unfortunately, the sum above overcounts:
    $$ \begin{aligned}
        \ch V(\lambda)^1 &= \ch V^1 / V^2 + \ch V^2 / V^3 + \ch V^3 / V^4 + \cdots \\
        \sum_{i > 0} \ch V(\lambda)^i &= \ch V^1 / V^2 + 2 \ch V^2 / V^3 + 3 \ch V^3 / V^4 + \cdots
    \end{aligned}$$
However, if (for example) the sum $\sum_{i > 0} \ch V(\lambda)^i$ happened to be multiplicity-free when decomposed into sums characters of simple $G$-modules, then we would know that everything is concentrated in the first term $\ch V^1 / V^2$, and hence multiplicity-free sums give the actual character of $V^1(\lambda)$. This works to determine all simple characters in types $A_2$ and $B_2$, and most in type $G_2$, as is shown in the next section. (See the section on [sticking points](#stickingpoints) for some examples of where I can't yet pull enough information out of the Jantzen filtration to determine characters.


## Characters of simple modules {#simples}

Let $T \subseteq B \subseteq G$ be a pinned reductive group defined over a field $k$ of characteristic $p > 0$, and $\lambda \in X(T)_+$ a dominant weight. A major open problem is to determine a character formula for the simple module $L(\lambda)$. For the groups of type $A_2$ and $B_2$, all simple characters can be computed using standard facts and the Jantzen filtration, and the same tactic _almost_ works for $G_2$. The following visualisation shows various ways of looking at the simple characters for these groups.

Selecting [simples in terms of Weyls]{.instructions} will show the coefficients of the expansion $L(\lambda) = \sum_{\mu} c_\mu \chi(\mu)$, which is the most performant as there is the least amount of work to do computationally. Selecting [Weyls in terms of simples]{.instructions} will show the coefficients the other way around, of the expansion $\chi(\lambda) = \sum_{\mu} b_\mu \ch L(\mu)$. This has some nasty behaviour as the weights get large (inverting the upper triangular matrix requires incredibly large numbers), and so this mode peters out after a while. Finally, selecting [simples in the standard basis]{.instructions} will show the honest character $L(\lambda) = \sum_{\mu} a_\mu e^\mu$ inside the group algebra $\bbZ[X(T)]$. The performance of this mode is dependent on the number of terms in the "simples in terms of Weyls" expansion.

You can pan by [clicking and dragging]{.instructions}, and zoom by [holding shift and scrolling]{.instructions}. You can [click once]{.instructions} to freeze a weight in place, and [double-click anywhere else]{.instructions} to unfreeze. [If you select an incredibly large weight while in a "slow" mode, you might have to close your browser tab and re-open it. Sorry!]{.warning}

<figure id="SimpleCharacters"></figure>

I've checked my program's output on $p$-restricted weights for $A_2$, $B_2$, and $G_2$ against tables published by Frank Luebeck, [available here](http://www.math.rwth-aachen.de/~Frank.Luebeck/chev/WMSmall/index.html?LANG=en). Any weight which is not $p$-restricted computed via the Steinberg tensor product theorem, and hopefully I have not made an error while programming that part. Any suggestions for how to check my results there would be very welcome.


## Future work {#futurework}

This is a todo list for myself in rough order of priority, for when I have time.

1. Add a more in-depth section on how the code works (also as a reference for myself). This would start of well paired with the [positive and simple systems](#positivesystems) section, since we can explicitly examine a whole bunch of stuff to do with embeddings, Cartan matrices, Dynkin diagrams, etc.
2. Clean up the visualisation code and the algebra code so that it's ready to be shown to people.
3. Add better support for groups like $GL_2$ whose rank is not equal to its semisimple rank. At the moment the code responsible for the Steinberg tensor product gives up on $GL_2$, because it doesn't know how decompose a weight into a $p$-restricted one.
4. The simple "multiplicity-free" tactic with the Jantzen filtration gives all the simple characters for $A_1$, $A_2$, $A_3$, and $B_2$, however it is not enough to get all the simple characters of $G_2$. Is there some other tactic that leverages the Jantzen filtration for all weights of $G_2$?
5. Are tilting characters easy to implement?

## Sticking points {#stickingpoints}

- Computing the decomposition of $\chi(1, 4)$ in $G_2$ with $p = 5$. The Jantzen sum evaluates as $L(0, 5) + 2 L(1, 3) + L(2, 0)$ and hence the multiplicity-free tactic does not apply. However, the formal character
  $$ \chi(1, 4) - (\ch L(0, 5) + 2 L(1, 3) + L(2, 0))$$
  has some negative terms, and so we know that actually the simple $L(1, 3)$ should only occur once, rather than twice, as a composition factor of the Weyl module. This strategy is now programmed in, and gets a few more G2 weights than previously.
- Computing the decomposition of $\chi(1, 1)$ in $G_2$ with $p = 3$. The Jantzen sum is
  $$ \chi(0, 0) + \chi(0, 1) + \chi(1, 0) = L(0, 0) + 2 L(0, 1) + L(1, 0), $$
  but unfortunately the previous strategy can't proceed further here..
- Similarly, Computing the decomposition of $\chi(1, 0, 1)$ in $A_3$ with $p = 2$. In this case, the Jantzen sum gives $2 \chi(0, 0, 0)$, and so we have two possibilities: the Weyl module $V(1, 0, 1)$ has either one or two trivial composition factors (the answer should be 1, since the simple $L(1, 0, 1)$ has a two-dimensional zero weight space according to Luebeck's tables).

<!--
## History
- 9th February, 2020. Added a strategy for computing a few more weights of G2. Fixed a crash occuring when the "Show terms of the sum" dialog is open and an unknown character for G2 is attempted to be shown. On the build side, made the site use pandoc and added [notes](notes.html) and [root data](root_data.html) into the mix.
- 24th January, 2020. First released, contains basic root systems, root system game (needs work), Weyl characters, Weyl orbits, the Jantzen filtration, and simple characters which work for A2 and B2, but not much for G2.
-->
