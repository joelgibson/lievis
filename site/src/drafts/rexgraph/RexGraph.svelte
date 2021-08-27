<script type="ts">
    import * as d3 from 'd3-force'
    import { arr, cartan, digraph, EnumCox, maps, rtsys } from 'lielib'
    import type { Mat } from 'lielib'

    const systems: [string, number][] = [
        ['A', 3],
        ['B', 3],
        ['D', 4],
        ['F', 4],
        ['A', 4],
    ]
    let systemIndex = 1

    console.log(d3)
    $: [type, rank] = systems[systemIndex]
    $: C = cartan.cartanMat(type, rank)
    $: cox = new EnumCox(cartan.cartanMatToCoxeterMat(C))
    $: rs = rtsys.createRootSystem(C)
    $: w0word = rtsys.longestWord(rs)
    $: w0elt = cox.growToWord(w0word)
    $: coxElt = w0elt
    $: rexes = cox.reducedExpressions(coxElt)
    $: bruhat = cox.bruhatGraph(w0elt)
    $: layout = digraph.layoutPoset(bruhat, {horizDist: 40, vertDist: 50, orientation: 'up'})
    $: ({nodes, edges} = rexGraph(cartan.cartanMatToCoxeterMat(C), rexes))

    $: d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(20).strength(1))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .stop()
        .tick(100)

    $: width = 50 + Math.max(...nodes.map(node => node.x)) - Math.min(...nodes.map(node => node.x))
    $: height = 50 + Math.max(...nodes.map(node => node.y)) - Math.min(...nodes.map(node => node.y))

    type Node = {rex: number[]}
    function rexGraph(coxeterMat: Mat, rexes: number[][]) {
        let nodes = new maps.EntryVecMap<Node>()
        for (let rex of rexes)
            nodes.set(rex, {rex})

        let edges: {source: Node, target: Node, start: number, mst: number, s: number, t: number}[] = []
        for (let s = 0; s < coxeterMat.nrows; s++) {
            for (let t = s + 1; t < coxeterMat.nrows; t++) {
                let mst = coxeterMat.get(s, t)
                if (mst == 0)
                    continue

                for (let rex of rexes) {
                    for (let start = 0; start + mst - 1 < rex.length; start++) {
                        if (arr.range(mst).every(i => rex[start + i] == ((i % 2 == 0) ? s : t))) {
                            let otherRex = rex.slice()
                            for (let i = 0; i < mst; i++)
                                otherRex[start + i] = ((i % 2 == 0) ? t : s)

                            if (!nodes.contains(otherRex))
                                throw new Error(`Did not find rex ${otherRex}, produced from braiding ${rex}`)

                            edges.push({source: nodes.get(rex), target: nodes.get(otherRex), start, mst, s, t})
                        }
                    }
                }
            }
        }

        return {nodes: maps.values(nodes), edges}
    }
</script>

<select bind:value={systemIndex}>
    {#each systems as [type, rank], i}
        <option value={i}>{type}{rank}</option>
    {/each}
</select>

<svg
    width={layout.width + 20}
    height={layout.height + 20}
    >
    <g transform="translate(10,10)">
        {#each bruhat.edges() as edge}
            <line
                x1={layout.nodeX(edge.src)}
                y1={layout.nodeY(edge.src)}
                x2={layout.nodeX(edge.dst)}
                y2={layout.nodeY(edge.dst)}
                stroke="black"
                stroke-width="1"
                />
        {/each}
        {#each bruhat.nodes() as node}
            <circle
                cx={layout.nodeX(node)}
                cy={layout.nodeY(node)}
                r="5"
                fill="black"
                on:mouseover={() => {coxElt = node.key}}
                />
        {/each}
    </g>
</svg>

There are {rexes.length} reduced expressions for {coxElt}.
<svg
    width={width}
    height={height}
    viewBox={`${-width/2} ${-height/2} ${width} ${height}`}
    >
    {#each edges as edge}
        <line
            x1={edge.source.x}
            y1={edge.source.y}
            x2={edge.target.x}
            y2={edge.target.y}
            stroke="black"
            stroke-width="1"
            />
    {/each}
    {#each nodes as node}
        <circle
            cx={node.x}
            cy={node.y}
            r="4"
            fill="black"
            />
        <!-- <g transform={`translate(${node.x}, ${node.y})`} text-anchor="middle">
            <text>{node.rex.join('')}</text>
        </g> -->
    {/each}
</svg>
