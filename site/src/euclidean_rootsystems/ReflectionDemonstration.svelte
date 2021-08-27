<script>
    import Latex from '$lib/components/Latex.svelte'
    import { vec, mat, draw } from 'lielib'

    export let width = 600
    export let height = 400


    $: centre = [width/2, height/2]
    $: C = draw.Coords.fromLegacy(width, height, centre, 1, mat.id(2))

    let alpha = [50, 100]
    let v = [-200, 0]

    // Reflections of α and v.
    $: reflAlpha = vec.reflect(alpha, alpha)
    $: reflV = vec.reflect(alpha, v)

    // Projections of v to the line Rα and the hyperplane Hα
    $: projLine = vec.projectLine(alpha, v)
    $: projPlane = vec.projectHyperplane(alpha, v)

    // Make things draggable.
    let draggableUpdaters = {
        alpha: (x) => alpha = x,
        v: (x) => v = x
    }
    let dragging = undefined

    let wrapper = undefined
    function onMouseMove(e) {
        if (dragging)
            draggableUpdaters[dragging](C.fromEvent(e, wrapper))
    }
    function startDrag(e, name) {
        dragging = name

        // PreventDefault stops the diagram from being highlighted on a drag.
        e.preventDefault()
    }
</script>

<style>
    .wrapper { position: relative; overflow: hidden; width: 100%; height: 100%; }
    .wrapper > * { position: absolute; }
    .nondraggable { opacity: 50%; }
    .draggable { cursor: grab; }
    path { stroke-width: 1.5px; }
</style>

<svelte:window on:mousemove={onMouseMove} on:mouseup={() => dragging = undefined} />

<div class="wrapper" bind:this={wrapper} style={`width: ${width}px; height: ${height}px`}>
    <svg width={width} height={height}>
        <path d={C.line(alpha)} stroke="black" />
        <path d={C.vector(alpha)} stroke="red" class="draggable" on:mousedown={(e) => startDrag(e, 'alpha')} />
        <path d={C.vector(v)} stroke="blue" class="draggable" on:mousedown={(e) => startDrag(e, 'v')}/>
        <path d={C.vector(reflAlpha)} stroke="red" class="nondraggable" />
        <path d={C.vector(reflV)} stroke="blue" class="nondraggable" />
        <path d={C.vector(projLine, projPlane)} stroke="orange" class="nondraggable" />
    </svg>
    <div style={C.absPosition(reflAlpha, 'vector')} class="nondraggable"><Latex markup="s_\alpha(\alpha)" /></div>
    <div style={C.absPosition(reflV, 'vector')} class="nondraggable"><Latex markup="s_\alpha(v)" /></div>
    <div style={C.absPosition(vec.add(vec.scale(projLine, 1/2), projPlane))} class="nondraggable"><Latex markup={`\\frac{(\\alpha, v)}{(\\alpha, \\alpha)} \\alpha`}/></div>
    <!-- The draggable ones need to come last, so that they sit over the top of everything else and can't get obscured. -->
    <div style={C.absPosition(alpha, 'vector')} class="draggable" on:mousedown={(e) => startDrag(e, 'alpha')}><Latex markup="\alpha" /></div>
    <div style={C.absPosition(v, 'vector')} class="draggable" on:mousedown={(e) => startDrag(e, 'v')}><Latex markup="v" /></div>
</div>
