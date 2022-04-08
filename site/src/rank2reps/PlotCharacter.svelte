<!-- Plot an element of Z[X(T)]. -->

<script lang="ts">
    import { draw, vec, char } from 'lielib'

    // A coordinate system which accepts whatever basis the character is.
    export let D: draw.NewCoords

    // The character.
    export let character: char.CharElt

    // Show bubbles or text?
    export let showText = false

    // Scale so that +/- 1 is this radius
    export let radius = 1

    // Scaling factor so that when we zoom out stuff doesn't look too stupid.
    $: scaleFactor = Math.sqrt(vec.norm(D.aff2.xyLin([1, 0]))) / 4

    function elementRadius(coeff: bigint, radius: number) {
        return radius * Math.sqrt(Math.abs(Number(coeff))) * scaleFactor
    }

    // Separate the character into its positive and negative parts.
    $: characterPos = character.entries.filter(e => e.value > 0)
    $: characterNeg = character.entries.filter(e => e.value < 0)
</script>

<style>
    .positivedim {
        fill: powderblue;
        stroke: black;
    }
    .negativedim {
        fill: sandybrown;
        stroke: black;
    }
</style>


<path
    d={D.circlesFromEntries(characterPos, c => elementRadius(c, radius))}
    class="positivedim"
    stroke-width={scaleFactor}
    />
<path
    d={D.circlesFromEntries(characterNeg, c => elementRadius(c, radius))}
    class="negativedim"
    stroke-width={scaleFactor}
    />

{#if showText}
    {#each character.toPairs() as [[u, v], mult]}
        {#if mult != 0n}
            <circle
                cx={D.aff2.x(u, v)}
                cy={D.aff2.y(u, v)}
                r={10}
                fill-opacity="40%"
                stroke-width=0
                class={(mult > 0) ? 'positivedim' : 'negativedim'}
                />
            <text
                x={D.aff2.x(u, v)}
                y={D.aff2.y(u, v)}
                text-anchor="middle"
                dominant-baseline="middle">{mult}</text>
        {/if}
    {/each}
{/if}
