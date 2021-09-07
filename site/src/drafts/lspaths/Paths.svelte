<script lang="ts">
    import { aff, mat, cartan, rtsys, draw, rt2d, lspath } from 'lielib'
    import Rank2Background from './Rank2Background.svelte'
    import InteractiveMap from '../../rank2reps/InteractiveMap.svelte'
    import Latex from '$lib/components/Latex.svelte'

    let typeName: 'A' | 'B' | 'C' | 'G' = 'A'
    $: cartanMat = cartan.cartanMat(typeName, 2)
    $: rs = rtsys.createRootSystem(cartanMat)
    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    $: proj = mat.transpose(mat.cholesky([mat.transpose(mat.inverse(cartanMat)), cartan.symmetrise(cartanMat), mat.inverse(cartanMat)].reduce(mat.multMat)))
    $: sect = mat.inverse(proj)
    let D = new draw.NewCoords(draw.viewPort(0, 0, 0, 0), aff.Aff2.id)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    const INIT_PATH =  [[0, 0],  [1, 0]]
    let path = INIT_PATH

    function reset() {
        path = INIT_PATH
    }
    function f(s: number) {
        let newPath = lspath.f(rs, path, s)
        if (newPath !== null)
            path = newPath
    }
</script>

<InteractiveMap
    minScale={30}
    initScale={50}
    maxScale={100}
    bind:userPort
    >
    <g slot="svg">
        <Rank2Background
            {D}
            {rs}
            />
        {#each rs.posRoots as root}
            <path d={D.vector(root.wt)} stroke="grey" />
        {/each}
        <path d={D.path(path)} stroke-width="3" stroke="black" fill="none"/>
        <path d={D.circle(path[path.length - 1], 5)} fill="black" r="3">
        <!-- <path d={D.path(f1path)} stroke-width="3" stroke="red" fill="none"/>
        <path d={D.path(f0f1path.slice(1, 4))} stroke-width="3" stroke="green" fill="none"/>
        <path d={D.path(f1f1path)} stroke-width="3" stroke="blue" fill="none"/>
        <path d={D.path(f0path)} stroke-width="3" stroke="grey" fill="none"/>
        <path d={D.path(f0f1f1path)} stroke-width="3" stroke="orange" fill="none"/>
        <path d={D.path(f0f0f1f1path)} stroke-width="3" stroke="purple" fill="none"/> -->
    </g>
    <div slot="overlay">
        {#each rs.posRoots.slice(0, 2) as simpRoot, i}
            <div style={D.absPosition(simpRoot.wt, 'vector')}>
                <Latex markup={`\\alpha_${i+1}`} />
            </div>
        {/each}
    </div>
    <div slot="controls">
        <table>
            <tr>
                <select bind:value={typeName}>
                    <option value="A">A2</option>
                    <option value="B">B2</option>
                    <option value="C">C2</option>
                    <option value="G">G2</option>
                </select>
            </tr>
            <tr>
                <button type="button" on:click={reset}>Reset</button>
                <button type="button" on:click={() => f(0)}>f<sub>1</sub></button>
                <button type="button" on:click={() => f(1)}>f<sub>2</sub></button>
            </tr>
            <!-- <tr>
                <td><label for="root-system">Root system:</label></td>
                <td>
                    <select id="root-system" bind:value={groupName}>
                        {#each allowedGroups as key}
                        <option value={key}>{key}</option>
                        {/each}
                    </select>
                </td>
            </tr> -->
        </table>
    </div>
</InteractiveMap>
