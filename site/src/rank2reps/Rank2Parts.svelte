<!--
    All of the SVG bits for plotting a rank 2 root system. This component should only be used
    inside an SVG with a coordinate system already set up. For an example, see InteractNormals.svelte
-->

<script>
    import {vec} from 'lielib'

    export let D                   // A Coords object
    export let origin = false      // Show origin
    export let roots = []          // Roots to show
    export let simples = []        // If the simple roots are passed in, the dominant chamber will be shown.
    export let gridCoroots = []    // Show grid lines for these coroots. For example, passing in the positive
                                   // roots gives the usual grid lines. Passing only the simples will give the
                                   // weight lattice as the intersection points.
    export let fundamentals = []   // If the fundamental weights are passed, they will be shown.
    export let normal = undefined  // If the normal is passed, it will be shown as a dashed line.
    export let normalPositives = undefined // If this normal is passed, the positive roots will be shown in red.
                                   // is there an easy way to just pass this from the simple roots?
</script>

<!-- Origin -->
{#if origin}
<path
    d={D.circle([0, 0], 3)}
    stroke="black"
    fill="black"
    />
{/if}

<!-- Dominant Weyl chamber -->
{#if simples.length > 0}
<path
    d={D.openTriangle(...simples)}
    fill="#eef"
    stroke="none"
    />
{/if}

<!-- Grid showing where the coroots evaluate integrally. -->
{#each gridCoroots as coroot}
    <path
        d={D.covector(coroot)}
        stroke="#e0e0e0"
        stroke-width="1"
        />
{/each}

<!-- Chosen normal -->
{#if normal}
<path
    d={D.line(normal)}
    stroke="blue"
    stroke-dasharray="4"
    />
{/if}

<!-- Roots -->
{#each roots as root}
    <path
        d={D.vector(root)}
        stroke={(normalPositives && vec.dot(normalPositives, root) > 0) ? "red" : "black"}
        stroke-width="2"
        />
{/each}

<!-- Fundamental weights -->
{#each fundamentals as weight}
    <path
        d={D.vector(weight)}
        stroke="blue"
        stroke-width="1"
        />
{/each}
