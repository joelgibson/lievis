---
title: Grid paper
---

<script type="module">
    import GridPaper from './GridPaper.svelte'

    new GridPaper({target: document.getElementById('GridPaper')})
</script>

<style>
    #GridPaper {
        height: min(90vh, 800px);
    }
</style>

<div id="GridPaper"></div>
