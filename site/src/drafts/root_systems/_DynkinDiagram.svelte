<script lang="ts">
    import type { Mat } from 'lielib'
    import { arr, cartan } from 'lielib'
    import Latex from '$lib/components/Latex.svelte'

    export let cartanMat: Mat = cartan.cartanMat("G", 2)
    export let vertDist = 40
    export let horizDist = 40
    export let vertexLabels: (i: number) => string | null = null
    export let aboveLabels: (i: number) => string | null = null
    export let special: boolean[] | null = null
    export let labelOffsetY = 15
    export let reverseX = false

    $: isSpecial = arr.fromFunc(cartanMat.nrows, (i) => (special != null && special[i]))
    $: shortEdges = vertexLabels !== null
    $: layout = cartan.dynkinLayout(cartanMat, {vertDist, horizDist, reverseX})
    $: minX = Math.min(...layout.nodes.map(layout.nodeX))
    $: minY = Math.min(...layout.nodes.map(layout.nodeY))

    $: height = layout.height + 20 + (vertexLabels === null ? 0 : 10 + labelOffsetY)
</script>

<div class="wrapper">
<svg width={layout.width + 20} {height} viewBox={`${minX} ${minY} ${layout.width+20} ${layout.height+20}`}>
    <g transform="translate(10, 10)">
    {#each layout.nodes as node}
        <circle
            cx={layout.nodeX(node)}
            cy={layout.nodeY(node)}
            r={isSpecial[node] ? 4 : 3}
            fill={isSpecial[node] ? 'red' : 'black'}
            />
    {/each}
    {#each layout.edges as edge}
        <path
            d={layout.edge(edge, shortEdges)}
            fill="none"
            stroke={vertexLabels ? 'grey' : 'black'}
            stroke-width="2"
            />
    {/each}
    {#if vertexLabels !== null}
        {#each layout.nodes as node}
            <text
                x={layout.nodeX(node)}
                y={layout.nodeY(node) + labelOffsetY}
                text-anchor="middle"
                dominant-baseline="middle"
                >
                {vertexLabels(node)}
            </text>
        {/each}
    {/if}
    </g>
</svg>
{#if aboveLabels !== null}
    {#each layout.nodes as node}
        <div style={`position: absolute; left: ${5 + layout.nodeX(node)}px; top: ${12 + layout.nodeY(node)}px`}>
            <Latex markup={aboveLabels(node)} />
        </div>
    {/each}
{/if}
</div>

<style>
    div.wrapper { position: relative; }
    div.wrapper > div { text-align: center; }
</style>
