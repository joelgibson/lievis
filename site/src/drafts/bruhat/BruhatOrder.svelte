<script lang="ts">
    import { arr, cartan, digraph, EnumCox, mat, rtsys } from 'lielib'

    const minRanks = {'A': 1, 'B': 2, 'C': 2, 'D': 3, 'E': 6, 'F': 4, 'G': 2}
    const maxRanks = {'A': 8, 'B': 8, 'C': 8, 'D': 8, 'E': 8, 'F': 4, 'G': 2}

    export let type: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' = "B"
    export let setRank: number = 5
    $: rank = Math.min(Math.max(minRanks[type], setRank), maxRanks[type])

    let parabolicBools = arr.constant(rank, false)

    $: cartanMat = cartan.cartanMat(type, rank)
    $: dynkLayout = cartan.dynkinLayout(cartanMat, {horizDist: 40, vertDist: 40})
    $: rs = rtsys.createRootSystem(cartanMat)
    $: parabolicBools = arr.fromFunc(rank, i => parabolicBools[i])
    $: parabolicIndices = parabolicBools.map((x, i) => x ? i : -1).filter(x => x >= 0)

    function createPoset(rs, parabolicIndices: number[]) {
        let weylOrder = rtsys.weylOrder(rs)
        let parabolicOrder = rtsys.weylOrder(rs, parabolicIndices)
        if (weylOrder > 60000 || weylOrder / parabolicOrder > 200)
            return {kind: 'toolarge'}

        let cox = new EnumCox(cartan.cartanMatToCoxeterMat(rs.cartan))
        let w0 = cox.growToWord(rtsys.longestWord(rs))
        let G = cox.bruhatGraph(w0, cox.rightQuotient(parabolicIndices))
        let layout = digraph.layoutPoset(G, {horizDist: 40, vertDist: 30, orientation: 'up'})

        return {kind: 'shown', G, layout}
    }

    $: state = createPoset(rs, parabolicIndices)

</script>

<div class="control-row">
    <select bind:value={type}>
        {#each 'ABCDEFG'.split('') as type}
            <option value={type}>{type}</option>
        {/each}
    </select>
    <input type="range"
        min={minRanks[type]}
        max={maxRanks[type]}
        bind:value={setRank}>

    {type}{rank}
</div>

Weyl group size {rtsys.weylOrder(rs)}, parabolic subgroup size {rtsys.weylOrder(rs, parabolicIndices)}, quotient size {rtsys.weylOrder(rs) / rtsys.weylOrder(rs, parabolicIndices)}

<svg
    width={dynkLayout.width+40}
    height={dynkLayout.height+60}
    >
    <g transform="translate(20, 20)">
        {#each dynkLayout.edges as edge}
            <path
                d={dynkLayout.edge(edge)}
                fill="none"
                stroke="black"
                stroke-width="2"
                />
        {/each}
        {#each dynkLayout.nodes as node}
        <circle
            cx={dynkLayout.nodeX(node)}
            cy={dynkLayout.nodeY(node)}
            r={5}
            fill="black"
            on:click={() => {
                parabolicBools[node] = !parabolicBools[node]
            }}
            />
        {#if parabolicBools[node]}
            <circle
                cx={dynkLayout.nodeX(node)}
                cy={dynkLayout.nodeY(node)}
                r={10}
                fill="none"
                stroke="black"
                stroke-width="1"
            />
        {/if}
        {/each}
    </g>
</svg>

{#if state.kind == 'shown'}
<svg
    width={state.layout.width + 20}
    height={state.layout.height + 20}
    >
    <g transform="translate(10,10)">
        {#each state.G.edges() as edge}
            <line
                x1={state.layout.nodeX(edge.src)}
                y1={state.layout.nodeY(edge.src)}
                x2={state.layout.nodeX(edge.dst)}
                y2={state.layout.nodeY(edge.dst)}
                stroke="black"
                stroke-width="1"
                />
        {/each}
        {#each state.G.nodes() as node}
            <circle
                cx={state.layout.nodeX(node)}
                cy={state.layout.nodeY(node)}
                r="5"
                fill="black"
                />
        {/each}
    </g>
</svg>
{:else}
Too large!
{/if}
