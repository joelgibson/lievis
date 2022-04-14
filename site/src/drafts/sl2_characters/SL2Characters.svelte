<script lang="ts">
    import ButtonGroupVertical from '$lib/components/ButtonGroupVertical.svelte';
    import FullscreenableContainer from '$lib/components/FullscreenableContainer.svelte';
    import {createInteractionHandlers} from '$lib/pointer-interactions';
    import {SL2BasisGraph, BasisGraph} from './sl2'

    let canvasElt: HTMLCanvasElement | null
    let fullscreen = false
    let resizeCount = 0
    let uptoN = 230
    let primes = [2, 3, 5, 7, 11]
    let primeIdx = primes.indexOf(3)
    $: prime = primes[primeIdx]
    let hoveredPoint = {x: -100, y: -100}
    $: graph = SL2BasisGraph(uptoN, prime)
    let globalScale = 1.0

    const pointerHandlers = createInteractionHandlers({
        hover(x: number, y: number) {
            hoveredPoint = {x, y}
        },
    })


    function star(ctx: CanvasRenderingContext2D, points: number, cx: number, cy: number, radius: number) {
        // A star is like two regular polygons, but alternating and on two radii.
        let outer = radius
        let inner = radius * 0.5
        for (let i = 0; i <= 2*points; i++) {
            let r = (i % 2 == 1) ? outer : inner
            let x = cx + r * Math.sin(i * Math.PI / points)
            let y = cy + r * Math.cos(i * Math.PI / points)
            if (i == 0)
                ctx.moveTo(x, y)
            else
                ctx.lineTo(x, y)
        }
    }

    function draw(canvasElt: HTMLCanvasElement | null, source: string, target: string, prime: number, graph: BasisGraph, globalScale: number, hoveredPoint: {x: number, y: number}, resizeCount: number) {
        if (canvasElt == null)
            return

        let dpr = window.devicePixelRatio
        let width = canvasElt.clientWidth
        let height = canvasElt.clientHeight
        canvasElt.width = width * dpr
        canvasElt.height = height * dpr

        let ctx = canvasElt.getContext('2d')
        ctx.resetTransform()
        ctx.scale(dpr, dpr)

        let sx = (col) => 20 + globalScale*12*col
        let sy = (row) => 40 + globalScale*10*row

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${globalScale * 11}px Arial`
        for (let i = 0; i < uptoN; i++) {
            if (i % 10 == 0)
                ctx.fillText('' + Math.floor(i / 10), sx(i), sy(-2))
            ctx.fillText('' + (i % 10), sx(i), sy(-1))
        }

        // for (let lam of WpOrbit(uptoN, prime, 10 + 1)) {
        //     ctx.beginPath()
        //     ctx.arc(sx(lam - 1), sy(-1), 5, 0, 2*Math.PI)
        //     ctx.stroke()
        // }


        let trans = graph.getTransition(source, target)
        ctx.beginPath()
        for (let i = 0; i < uptoN; i++) {
            for (let j = 0; j < uptoN; j++) {
                let mult = trans.get(i, j)
                if (mult == 0)
                    continue

                // Size proportional to abs(multiplicity), colour is red or blue depending on sign.
                // There are some size scalings so that shapes representing the same multiplicity
                // have the same visual impact (area probably I guess)
                let size = globalScale * (3 + 3 * Math.sqrt(Math.abs(mult)))
                ctx.fillStyle = (mult > 0) ? 'blue' : 'red'
                if (target == 'monomial') {
                    ctx.fillRect(sx(i) - size/2, sy(j) - size/2, size, size)
                } else if (target == 'weyl') {
                    ctx.beginPath()
                    star(ctx, 3, sx(i), sy(j), size*0.9)
                    ctx.fill()
                } else if (target == 'simple') {
                    ctx.beginPath()
                    ctx.arc(sx(i), sy(j), size*0.6, 0, 2 * Math.PI)
                    ctx.fill()
                } else {
                    ctx.beginPath()
                    star(ctx, 5, sx(i), sy(j), size)
                    ctx.fill()
                }
                //star(ctx, 5, sx(i), sy(j), 5)
            }
        }

        // Draw the hover crosshair.
        ctx.strokeStyle = '#ddd'
        ctx.beginPath()
        ctx.moveTo(hoveredPoint.x, 0)
        ctx.lineTo(hoveredPoint.x, height)
        ctx.moveTo(0, hoveredPoint.y),
        ctx.lineTo(width, hoveredPoint.y)
        ctx.stroke()
    }


    let options = [
        {text: 'Monomial', value: 'monomial'},
        {text: 'Weyl', value: 'weyl'},
        {text: 'Simple', value: 'simple'},
        {text: 'Tilting', value: 'tilting'},
    ]
    let source = 'simple'
    let target = 'monomial'

    $: draw(canvasElt, source, target, prime, graph, globalScale, hoveredPoint, resizeCount)
</script>

<style>
    canvas {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background-color: rgb(255, 255, 248);
    }
    .controls {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 15em;

        border: 1px solid #aaa;
        background-color: white;

        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 0.8rem;

        display: flex;
        flex-direction: column;
        padding: 5px;
    }
    .control-group {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .vert {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    input[type="range"] { width: 8em; }
</style>

<FullscreenableContainer bind:fullscreen on:resize={() => resizeCount++}>
    <canvas bind:this={canvasElt} use:pointerHandlers />
    <div class="controls">
        <button on:click={() => fullscreen = !fullscreen}>Fullscreen</button>
        <div class="control-group">
            <label for="prime">Scale = {globalScale.toFixed(2)}</label>
            <input type="range" min={0.5} max={1.5} step={0.01} bind:value={globalScale} />
        </div>
        <div class="control-group">
            <label for="prime">p = {prime}</label>
            <input type="range" min={0} max={primes.length - 1} bind:value={primeIdx} />
        </div>
        <div class="control-group">
            <ButtonGroupVertical {options} bind:value={source} />
            <div class="vert">
                <span>In</span>
                <button on:click={() => [source, target] = [target, source]}>⇿</button>
            </div>
            <ButtonGroupVertical {options} bind:value={target} />
        </div>
        <!-- <fieldset>
            From:
            {#each bases as basis}
                <input type="radio" name="source" id={`source-${basis}`} value={basis} bind:group={source}>
                <label for={`source-${basis}`}>{basis}</label>
                <br>
            {/each}
        </fieldset>
        <fieldset>
            Into:
            {#each bases as basis}
                <input type="radio" name="target" id={`target-${basis}`} value={basis} bind:group={target}>
                <label for={`target-${basis}`}>{basis}</label>
                <br>
            {/each}
        </fieldset> -->
    </div>
</FullscreenableContainer>
