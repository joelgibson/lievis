<script lang="ts">
    import { vec, aff, reduc, groups, draw, fmt } from 'lielib'

    import Latex from '$lib/components/Latex.svelte'
    import ButtonGroup from '$lib/components/ButtonGroup.svelte'
    import WidgetLinearComb from './WidgetLinearComb.svelte'
    import PlotCharacter from './PlotCharacter.svelte'
    import Rank2WeightsDatum from './Rank2WeightsDatum.svelte'

    import InteractiveMap from './InteractiveMap.svelte'
    import { createEventDispatcher } from 'svelte';
    import { objectDelta } from '$lib/state';
    import { createSVGSnapshotBlob } from '$lib/snapshots';
    import InfoTooltip from '$lib/components/InfoTooltip.svelte';

    const allowedGroups = ['A1xA1', 'SL3', 'B2', 'G2']

    type GroupName = 'A1xA1' | 'SL3' | 'B2' | 'G2'
    type State = {
        indicatePRestricted: boolean
        P: number
        reflectWts: boolean
        charDisplay: 'dots' | 'numbers'
        charText: boolean

        controls: boolean
        fullscreen: boolean
    }
    type SerialisableState = State & {
        groupName: GroupName
        frozenWt: number[] | null
    }
    const defaultSerialisableState: SerialisableState = {
        groupName: 'SL3',
        indicatePRestricted: true,
        P: 5,
        reflectWts: true,
        charDisplay: 'dots',
        charText: false,
        controls: true,
        fullscreen: false,
        frozenWt: null,
    }
    let {groupName, frozenWt, ...state} = defaultSerialisableState

    export function restoreState(delta: Partial<SerialisableState>) {
        ({groupName, frozenWt, ...state} = {...defaultSerialisableState, ...delta})
    }

    const dispatch = createEventDispatcher()
    $: dispatch('newState', objectDelta(defaultSerialisableState, {groupName, frozenWt, ...state}))

    let svgElem: null | SVGElement

    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let datum: reduc.BasedRootDatum & groups.EucEmbedding & groups.LatticeLabel

    $: datum = groups.basedRootSystemByName(groupName)
    $: [proj, sect] = groups.rank2eucProjSect(datum)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    // hoveredPoint is bound from InteractiveMap. cursorWt updates directly from that, and selectedWt takes the
    // first valid weight in its list. Selection and deselection events should set and unset frozenWt.
    let cursorWt = [0, 0]

    function maySelectWt(wt) {
        return wt != null && wt.every(x => !isNaN(x)) && reduc.isDominant(datum, wt)
    }
    $: selectedWt = [frozenWt, cursorWt, selectedWt, vec.zero(datum.rank)].filter(maySelectWt)[0]

    function makeCharacter(datum, P, selectedWt, reflectWts) {
        let character = reduc.computeJantzenMults(datum, P, selectedWt)
        if (reflectWts) {
            character = reduc.weylCharacterNormalise(datum, character)
        }
        return character
    }

    $: character = makeCharacter(datum, state.P, selectedWt, state.reflectWts)
</script>


<style>
    input[type="range"] { width: 10em; }
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
    minScale={2}
    initScale={20}
    maxScale={40}
    bind:userPort
    bind:controlsShown={state.controls}
    bind:fullscreen={state.fullscreen}
    bind:svgElem={svgElem}
    on:pointHovered={(e) => cursorWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointSelected={(e) => frozenWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointDeselected={(e) => frozenWt = null}
    takeSnapshot={() => ({downloadName: 'WeylCharacters', blob: createSVGSnapshotBlob(svgElem, {hideSelector: '.cursor'})})}
>
    <g slot="svg">
        <Rank2WeightsDatum
            {D}
            {datum}
            P={state.P}
            dominantChamber={true}
            pRestricted={state.indicatePRestricted}
            wpWalls={true}
            />

        <PlotCharacter
            {D}
            {character}
            radius={(state.charDisplay == 'dots') ? 4 : 0}
            showText={state.charDisplay == 'numbers'}
            />

        <!-- Show the cursor as a green circle. -->
        <path
            d={D.circle(cursorWt, 7)}
            fill="none"
            stroke="green"
            class="cursor"
            />

        <!-- Show the selection as a red circle. -->
        <path
            d={D.circle(selectedWt, 9)}
            fill="none"
            stroke="red"
            />
    </g>

    <table slot="controls">
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
            <td><label for="prestricted">Show <Latex markup={`X_1(T)`} /></label></td>
            <td><input type="checkbox" bind:checked={state.indicatePRestricted} id="prestricted"></td>
        </tr>

        <tr>
            <td>p = {state.P}</td>
            <td><input type="range" min={2} max={23} bind:value={state.P}></td>
        </tr>

        <tr>
            <td>Multiplicities</td>
            <td>
                <ButtonGroup
                    options={[
                        {text: "Dots", value: 'bubbles'},
                        {text: "Numbers", value: 'numbers'},
                    ]}
                    bind:value={state.charDisplay}
                />
            </td>
        </tr>

        <tr>
            <td><label for="reflect">Reflect to dominant</label></td>
            <td><input type="checkbox" id="reflect" bind:checked={state.reflectWts} /></td>
        </tr>
        <tr>
            <td>Cursor (<span style="color: green;">green</span>)</td>
            <td>μ = {@html fmt.linComb(cursorWt, datum.latticeLabel)}</td>
        </tr>
        <tr>
            <td>Selected (<span style="color: red;">red</span>)</td>
            <td>λ = {@html fmt.linComb(selectedWt, datum.latticeLabel)}</td>
        </tr>
        <tr>
            <td>Show character?</td>
            <td><input type="checkbox" id="showterms" bind:checked={state.charText} /></td>
        </tr>
        {#if state.charText}
            <WidgetLinearComb
                character={character}
                latticeLabel={datum.latticeLabel}
                A={'JantzenSum'}
                B={'χ'}
                lambda={selectedWt}
                />
        {/if}
    </table>
</InteractiveMap>
