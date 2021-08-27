<script lang="ts">
    import { cartan } from 'lielib'

    export let cartanMat = cartan.cartanMat("G", 3)
    export let vertDist = 40
    export let horizDist = 40
    export let colours: string[] = ['blue', 'green', 'red']

    $: layout = cartan.dynkinLayout(cartanMat, {vertDist, horizDist})
    $: minX = Math.min(...layout.nodes.map(layout.nodeX))
    $: minY = Math.min(...layout.nodes.map(layout.nodeY))
</script>

<svg width={layout.width + 20} height={layout.height + 20} viewBox={`${minX} ${minY} ${layout.width+20} ${layout.height+20}`}>
    <g transform="translate(10, 10)">
    {#each layout.nodes as node}
        <circle
            cx={layout.nodeX(node)}
            cy={layout.nodeY(node)}
            r="5"
            fill={colours[node]}
            stroke="black"
            stroke-width="1"
            />
    {/each}
    {#each layout.edges as edge}
        <path
            d={layout.edge(edge)}
            fill="none"
            stroke="grey"
            stroke-width="2"
            />
    {/each}
    </g>
</svg>
