<script lang="ts">
import FullscreenableContainer from "$lib/components/FullscreenableContainer.svelte";
import { aff, draw, maps, Queue, vec } from "lielib";

    let fullscreen = false

    let width = 100, height = 100
    let portAff = aff.Aff2.id
    $: portAff = aff.Aff2.id.scale(width/3, -width/3).translate(width/2, width/2)
    $: D = new draw.NewCoords(draw.viewPort(0, 0, width, width), portAff)

    /** Create a grid of (x, y, z) points such that x + y + z = 0, with
     * each point connected to its six neighbours via adding the six roots of A_2.
    */
    function createGrid(diameter: number) {
        let roots = [
            [1, -1, 0],
            [1, 0, -1],
            [0, 1, -1],
            [-1, 1, 0],
            [-1, 0, 1],
            [0, -1, 1],
        ]

        let dists = new maps.EntryVecMap<number>()
        let edges = new maps.EntryVecMap<number[][]>()

        dists.set([0, 0, 0], 0)
        edges.set([0, 0, 0], [])

        let queue = new Queue([[0, 0, 0]])
        while (queue.size() > 0) {
            let point = queue.dequeue()
            if (dists.get(point) > diameter)
                continue

            for (let root of roots) {
                let neigh = vec.add(point, root)
                if (!dists.contains(neigh)) {
                    dists.set(neigh, dists.get(point) + 1)
                    edges.set(neigh, [])
                    queue.enqueue(neigh)
                }

                edges.get(point).push(neigh)
            }
        }

        return {points: maps.keys(dists), dists, edges}
    }

    function containerResized(event) {
        width = event.detail.width
        height = event.detail.height
    }

    console.log(createGrid(3).points)
</script>

<style>
    svg { border: 1px solid black; }
    button { position: absolute; top: 5px; left: 5px; }
</style>

<FullscreenableContainer on:resize={containerResized} bind:fullscreen>
    <button on:click={() => {fullscreen = !fullscreen}}>Fullscreen</button>
    <svg {width} {height}>

    </svg>
</FullscreenableContainer>
