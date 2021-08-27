---
title: Bruhat order
---

<script type="module">
    import BruhatOrder from './BruhatOrder.svelte'

    new BruhatOrder({target: document.getElementById('BruhatOrder')})
</script>

Shows Bruhat order for standard parabolic subgroups.

This is a bit suboptimal right now because the internal representation of Coxeter groups requires the whole group to be enumerated, which is bad for taking quotients. E8/E7 only has 240 elements for example, but the internal representation used means that the whole ~700 million elements of E8 would need to be enumerated before showing these.

In the graphic below, click on the nodes of the Dynkin diagram to select a parabolic subset.

<div id="BruhatOrder"></div>
