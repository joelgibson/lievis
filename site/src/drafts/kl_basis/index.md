---
title: How to construct the Kazhdan-Luztig basis
---

<script type="module">
    import KLTriangles from './KLTriangles.svelte'

    Array.from(document.getElementsByTagName('KLTriangles')).forEach(node => {
        let props = {
            topElt: node.getAttribute('topElt') || '',
            botElt: node.getAttribute('botElt') || '',
            topLatex: node.getAttribute('topLatex') || '',
            botLatex: node.getAttribute('botLatex') || '',
            tilted: node.getAttribute('tilted') && true || false,
        }
        new KLTriangles({target: node.parentElement, anchor: node, props})
        node.remove()
    })
</script>

Upon re-reading Section 3.3.2 of _Introduction to Soergel Bimodules_, I feel that the chapter authors might have done a better job at explaining the algorithm behind constructing (and therefore proving the existence of) the Kazhdan-Lusztig basis of the Hecke algebra, as well as some of the symmetry properties and the $\mu$-coefficients.
Right-multiplication by a generator partitions a Coxeter group into pairs, and right multiplication by $\delta_s$ or $b_s$ upon the standard basis just mixes coefficients inside of each pair.
This affords a nice diagrammatic schematic of what is actually going on.

## Inductively constructing basis elements

For the base case, we have $b_{\id} = 1$. We could also throw in $b_s = \delta_s + v$ for each $s \in S$. Now, let $x \in W$ be an element such that we know all $b_w$ for $w < x$.

First, locate a right descent $s \in S$ such that $xs < x$. The basic idea is to form the product $b_{xs} b_s$, which is self-dual and has a top term of $\delta_x$, but may violate the degree bound condition. We then show that we can subtract off various $b_w$ for $w < x$ in order to correct the degree bound condition; then the resulting element must be $b_x$.

Firstly, consider the terms of $b_{xs} = \delta_{xs} + \sum_{y < xs} h_{y, xs} \delta_y$.
Right multiplication by $s$ partitions the whole group $W$ into pairs $\set{y, ys}$.
Let us relabel so that $y$ is the top element in each pair, $ys < y$.
The coefficient $h_{ys, xs}$ is nonzero only when $ys \leq xs$, and so the pairs where $ys \leq xs$ fall into these three cases:

<figure class="col">
    <figure class="row full">
        <figure class="col">
            <KLTriangles topElt="x" botElt="xs" topLatex="0" botLatex="1 = h_{xs, xs}"></KLTriangles>
            <figcaption>Case 1: the top pair $xs < x$</figcaption>
        </figure>
        <figure class="col">
            <KLTriangles topElt="y" botElt="ys" topLatex="0" botLatex="h_{ys, xs}" tilted="true"></KLTriangles>
            <figcaption>Case 2: a pair $ys < y$, with $ys < xs$ but $y \not < xs$</figcaption>
        </figure>
        <figure class="col">
            <KLTriangles topElt="y" botElt="ys" topLatex="h_{y, xs}" botLatex="h_{ys, xs}"></KLTriangles>
            <figcaption>Case 3: a pair <m>ys &lt; y</m>, with <m>y &lt; xs</m></figcaption>
        </figure>
    </figure>
    <figcaption>
        The element $b_{xs}$
    </figcaption>
</figure>

Case 1 is the very top pair, which we treat separately for illustrative purposes. Case 2 is where $ys < xs$ but $y \not < xs$ (we have drawn this on its side to try and illustrate this). Although $b_{xs}$ has no $\delta_{y}$ term in case 2, $b_{xs} b_s$ will have a $\delta_y$ term. Case 3 is the case where both $y$ and $ys$ are already less than $xs$ (the vast majority of elements will fall into this case). In cases 2 and 3, all coefficients lie in the ideal $v \bbZ[v]$ by the degree bound condition.

We now right-multiply by $b_s$. The right multiplication formula is
$$
\delta_{w} b_s = \begin{cases}
    \delta_{ws} + v \delta_{w}
        & \text{when } w < ws, \\
    \delta_{ws} + v^{-1} \delta
        & \text{when } w > ws,
\end{cases}
$$
so a coefficient either moves up and leaves $v$ times itself behind, or moves down and leaves $v^{-1}$ times itself behind. Multiplying our three cases above by $b_s$ on the right, we arrive at

<figure class="col">
    <figure class="row full">
        <figure>
            <KLTriangles topElt="x" botElt="xs" topLatex="1" botLatex="v"></KLTriangles>
            <figcaption>Case 1</figcaption>
        </figure>
        <figure>
            <KLTriangles topElt="y" botElt="ys" botLatex="v h_{ys, xs}" topLatex="h_{ys, xs}" tilted="true"></KLTriangles>
            <figcaption>Case 2</figcaption>
        </figure>
        <figure>
            <KLTriangles topElt="y" botElt="ys" topLatex="h_{ys, xs} + v^{-1} h_{y, xs}" botLatex="v h_{ys, xs} + h_{y, xs}"></KLTriangles>
            <figcaption>Case 3</figcaption>
        </figure>
    </figure>
    <figcaption>
        The element $b_{xs} b_s$
    </figcaption>
</figure>

Now we indeed have a top coefficient $\delta_x$ of $1$, and cases 1 and 2 automatically satisfy the degree bound condition. The only place something could have gone wrong is in case 3: if $h_{y, xs}$ has a nonzero $v^1$ term, then $v^{-1} h_{y, xs}$ has a constant term. Define the $\mu$-coefficients
$$
\mu_{y, w} = \text{coefficient of } v^1 \text{ in } h_{y, w}.
$$
Since $h_{y, y} = 1$, we can maintain self-duality and the degree bound condition by subtracting multiples of $b_y$ where appropriate, by subtracting $\mu_{y, xs} b_y$ from each case 3 pair.
Since $b_y$ has a constant coefficient only at $\delta_y$, and each other term lies in the ideal $v \bbZ[v]$, by doing this subtraction we do not affect the degree bound condition anywhere else.
Hence we arrive at the element
$$
b_{x} = b_{xs} b_s - \sum_{y \colon ys < y < xs} \mu_{y, xs} b_y
$$
which is self-dual, has a $\delta_{x}$ coefficient of 1, and satisfies the degree bound condition.
Therefore it is indeed the canonical basis element.

## A symmetry property

A key symmetry property of the KL polynomials is that for every pair $x \in W$, $s \in S$ with $xs < x$, we have $h_{ys, x} = v h_{y, x}$ whenever $ys < y$. This is almost self-evident from the diagrams above: already when looking at the element $b_{xs} b_s$ we can see that every bottom triangle is $v$ times the top triangle. Furthermore, we are only subtracting off some multiples of $b_y$ for $y$ in the top triangles; so the property holds by induction since it holds for the generators $b_s$ in particular.

After acknowledging this property, it is straightforward to show the following complete multiplication formula:
$$
b_x b_s = \begin{cases}
    b_{xs} + \sum_{y \colon ys < y < x} \mu_{y, x} b_y
        & \text{if } x < xs, \\
    (v + v^{-1})b_y
        & \text{if } x > xs.
\end{cases}
$$
The formula for $b_s b_x$ is analagous (note that while the $\mu_{y, x}$ coefficients do not depend on whether multiplication is on the right or left, in one case we are summing over the $y$ with $ys < y$, and in the other case we are summing over the $y$ with $sy < y$). This shows that the $\mu$ coefficients control the structure constants of the canonical basis, and indeed the $\mu$-coefficients are used to define the left, right, and two-sided cells of $W$.
