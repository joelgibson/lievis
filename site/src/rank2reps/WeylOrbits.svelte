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
    import { createEventDispatcher } from 'svelte';
    import { objectDelta } from '$lib/state';
    import { createSVGSnapshot } from '$lib/snapshots';
    import InfoTooltip from '$lib/components/InfoTooltip.svelte';


    const allowedGroups = ['A1xA1', 'SL3', 'B2', 'G2']

    type GroupName = 'A1xA1' | 'SL3' | 'B2' | 'G2'
    type State = {
        P: number
        indicatePRestricted: boolean
        rhoShift: boolean
        showRootSystem: boolean
        controls: boolean
        fullscreen: boolean
    }
    type FrozenWt = number[] | null

    type SerialisableState = State & {
        groupName: GroupName
        frozenWt: FrozenWt
    }

    const defaultSerialisableState: SerialisableState = {
        groupName: 'SL3',
        P: 0,
        indicatePRestricted: false,
        rhoShift: false,
        showRootSystem: false,
        frozenWt: null,
        controls: true,
        fullscreen: false,
    }
    let {groupName, frozenWt, ...state} = defaultSerialisableState

    export function restoreState(delta: Partial<SerialisableState>) {
        ({groupName, frozenWt, ...state} = {...defaultSerialisableState, ...delta})
    }

    const dispatch = createEventDispatcher()
    $: dispatch('newState', objectDelta(defaultSerialisableState, {groupName, frozenWt, ...state}))


    let svgElem: null | SVGElement
    let svgList: string[] = []
    function addSnapshot() {
        let url = createSVGSnapshot(svgElem, {hideSelector: 'path.cursor'})
        if (url != null)
            svgList = [...svgList, url]
    }
    function clearSVGSnapshots() {
        for (let url of svgList)
            URL.revokeObjectURL(url)

        svgList = []
    }


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

    // Form inputs
    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let datum: reduc.BasedRootDatum & groups.EucEmbedding & groups.LatticeLabel

    $: datum = groups.basedRootSystemByName(groupName)
    $: [proj, sect] = groups.rank2eucProjSect(datum)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    $: ({adj, det} = mat.integralAdjugate(datum.cartan))

    let cursorWt: number[] = [0, 0]
    $: cursorRt = vec.scale(mat.multVec(adj, cursorWt), 1/det)

    function maySelectWt(wt) {
        return wt != null && wt.every(x => !isNaN(x))
    }
    $: selectedWt = [frozenWt, cursorWt, selectedWt, vec.zero(datum.rank)].filter(maySelectWt)[0]

    let orbitWts: maps.IMap<number[], number>
    $: orbitWts = computeOrbit(datum, selectedWt, state.rhoShift, state.P)
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
    bind:controlsShown={state.controls}
    bind:fullscreen={state.fullscreen}
    bind:svgElem={svgElem}
    on:pointHovered={(e) => cursorWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointSelected={(e) => frozenWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointDeselected={(e) => frozenWt = null}>
    <g slot="svg">
        <Rank2WeightsDatum
            {D}
            {datum}
            P={state.P}
            dominantChamber={state.rhoShift}
            wpWalls={state.P > 0 || state.rhoShift}
            rhoShiftWpWalls={state.rhoShift}
            pRestricted={state.indicatePRestricted}
            />

        {#if state.showRootSystem}
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
        {#if state.rhoShift}
            <path
                d={D.circle(vec.neg(datum.rho), 4)}
                fill="black"
                />
        {/if}state.

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
            style="cursor"
            />

        <!-- Show the selection as a red circle. -->
        <path
            d={D.circle(selectedWt, 9)}
            fill="none"
            stroke="red"
            />
    </g>

    <div slot="overlay">
        {#if state.rhoShift}
            <div style={D.absPosition(vec.neg(datum.rho))}>
                <Latex markup={`-\\rho`}></Latex>
            </div>
        {/if}
        {#if state.rhoShift && state.showRootSystem}
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
                <td><input type="checkbox" bind:checked={state.showRootSystem}></td>
            </tr>
            <tr>
                <td><label for="p"><Latex markup={`p = ${state.P}`}/></label></td>
                <td><input type="range" min="0" max="17" step="1" bind:value={state.P} id="p"></td>
            </tr>
            <tr>
                <td><label for="rhoShift"><Latex markup={`\\rho`} />-shift</label></td>
                <td><input type="checkbox" bind:checked={state.rhoShift}></td>
            </tr>
            <tr>
                <td><label for="showX1">Show <Latex markup={`X_1(T)`} /></label></td>
                <td>(requires <Latex markup={`p > 0`}/>) <input type="checkbox" bind:checked={state.indicatePRestricted} disabled={state.P == 0}></td>
            </tr>
            <tr>
                <td>Save diagram</td>
                <td>
                    <button on:click={addSnapshot}>Create SVG</button>
                    <button on:click={clearSVGSnapshots}>Clear</button>
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            Clicking the <button on:click={addSnapshot}>Create SVG</button> button will take a snapshot of the visualisation (with the green cursor circle removed), and save it as an SVG file named "Snapshot 1".
                            This can be opened in a new tab to be viewed, or clicked to be downloaded as an SVG.
                            The <button on:click={clearSVGSnapshots}>Clear</button> button will clear the list of snapshots.
                        </p>
                    </InfoTooltip>
                </td>
            </tr>
            <tr>
                {#if svgList.length > 0}
                    <td colspan="2">
                        <ul>
                            {#each svgList as url, i}
                                <li><a href={url} target="_blank" download="WeylCharacters.svg">Snapshot {i+1}</a></li>
                            {/each}
                        </ul>
                    </td>
                {/if}
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
