<!-- Draws the bottom part of the SVG for a rank 2 weight lattice. -->

<script lang="ts">
    import type {draw} from 'lielib'
    import {vec, rtsys} from 'lielib'

    // The coordinate system (for the Euclidean embedding of the root datum), the
    // based root datum, and the prime being used (if we are showing P-dialated things).
    export let D: draw.NewCoords
    export let rs: rtsys.IRootSystem

    // Show the dominant chamber, the set of λ such that 〈 λ, α^ 〉≥ 0 for all simple
    // coroots α^
    export let dominantChamber = true

    // Grid lines showing where the positive or simple coroots evaluate integrally.
    // These will automatically switch off once we are sufficiently zoomed out.
    export let positiveGridlines = true
    export let simpleGridlines = false

    // Lines showing the reflecting hyperplanes for the usual Weyl action
    export let reflectingWalls = true

    // Scale the line thicknesses by this.
    $: scaledLineWidth = Math.min(Math.max(0 * 0.04, 0.4), 1.5)

    // Determine whether to show the grid lines, and choose which coroots to use.
    function determineGridCoroots(D: draw.NewCoords, rs: rtsys.IRootSystem, positiveGridlines: boolean, simpleGridlines: boolean): rtsys.IRoot[] {
        if (!(positiveGridlines || simpleGridlines)) {
            return []
        }
        // Find the longest root.
        let length = Math.sqrt(rtsys.highestRoot(rs).norm2) * D.aff2.detScale()
        if (length < 10)
            return []

        return (positiveGridlines) ? rs.posCoroots : rs.posCoroots.slice(0, 2)
    }

    // Determine the highest power of P reflecting wall shown.
    function getHighestPower(D, datum, P) {
        if (P == 0) {
            return 0
        }
        if (P == 1) {
            return 1
        }
        let extremaWeights = D.port.extrema.map(pt => D.aff2.uv(pt))
        let maxVal = 0
        for (let i = 0; i < datum.copositives.length; i++) {
            let coroot = datum.copositives[i]
            for (let j = 0; j < extremaWeights.length; j++) {
                maxVal = Math.max(maxVal, Math.abs(vec.dot(coroot, vec.add(datum.rho, extremaWeights[j]))))
            }
        }
        let power = 0
        while (maxVal > 1) {
            maxVal = maxVal / P
            power += 1
        }

        return Math.ceil(power)
    }

    $: gridCoroots = determineGridCoroots(D, rs, positiveGridlines, simpleGridlines)
</script>

{#if dominantChamber}
    <path
        d={D.openTriangle(rs.posCoroots[0].rt, rs.posCoroots[1].rt)}
        fill="#eef"
        stroke="none"
        />
{/if}

{#each gridCoroots as coroot}
    <path
        d={D.covector(coroot.rt)}
        stroke="#e0e0e0"
        stroke-width="1"
        class="blah"
        />
{/each}

{#if reflectingWalls}
    {#each rs.posCoroots as coroot}
        <path
            d={D.line(coroot.rt)}
            stroke="black"
            stroke-width={scaledLineWidth}
            />
    {/each}
{/if}
