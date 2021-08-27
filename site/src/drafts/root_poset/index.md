---
title: The root poset
---

<script type="module">
    import RootPoset from './RootPoset.svelte'

    new RootPoset({target: document.getElementById('RootPoset')})
</script>

There are two different graphs shown below. The one labelled *Root Poset* has vertices as roots, with the simple roots at the bottom, and a labelled edge $\alpha \xto{i} \beta$ if $\alpha + \alpha_i = \beta$. All edges in the root poset graph are directed edges, going up the page.

The one labelled *Root reflections* has vertices as roots, but this time there is an $i$-labelled undirected edge $\set{\alpha, \beta}$ if $s_i(\alpha) = \beta$. The root reflection graph is disconnected in non-simply-laced types, separated into two pieces by the length of the roots.

My plan for this was for it to eventually become part of a how-to-build-a-root-system explanation, starting from a Cartan matrix.

<div id="RootPoset"></div>
