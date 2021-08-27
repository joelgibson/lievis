<script lang="ts">
    import { vec, draw, cartan, rtsys, rt2d } from 'lielib'

    export let width = 150, height = 150
    export let cartanMat = cartan.cartanMat('A', 2)

    $: rs = rtsys.createRootSystem(cartanMat)
    $: ({proj, sect} = rt2d.euclideanProjSect(rs))
    $: D = draw.Coords.fromLegacy(width, height, [width/2, height/2], 25, proj, sect)
</script>

<svg width={width} height={height}>
    {#each rs.posRoots as root}
        <!-- Fundamental chamber -->
        <path
            d={D.openTriangle([1, 0], [0, 1])}
            fill="lightgreen"
            />

        <!-- Positive roots -->
        <path
            d={D.vector(root.wt)}
            stroke={root.index < 2 ? 'red' : 'black'}
            stroke-width="{root.index < 2 ? 1.5 : 1}"
            />

        <!-- Negative roots -->
        <path
            d={D.vector(vec.neg(root.wt))}
            stroke="black"
            stroke-width="1px"
            />
    {/each}
</svg>
