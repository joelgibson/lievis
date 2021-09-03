<script lang="ts">
    import { aff, mat, cartan, rtsys, draw, rt2d, lspath } from 'lielib'
    import Rank2Background from './Rank2Background.svelte'
    import InteractiveMap from '../../rank2reps/InteractiveMap.svelte'

    let cartanMat = cartan.cartanMat('G', 2)
    let rs = rtsys.createRootSystem(cartanMat)
    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let proj = mat.transpose(mat.cholesky([mat.transpose(mat.inverse(cartanMat)), cartan.symmetrise(cartanMat), mat.inverse(cartanMat)].reduce(mat.multMat)))
    let sect = mat.inverse(proj)
    let D = new draw.NewCoords(draw.viewPort(0, 0, 0, 0), aff.Aff2.id)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    const INIT_PATH =  [[0, 0],  [10, 1]]
    let path = INIT_PATH
    // let f1path = lspath.f(rs, path, 1)
    // let f0path = lspath.f(rs, path, 0)
    // let f0f0path = lspath.f(rs, path, 0)
    // let f1f0f0path = lspath.f(rs, f0f0path, 1)
    // let f1f1f0f0path = lspath.f(rs, f1f0f0path, 1)
    // let f0f1path = lspath.f(rs, f1path, 0)
    // let f1f1path = lspath.f(rs, f1path, 1)
    // let f0f1f1path = lspath.f(rs, f1f1path, 0)
    // let f0f0f1f1path = lspath.f(rs, f0f1f1path, 0)
    // console.log('f1f1f0f0', f1f1f0f0path)
    // console.log(lspath.f(rs, f1path2, 1))

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
    <div slot="controls">
        <table>
            <tr>
                <button type="button" on:click={reset}>Reset</button>
                <button type="button" on:click={() => f(0)}>f<sub>0</sub></button>
                <button type="button" on:click={() => f(1)}>f<sub>1</sub></button>
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
