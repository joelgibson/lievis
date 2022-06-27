<script lang="ts">
    import {aff, arr, draw, num, vec} from 'lielib'
    import { createInteractionHandlers } from '$lib/pointer-interactions';
    import Latex from '$lib/components/Latex.svelte';

    let n = 8

    const width = 200
    const portAff = aff.Aff2.id.scale(width/3, -width/3).translate(width/2, width/2)
    const coords = new draw.NewCoords(draw.viewPort(0, 0, width, width), portAff)
    const dotSize = 5

    const nonlins = {
        names: ['Linear', 'ReLU', 'Abs'],
        fns: {
            'Linear'(x: number) { return x },
            'ReLU'(x: number) { return (x >= 0) ? x : 0 },
            'Abs'(x: number) { return (x >= 0) ? x : -x },
        },
    }
    let nonlin = 'ReLU'

    function order(n: number, k: number): number {
        return n / num.gcd(n, k)
    }

    function is_trivial(n: number, m: number) { return m == 0 }
    function is_sign(n: number, m: number) { return n % 2 == 0 && n/2 == m }

    function inject(n: number, m: number, [x, y]: number[]) {
        if (is_trivial(n, m))
            return arr.constant(n, x)
        if (is_sign(n, m))
            return arr.fromFunc(n, i => (i % 2 == 0) ? x : -x)

        let xv = arr.fromFunc(n, i => Math.cos(2*Math.PI*m*i / n) * Math.SQRT2)
        let yv = arr.fromFunc(n, i => Math.sin(2*Math.PI*m*i / n) * Math.SQRT2)
        return vec.add(vec.scale(xv, x), vec.scale(yv, y))
    }

    function project(n: number, m: number, v: number[]) {
        let xv = arr.fromFunc(n, i => Math.cos(2*Math.PI*m*i / n) * Math.SQRT2)
        let yv = arr.fromFunc(n, i => Math.sin(2*Math.PI*m*i / n) * Math.SQRT2)
        if (is_trivial(n, m))
            [xv, yv] = [arr.constant(n, 1), arr.constant(n, 0)]
        if (is_sign(n, m))
            [xv, yv] = [arr.fromFunc(n, i => (i % 2 == 0) ? 1 : -1), arr.constant(n, 0)]

        return [vec.dot(v, xv) / n, vec.dot(v, yv) / n]
    }

    function hplanes(n: number, m: number): number[][] {
        return arr.fromFunc(order(n, m), i => [Math.cos(2*Math.PI*i*m/n), Math.sin(2*Math.PI*i*m/n)])
    }

    function scale(n: number, m: number, source: number) {
        let out = project(n, m, inject(n, source, [1, 0]).map(nonlins.fns[nonlin]))
        let norm = vec.norm(out)
        return (norm < 1e-6) ? 1 : 1/norm
    }

    let source: number = 0
    let globalV: number[]
    let doRelu = true
    let doScale = false
    $: globalV = arr.constant(n, 0)
    $: ms = arr.range(0, n / 2).filter(k => (k != 0) && (n % 2 == 0 || k != n / 2))
    const interactionHandlers = createInteractionHandlers({
        hover(x: number, y: number, e: PointerEvent, m: number) {
            globalV = inject(n, m, portAff.uv([x, y])).map(nonlins.fns[nonlin])
            source = m
        }
    })

    $: {
        console.log("Projections:", ms.map(m => project(n, m, globalV)))
    }
</script>

<style>
    svg {
        border: 1px solid black;
    }
    figure div {
        display: flex;
        flex-direction: column;
    }
    figure p {
        text-align: center;
    }
</style>

<form>
    n: <input type="number" bind:value={n}>
    <select bind:value={nonlin}>
        {#each nonlins.names as name}
            <option value={name}>{name}</option>
        {/each}
    </select>
    Scale outputs <input type="checkbox" bind:checked={doScale}>
</form>

<figure class="row">
    <div>
        <svg width={width} height={width} use:interactionHandlers={0}>
            {#each hplanes(n, 0) as hplane}
                <path d={coords.line(hplane)} stroke="grey" />
            {/each}
            <path d={coords.circle(vec.scale(project(n, 0, globalV), doScale ? scale(n, 0, source) : 1), dotSize)} fill="red" stroke="blue"/>
        </svg>
        <p><Latex markup={`V_0 = V_{triv}, \\ord(\\sigma) = ${order(n, 0)}`}/></p>
    </div>
    {#each ms as m}
        <div>
            <svg width={width} height={width} use:interactionHandlers={m}>
                {#each hplanes(n, m) as hplane}
                    <path d={coords.line(hplane)} stroke="grey" />
                {/each}
                <path d={coords.circle(vec.scale(project(n, m, globalV), doScale ? scale(n, m, source) : 1), dotSize)} fill="red" stroke="blue"/>
            </svg>
            <p><Latex markup={`V_${m}, \\ord(\\sigma) = ${order(n, m)}`}/></p>
        </div>
    {/each}
    {#if n % 2 == 0}
        <div>
            <svg width={width} height={width} use:interactionHandlers={n/2}>
                {#each hplanes(n, n/2) as hplane}
                    <path d={coords.line(hplane)} stroke="grey" />
                {/each}
                <path d={coords.circle(vec.scale(project(n, n/2, globalV), doScale ? scale(n, n/2, source) : 1), dotSize)} fill="red" stroke="blue"/>
            </svg>
            <p><Latex markup={`V_${n/2} = V_{sign}, \\ord(\\sigma) = ${order(n, n/2)}`}/></p>
        </div>
    {/if}
</figure>
