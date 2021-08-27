---
title: How to read Cartan matrices
---

<script>
    import CartanMatrices from './_CartanMatrices.svelte'
</script>

Dynkin diagrams are a compact method of encoding Cartan matrices, but it can be challenging to try to remember which way around the arrows go. This is not usually an issue when working theoretically, but in examples or programming where everything has to be explicit, getting things around the right way is important.

## 5 kinds of junctions

The convention used here is that the Cartan matrix $A = [a_{ij}]$ associates rows with _coroots_ and columns with _roots_, so we have $a_{ij} = \innprod{\alpha_i^\vee, \alpha_j}$. Equivalently, in some Weyl-invariant symmetric bilinear form $(-, -)$ we have $a_{ij} = 2 \frac{(\alpha_i, \alpha_j)}{(\alpha_i, \alpha_i)}$.
As far as I am aware, this convention is standard throughout the Kac-Moody and quantum groups literature.

In the table below, we consider to have fixed the ordering $i < j$, so that $i$ is the left vertex in the Dynkin diagram, and
$$
[a_{ij}] = \begin{pmatrix} a_{ii} & a_{ij} \\ a_{ji} & a_{jj} \end{pmatrix}.
$$
The other columns are explained below.

<CartanMatrices />

- The column $a_{ij} a_{ji}$ records the product of the off-diagonal entries, which determines $m_{ij}$.
- The number $m_{ij}$ is the order of $(s_i s_j)$ in the Weyl group, so that $(s_i s_j)^{m_{ij}} = 1$.
- The matrix $[i \cdot j]$ is the smallest integral symmetrisation of $[a_{ij}]$ such that the diagonals are positive even integers. The diagonal entries record the square lengths of roots. We can see that the arrow always points to the smaller root, and that the number of lines is the ratio of the square lengths of the roots.

There are three kinds of nontrivial junction with $m_{ij} < \infty$, which come from the $A_2$, $B_2$ or $C_2$, and $G_2$ Dynkin diagrams. The $G_2$ junction appears exclusively in finite type $G_2$, and affine types $G_2^{(1)}$ and and $D_4^{(3)}$. The other two kinds of junction seen in affine type are the $A_1^{(1)}$ kind and $A_2^{(2)}$ kinds, seen only in those exact Cartan types.

In Lusztig's _Introduction to quantum groups_, the matrix $[i \cdot j]$ is called a _Cartan datum_, and is used in place of the Cartan matrix. This has the effect of forcing all Cartan matrices to be symmetrisable, and is further important because the choice of normalisation $i \cdot i$ features in the definition of the quantum group.

## Conventions used in books

The books I know of that use the same $a_{ij} = \innprod{\alpha_i^\vee, \alpha_j}$ convention on this page are:

1. _Infinite-dimensional Lie algebras_ by Victor Kac, 3rd Edition (1990). $a_{ij}$ introduced in Section 1.1.
2. _Quantum groups and their primitive ideals_ by Anthony Joseph (1995). In section 3.1 we have $a_{ij} = (\alpha_i^\vee, \alpha_j)$.
3. _Lectures on Quantum Groups_ by Jens Carsten Jantzen (1996). At the start of Chapter 4, we have $a_{\alpha \beta} = 2 (\alpha, \beta) / (\alpha, \alpha)$.
4. _Kac-Moody groups, their flag varieties and representation theory_ by Shrawan Kumar (2002). In definition 1.1.2 we have $a_{ij} = \alpha_j(\alpha_i^\vee)$.
5. _Introduction to quantum groups and crystal bases_ by Hong and Kang (2002). In section 2.1 we have $a_{ij} = \alpha_j(h_i)$.
6. Kashiwara's papers on crystals and quantized enveloping algebras.

A very notable exception which uses the opposite convention is Bourbaki, who sets $n(\alpha, \beta) = 2 (\alpha | \beta) / (\beta | \beta)$ (VI, Section 1, part 5, definition 3).

