<script lang="ts">
    import { cartan, digraph, rtsys } from 'lielib'

    const minRanks = {'A': 1, 'B': 2, 'C': 2, 'D': 3, 'E': 6, 'F': 4, 'G': 2}
    const maxRanks = {'A': 8, 'B': 8, 'C': 8, 'D': 8, 'E': 8, 'F': 4, 'G': 2}

    export let type: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' = "B"
    export let setRank: number = 5
    $: rank = Math.min(Math.max(minRanks[type], setRank), maxRanks[type])

    const margin = {x: 150, y: 50}

    let displayBasis: 'rt' | 'wt' = 'rt'
    let showLabels: boolean = true
    let posetKind: 'addition' | 'reflection' = 'addition'

    $: C = cartan.cartanMat(type, rank)
    $: dynkLayout = cartan.dynkinLayout(C)
    $: rs = rtsys.createRootSystem(C)
    $: graph = (posetKind == 'addition') ? rtsys.rootPosetDigraph(rs) : rtsys.rootReflectionDigraph(rs)
    $: layout = digraph.layoutPoset(graph, {
        horizDist: showLabels ? 120 : 80,
        vertDist: showLabels ? 80 : 60,
        orientation: 'up',
    })

    function heightprod(rs: rtsys.IRootSystem): number {
        let prod = 1
        for (let root of rs.posRoots)
            prod *= root.height

        return prod
    }
</script>

<style>
    div.wrapper {
        width: 100%;
        height: 100%;
        margin: 0;
        position: relative;
        overflow: visible;
    }
    div.controls {
        border: 1px solid #aaa;
        background-color: white;

        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 0.8rem;

        display: flex;
        flex-direction: column;
        padding: 5px;
        width: 18em;
    }

    div.control-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
</style>

<div class="controls">
    <span>Root poset</span>
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
    <div class="control-row">
        <select bind:value={posetKind}>
            <option value="addition">Root poset</option>
            <option value="reflection">Root reflections</option>
        </select>
    </div>
    <div class="control-row">
        <label for="viewRoots">Basis:</label>
        Root <input type="radio" bind:group={displayBasis} value="rt">
        Weight <input type="radio" bind:group={displayBasis} value="wt">
    </div>
    <div class="control-row">
        <label for="showLabels">Show labels:</label>
        <input type="checkbox" id="showLabels" bind:checked={showLabels}>
    </div>
    <div class="control-row">
        {rs.posRoots.length} positive roots
    </div>
    <!-- <div class="control-row">
        Dimension denominator {heightprod(rs).toLocaleString()}
    </div> -->
</div>

<svg width={dynkLayout.width + 20} height={dynkLayout.height + 50}>
    <g transform="translate(10, 10)">
        {#each dynkLayout.edges as edge}
            <path
                d={dynkLayout.edge(edge)}
                stroke="black"
                stroke-width="1"
                fill="none"
                />
        {/each}
        {#each dynkLayout.nodes as node}
            <circle
                cx={dynkLayout.nodeX(node)}
                cy={dynkLayout.nodeY(node)}
                r={5}
                fill={`hsl(${17.03665 * node}rad,80%,50%)`}
                />
            <text
                x={dynkLayout.nodeX(node)}
                y={dynkLayout.nodeY(node) + 20}
                text-anchor="middle"
                >
                {node + 1}
            </text>
        {/each}
    </g>
</svg>

<div class="wrapper">
    <svg width={layout.width + margin.x} height={layout.height + margin.y}>

        <g transform="translate({margin.x/2}, {margin.y/2})">
        {#each graph.edges() as edge}
            <line
                x1={layout.nodeX(edge.src)}
                y1={layout.nodeY(edge.src)}
                x2={layout.nodeX(edge.dst)}
                y2={layout.nodeY(edge.dst)}
                stroke={`hsl(${17.03665 * edge.data}rad,80%,50%)`}
                stroke-width="2"
                />
        {/each}
        {#each graph.nodes() as node}
            <circle
                cx={layout.nodeX(node)}
                cy={layout.nodeY(node)}
                r="4"
                fill="black"
                />
        {/each}
        {#if showLabels}
            {#each graph.nodes() as node}
            <text
                x={layout.nodeX(node)}
                y={layout.nodeY(node) - 10}
                text-anchor="middle"
                dominant-baseline="middle"
                >
                {#if displayBasis == 'rt'}
                    α[{node.data.rt.join('')}]
                {:else}
                    ϖ[{node.data.wt.join(',')}]
                {/if}
            </text>
            {/each}
        {/if}
        </g>
    </svg>
</div>
