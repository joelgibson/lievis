<script lang="ts">
    import Latex from '$lib/components/Latex.svelte'
    import FullscreenableContainer from '$lib/components/FullscreenableContainer.svelte'
    import {aff, arr, cartan, draw, maps, mat, matmut, rtsys, vec} from 'lielib'

    let width = 800
    let height = 800
    function resize(event) {
        width = event.detail.width
        height = event.detail.height
    }

    let type = 'A'
    const minRanks = {'A': 1, 'B': 2, 'C': 2, 'D': 4, 'E': 6, 'F': 4, 'G': 2}
    const maxRanks = {'A': 8, 'B': 8, 'C': 8, 'D': 8, 'E': 8, 'F': 4, 'G': 2}
    let setRank = 3
    let showLabels = false
    $: rank = Math.min(Math.max(minRanks[type], setRank), maxRanks[type])

    $: cartMat = cartan.cartanMat(type, rank)
    $: rs = rtsys.createRootSystem(cartMat)

    $: rootToPort = mat.fromColumns(arr.range(rank).map(i => [Math.cos(Math.PI / rank * i), Math.sin(Math.PI / rank * i)]))

    const portAff = aff.Aff2.id.scale(width/6, -width/6).translate(width/2, width/2)
    const coords = new draw.NewCoords(draw.viewPort(0, 0, width, width), portAff)

    let dragging: number | null = null
    let svg: SVGSVGElement | null = null

    function startDrag(i: number) { dragging = i; }
    function onMouseMove(event: MouseEvent) {
        if (dragging === null || svg == null)
            return

        let svgRect = svg.getBoundingClientRect()
        let x = event.clientX - svgRect.left
        let y = event.clientY - svgRect.top
        let newRootToPort = mat.copy(rootToPort)
        matmut.set(newRootToPort, 0, dragging, portAff.u(x, y))
        matmut.set(newRootToPort, 1, dragging, portAff.v(x, y))
        rootToPort = newRootToPort
    }
</script>

<style>
    .controls { position: absolute; top: 5px; left: 5px; }
    .nondraggable { user-select: none; color: grey; }
    .draggable { cursor: grab; user-select: none; }
</style>

<svelte:window on:mousemove={onMouseMove} on:mouseup={() => dragging = null} />


<FullscreenableContainer on:resize={resize}>
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
            <label for="labels">Labels</label>
            <input type="checkbox" bind:checked={showLabels} />
        </div>

    </div>

    <svg width={width} height={height} bind:this={svg}>
        <!-- Negative roots -->
        {#each rs.posRoots as root}
            <path d={coords.vector(mat.multVec(rootToPort, vec.neg(root.rt)))} stroke="red" />
        {/each}

        <!-- Positive non-simple roots -->
        {#each rs.posRoots.slice(rank) as root}
            <path d={coords.vector(mat.multVec(rootToPort, root.rt))} stroke="blue" />
        {/each}

        <!-- Simple roots-->
        {#each rs.posRoots.slice(0, rank) as root}
            <path d={coords.vector(mat.multVec(rootToPort, root.rt))} stroke="black" />
        {/each}
    </svg>

    {#if showLabels}
        <!-- Negative roots -->
        {#each rs.posRoots as root}
            <div style={coords.absPosition(mat.multVec(rootToPort, vec.neg(root.rt)), 'vector')} class="nondraggable">
                <Latex markup={"-" + root.rt.map(x => x + '').join('')} />
            </div>
        {/each}

        <!-- Positive non-simple roots -->
        {#each rs.posRoots.slice(rank) as root}
            <div style={coords.absPosition(mat.multVec(rootToPort, root.rt), 'vector')} class="nondraggable">
                <Latex markup={root.rt.map(x => x + '').join('')} />
            </div>
        {/each}
    {/if}

    <!-- Simple roots -->
    {#each rs.posRoots.slice(0, rank) as root, i}
        <div style={coords.absPosition(mat.multVec(rootToPort, root.rt), 'vector')} class="draggable" on:mousedown={(e) => startDrag(i)}>
            <Latex markup={root.rt.map(x => x + '').join('')} />
        </div>
    {/each}
</FullscreenableContainer>
