---
title: Root systems
---

These notes go through the details of constructing and working with root systems (in the sense of Bourbaki) on a computer, starting from the combinatorial data of a Cartan matrix.


## Cartan matrices

A *generalised Cartan matrix* or *GCM* is a matrix $A ∈ \Mat_I(\bbZ)$ of integers over some finite indexing set $I$, satisfying:

1. $a_{ii} = 2$ for all $i ∈ I$,
2. $a_{ij} ≤ 0$ for all $i ≠ j$, and
3. $a_{ij} = 0 ⟺ a_{ji} = 0$.

The GCM $A$ is *finite type* if all of its principal submatrices have positive determinant (a more practical way to check this is by classification).
Our convention for Cartan matrices and pairings will be that the coroot goes first, so $a_{ij} = ⟨\alpha_i, \alpha_j⟩$ in any realisation of the root system.

::: aside
In order to construct non-reduced root systems, i.e. root systems with components of type $BC_n$, we need one extra piece of data: a subset $D ⊆ I$ of *divisible indices*.
It cannot just be any subset: $d ∈ D$ is allowed only if it corresponds to the short root in a subdiagram of type $B_n$, or if it corresponds to type $A_1$.
One can see from the classification of finite-type indecomposable Cartan matrices that this is equivalent to requiring that row $d$ of the matrix $A$ is divisible by $2$.
An alternative formulation might be to take $D$ as a diagonal matrix with entries $d_i$, and then the requirement is that $A$ is finite type, and $D^{-1} A$ is integral.

In fact, this basic modification (allowing even rows of the Cartan matrix, i.e. $A_1$ or $B_n$ ends) to be doubled means that pairs $(A, D)$ correctly classify irreducible finite type *and* affine type Dynkin diagrams: see the setup and Appendix 2 in *Affine root systems and Dedekind's $η$-function* by Macdonald.
:::

From this point forward we fix an indexing set $I = \set{1, \ldots, r}$, a finite-type Cartan matrix $A ∈ \Mat_I(\bbZ)$, and (for those interested in nonreduced root systems) a diagonal matrix $D = \diag(d_1, \ldots, d_r)$ with $d_i ∈ \set{1, 2}$ such that $D^{-1} A$ is integral.


## Encoding root systems

It is well-known that root systems are encoded (up to choice of base) by Cartan matrices of finite type.
We will show how to formulate things in a uniform way so that divisible roots are also taken into account.
The result will be that we need to remember both the Cartan matrix $A$, and a divisibility vector $D = \diag(d_1, \ldots, d_r)$ where each $d_i ∈ \set{1, 2}$, and treat $(A, D)$ as the defining data of the system.

The data of a root system is:

- Two real vector spaces $X^∨$ and $X$, together with a perfect pairing $⟨ -, - ⟩ : X^∨ × X → \bbR$.
- Finite subsets of *coroots* $Φ^∨ ⊆ X^\vee$ and *roots* $Φ ⊆ X$, neither including zero, together with a bijection $Φ → Φ^∨$ written as $α ↦ α^∨$.

The data are required to satisfy the following:

- $⟨β, α⟩ ∈ \bbZ$ for all $β ∈ Φ^∨$ and $α ∈ Φ$.
- $⟨α^∨, α⟩ = 2$, and the reflection $r_α : X → X$ defined by $r_α(x) = x - ⟨α^∨, x⟩α$ leaves $Φ$ stable.

Each root $α ∈ Φ$ defines a hyperplane $H_α ⊆ X^∨$ as the kernel of the map $ν ↦ ⟨ν, α⟩$.
After choosing a chamber $C ⊆ X^∨$ in this hyperplane arrangement, taking all *indivisible* roots $α$ such that $H_α$ is a wall defines a *base* $(α_1, \ldots, α_r)$ of the root system, which we'll call the *simple roots*.
Their duals $(α_1^∨, \ldots, α_r^∨)$ are almost a base for the coroot system $Φ^∨$, however if $α_i$ is an element of the base such that $2 α_i$ is a root, then $2 (2 α_i)^∨ = α_i^∨$.
Hence define $d_i = 1$ when $2 α_i$ is not a root, and $d_i = 2$ when $2 α_i$ is a root, then the vectors $(β_1, \ldots, β_r)$ defined by $d_i β_i = α_i^\vee$ form a base, called the *simple coroots*.
Note that $β_i^∨ = d_i α_i^∨$.

The matrix $A_{ij} = ⟨α_i^∨, α_j⟩$ of the pairing of the simple roots with their duals is called the *Cartan matrix*, and the ratios $d_i = \frac{α_i^∨}{β_i}$ of the dual simple roots to simple coroots is the *divisibility vector* $D$, which we think of as a diagonal matrix $D = \diag(d_1, \ldots, d_r)$.
Note that the matrix of the pairing $⟨β_i, α_j⟩$ of the simple coroots with the simple roots is equal to $D^{-1} A$.
If we were to measure the Cartan matrix of the dual system, we would get

$$
a_{ij}^\vee = ⟨β_j, β_i^∨⟩ = \left ⟨ \frac{α_j^\vee}{d_j}, d_i α_i \right ⟩ = \frac{d_i}{d_j} a_{ji},
$$

and hence the dual Cartan matrix $A^\vee$ is $D A^T D^{-1}$, and the dual divisibility vector $d_i^∨ = \frac{β_i^∨}{α_i} = d_i$ is unchanged.
The upshot of this dual formalism is that for all reduced indecomposable root systems duals work via transpose, while root systems of type $BC_n$ are self-dual.

The simple roots $(α_1, \ldots, α_r)$ are a basis for the *root lattice* $\bbZ Φ ⊆ X$, while the simple coroots $(β_1, \ldots, β_r)$ are a basis for the coroot lattice $\bbZ Φ^∨ ⊆ X^∨$.
If $X$ has minimal dimension $r$, then there is a *weight lattice* $P ⊆ X$, defined by
$$ P = \set{x ∈ X ∣ ⟨β, x⟩ ∈ \bbZ \text{ for all } β ∈ Φ^∨}. $$
The $β ∈ Φ^∨$ in the definition may be replaced by either $\bbZ Φ^∨$ or the simple coroots $(β_1, \ldots, β_r)$.
The *fundamental weights* $(ϖ_1, \ldots, ϖ_r) ⊆ X$ are defined to be the basis dual to the simple coroots $(β_1, \ldots, β_r)$: these generate the weight lattice.
(It is key here that the simple coroots $β_i$ are used, rather than the dual simple roots $α_i^∨$, since otherwise some "fundamental weights" would actually lie outside the weight lattice).
Similarly we have a coweight lattice $P^∨ ⊆ X^∨$, and define the *fundamental coweights* $(ϖ_1^∨, \ldots, ϖ_r^∨)$ to be the basis dual to the simple roots $(α_1, \ldots, α_r)$.


## An example: type $BC_2$

Let $α_1$ be the long root and $\alpha_2$ be the short root in type $BC_2$, which can be represented in the Euclidean space $\mathbb{R}^2$ by the vectors $(2, 0)$ and $(-1, 1)$.
The root $α_2$ is doubled, so $2 α_2$ is also a root.
Treating the roots as column vectors and the coroots as row vectors, they need to pair to give the Cartan matrix:
The coroots $(α_1^∨, α_2^∨)$ pair with the roots to give the Cartan matrix:
$$
\begin{pmatrix} α_1^∨ \\ α_2^∨ \end{pmatrix}
\begin{pmatrix} α_1 & α_2 \end{pmatrix}
=
\begin{pmatrix} 2 & -1 \\ -2 & 2 \end{pmatrix},
$$
which gives $α_1^∨ = (1, 0)$ and $α_2^∨ = (-1, 1)$.
We could have also used that $α^∨ = \frac{2}{α ⋅ α} α^∨$, since our inner product is compatible with the row-vector column-vector pairing.
Note now that $(2 α_2)^∨ = \frac{1}{2} α_2^\vee$, so $β_1 = (1, 0)$ and $β_2 = (-\frac{1}{2}, \frac{1}{2})$ are a base for the dual system. We have:
$$
α_1^∨ = \begin{pmatrix} 1 & 0 \end{pmatrix},
α_2^∨ = \begin{pmatrix} -1 & 1 \end{pmatrix}, \quad
α_1 = \begin{pmatrix} 2 \\ 0 \end{pmatrix},
α_2 = \begin{pmatrix} -1 \\ 1 \end{pmatrix}.
$$
$$
β_1 = \begin{pmatrix} 1 & 0 \end{pmatrix},
β_2 = \begin{pmatrix} -\frac{1}{2} & \frac{1}{2} \end{pmatrix}, \quad
β_1^∨ = \begin{pmatrix} 2 \\ 0 \end{pmatrix},
β_2^∨ = \begin{pmatrix} -2 \\ 2 \end{pmatrix}.
$$


### Weight and root lattices of $BC_2$

The weight lattice is defined to be $P = \set{v ∈ \bbR^2 ∣ ⟨α^∨, v⟩ ∈ \bbZ \text{ for all } α ∈ Φ}$.
Checking pairings with $α_1^∨$ and $α_2^∨$ shows that $P ⊆ \bbZ^2$, and checking the pairing on $(2 α_2)^∨$ shows that if $(a, b) ∈ P$ then $a - b ∈ 2 \bbZ$.
These are all of the conditions, so the weight lattice is
$$ P = \set{(a, b) ∈ \bbZ^2 ∣ a - b ∈ 2 \bbZ}. $$
The basis dual to $(α_1^∨, α_2^∨)$ is $(1, 1)$ and $(0, 1)$, which is *not* a basis for the weight lattice $P$.
The correct definition is the basis dual to $(β_1, β_2)$, which is $ϖ_1 = (1, 1)$ and $ϖ_2 = (0, 2)$.
Note that the weight lattice $P$ is equal to the root lattice $Q = \bbZ Φ$ for type $BC_2$.
If we were to remove the doubled root and go back to a system of type $B_2$, the root lattice would stay the same, but the weight lattice would enlarge to the whole of $\bbZ^2$.

We get the fundamental weight and fundamental coweight bases:
$$
ϖ_1^∨ = \begin{pmatrix} \frac{1}{2} & \frac{1}{2} \end{pmatrix},
ϖ_2^∨ = \begin{pmatrix} 0 & 1 \end{pmatrix}, \quad
ϖ_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix},
ϖ_2 = \begin{pmatrix} 0 \\ 2 \end{pmatrix}.
$$

### Affinisation of $BC_2$

The highest root is $\widetilde{α} = 2 α_1 + 2 α_2 = (2, 2)$, and its corresponding coroot is $\widetilde{α}^∨ = (\frac{1}{2}, \frac{1}{2}) = β_1 + β_2$, the highest short root in the dual system.
Upon affinising using the new affine root $δ - \widetilde{α}$ and the new affine coroot $-(\widetilde{α})^∨$, we would get the Cartan matrix
$$
\begin{pmatrix}
    2 & -1 & -2 \\
    -2 & 2 & 0 \\
    -1 & 0 & 2
\end{pmatrix}
$$

In terms of Dynkin diagrams, we get the following for affinisation (using the extra notation of an asterisk over a vertex for a doubled simple root):

<figure class="row">
    <figure id="BC2"></figure>
    <figcaption>Affinises to</figcaption>
    <figure id="BCaff2"></figure>
</figure>
<script type="module">
    import {mat} from 'lielib'
    import DynkinDiagram from './_DynkinDiagram.svelte'

    let BC2 = mat.fromRows([
        [2, -1],
        [-2, 2],
    ])
    let BCaff2 = mat.fromRows([
        [2, -1, -2],
        [-2, 2, 0],
        [-1, 0, 2],
    ])
    new DynkinDiagram({
        target: document.getElementById('BC2'),
        props: {cartanMat: BC2, vertexLabels: (i) => ['1', '2*'][i]},
    })
    new DynkinDiagram({
        target: document.getElementById('BCaff2'),
        props: {cartanMat: BCaff2, vertexLabels: (i) => ['1', '2', '3'][i], special: [false, false, true], reverseX: true},
    })
</script>
The affinised root system (we have not yet explained exactly how to do this) is reduced: there are no longer divisible roots.

## Constructing root systems

Now that we know how root systems are classified by the pair $(A, D)$, we should be able to build them starting from that information.
We want to be able to recover root/coroot coefficients in both the simple root/coroot basis and fundamental weight/coweight basis.
We also need the bijection between roots and coroots: in the reduced case this is straightforward because we know the simple roots and coroots are in bijection, and reflections commute with the bijection: $(w α)^∨ = w α^∨$.
Thus we can build reduced root systems by starting with the information of the simple roots/coroots and reflecting.

In the nonreduced case, we also need to throw any multiples $2 α_i$ of simple roots where $d_i = 2$ into our starting set, because they are not in the $W$-orbit of the rest of the roots.
This also has the effect of including the simple coroots $β_i$ into our starting set, as the duals of the $2 α_i$.

Let $(A, D)$ be a pair defining a Cartan type, i.e. $I = \set{1, \ldots, r}$, $A ∈ \Mat_I(\bbZ)$ is a finite-type Cartan matrix, and $D$ is a divisibility vector.
We will encode each root in both the basis $\underline{\alpha} = (\alpha_1, \ldots, \alpha_r)$ of simple roots, and the basis $\underline{ϖ} = (ϖ_1, \ldots, ϖ_r)$ of fundamental weights, and similarly we will encode roots in the dual in the bases $\underline{\beta}$ of simple coroots and $\underline{ϖ^∨}$ of fundamental coweights.
We first need to add all the pairs $(α_i^∨, α_i)$ of simple roots and their duals $α_i^∨ = d_i β_i$, so we get in the coroot and root bases
$$ [^{\underline{β}} α_i^∨] = d_i e_i, \quad [^{\underline{α}} α_i] = e_i. $$
In the coweight and weight bases, we instead have
$$ [^{\underline{ϖ^∨}} α_i^∨] = i\text{th row of } A, \quad [^{\underline{ϖ}} α_i] = i\text{th column of } D^{-1} A.$$
This will generate an indivisible system (the one with smaller roots) in $Φ$ and an indivisible system (the one with larger roots) in $Φ^∨$, but we may be missing some of the basis vectors of $Φ^∨$.
So we need to add, whenever $d_i = 2$, the pairs $(β_i, 2 α_i)$ into the mix:

$$ {\color{red} Incorrect formula here...} $$
$$ [^{\underline{\beta}} β_i] = e_i, \quad [^{\underline{α}} 2 α_i] = 2 e_i, $$
$$ [^{\underline{ϖ^∨}} β_i] = \frac{1}{2}(i\text{th row of } A), \quad [^{\underline{ϖ}} 2 α_i] = 2(i\text{th column of } D^{-1} A). $$
Let $|D|$ be the number of $2$'s in $D$: then the above gets us started with $r + |D|$ pairs of roots.
Building the rest of the vectors by applying simple reflections is straightforward.


There is another way to build root systems, this time by adding roots together rather than reflecting, as in a Lie algebra representation or crystal.
The idea is that the root system, together with $r$ many zeros, defines a crystal graph (the crystal of the adjoint representation for the corresponding Lie algebra).
We can navigate inside this implicit crystal by using the weight along different $i$-strings (which are literally the coordinates in the fundamental weight basis in the reduced case, and otherwise the inner product $⟨α_i^∨, γ⟩$), and indictively figuring out the weight of the top of each $i$-string a root lies along.

To begin with, the highest weight of the $i$-string containing a simple root $α_i$ is $2$, or $4$ if $d_i = 2$ in the non-reduced case.
When $j ≠ i$, since $α_i - α_j$ is not a root (this would contradict the dichotomy of positive and negative roots), $α_i$ is at the bottom of its $j$-string, and so the highest weight of the $j$-string it lies on is $-\wt_j(α_i) = -⟨α_j^∨, α_i⟩ = -a_{ji}$.



## Based root data

A *based root datum* is an embedding of simple roots and coroots into dual ambient spaces, in such a way that the pairing is preserved.
Concretely, a *based root datum* for the Cartan type $A ∈ \Mat_I(\bbZ)$ is the data of:

- Two $\bbR$-vector spaces $X^\vee$ and $X$, together with a perfect pairing $⟨ -, - ⟩ : X^∨ × X → \bbR$,
- A set $Δ^∨ = \set{α_i^∨ ∣ i ∈ I} ⊆ X^∨$ of *simple coroots* and $Δ = \set{α_i ∣ i ∈ I} ⊆ X$ of *simple roots*,

satisfying the condition that $⟨α_i^∨, α_j⟩ = a_{ij}$ for all $i, j ∈ I$.


## Dealing with non-reduced root data

There are a few complications when dealing with non-reduced root data:

- The divisible roots are not in the $W$-orbit of the simple roots, so they need to be added explicitly when generating root systems by reflections.
- The duals $(α_1^\vee, \cdots, α_r^\vee)$ of the simple roots are not necessarily a base of the dual root system: rather for all divisible indices $d ∈ D$ we need to take $(2α_d)^∨ = \frac{1}{2} α_d^∨$ instead.
- The fundamental weights of the root space should be dual to coroot basis, which (because of the above point) is not the same as being dual to the simple coroots.
