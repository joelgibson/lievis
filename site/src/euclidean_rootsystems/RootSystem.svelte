<!-- Display a rank 2 root system. -->

<script>
    import Latex from '$lib/components/Latex.svelte'
    import Rank2Parts from './Rank2Parts.svelte'
    import { vec, mat, draw, groups } from 'lielib'

    // Input props.
    export let datum = groups.SL(2)
    export let width = 200
    export let height = 200
    export let scale = 50

    $: orthog = vec.gramSchmidt(mat.toColumns(datum.charToEuc))
    $: if (orthog.length == 1) orthog.push(vec.zero(orthog[0].length))
    $: trans = mat.multMat(mat.fromRows(orthog), datum.charToEuc)
    $: D = draw.Coords.fromLegacy(width, height, [width/2, height/2], scale, trans, mat.multMat(datum.eucToChar, mat.fromColumns(orthog)))

    let rootsShown = []
    let svgElem // Bound from the <svg> element.

    // When the mouse moves, try to find the nearest integral point in the ambient root space.
    // If that integral point is a root, show its coordinates.
    function handleMouseMove(e) {
        let rtLatticePoint = D.fromEvent(e, svgElem).map(Math.round)
        rootsShown = datum.roots.filter(root => vec.equal(root, rtLatticePoint))
    }
</script>

<div style={`width: ${width}px; height: ${height}px; position: relative`}>
<svg width={width} height={height} bind:this={svgElem} on:mousemove={handleMouseMove}>
    <Rank2Parts
        {D}
        origin={true}
        roots={datum.roots}
        simples={[]}
        normal={undefined}
        normalPositives={undefined}
        fundamentals={[]}
        gridCoroots={[]}
        />
</svg>
{#each rootsShown as root}
    <div style={D.absPosition(root, 'vector')}>
        <Latex markup={"(" + mat.multVec(datum.charToEuc, root).join(", ") + ")"} />
    </div>
{/each}
<!--
{#each datum.simples as sroot, i}
    <div style={D.absPosition(sroot)}>
        <Latex markup={`\\alpha_${i + 1}`} />
    </div>
{/each}
-->
<!--{#each datum.fundamentals as fund, i}
    <div style={D.absPosition(fund)}>
        <Latex markup={`\\varpi_${i + 1}`} />
    </div>
{/each}-->
</div>
