<script lang="ts">
import { createSVGSnapshot } from '$lib/snapshots';

    import {arr} from 'lielib'

    const margin = 100

    /** How far apart horizontally are the ideal slits? */
    const slitDistance = 100

    /** Radius of the outer circles. */
    const outerRadius = slitDistance / 2 - 10

    /** How far apart vertically are the levels? */
    const levelDistance = 100

    /** How far to the left or right the ramp is placed from the ideal vertical slit. */
    const rampOffsetX = 20
    const rampOffsetY = 20

    /** Radius of the keyhole arc. */
    const keyRadius = 5

    /** The coordinates of a ramp are identified by level l, index i, and dx +-1 and dy +- 1. */
    const rampX = (l: number, i: number, dx: number, dy: number) => i * slitDistance + dx * rampOffsetX
    const rampY = (l: number, i: number, dx: number, dy: number) => l * levelDistance + dy * rampOffsetY
    const ramp = (l: number, i: number, dx: number, dy: number) => rampX(l, i, dx, dy) + ',' + rampY(l, i, dx, dy)

    /** A key-diameter above. */
    const rampKey = (l: number, i: number, dx: number, dy: number) => rampX(l, i, dx, dy) + ',' + (rampY(l, i, dx, dy) + 2*keyRadius)

    /** An outer-diameter above. */
    const rampOuter = (l: number, i: number, dx: number, dy: number) => rampX(l, i, dx, dy) + ',' + (rampY(l, i, dx, dy) + 2*outerRadius)

    let levels = 5
    let n = 5

    let svgElem: SVGElement
    function downloadSVG() {
        let url = createSVGSnapshot(svgElem, {})
        let anchor = document.createElement('a')
        anchor.download = `carpark-${n}-${levels}.svg`
        anchor.href = url
        anchor.click()
    }
</script>

<style>
    svg { width: 100%; height: 90vh; border: 1px solid #aaa;}
    table { width: 100%; }
    table td { width: 50%; }
</style>

<figure>
    <table>
        <tr><td>Number of punctures: {n}</td><td><input type="range" min="1" max="10" bind:value={n}></td></tr>
        <tr><td>Number of levels: {levels}</td><td><input type="range" min="1" max="10" bind:value={levels}></td></tr>
        <tr><td class="controls"><button on:click={downloadSVG}>Download SVG</button></td></tr>
    </table>
    <svg style={`width: ${2*margin + (n-1) * slitDistance}px; height: ${margin+10 + (levels - 1) * levelDistance}px`} bind:this={svgElem}>
    <g transform={`scale(1,-1) translate(${margin}, ${-75-levels*levelDistance})`}>
    {#each arr.range(levels + 2) as l}

        <!-- Main outside disk at the back -->
        <path
            d={[
                `M${ramp(l, 0, -1, -1)}`,
                `A ${outerRadius} ${outerRadius} 0 0 0 ${rampOuter(l, 0, -1, -1)}`,
                `L ${rampOuter(l, n-1, 1, -1)}`,
                `A ${outerRadius} ${outerRadius} 0 0 0 ${ramp(l, n-1, 1, -1)}`,
            ].join(' ')}
            stroke="black"
            fill="none"
            />

        {#each arr.range(n) as i}
            <!-- Guide points, unnecessary for show but handy for construction. -->
            <!-- {#each [-1, 1] as dx}
                {#each [-1, 1] as dy}
                    <circle cx={rampX(l, i, dx, dy)} cy={rampY(l, i, dx, dy)} r=3 fill="black" />
                {/each}
            {/each} -->

            <!-- Little arc going behind ramp.-->
            <path
                d={[
                    `M${ramp(l, i, -1, 1)}`,
                    `A ${keyRadius} ${keyRadius} 0 0 0 ${rampKey(l, i, -1, 1)}`,
                    `L${rampKey(l, i, 1, 1)}`,
                    `A ${keyRadius} ${keyRadius} 0 0 0 ${ramp(l, i, 1, 1)}`,
                ].join(' ')}
                stroke="black"
                fill="none"
                />

            <!-- Draw the ramp as one object so that we can fill it and occlude things behind it. -->
            <path
                d={[
                    `M${ramp(l, i, -1, -1)}`,
                    `C${ramp(l, i, 0.25, -1)} ${ramp(l+1, i, 0.25, -1)} ${ramp(l+1, i, 1, -1)}`,
                    `L${ramp(l+1, i, 1, 1)}`,
                    `C${ramp(l+1, i, -0.25, 1)} ${ramp(l, i, -0.25, 1)} ${ramp(l, i, -1, 1)}`,
                    `Z`,
                ].join(' ')}
                stroke="black"
                fill="white"
                />
        {/each}

        <!-- Connect the ramps together along the bottom (express exit) -->
        {#each arr.range(n-1) as i}
            <path d={`M${ramp(l, i, 1, -1)} L${ramp(l, i+1, -1, -1)}`} stroke="black"></path>
        {/each}
    {/each}
    </g>
    </svg>
</figure>
