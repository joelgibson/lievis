<script lang="ts">
    import { mat, draw } from 'lielib'
    import Latex from '$lib/components/Latex.svelte'


    export let topElt = "x"
    export let botElt = "xs"
    export let topLatex = "1"
    export let botLatex = "v"
    export let tilted = false
    export let horizStretch = 1

    const width = 200
    const height = 200
    const sideLength = 100
    const top = Math.cos(30 * Math.PI / 180) * sideLength
    const rot = mat.rotate2D(tilted ? Math.PI / 5 : 0)
    const D = draw.Coords.fromLegacy(width, height, [width/2, height/2], 1, rot)
</script>

<div style={`width: ${width}px; height: ${height}px`}>
    <svg {width} {height}>
        <path d={D.closedPolygon([[-sideLength, 0], [sideLength, 0], [0, top]])} />
        <path d={D.closedPolygon([[-sideLength, 0], [sideLength, 0], [0, -top]])} />
    </svg>
    <!-- Markers in corners -->
    <div style={D.absPosition([0, 0.8*top])}><Latex markup={topElt} /></div>
    <div style={D.absPosition([0, -0.75*top])}><Latex markup={botElt} /></div>

    <!-- Markers in middle -->
    <div style={D.absPosition([0, top/4])}><Latex markup={topLatex} /></div>
    <div style={D.absPosition([0, -top/4])}><Latex markup={botLatex} /></div>
</div>

<style>
    div { position: relative; }
    svg path {
        stroke: black;
        stroke-width: 1;
        fill: none;
    }
</style>
