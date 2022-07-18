---
title: Stability Conditions
---

<script type="module">
    import StabilityConditions from './StabilityConditions.svelte'

    new StabilityConditions({target: document.getElementById('StabilityConditions')})
</script>

<style>
    section > figure {
        height: min(90vh, 800px);
    }
</style>

Let $\Delta \subseteq \Phi \subseteq V$ be a root system $\Phi$ inside a vector space $V$, with a chosen basis $\Delta$ of simple roots.
A *stability condition* is a linear map $\varphi \colon V \to \mathbb{R}^2$, and such maps are determined by where the simple roots $\Delta$ are sent.

<figure id="StabilityConditions"></figure>
