<!-- Draws the bottom part of the SVG for a rank 2 weight lattice. -->

<script lang="ts">
    import type {Vec, draw, reduc} from 'lielib'
    import {vec} from 'lielib'

    // The coordinate system (for the Euclidean embedding of the root datum), the
    // based root datum, and the prime being used (if we are showing P-dialated things).
    export let D: draw.NewCoords
    export let datum: reduc.BasedRootDatum
    export let P = 0

    // Show the dominant chamber, the set of λ such that 〈 λ, α^ 〉≥ 0 for all simple
    // coroots α^
    export let dominantChamber = true

    // Show the P-restricted dominant weights (also called X₁(T)), those weights λ
    // satisfying 0 ≤〈 λ, α^ 〉< p for all simple coroots α^.
    export let pRestricted = false

    // Show the standard alcove C for the dot action, those weights λ such that
    // 0 ≤〈 λ + ρ, α^ 〉< p for all positive coroots α^.
    // export let standardAlcove = false

    // Grid lines showing where the positive or simple coroots evaluate integrally.
    // These will automatically switch off once we are sufficiently zoomed out.
    export let positiveGridlines = true
    export let simpleGridlines = false

    // Lines showing the reflecting hyperplanes for the usual Weyl action
    export let reflectingWalls = true

    // Grid lines showing the p-Walls for the action of W_p. If rhoShiftWpWalls is true, this
    // will shift them down to -rho.
    export let wpWalls = false
    export let rhoShiftWpWalls = true

    // Scale the line thicknesses by this.
    $: scaledLineWidth = Math.min(Math.max(0 * 0.04, 0.4), 1.5)

    // Determine whether to show the grid lines, and choose which coroots to use.
    function determineGridCoroots(D: draw.NewCoords, datum, positiveGridlines, simpleGridlines): Vec[] {
        if (!(positiveGridlines || simpleGridlines)) {
            return []
        }
        // Find the longest root.
        let length = datum.simples.map(wt => D.aff2.xy(wt)).map(vec.norm).reduce(Math.max, 0)
        if (length < 10) {
            return []
        }
        if (positiveGridlines) {
            return datum.copositives
        } else {
            return datum.cosimples
        }
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

    $: gridCoroots = determineGridCoroots(D, datum, positiveGridlines, simpleGridlines)
    $: maxWall = getHighestPower(D, datum, P)
    $: powers = vec.fromEntries(maxWall, i => i + 1)
</script>

{#if dominantChamber}
    <path
        d={D.openTriangle(datum.cosimples[0], datum.cosimples[1])}
        fill="#eef"
        stroke="none"
        />
{/if}

{#if pRestricted && P > 1 && datum.ssrank == 2}
    <!-- We need to show a half-open region. We will use a darker green stroke
            and dash the half-open part. First draw the triangle intersecting 0. -->
    <path
        d={D.openPolytopeFromLines([
            [...datum.cosimples[1], -P+1],
            [...datum.cosimples[0], 0],
            [...datum.cosimples[1], 0],
            [...datum.cosimples[0], -P+1]
        ])}
        stroke="#030"
        fill="#cfc"
        />
    <path
        d={D.openPolytopeFromLines([
            [...datum.cosimples[1], 0],
            [...datum.cosimples[0], -P+1],
            [...datum.cosimples[1], -P+1],
            [...datum.cosimples[0], 0]
        ])}
        stroke="#030"
        fill="#cfc"
        />
{/if}

{#each gridCoroots as coroot}
    <path
        d={D.covector(coroot)}
        stroke="#e0e0e0"
        stroke-width="1"
        class="blah"
        />
{/each}

{#if wpWalls}
    {#if P == 0}
        {#each datum.copositives as coroot}
            <path
                d={D.line(coroot, 0, (rhoShiftWpWalls) ? vec.neg(datum.rho) : undefined)}
                stroke="#99f"
                stroke-width={1.5 * scaledLineWidth}
                />
        {/each}
    {:else}
        {#each powers as power}
            {#each datum.copositives as coroot}
                <path
                    d={D.covector(coroot, Math.pow(P, power), (rhoShiftWpWalls) ? vec.neg(datum.rho) : undefined)}
                    stroke="#99f"
                    stroke-width={power * scaledLineWidth}
                    />
            {/each}
        {/each}
    {/if}
{/if}

{#if reflectingWalls}
    {#each datum.copositives as coroot}
        <path
            d={D.line(coroot)}
            stroke="black"
            stroke-width={scaledLineWidth}
            />
    {/each}
{/if}
