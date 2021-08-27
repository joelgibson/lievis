<script lang="ts">

    import katex from '$lib/katex-v0.13.11/katex.mjs'
    import katex_macros from '$lib/katex_macros'

    export let markup = ""
    export let display = false

    function getHtml(markup) {
        return katex.renderToString(markup, {throwOnError: false, displayMode: display, macros: katex_macros})
    }
</script>

{#if display}
    <div class="math-display">{@html getHtml(markup)}</div>
{:else}
    <span class="math-inline">{@html getHtml(markup)}</span>
{/if}
