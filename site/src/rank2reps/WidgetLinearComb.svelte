<!-- A widget with a checkbox, whose purpose is to show the full expansion
     A(lambda) = B(weight1) + B(weight2) + ...
-->

<script lang="ts">
    import { fmt } from 'lielib'

    // Input parameters: the linear combination, the lattice label, the main label, the expansion labels.
    export let character = null
    export let latticeLabel = 'x'
    export let A = 'L'
    export let lambda = [1]
    export let B = 'e'
</script>

<style>
    pre {
        max-height: 15rem;
        overflow: auto;
    }
</style>

<!-- We need to deal with the possibility that the character is null here, since we have cases like
     G2 where we can't quite compute the weights. -->
{#if character != null}
<pre>
Support: {character.size().toLocaleString()} terms
{A}({@html fmt.linComb(lambda, latticeLabel)}) =
{#each character.toPairs() as [wt, mult]}
{"\n   "}{mult} {B}({@html fmt.linComb(wt, latticeLabel)})
{:else}
0
{/each}
</pre>
{:else}
    <pre>Unknown</pre>
{/if}
