---
title: Notes on Jantzen's book
---

My own extremely terse reference notes on Jantzen's _Representations of Algebraic Groups_.

* $k$ a field
* $G = (G_\bbZ)_k$ is the extension of scalars from a split reductive algebraic group $G_\mathbb{Z}$ over the integers.
* $T \subseteq B \subseteq G$ a pinning.
* $X(T)$ character lattice.
* $R$ roots, $R^+$ positive roots, $S$ simple roots.
* (3.15) $X_r(T) = \{ \lambda \in X(T) \mid 0 \leq \langle \lambda, \alpha^\vee \rangle < p^r \text{ for all } \alpha \in S\}$. We have $X_1(T) \subseteq X_2(T) \subseteq \cdots \subseteq X(T)_+$.

## Induced modules and simple modules

* For $\lambda \in X(T)$ write $k_\lambda$ for the one-dimensional $B$-module with character $e^\lambda$.
* Define $H^i(\lambda) = R^i \operatorname{ind}_B^G(k_\lambda)$, the right derived induction functor. (We could have defined this for any $B$-module). Note $H^0(\lambda) = \operatorname{ind}_B^G(k_\lambda)$.
* The _induced module_ $H^0(\lambda)$, if it is nonzero, has a one-dimensional highest weight space of weight $\lambda$, and weights lying between $w_0 \lambda$ and $\lambda$.
* If nonzero, it has a simple socle, which we call $L(\lambda)$.
* If nonzero, then $L(\lambda) \cong L(- w_0 \lambda)^*$.
* $H^0(\lambda)$ is nonzero precisely for the dominant weights $\lambda \in X(T)_+$.
* For $\lambda$ dominant, the multiplicity of $L(\lambda)$ in $H^0(\lambda)$ is 1, and they share the highest-weight space.
* Define the _Weyl module_ $V(\lambda) = H^0(-w_0 \lambda)^*$. Then $V(\lambda)$ and $H^0(\lambda)$ have the same character, and the $V(\lambda)$ are the universal highest weight modules, as in they map onto any highest-weight module.

## Irreducible representations of Frobenius kernels

* (3.16) Steinberg inductive rule: if $\lambda \in X_r(T)$ and $\mu \in X(T)_+$, then $L(\lambda + p^r \mu) \cong L(\lambda) \otimes L(\mu)^{[r]}$.
* (3.17) Steinberg tensor product rule: write (non-uniquely) $\lambda = \sum_{i \geq 0} p^i \lambda_i$ for $\lambda_i \in X_1(T)$. Then $L(\lambda) = L(\lambda_0) \otimes L(\lambda_1)^{[1]} \otimes L(\lambda_2)^{[2]} \otimes \cdots$

## Kempf's vanishing theorem

* For $\lambda$ dominant, $H^i(\lambda) = 0$ for $i > 0$.

## BWB and Weyl Character Formula

* (1.5) Recall $\rho$ is half the sum of the positive roots. It's not clear that $\rho$ is in the weight lattice $X(T)$, however $2 \rho$ is a root and is therefore in the weight lattice. Since $\langle \rho, \beta^\vee \rangle = 1$ for all simple coroots $\beta^\vee$, we have that $s_\beta \rho - \rho$ is again in the root lattice.
* (5.1) The _dot action_ $w \bullet \lambda = w(\lambda + \rho) - \rho$, by the discussion above, maps $X(T)$ into itself.
* (5.4a) For $\lambda \in X(T)$, if $\langle \lambda, \alpha^\vee \rangle = -1$ for some simple $\alpha \in S$, then $H^\bullet(\lambda) = 0$.
* (5.5) If $p = 0$, set $\overline{C}_\mathbb{Z} = \{ \lambda \in X(T) \mid 0 \leq \langle \lambda + \rho, \beta^\vee \rangle \text{ for all } \beta \in R^+\}$
* (5.5) If $p > 0$, set $\overline{C}_\mathbb{Z} = \{ \lambda \in X(T) \mid 0 \leq \langle \lambda + \rho, \beta^\vee \rangle \leq p \text{ for all } \beta \in R^+\}$
* (5.5a) If $\lambda \in \overline{C}_\mathbb{Z}$ and $\lambda \notin X(T)_+$, then $H^\bullet(w \bullet \lambda) = 0$ for all $w \in W$. This follows immediately from (5.4a) and the definition of $\overline{C}_\mathbb{Z}$.
* (5.5b) If $\lambda \in \overline{C}_\mathbb{Z} \cap X(T)_+$, then the Borel-Weil-Bott identity holds: $H^i(w \bullet \lambda) \cong H^0(\lambda)$ if $i = l(w)$ and $H^i(w \bullet \lambda) = 0$ otherwise. In characteristic zero this is precisely the Borel-Weil-Bott theorem.
* (5.6) For all $\lambda \in X(T)_+ \cap \overline{C}_\mathbb{Z}$, we have $L(\lambda) = H^0(\lambda)$. We also have that there are no exts between $L(\lambda)$ and $L(\mu)$ for $\lambda, \mu$ in the fundamental dominant alcove $\overline{C}_\mathbb{Z} \cap X(T)_+$, applying this in characteristic 0 gives semisimplicity of $\mathsf{Rep}_G$.
* (5.7) Define the Euler characteristic $\chi(\lambda) = \sum_{i \geq 0} (-1)^i \operatorname{ch} H^i(\lambda)$ (we could have defined this for an arbitrary $B$-module rather than $k_\lambda$).
* (5.7) By Kempf's vanishing theorem, $\chi(\lambda)$ is the character of $H^0(\lambda)$ whenever $\lambda$ is dominant.
* (5.7) The long exact sequence of derived functors gives that if $0 \to M' \to M \to M'' \to 0$ is exact, then $\chi(M) = \chi(M') + \chi(M'')$.
* (5.7) The generalised tensor identity gives that $\chi(V \otimes M) = \operatorname{ch}(V) \chi(M)$ for any $G$-module $V$.
* (5.8) After realising that the characters of the $\{L(\lambda) \mid \lambda \in X(T)_+ \}$ or that the characters of the $\{H^0(\lambda) \mid \lambda \in X(T)_+ \}$ form a basis for $\mathbb{Z}[X(T)]^+$, the generalised tensor identity then gives that for all $\lambda \in X(T)$ and symmetric $\sum_{\mu} a_\mu e^\mu \in \mathbb{Z}[X(T)]^W$, we have that $\chi(\lambda) \sum_\mu a_\mu e^\mu = \sum_\mu a_\mu \chi(\lambda + \mu)$.
* (5.9) We have $\chi(w \bullet \lambda) = \det(w) \chi(\lambda)$ for all $\lambda \in X(T)$ and $w \in W$.
* (5.9) For $\lambda \in X(T) \otimes \mathbb{Q}$ define the formal character $A(\lambda) = \sum_{w \in W} \det(w) e^{w \lambda}$. Note $w A(\lambda) = \det(w) A(\lambda)$.
* (5.10) The _Weyl character formula_: for all $\lambda \in X(T)$ we have $\chi(\lambda) = A(\lambda + \rho) / A(\rho)$.
* (5.11) Combining (5.10) with previous results gives $\operatorname{ch} V(\lambda) = \operatorname{ch} H^0(\lambda) = \chi(\lambda) = A(\lambda + \rho) / A(\rho)$.

We have the following rules for working with the $\chi(\lambda)$.

1. For any $\lambda$, we may write $\chi(\lambda)$ in the standard basis by applying the Weyl character formula (5.10), or by using the Demazure character formula.
2. We can always replace a $\chi(\lambda)$ by either $0$ or, $\chi(\mu)$ where $\mu$ is dominant. To do this, we see that (5.4a) gives that if $\langle \lambda + \rho, \alpha^\vee \rangle = 0$ (i.e. $\lambda$ is fixed by some $\rho$-shifted simple reflection) then $\chi(\lambda) = 0$. Otherwise, we have by (5.9) that $\chi(\lambda) = \det(w) \chi(w \bullet \lambda)$ and we choose $w$ such that $w \bullet \lambda$ is dominant.
3. We can multiply $\chi$ by any symmetric character in the standard basis using (5.8). Note the terms on the right side will not be linearly independent, and there will be cancellation once the $\chi(\lambda + \mu)$ have been orbited under $\bullet$ to make them dominant.

So we already have a way of computing tensor product characters for the Weyl/induced modules, e.g. to compute $\operatorname{ch} (V(\lambda) \otimes V(\mu))$, do the following:

1. Expand $\chi(\lambda) = \sum_{\nu} a_\nu e^\nu$ using the Weyl/Demazure character formula.
2. Apply (5.8) to get $\chi(\lambda) \chi(\mu) = \sum_\nu a_\nu \chi(\nu + \mu)$.
3. Rewrite the terms in the above sum to make all of the arguments to $\chi$ dominant. This will add signs or kill terms, in the end we will have a linear combination of $\chi(-)$ with only dominant arguments.

## 6. The Linkage Principle

* (6.1) Affine reflections: for $\beta \in R$ and $r \in \mathbb{Z}$, set $s_{\beta, r} (\lambda) = s_\beta(\lambda) + r \beta$. Alternative formula is $s_{\beta, r}(\lambda) = \lambda - (\langle \lambda, \beta^\vee \rangle - r) \beta$.
* (6.2) $W_p$ acts on $X(T) \otimes \mathbb{R}$ and defines a system of "facets". A _facet_ $F$ for $W_p$ is defined by a decomposition $R^+ = R_0^+(F) \sqcup R_1^+(F)$ and some integers $n_\alpha$, as the set of all $\lambda \in X(T) \otimes \mathbb{R}$ satisfying $\langle \lambda + \rho, \alpha^\vee \rangle = n_\alpha p$ for all of the $\alpha \in R_0^+$, and $(n_\alpha - 1)p < \langle \lambda + \rho, \alpha^\vee \rangle < n_\alpha p$ for all $\alpha \in R_1^+$. If the set $F \subseteq X(T) \otimes \mathbb{R}$ determined by this is empty, it's not a facet.
* (6.3) $\Sigma = \Sigma(C)$ the set of all reflections $s_F$ in the $p$-dialated affine Weyl group where $F$ is a wall of $C$, where $C$ is the standard alcove
* (6.3) $\Sigma$ can be described explicitly: it consists of $s_\alpha$ for all simple roots $\alpha \in S$, and all $s_{\beta, p}$ where $\beta$ is the highest short root of an irreducible component of $R$.
* The _closure_ of a facet is its usual closure in $\mathbb{R}^n$, replacing both the strict inequality signs above with $\leq$. The _upper closure_ is what we get when we replace only the second inequality: $(n_\alpha - 1)p < \langle \lambda + \rho, \alpha^\vee \rangle \leq n_\alpha p$
* A facet which is open in $X(T) \otimes \mathbb{R}$ is called an *alcove*.
* $C = \{ \lambda \mid 0 < \langle \lambda + \rho, \alpha^\vee \rangle < p \} \subseteq X(T) \otimes \mathbb{R}$ is the *standard alcove*.

## 7. The Translation Functors

Assume that $p > 0$. We know our category breaks into blocks, where the block $\mathcal{M}_\mu$ consists of all modules having composition factors in the same linkage class as $\mu$ (in the orbit $W_p \bullet \mu$). Usually $\overline{C}_\mathbb{Z}$ is the choice of representatives for the linkage classes.

* There are some functors $T_\lambda^\mu: \mathcal{M}_\lambda \to \mathcal{M}_\mu$.
* The $T_\lambda^\mu$ are an equivalence of categories if $\lambda, \mu$ belong to the same facet.
* (7.12) Recall $\Sigma = \Sigma(C)$ from (6.3).
* (7.17a) Let $\lambda, \mu \in \overline{C}_\mathbb{Z}$ and $w \in W_p$ such that $w \bullet \lambda$ is dominant. Suppose also that $\mu$ belongs to the **upper closure** of the facet containing $w \bullet \lambda$. Then for all $w_1 \in W_p$ and $i \in \mathbb{N}$ we have $[H^i(w_1 \bullet \lambda) : L(w \bullet \lambda)] = [H^i(w_1 \bullet \mu) : L(w \bullet \mu)]$.
* (7.17b) With the same conditions as the previous point, if $\operatorname{ch} L(w \bullet \lambda) = \sum_{w' \in W_p} a_{w, w'} \chi(w' \bullet \lambda)$, then $\operatorname{ch} L(w \bullet \mu) = \sum_{w' \in W_p} a_{w, w'} \chi(w' \bullet \mu)$.
* (7.18) For $\lambda \in C \cap X(T)$ and $w \in W_p$ and $s \in \Sigma$ such that $w \bullet \lambda < ws \bullet \lambda$, then $[H^i(w_1 \bullet \lambda) : L(w \bullet \lambda)] = [H^i(w_1 s \bullet \lambda : L(w \bullet \lambda))]$ for all $w_1 \in W_p$ and $i \in \bbN$.


## Filtrations of Weyl modules

Assume that $p > 0$. Throughout this chapter we are working with reduction modulo $p$, so we have some notation for dealing with that.

* Let $A$ be a Dedekind domain, $\Pi (A)$ the max spectrum, $K$ its field of fractions.
* For $\mathfrak{p} \in \Pi (A)$, let $\nu_\mathfrak{p}: A \setminus \{0\} \to \mathbb{N}$ be the $\mathfrak{p}$-adic valuation, meaning that for nonzero $a \in A$, we have $\nu_\mathfrak{p}(a) = r$ if $a \in \mathfrak{p}^r$ and $a \notin \mathfrak{p}^{r + 1}$.
* Define $\nu_p$ to be the valuation $\nu_p = \nu_{p\mathbb{Z}}$ when $A = \mathbb{Z}$.
* For each dominant $\lambda \in X(T)_+$, there exists a filtration $V(\lambda) = V(\lambda)^0 \supseteq V(\lambda)^1 \supseteq \cdots$ of the Weyl module $V(\lambda)$, such that $V(\lambda) / V(\lambda)^1$ is the simple module $L(\lambda)$ and $\sum_{i > 0} \operatorname{ch} V(\lambda)^i =  \sum_{\alpha \in R^+} \sum_{0 < mp < \langle \lambda + \rho, \alpha^\vee \rangle} \nu_p(mp) \chi(s_{\alpha, mp} \bullet \lambda)$.
* Note that there is _no alternation_ in the sum on the left. So if the above sum is zero, we have $V(\lambda) \cong L(\lambda)$. If the sum comes out as the character of a simple, that implies that $V(\lambda)^2 = 0$ and $V(\lambda)^1$ is that simple, and $V(\lambda)$ has precisely two composition factors.

## Computing simple characters in rank 2

Write $\ell(\lambda) = \operatorname{ch} L(\lambda)$ from now on. The sets $\{ \ell(\lambda) \mid \lambda \in X(T)_+ \}$, $\{\chi(\lambda) \mid \lambda \in X(T)_+ \}$ give different bases for the symmetric character ring $\mathbb{Z}[X(T)]^W$. Furthermore

* We can compute all of the $\chi(\lambda)$ in the standard basis $e^\lambda$, via the Demazure character formula or the Weyl character formula.
* The change-of-basis between the $\chi$ and $\ell$ is triangular, since if $L(\lambda)$ appears as a composition factor of $H^0(\mu)$ then $w_0 \mu \leq \lambda \leq \mu$.
* It seems at first glance that the Jantzen filtration gives a formula of the form $\chi(\lambda) - \ell(\lambda) = \sum_{\mu} a_\mu \chi(\mu)$, however this is not true because we will most likely be overcounting the composition factors $V(\lambda)^2, V(\lambda)^3, \ldots$.

## Other assorted notes

- The [coxeter number]{.defn} is $1 + \sum_i m_i$, where $\beta = \sum_i a_i \alpha_i$ is the highest root.
