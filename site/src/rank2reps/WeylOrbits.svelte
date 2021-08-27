<!--
    Display the Weyl orbits. Notes from optimisation:
    - Drawing many, many items is still a bit slow, but waaaay faster than React.
    - Can get around this by drawing new things over the top of static things.
    - Still on a re-render the many many items were being redrawn. Using a const
      variable fixed this.
-->

<script lang="ts">
    import Rank2WeightsDatum from './Rank2WeightsDatum.svelte'
    import Rank2Parts from './Rank2Parts.svelte'
    import InteractiveMap from './InteractiveMap.svelte'
    import Latex from '$lib/components/Latex.svelte'

    import { vec, vecmut, mat, draw, reduc, groups, fmt, maps, aff } from 'lielib'


    function computeOrbit(datum: reduc.BasedRootDatum, wt: number[], rhoShift: boolean, p: number) {
        let shift = (rhoShift) ? datum.rho : vec.zero(datum.rank)
        let orbit = new maps.EntryVecMap<number>()
        let limit = (p > 0) ? 30 : 0
        let wtCopy = []
        for (let i = -limit; i <= limit; i++) {
            for (let j = -limit; j <= limit; j++) {
                vecmut.addScaled(wtCopy, wt, datum.simples[0], i*p)
                vecmut.addScaled(wtCopy, wtCopy, datum.simples[1], j*p)
                vecmut.add(wtCopy, wtCopy, shift)
                reduc.weylOrbitIterate(datum, wtCopy, (wt) => orbit.set(vec.sub(wt, shift), 1))
                vecmut.sub(wtCopy, wtCopy, shift)
            }
        }
        return orbit
    }

    const allowedGroups = ['A1xA1', 'SL3', 'B2', 'G2']

    // Form inputs
    let groupName = 'SL3'
    let P = 0
    let indicatePRestricted = false
    let rhoShift = false
    let showRootSystem = false

    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let datum: reduc.BasedRootDatum & groups.EucEmbedding & groups.LatticeLabel

    $: datum = groups.basedRootSystemByName(groupName)
    $: [proj, sect] = groups.rank2eucProjSect(datum)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    $: ({adj, det} = mat.integralAdjugate(datum.cartan))

    let frozenWt: null | number[] = null
    let cursorWt: number[] = [0, 0]
    $: cursorRt = vec.scale(mat.multVec(adj, cursorWt), 1/det)

    function maySelectWt(wt) {
        return wt != null && wt.every(x => !isNaN(x))
    }
    $: selectedWt = [frozenWt, cursorWt, selectedWt, vec.zero(datum.rank)].filter(maySelectWt)[0]

    let orbitWts: maps.IMap<number[], number>
    $: orbitWts = computeOrbit(datum, selectedWt, rhoShift, P)
</script>

<style>
    table { display: block; border-collapse: collapse; width: 20em;}
    table td { padding: 0.5px; }
    table, tr:not(:first-child) td {
        padding-top: 3px;
    }
    td:not(:first-child) { padding-left: 4px; }
    td:nth-child(1) { white-space: nowrap; }
    td:nth-child(2) { width: 100%; text-align: right; }
</style>

<InteractiveMap
    minScale={10}
    initScale={30}
    maxScale={80}
    bind:userPort
    on:pointHovered={(e) => cursorWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointSelected={(e) => frozenWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointDeselected={(e) => frozenWt = null}>
    <g slot="svg">
        <Rank2WeightsDatum
            {D}
            {datum}
            {P}
            dominantChamber={rhoShift}
            wpWalls={P > 0 || rhoShift}
            rhoShiftWpWalls={rhoShift}
            pRestricted={indicatePRestricted}
            />

        {#if showRootSystem}
            <Rank2Parts
                {D}
                origin={true}
                roots={datum.roots}
                simples={[]}
                normal={undefined}
                normalPositives={false}
                fundamentals={[]}
                gridCoroots={[]}
            />
        {/if}

        <!-- Vertex labelling -ρ -->
        {#if rhoShift}
            <path
                d={D.circle(vec.neg(datum.rho), 4)}
                fill="black"
                />
        {/if}

        <!-- Vertices in orbit -->
        <path
            d={D.circlesFromMap(orbitWts, () => 4)}
            fill="brown"
            />

        <!-- Show the cursor as a green circle. -->
        <path
            d={D.circle(cursorWt, 7)}
            fill="none"
            stroke="green"
            />

        <!-- Show the selection as a red circle. -->
        <path
            d={D.circle(selectedWt, 9)}
            fill="none"
            stroke="red"
            />
    </g>

    <div slot="overlay">
        {#if rhoShift}
            <div style={D.absPosition(vec.neg(datum.rho))}>
                <Latex markup={`-\\rho`}></Latex>
            </div>
        {/if}
        {#if rhoShift && showRootSystem}
            {#each datum.simples as root, i}
                <div style={D.absPosition(root, 'vector')}>
                    <Latex markup={`\\alpha_{${i + 1}}`} />
                </div>
            {/each}
        {/if}
    </div>

    <div slot="controls">
        <table>
            <tr>
                <td><label for="root-system">Root system:</label></td>
                <td>
                    <select id="root-system" bind:value={groupName}>
                        {#each allowedGroups as key}
                            <option value={key}>{key}</option>
                        {/each}
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="showRootSystem">Show roots</label></td>
                <td><input type="checkbox" bind:checked={showRootSystem}></td>
            </tr>
            <tr>
                <td><label for="p"><Latex markup={`p = ${P}`}/></label></td>
                <td><input type="range" min="0" max="17" step="1" bind:value={P} id="p"></td>
            </tr>
            <tr>
                <td><label for="rhoShift"><Latex markup={`\\rho`} />-shift</label></td>
                <td><input type="checkbox" bind:checked={rhoShift}></td>
            </tr>
            <tr>
                <td><label for="showX1">Show <Latex markup={`X_1(T)`} /></label></td>
                <td>(requires <Latex markup={`p > 0`}/>) <input type="checkbox" bind:checked={indicatePRestricted} disabled={P == 0}></td>
            </tr>
            <tr>
                <td>Cursor (<span style="color: green;">green</span>)</td>
                <td>μ = {@html fmt.linComb(cursorWt, datum.latticeLabel)}</td>
            </tr>

            <tr>
                <td>Selected (<span style="color: red;">red</span>)</td>
                <td>λ = {@html fmt.linComb(selectedWt, datum.latticeLabel)}</td>
            </tr>

        </table>
    </div>
</InteractiveMap>
