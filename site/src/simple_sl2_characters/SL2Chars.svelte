<!-- Binomial coefficients modulo n

    When using this component, wrap it in some containing element like <figure> that has a
    constrained width and size: this component will expand to fill all available space.

-->

<script lang="ts">
    import FullscreenableContainer from '$lib/components/FullscreenableContainer.svelte'
    import ButtonGroup from '$lib/components/ButtonGroup.svelte'

    function pascal(highestWeight: number, char: number): number[][] {
        function nextRow(prevRow) {
            let row = [1]
            for (let i = 0; i < prevRow.length - 1; i++)
                row.push(
                    (char == 0) ? 1 : (prevRow[i] + prevRow[i+1]) % char)

            row.push(1)
            return row
        }

        let rows = [[1]]
        for (let i = 0; i < highestWeight; i++)
            rows.push(nextRow(rows[i]))

        return rows
    }

    function simpCharacters(highestWeight: number, char: number) {
        return pascal(highestWeight, char).map((row, hw) => ({
            hw,
            mults: row.map((val, i) => ({wt: hw - 2 * i, mult: (val == 0) ? 0 : val}))
        }))
    }

    function drawCharacter({zoom, p, show}: DrawConfig, canvasElt: HTMLCanvasElement | null, resizeCount: number) {
        if (canvasElt == null)
            return

        // On high-DPI displays, there is a difference between CSS pixels and real pixels. For example,
        // an element with {width: 100px;} might actually have a width of 200 real pixels. Canvas width
        // and height are always measured in real pixels (since the width and height refers to whatever
        // raw pixel buffer is underlying the canvas). Here we set the dimensions of the raw pixel buffer
        // to match the number of real pixels (otherwise we get a fuzzy image on high-DPI displays).
        let dpr = window.devicePixelRatio
        let width = canvasElt.clientWidth
        let height = canvasElt.clientHeight
        canvasElt.width = width * dpr
        canvasElt.height = height * dpr

        // However, we want to work in CSS-pixels usually. So as soon as we take out a drawing context
        // for the canvas, we scale by dpr so that we are drawing in CSS-pixel-coordinates.
        const ctx = canvasElt.getContext('2d')
        ctx.resetTransform()
        ctx.scale(dpr, dpr)

        let radius = zoom * zoom

        ctx.clearRect(0, 0, width, height)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${radius * 3}px 'Libertinus Serif'`

        let maxWeight = Math.floor(Math.min(height/2, width/3) / radius) - 1
        simpCharacters(maxWeight, p).forEach(({hw, mults}) => {
            mults.forEach(({wt, mult}) => {
                if (mult == 0)
                    return


                ctx.beginPath()

                if (show == 'dots') {
                    ctx.fillStyle = (mult == 1) ? 'black' : `hsl(${(mult - 2) * Math.SQRT2 * 100},50%,50%`
                    ctx.arc(
                        width / 2 + 2 * radius * wt + 0.5 | 0,
                        (hw + 1) * 2 * radius + 0.5 | 0,
                        radius + 0.5 | 0,
                        0,
                        2*Math.PI
                    )
                }

                if (show == 'numbers')
                    ctx.fillText(
                        '' + mult,
                        width / 2 + 2 * radius * wt,
                        (hw + 1) * 2 * radius
                    )

                ctx.fill()
            })
        })
    }
    let canvasElt: HTMLCanvasElement | null = null
    let showText = false

    interface DrawConfig {
        zoom: number
        p: number
        show: 'dots' | 'numbers'
    }

    let zoom = 2
    let p = 3
    let show = 'dots'
    $: drawConfig = {zoom, p, show} as DrawConfig

    let fullscreen = false;
    let resizeCount = 0
    $: drawCharacter(drawConfig, canvasElt, resizeCount)
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

    form {
        position: absolute;
        overflow: hidden;
        left: 1rem;
        top: 1rem;
        max-width: 240px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 0.8rem;
    }

    input[type="range"] { width: 9rem; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%;}
    td { padding: 1px 0 1px 0; }
    tr td { height: 1rem; }
    tr td:nth-child(1) { width: 4rem; }
    tr td:nth-child(2) { width: 1.8rem; }
</style>


<FullscreenableContainer bind:fullscreen on:resize={function () {console.log('resize event', this); resizeCount++}}>
    <canvas bind:this={canvasElt} />
    <form class="controls">
        <table>
            <tr>
                <td><label for="p">p</label></td>
                <td>{p}</td>
                <td><input id="p" type="range" min="0" max="17" bind:value={p}/></td>

            </tr>
            <tr>
                <td><label for="zoom">scale</label></td>
                <td>{zoom.toFixed(1)}</td>
                <td><input id="zoom" type="range" min="1" max="7" step="0.1" bind:value={zoom} /></td>
            </tr>
            <tr>
                <td>Display</td>
                <td></td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'Dots', value: 'dots'},
                            {text: 'Numbers', value: 'numbers'},
                        ]}
                        bind:value={show}
                        />
                </td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>
                    <button type="button" on:click={() => {fullscreen = !fullscreen}}>
                        {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    </button>
                </td>
            </tr>
        </table>
    </form>
</FullscreenableContainer>
