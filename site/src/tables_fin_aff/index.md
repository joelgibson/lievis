---
title: Tables _Fin_ and _Aff_
---

<script type="module">
    import Fin from './_Fin.svelte'
    import Aff1 from './_Aff1.svelte'
    import Aff23 from './_Aff23.svelte'

    new Fin({target: document.getElementById('Fin')})
    new Aff1({target: document.getElementById('Aff1')})
    new Aff23({target: document.getElementById('Aff23')})
</script>

<style>
    /** Add scrollbars for phones, remove them for larger displays. */
    figure { overflow: auto; }
    @media screen and (min-width: 1024px) {
        figure { overflow: inherit; }
    }
</style>

Chapter 4 of the book _Infinite dimensional Lie algebras_ by Kac classifies the Cartan matrices of finite and affine type. Each Cartan matrix of finite type defines a crystallographic root system and finite Weyl group, and each is listed in _Table Fin_. Tables _Aff 1_, _Aff 2_, and _Aff 3_ list the Cartan matrices of affine type. [See here](cartan_matrices.html) for a reminder on how to read Dynkin diagrams.

## Table _Fin_

Table _Fin_ lists the finite-type Dynkin diagrams, along with various data about their associated Weyl groups and root systems.

<figure id="Fin"></figure>

The columns in this table are:

- The *Dynkin diagram* is a compact representation of the Cartan matrix. The arrow points from long roots to short roots; for example $C_3$ has two short simple roots. When taking the untwisted affinisation, the affine vertex will attach at the red vertex. (These can be determined by looking at the highest root $\widetilde{\alpha}$ in the fundamental weight basis)
- $|S|$: The *rank* of the simple Lie algebra, or Coxeter group.
- $|R|$: the number of roots. The number of positive roots is half the number of roots.
- $|Q/P|$: the *index of connection*, the index of the root lattice in the weight lattice. Alternatively, the determinant of the Cartan matrix.
- $|W|$ the order of the Weyl group, calculated using the index of connection and the coefficients of the highest root: $|W| = |S|! \times [Q : P] \times a_1 \cdots a_{|S|}$.
- $l(w_0)$ is the length of the longest element of $W$. This is equal to the number of positive roots.
- $h$ the *Coxeter number*, the order of a _Coxeter element_. A Coxeter element is a product of reflections incident on a single chamber, and all such elements are conjugate in $W$. Alternatively, $h = 1 + \sum_i a_i$, or one more than the height of the highest root.
- $a_i$ the coefficients of the highest root in the root basis: $\tilde{\alpha} = \sum_{i} a_i \alpha_i$.
- $h^\vee$ the dual Coxeter number: $h^\vee = 1 + \sum_i a_i^\vee$.
- $a_i^\vee$ the coefficients of the dual of the highest root (which is the highest short coroot): $(\tilde{\alpha})^\vee = \sum_i a_i^\vee \alpha_i^\vee$.
- $m_i$: the _exponents_ of the group. These describe the eigenvalues (with multiplicity) of a Coxeter element, where each eigenvalue is written as $\exp\left(2 \pi i m_i / h\right)$. These are *not* indexed by simple roots, are are instead listed in weakly increasing order.
- $d_i$ (not shown): the degrees of the fundamental invariants of $W$ acting on $\Sym(V^*)$ with $V$ an irreducible representation of $W$. These can be derived from the exponents: $d_i = m_i + 1$.

The Cartan types $B_n$ and $C_n$ are *dual* under the switching of their root and coroot systems (alternatively, transposing the Cartan matrix).
However, looking at the special vertex in their Dynkin diagrams, as well as the coefficients $a_i^\vee$, one sees that this data is *not* swapped under duality.
A consequence of this is that taking duals does not commute with affinisation.


## Table _Aff 1_

_Table Aff 1_ contains the Dynkin diagrams of the untwisted affine algebras: these are the affine Dynkin diagrams that can be obtained by an untwisted affinisation of the finite type Dynkin diagrams in _Table Fin_. The Cartan entries are obtained as follows: if $\alpha_0$ is the new affine root, then the new column of the Cartan matrix is defined by $a_{i0} = \innprod{\alpha_i^\vee, \alpha_0} = \innprod{\alpha_i^\vee, -\widetilde{\alpha}}$, where $\widetilde{\alpha}$ is the highest root in the finite root system. Similarly, $a_{0j} = \innprod{\alpha_0^\vee, \alpha_j} = \innprod{-\widetilde{\alpha}^\vee, \alpha_j}$, where $\widetilde{\alpha}^\vee$ is the coroot associated to the highest root (equivalently, the _highest short coroot_).

In Kac' notation, $A_{n}^{(1)}$ means the untwisted affinisation starting from $A_n$; in particular $A_{n}^{(1)}$ has $n + 1$ nodes.

<figure id="Aff1"></figure>

Some columns of this table need to be interpreted differently:

- The red vertex in the Dynkin diagram is indicating the affine vertex that was attached during the construction of the affine algebra from the finite one. This is _not_ a canonical property of the diagram, but is useful to know when studying the algebra. We have $a_0 = 1$ in all but the case of $A_{2n}^{(2)}$ (shown in a table below), and $a_0^\vee = 1$ always.
- The marks $a_i$ are the coefficients of a linear dependence in the columns of the Coxeter matrix. They define a _null root_ $\delta = \sum_i a_i \alpha_i$ (not a root, but rather a distinguished element of the root lattice), so that in any realisation of the root system we have $\innprod{\alpha_i^\vee, \delta} = 0$ for all coroots $\alpha_i^\vee$.
- The _Coxeter number_ $h = \sum_i a_i$.
- The comarks $a_i^\vee$ are the coefficients of a linear dependence in the rows of the Coxeter matrix. They define the _canonical central element_ $K = \sum_i a_i^\vee \alpha_i^\vee$ (commonly also written as $c$). In any realisation of the root system we have $\innprod{K, \alpha_i} = 0$ for all $i$. The canonical central element defines the _level_ of a representation.
- The _dual Coxeter number_ $h^\vee = \sum_i a_i^\vee$.

Note that now due to the symmetry in the definitions of $a_i$ and $a_i^\vee$, we _do_ have for affine Dynkin diagrams that $a_i$ in the dual diagram is equal to $a_i^\vee$. There is a _twist_ (ha-ha) however: some of the dual diagrams do not appear in Table Aff 1, rather they only appear in tables Aff 2 and 3, meaning that their corresponding algebras are more complicated to construct when starting from a finite-dimensional algebra.

## Tables _Aff 2_ and _Aff 3_

The remaining affine type Dynkin diagrams arise through _twisted affinisation_, which is a more complicated process. Roughly how this is done is we first isolate a nontrivial _diagram automorphism_ of one of the finite type diagrams. There are not so many of these: we can flip $A_n$ for $n \geq 2$ (an order $r = 2$ automorphism), we can flip $E_6$ along its longest path (order $r = 2$), we can interchange the two end vertices of $D_n$ for $n \geq 4$ (order $r = 2$), and we can rotate the leaves of $D_4$ (order $r = 3$). One then performs the loop algebra construction on the fixed-point subalgebra defined by the automorphism, using the automorphism to twist the Lie algebra structure somehow. We get several new types of diagrams:

<figure id="Aff23"></figure>

The only entry in table _Aff 3_ is $D_4^{(3)}$. Also observe that if we were only interested in the Coxeter matrices associated to each Dynkin diagram, we would have already found all of the affine ones in table _Aff 1_.

Every indecomposable Dynkin diagram of finite or affine type appears in the tables above. Note that $A_3^{(2)} = C_2^{(1)}$, so by convention we remove $A_2^{(3)}$ in order to get an irredundant list.
