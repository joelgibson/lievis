---
title: Random notes
---

These notes are all old and probably slightly incorrect, and are more just notes-to-self for while I'm programming.


# Affinisation

The process of untwisted affinisation is laid out in Kac.
We can consider this to define an "affinisation" process on a Cartan matrix of finite indecomposable type, which turns it into a Cartan matrix of affine type.
What we do is take the simple roots $\alpha_1, \ldots, \alpha_r$, and add a new "fake" simple root $\alpha_{r + 1} = -\tilde{\alpha}$ where $\tilde{\alpha}$ is the highest root.
We correspondingly add the dual root $\alpha^\vee_{r + 1} = - \tilde{\alpha}^\vee$, the negative of the corresponding coroot (alternatively, the highest short coroot).
The matrix recording the pairing $\innprod{\alpha_i^\vee, \alpha_j}_{i = 1}^{r + 1}$ is the _untwisted affine Cartan matrix_ corresponding to $A$.

Wheras the original Cartan matrix was invertible, the affine matrix will have corank 1.
Write $a_1, \ldots, a_n$ for the coefficients $\widetilde{\alpha} = \sum_{i = 1}^r a_i \alpha_i$ of the highest root, then since $a_1 \alpha_1 + \cdots + a_r \alpha_r + \alpha_{r + 1} = 0$ the vector $(a_1, \ldots, a_r, 1)$ gives a linear dependence among the columns of the affine Cartan matrix.
Similarly, write $\widetilde{\alpha}^\vee = \sum_{i = 1}^r a_i^\vee \alpha_i^\vee$ for the coefficients of the highest short coroot.
Then the vector $(a_1^\vee, \ldots, a_r^\vee, 1)$ gives a linear dependence among the rows of the affine matrix.
In the untwisted case, we define $a_{r + 1} = 1$ and $a_{r + 1}^\vee = 1$.

The numbers $h = \sum_{i = 1}^{r + 1} a_i$ and $h^\vee = \sum_{i = 1}^{r + 1} a_i^\vee$ are called the _Coxeter number_ and _dual Coxeter number_ associated to the affine diagram (or if the affine diagram is untwisted, associated to the underlying finite type root system).

IMPORTANT NOTE: $h(R^\vee) \neq h^\vee(R)$, or in other words the Coxeter number of the dual root system is _not_ the dual Coxeter number of the original system.
In the most simple terms, this is because the coefficients of the highest root, highest short root, highest coroot, and highest short coroot may all be different: $a_i^\vee(R)$ is not equal to $a_i(R^\vee)$.
The slogan here is that _affinisation and duals do not commute_.
As a concrete example, starting with a root system of type $C_r$ and affinising gives what Kac calls $C_r^{(1)}$, however the dual of this (the transpose of the affine Cartan matrix) is what Kac calls $D_{r + 1}^{(2)}$, an affine algebra that only arises from the twisted construction.
As another example, both $G_2$ and $F_4$ are self-dual, but their affine algebras are not self-dual.


Now, in any realisation of the affine system, we can define canonically the *null root* $\delta = \sum_{i = 1}^{r + 1} a_i \alpha_i$, which lies in the $\bbR$-span of the simple roots. Since $a_{r+1} = 1$ in the untwisted case, the affine root can be expressed as $\alpha_{r + 1} = \delta - \sum_{i = 1}^r a_i \alpha_i = \delta - \widetilde{\alpha}$.
The null root is not seen by any simple coroot (not even the affine simple coroot), meaning that $\innprod{\alpha_i^\vee, \delta} = 0$, and hence it is fixed by all reflections: $s_i(\delta) = \delta$ for $i = 1, \ldots, r+1$.
Furthermore, the finite reflections send the finite simple roots to other finite (perhaps non-simple) roots.
If the simple affine roots are linearly independent, the finite reflections look like

$$
s_i = \begin{pmatrix}
s_i |_{\Phi_f} & 0 \\ 0 & 1 \end{pmatrix}
$$

however the affine reflection $s_{r + 1}$ acts on the finite root $\alpha_i$ as
$$
\begin{aligned}
s_{r+1}(\alpha_i)
    &= \alpha_i - \innprod{\alpha_{r+1}^\vee, \alpha_i} \alpha_{r+1} \\
    &= \alpha_i - \innprod{\alpha_{r+1}^\vee, \alpha_i}(\delta - \widetilde{\alpha})
\end{aligned}
$$


# Character rings for reductive groups

Each split reductive group $G$ over $\bbZ$ boils down to the combinatorial data of its *root datum*: a pair $(X^\vee, X)$ of free $\bbZ$-modules of finite rank, in some perfect pairing $\innprod{-, -} \colon X^\vee \times X \to \bbZ$, along with choices of simple coroots $\alpha_i^\vee \in X^\vee$ and simple roots $\alpha_i \in X$. The *Cartan matrix* $A = [a_{ij}] = [\innprod{\alpha_i^\vee, \alpha_j}]_{ij}$ records the 'core' of this data, the isogeny class of the group.

A morphism of root data is a pair $(f^\vee, f) \colon (X^\vee, X) \to (Y^\vee, Y)$ of (necessarily adjoint) maps $f^\vee \colon X^\vee \to Y^\vee$ and $f \colon Y \to X$ such that the simple roots and coroots of one root datum are sent to the simple roots and coroots of another. Thus the root data of the same Cartan type form a *category*. This category has initial and final objects, called the *simply connected* and *adjoint* root data respectively. The simply-connected datum has $X^\vee_{sc}$ the free $\bbZ$-module with basis $\alpha_i^\vee$, and $X_{sc}$ the free $\bbZ$-module with basis $\varpi_i$, with $\innprod{\alpha_i^\vee, \varpi_i} = \delta_{ij}$. The simple roots are the unique solutions to $\innprod{\alpha_i^\vee, \alpha_j} = a_{ij}$.

Returning to an arbitrary root datum $(X^\vee, X)$, characters of the torus live in $\bbZ[X]$, while characters of representations of the group live in the subring $\bbZ[X]^W$. We introduce the notation:

- $e(\lambda)$ is the basis of $\bbZ[X]$ as a group algebra.
- $m(\lambda) = \sum_{\mu \in W \cdot \lambda} e(\mu)$ is the sum over the orbit of $\lambda$ under $W$.
- $\chi(\lambda)$ is the Weyl character associated to $\lambda$.

The elements $\set{m(\lambda) \mid \lambda \in X_+}$ and $\set{\chi(\lambda) \mid \lambda \in X_+}$ form bases of $\bbZ[X]^W$. A key step is being able to calculate the *Kostka numbers*, the coefficients which expand $\chi(\lambda)$ in terms of the $m(\mu)$:

$$
\chi(\lambda) = \sum_{\mu \in X_+} K_{\lambda \mu} m(\mu) = \sum_{\mu \in X} K_{\lambda \mu} e(\mu).
$$

A classic (but impractical) way of calculating these numbers is by the Weyl character formula. A much more practical method to calculate them for dominant $\lambda$ is by Freudenthal's formula, which recurses down from the highest weight. For non-dominant weights, the relation $\chi(w \bullet \lambda) = \det(w) \chi(\lambda)$ may be used, where $w \bullet \lambda = w(\lambda + \rho) - \rho$ is the reflection around $-\rho$. If $\lambda$ has a stabiliser under the $\bullet$-action (i.e. $\innprod{\alpha_i^\vee, \lambda} = -1$ for some $i$) then $\chi(\lambda) = 0$.

The generalised tensor identity implies that if $\sum_\mu a_\mu e(\mu)$ is symmetric under the $W$-action, then
$$
\chi(\lambda) \sum_{\mu} a_\mu e(\mu) = \sum_\mu a_\mu \chi(\lambda + \mu),
$$
which can be used to calculate tensor product multiplicities.

Implementing Freudenthal's formula for an arbitrary root datum is not difficult, but things can be made far more efficient if it is only implemented for semisimple Lie algebras. It can be connected to an arbitrary root datum in the following way. Define $X_0 = \set{\lambda \in X \mid \innprod{\alpha_i^\vee, \lambda} = 0 \text{ for all } i}$: this is the "central" part of the root datum which plays almost no role in the Lie theory (aside from just shifting things around). It is the kernel of the map $f \colon X \to X_{sc}$.


# SL2 and quantum numbers

The simple reductive group $\SL_2$ has well-understood representation theory, both in characteristic zero and in characteristic $p > 0$.
The weight lattice of $\SL_2$ is identified with the integers, with the positive root $\alpha = 2$ and the fundamental weight $\varpi = 1$.
The characters of $\SL_2$-modules are then Laurent polynomials in a single variable.

For $\lambda \geq 0$, the induced module $\nabla_\lambda$ has character
$$
\ch \nabla_\lambda
    = q^{\lambda} + q^{\lambda - 2} + \cdots + q^{2 - \lambda} + q^{-\lambda}
    = \frac{q^{\lambda + 1} - q^{-(\lambda + 1)}}{q - q^{-1}}
    = [\lambda + 1]_q,
$$
where $[n]_q$ denotes the quantum integer $n$. In characteristic zero, the induced modules are irreuducible and so the quantum integers describe all the characters of $\SL_2$.

In positive characteristic however, things are more interesting. Suppose we are in characteristic $p > 0$ for some prime $p$, then

1. By general theory, the module $\nabla_\lambda$ for $\lambda$ in the fundamental alcove $\overline{C} = \set{\lambda \mid 0 \leq \innprod{\alpha^\vee, \lambda} < p \text{ for all } \alpha \in \Phi^+}$ remain irreducible, and
2. By Steinberg's tensor product theorem, it is enough to know simple representations in the region $X_1 = \set{\lambda \mid 0 \leq \innprod{\alpha^\vee, \lambda + \rho} \leq p \text{ for all } \alpha \in S}$.

Usually the set of weights $\overline{C}$ is a strict subset of $X_1$ and therefore more work needs to be done to find all the simple characters. But in the special case of $\SL_2$, all the dominant weights inside $X_1$ are also inside $C$ and these weights are $\set{0, 1, \ldots, p - 1}$. So whenever $0 \leq \lambda < p$, we may write $\ch L(\lambda) = \ch \nabla_\lambda = [\lambda + 1]_q$.

The Steinberg tensor product theorem says the following: write a dominant weight $\lambda$ as a sum $\lambda = \sum_{i \geq 0} p^i \lambda_i$ with each $\lambda_i \in X_1$. Then $L(\lambda) = L(\lambda_0) \otimes L(\lambda_1)^{[1]} \otimes L(\lambda_2)^{[2]} \otimes \cdots$, where $V^{[k]}$ is the $p^k$-twist of the module $V$. We do not need to know much about the functor $(-)^{[k]}$ aside from the fact that it dialates characters by $p^k$. If we consider a character $\ch V$ to be a Laurent polynomial $f(q) \in \bbZ[q^{\pm 1}]$, then the character $\ch V^{[1]}$ is $f(q^p)$.

Hence we can immediately write down the characters of $\SL_2$ for $p = 3$, say:

$$
\begin{aligned}
    0 = (0)_3  :&& \ch L(0) &=& &1 \\
    1 = (1)_3  :&& \ch L(1) &=& q^{-1} &+ q \\
    2 = (2)_3  :&& \ch L(2) &=& q^{-2} + &1 + q^{2} \\
    3 = (10)_3 :&& \ch L(3) &= \ch L(1)^{[1]} =& q^{-3} &+ q^{3} \\
    4 = (11)_3 :&& \ch L(4) &= \ch L(1)^{[1]} \otimes L(1)^{[0]} =& q^{-4} + q^{-2} &+ q^{2} + q^{4} \\
    5 = (12)_3 :&& \ch L(5) &= \ch L(1)^{[1]} \otimes L(2)^{[0]} =& q^{-5} + q^{-3} + q^{-1} &+ q + q^3 + q^5 \\
    6 = (20)_3 :&& \ch L(6) &= \ch L(2)^{[1]} =& q^{-6} + &1 + q^{6}
\end{aligned}
$$

Using this, it can be seen that the $(n - 2i)$ weight space in $L(n)$ is nonzero iff $\binom{n}{i} \not\equiv 0 \pmod{p}$. The diagram below shows the pattern of nonzero binomial coefficients modulo $p$, where $p$ is any natural number (of course, only $p = 0$ and $p$ prime correspond to representation theory). The curious case of $p = 1$ is because I have defined $\binom{p}{0} = \binom{p}{p} = 1$ regardless of characteristic, with the other coefficients determined by the usual Pascal's triangle recurrence relation.

## Quantum integers

Define the _quantum integers_ $[n] \in \bbZ[v^{\pm 1}]$ for $n \geq 0$ as follows:

$$
\begin{aligned}
    [0] &= 0 \\
    [1] &= 1 \\
    [2] &= v^{-1} + v^{1} \\
    [3] &= v^{-2} + 1 + v^{2} \\
    [4] &= v^{-3} + v^{-1} + v^{1} + v^{3},
\end{aligned}
$$

and further define $[-n] = -[n]$. This can be compactly summarised in the geometric series formula
$$
[n] := \frac{v^n - v^{-n}}{v - v^{-1}}.
$$

The quantum integers are fixed under the ring homomorphism $v \mapsto v^{-1}$, which we write as $[n]_{v^{-1}} = [n]$.
We also have the _quantum addition formula_

$$
[n] +_v [m] := v^{-m}[n] + v^n[m] = v^{m}[n] + v^{-n}[m]
$$

and the _quantum multiplication formula_

$$
[n] \times_v [m] := [n]_v [m]_{v^n}.
$$

It is straightforward to show that $[n] +_v [m] = [n + m]$ and $[n] \times_v [m] = [nm]$.

We may also define the _quantum factorial_ for $n \geq 0$:

$$
[n]^{!} := [n][n - 1] \cdots [2][1],
$$

and the _quantum binomial coefficient_ for $n \in \bbZ$ and $r \in \bbN$

$$
\qbinom{n}{r} := \frac{[n]^!}{[r]^![n-r]^!} = \frac{[n][n-1] \cdots [n-1+r]}{[r][r-1] \cdots [1]}.
$$

The quantum binomaial coefficients satisfy a Pascal-style recurrence relation

$$
\qbinom{n}{k} = v^k \qbinom{n - 1}{k} + v^{n - k} \qbinom{n - 1}{k - 1}
$$

which together with $\qbinom{n}{0} = \qbinom{n}{n} = 1$ shows that they are Laurent polynomials, again symmetric over $v \mapsto v^{-1}$.


### Classic quantum integers

A more common definition of the quantum integers is by taking
$$
[n]_q := \frac{q^{n} - 1}{q - 1} = 1 + q + \cdots + q^{n - 1}.
$$
We will differentiate between these quantum integers and the others by using $q$ vs $v$ as the variable. They are related by
$$
v^{-n + 1}[n]_{q \mapsto v^2} = [n]_v,
$$
as we can see in the formula:
$$
    v^{-n + 1}[n]_{q \mapsto v^2}
        = \frac{v^{-n}}{v^{-1}} \cdot \frac{v^{2n} - 1}{v^2 - 1}
        = \frac{v^n - v^{-n}}{v - v^{-1}} = [n]_v.
$$
In the opposite direction, we have
$$
[n]_q = (v^{n - 1}[n]_v)_{v \mapsto q^{\frac{1}{2}}}
$$


# Computing in Lie theory

I'll go over here in brief how I am computing all the basic combinatorial objects in Lie theory: root systems and statistics on them, Weyl groups, characters of irreps, etc. I hope to expand this into something more illuminating, but for now it's basically a set of notes-to-self.

The real question we're answering here is: starting from a Cartan matrix, how do you produce _everything_ else?


## The goals

Some of the goals are as follows:

1. Compute irreducible characters and tensor product multiplicities etc for arbitrary finite type root data.
2. Compute various other statistics and interesting numbers on their associated root systems (eg heading towards _the poster_).
3. Be able to compute in Weyl groups, both in a compact enumerated form (eg for computing KL polynomials), and in a more sparse non-enumerated form (for occasional computations, or computations where we quotient by a large parabolic).

In order to go towards goal 1, we can use the fact that every reductive group $G$ admits a central isotypy $G_{sc} \to G$ from the simply-connected group in its isogeny class, which we can use to pull back representations of $G$ to representations of $G_{sc}$. Irreps should stay irreducible (why?), and then we are always working within the basis of fundamental weights where computations simplify somewhat.

This means that (modulo some mappings between root data) solving 2 well will also give most of the tools to solving 1.


## Building root systems

Let $A = [a_{ij}]$ be an $n \times n$ Cartan matrix of finite type, i.e. a GCM with nonzero (and therefore positive, integer) determinant. It defines a root system, root lattice, and weight lattice, and dually a coroot system, coroot lattice, and coweight lattice. Theoretically, these are all sitting inside some finite-dimensional vector space $V$ of dimension $n$ over the reals, but we never work explicitly with this space; instead whenever we build roots we will just build their root and weight coordinates without worrying about trying to embed them into anything, instead studying their relationship to each other, and how the pairing works on them.

To begin with, the simple roots are coordinate vectors in the simple root basis, and the columns of the Cartan matrix in the fundamental weight basis. Dually, the simple coroots are coordinate vectors in the simple coroot basis, and the rows of the Cartan matrix in the fundamental coweight basis.
$$
\alpha_i = \sum_j \delta_{ij} \alpha_j = \sum_j a_{ji} \varpi_j, \quad
\alpha_i^\vee = \sum_j \delta_{ij} \alpha_j^\vee = \sum_j a_{ij} \varpi_j^\vee, \quad
$$
For brevity, from now on we call these the _root, weight, coroot_, and _coweight_ bases. The pairings on these bases are:
$$
\innprod{\alpha_i^\vee, \varpi_j} = \delta_{ij}, \quad
\innprod{\alpha_i^\vee, \alpha_j} = a_{ij}, \quad
\innprod{\varpi_i^\vee, \alpha_j} = \delta_{ij}, \quad
\innprod{\varpi_i^\vee, \varpi_j} = a_{ij}^{-1},
$$
where $a_{ij}^{-1}$ denotes the $(i, j)$ entry of $A^{-1}$. Consequently the pairing between the weight and coweight bases is not integral, and we prefer to make use of the others.

When building the root systems, for each root and coroot we record it in both the weight and root (or coweight and coroot) bases simultaneously. There are two "games" that can be played to construct the root systems: the first is the _root reflection_ game, and the second is the _root addition_ game. The reflection game is important for us because if we play the games in the same order on both the root and coroot sides, then it constructs the root-coroot bijection. The addition game is important because it records data about how far each root is along each $i$-string, and constructs the root poset.


### The root reflection game

This is the "Weyl group centric" method of building roots, and could really be done for any finite Coxeter group (the difficulty for other finite Coxeter groups being that the Cartan matrix defining the reflections is not integral, and so becomes more difficult to work with). The fact that we have a crystallographic root system makes things very nice here.

Let $W$ be the Weyl group: it is generated by the simple reflections $r_i$, where $r_i(v) = v - \innprod{\alpha_i^\vee, v} \alpha_i$ for any $v \in V$. Dually, we have $r_i^\vee(f) = f - \innprod{f, \alpha_i} \alpha_i^\vee$ for any $f \in V^*$. From now on we call both these reflections by the name $r_i$ and hope that which kind of vector we are reflecting is clear from context. We can write down how these reflections behave on the root and weight basis elements:
$$
r_i(\alpha_j) = \alpha_j - a_{ij} \alpha_i, \quad r_i(\varpi_j) = \varpi_j - \delta_{ij} \alpha_i.
$$
On the root basis, the simple reflection $r_i$ only modifies the $i$th coordinate: if $\lambda = \sum_j x_j \alpha_j$ in the root basis then
$$
x =
\begin{pmatrix} x_1 \\ \vdots \\ x_i \\ \vdots \\ x_n \end{pmatrix}
\xto{r_i}
\begin{pmatrix} x_1 \\ \vdots \\ x_i - x \cdot A_{i, -} \\ \vdots \\ x_n \end{pmatrix},
$$
where $x \cdot A_{i, -}$ denotes the dot product of the vector $x$ with the $i$th row of the Cartan matrix (which is the simple coroot $\alpha_i^\vee$ in the coweight basis). (TODO: this has a lovely interpretation in terms of Dynkin diagrams). In the weight basis on the other hand, we have if $\lambda = \sum_j y_j \varpi_j$ then
$$
y =
\begin{pmatrix} y_1 \\ \vdots \\ y_i \\ \vdots \\ y_n \end{pmatrix}
\xto{r_i}
y - y_i A_{-, i},
$$
where $A_{-, i}$ this time represents the $i$th column of the Cartan matrix (which is the simple root $\alpha_i$ in the weight basis).

Armed with the knowledge of how to reflect column vectors, we start off the game having only the simple roots. To each of these starting points, we try to apply the $n$ possible reflections. Three possiblities occur:

1. We produce a new vector we have not yet seen before. This is a new root of the root system, and we record it.
2. We produce a vector that we have seen before. This is again a root of the root system, but since it's already recorded we can ignore it.
3. We produce a negative root (a root whose coordinates in the root basis are all $\leq 0$). This only happens for $r_i$ applied to $\alpha_i$, in fact. We ignore these.

Playing this game, building roots layer by layer, produces the whole positive root system. If we play the game in the same order on the dual system, we produce the bijection $\alpha \mapsto \alpha^\vee$ between roots and coroots. The layer at which we uncover a new root is called the _depth_ of that root: the minimal number of simple reflections needed to transform the root into a negative root, all the simple roots having depth 1.


### The root addition game

This is the "Lie algebra centric" method of building roots. We know that the root system (along with a Cartan subalgebra of dimension $n$) is the adjoint representation of a semisimple Lie algebra, and so in particular we can look at this Lie algebra's restriction to the copy of $\mathfrak{sl}_2$ corresponding to each simple root $i$, henceforth called the $i$-subalgebra. This is a finite-dimensional representation of $\mathfrak{sl}_2$ and so breaks up into $i$-strings.

Each root in the root system is a member of the $i$-string (perhaps the $i$-string has length zero, in which case it is a member of a boring string). We will label the lengths of $i$ strings by their highest weight, which records the number of edges in the string. For each root $\alpha$ and each $i$, we need to know:

1. How long is the $i$-string passing through $\alpha$, and
2. What position is $\alpha$ along this string?

We will record a root's position along its string by the $\mathfrak{sl}_2$-weight, so for example if $\alpha$ is in weight 2 on a 1-string then

(DIAGRAM HERE)

If $\alpha$ is not at the top of its $i$-string, then $\alpha + \alpha_i$ is also a root, and we can use this fact to determine the "legal moves" which will produce more roots. In addition to keeping track of each root in the root and weight basis (the $i$th coordinate in the weight basis gives us the position along the $i$-string), we need to keep track of the highest weight of the $i$-string for each root: another vector of length $n$ to store with each root.

1. $\alpha_i$ is at the top of its $i$-string, since $\alpha_i + \alpha_i$ is not a root. Also, the $i$-string passing through $\alpha_i$ has length 3 (since $-\alpha_i$ is a root, but $-2\alpha_i$ is not).
2. If $j \neq i$, then $\alpha_i$ is at the bottom of its $j$-string, since $\alpha_i - \alpha_j$ is not a root (all roots are either positive or negative).

We then proceed layer by layer to build the whole positive root system. Each root $\alpha$ can be "promoted" to the next layer up for each $i$ such that $\alpha$ is not at the top of its $i$-string. Once promoted, we know that $\alpha + \alpha_i$ lies on the same $i$-string as $\alpha$ which has the same length: we record this length. There may be another way to get to $\alpha + \alpha_i$ from the same layer, say $\beta + \alpha_j$, in which case we also fill in the $j$-string length coming from $\beta$.

After filling in a layer, there may be string lengths which are not recorded since they came from nothing below. For example if $\beta$ is on the new layer, and the $i$-string length for $\beta$ is unrecorded, then we may assume that $\beta$ is at the bottom of its $i$-string, and fill in the string length data from the $i$-weight of $\beta$.

After this game finishes, the whole positive root system is constructed. If the positive root system is indecomposable, then the resulting poset has a unique maximal element, which is the _highest root_.


### Norms of roots

The last piece of data we need is the _norm_ $(\alpha, \alpha)$ of a root. We know that if the root system is indecomposable, then there exists a unique $W$-invariant inner product on $V$. Hence we can define a canonical inner product on $V$ by declaring that $(\alpha, \alpha) = 2$ for all of the short simple roots.

In finite type, there are at most 2 lengths of root in each indecomposable system. If we can figure out what the norms of the simple roots should be we will be done: the norms of all the other roots can be calculated directly from the pairing matrix, or transferred upwards from the simple roots while playing the reflection game.

The $W$-invariant inner product should satify
$$
\innprod{\alpha_i^\vee, -} = 2 \frac{(\alpha_i, -)}{(\alpha_i, \alpha_i)}
$$
for each $i$. Playing around with this identity leads to
$$
\frac{(\alpha_i, \alpha_i)}{(\alpha_j, \alpha_j)} = \frac{\innprod{\alpha_j^\vee, \alpha_i}}{\innprod{\alpha_i^\vee, \alpha_j}} = \frac{a_{ji}}{a_{ij}},
$$
which gives the ratio of lengths for any two simple roots which are adjacent in the Dynkin diagram. Since we have fixed the smallest roots to have square length $2$, the lengths of the other roots can be extrapolated from this ratio; for example by classifying the Dynkin diagram into simply-laced components with an arrow between them.

Let $D$ be the diagonal matrix with entries $(\alpha_i, \alpha_i)/2$, then $DA$ is a symmetric matrix representing the inner product just defined. Almost anything we do with this inner product will be scaling-invariant, so we won't worry about fixing notation too much with it until later on: this is the "gist" of how to create a $W$-invariant inner product.


## The Weyl group

- Formula for the order of the Weyl group in terms of highest root
- How to adapt the formula for decomposable systems, and parabolic subgroups.
- Longest word
- Enumerated Coxeter group
- Word Coxeter group


## Affinisation

- Untwisted affine Cartan matrix
- Affine reflection matrices for the affine Weyl group
- Coordinates for the affine Weyl group
- Plotting the affine Weyl group (how to go from a positive-definite Gram matrix to some vectors in $\bbR^n$?)


## Dimensions and multiplicities of irreps

- Weyl dimension formula (not much to say)
- Dominant characters via Freudenthal's formula
- Tensor product multiplicities via the generalised tensor identity


## Working with integral matrices

- Hermite normal form
- Inverses and adjugates
- Smith normal form
