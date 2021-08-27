---
title: Reduced expression graph
---

<script type="module">
    import RexGraph from './RexGraph.svelte'

    new RexGraph({target: document.getElementById('RexGraph')})
</script>

A an element $w$ in a Coxeter system $(W, S)$ may admit many different reduced expressions in the generators $S$, and by Matsumoto's theorem any reduced expression for $w$ can be made into any other by repeatedly applying the defining braid relations for $(W, S)$. Another way to say this is that the set of reduced expressions form the vertices of an undirected graph, with edges representing braid moves; Matsumoto's theorem is equivalent to this graph being connected.

Mousing over each group element $w$ below will show the reduced expression graph for $w$.

<div id="RexGraph"></div>
