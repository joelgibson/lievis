<script lang="ts">
    import {createEventDispatcher} from 'svelte'

    import { vec, draw, fmt, reduc, groups, aff, big } from 'lielib'

    import Latex from '$lib/components/Latex.svelte'
    import Rank2WeightsDatum from './Rank2WeightsDatum.svelte'
    import PlotCharacter from './PlotCharacter.svelte'
    import InteractiveMap from './InteractiveMap.svelte'
    import WidgetLinearComb from './WidgetLinearComb.svelte'
    import ButtonGroup from '$lib/components/ButtonGroup.svelte'
    import InfoTooltip from '$lib/components/InfoTooltip.svelte'

    import { objectDelta } from '$lib/state';
    import { createSVGSnapshot } from '$lib/snapshots';

    // State interface. State should be serialisable so that it can be read and restored externally
    // (for example from a hash URL). The interface for this is the following:
    // - A SerialisableState type which holds the full data of the serialisable state (this may or may not match
    //   the internal state).
    // - A 'newState' event which is emitted by the component each time the state transitions. This should return
    //   something as small as possible: a delta against a default state.
    // - A 'restoreState' function which is called externally to apply a delta back to the component.

    // In this component, there are three groups of state, grouped by how fast we expect them to change.
    // The GroupName determines the datum and replots everything.
    // The State is the user controls.
    // The FrozenWt is the weight that the user has selected manually with the mouse.
    type GroupName = 'T2' | 'A1xA1' | 'GL2' | 'SL3' | 'B2' | 'G2'
    type State = {
        showShiftedWalls: boolean
        showDimensions: 'dots' | 'numbers'
        showOrbit: 'none' | 'regular' | 'dot'
        characterType: 'weyl' | 'demazure'
        demazureWord: string,
        showCharacter: boolean
    }
    type FrozenWt = number[] | null

    type SerialisableState = State & {
        groupName: GroupName
        frozenWt: FrozenWt
    }
    const defaultSerialisableState: SerialisableState = {
        groupName: 'SL3',

        showShiftedWalls: false,
        showDimensions: 'dots',
        showOrbit: 'none',
        characterType: 'weyl',
        demazureWord: '1',
        showCharacter: false,

        frozenWt: null,
    }

    let {groupName, frozenWt, ...state} = defaultSerialisableState

    export function restoreState(delta: Partial<SerialisableState>) {
        ({groupName, frozenWt, ...state} = {...defaultSerialisableState, ...delta})
    }

    const dispatch = createEventDispatcher()
    $: dispatch('newState', objectDelta(defaultSerialisableState, {groupName, frozenWt, ...state}))


    const allowedGroups = ['T2', 'A1xA1', 'GL2', 'SL3', 'B2', 'G2']

    // Remove all of the non-allowed characters from the Demazure word.
    function filterDemazureWord(datum: reduc.BasedRootDatum, word: string) {
        return word
            .split("")
            .filter(x => ("0123456789").includes(x))
            .map(x => parseInt(x, 10))
            .filter(x => 0 < x && x <= datum.simples.length)
            .join("")
    }

    const chooseCharacters = {
        weyl(datum: reduc.BasedRootDatum, selectedWt: number[]) {
            return reduc.weylCharacter(datum, selectedWt)
        },
        demazure(datum: reduc.BasedRootDatum, selectedWt: number[], demazureWord: string) {
            return reduc.demazureCharacter(datum, demazureWord.split("").map(x => parseInt(x, 10) - 1), selectedWt)
        },
    }

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




    // Form inputs
    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let datum: reduc.BasedRootDatum & groups.EucEmbedding & groups.LatticeLabel

    $: datum = groups.basedRootSystemByName(groupName)
    $: [proj, sect] = groups.rank2eucProjSect(datum)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    $: cursorWt = vec.zero(datum.rank)                          // Weight under the cursor: always updates
    let selectedWt: number[]
    $: selectedWt = (frozenWt !== null) ? frozenWt : cursorWt   // Weight we want to compute stuff about.

    $: character = chooseCharacters[state.characterType](datum, selectedWt, state.demazureWord)
</script>

<style>
    input[type="text"] { width: 4em; }
    table { display: block; border-collapse: collapse; width: 20em;}
    table td { padding: 0.5px; }
    table, tr:not(:first-child) td { padding-top: 3px; }
    td:not(:first-child) { padding-left: 4px; }
    td:nth-child(1) { white-space: nowrap; }
    td:nth-child(2) { width: 100%; text-align: right; }
</style>

<InteractiveMap
    minScale={10}
    initScale={30}
    maxScale={80}
    bind:userPort
    bind:svgElem={svgElem}
    on:pointSelected={(e) => frozenWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointHovered={(e) => cursorWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointDeselected={(e) => frozenWt = null}>
    <g slot="svg">
        <Rank2WeightsDatum
            {D}
            {datum}
            wpWalls={state.showShiftedWalls}
            />

        <PlotCharacter
            {D}
            {character}
            radius={(state.showDimensions == 'dots') ? 2.5 : 0}
            showText={state.showDimensions == 'numbers'}
            />

        {#each [
            {wt: cursorWt, radius: 7, colour: 'green', klass: 'cursor'},
            {wt: selectedWt, radius: 9, colour: 'red', klass: 'selected'},
        ] as {wt, radius, colour, klass}}
            {#if state.showOrbit == 'none'}
                <!-- just show the selected point. -->
                <path d={D.circle(wt, radius)} fill="none" stroke={colour} class={klass} />
            {:else if state.showOrbit == 'regular'}
                <!-- show the usual Weyl orbit. -->
                {#each reduc.weylOrbit(datum, wt) as wt}
                    <path d={D.circle(wt, radius)} fill="none" stroke={colour} class={klass} />
                {/each}
            {:else}
                <!-- show the rho-shifted Weyl orbit. -->
                {#each reduc.weylOrbit(datum, vec.add(wt, datum.rho)) as wt}
                    <path d={D.circle(vec.sub(wt, datum.rho), radius)} fill="none" stroke={colour} class={klass} />
                {/each}
            {/if}
        {/each}
    </g>
    <div slot="controls">
        <table>
            <tr>
                <td>Root system:</td>
                <td>
                    <select id="root-system" bind:value={groupName}>
                        {#each allowedGroups as key}
                        <option value={key}>{key}</option>
                        {/each}
                    </select>
                </td>
            </tr>

            <tr>
                <td>Show shifted walls</td>
                <td><input type="checkbox" bind:checked={state.showShiftedWalls}></td>
            </tr>

            <tr>
                <td>Dimensions</td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'Dots', value: 'dots'},
                            {text: 'Numbers', value: 'numbers'},
                        ]}
                        bind:value={state.showDimensions}
                        />
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            <button class="button" on:click={() => state.showDimensions = 'dots'}>Dots</button> shows the dimension of a weight space as a circle whose area is proportional to <Latex markup={`\\abs{\\dim V_\\nu}`} />, with the colour indicating a positive or negative virtual dimension.
                            <button class="button" on:click={() => state.showDimensions = 'numbers'}>Numbers</button> shows this data explicitly as numbers.
                        </p>
                    </InfoTooltip>
                </td>
            </tr>

            <tr>
                <td>Weyl orbits</td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'None', value: 'none'},
                            {text: 'W', value: 'regular'},
                            {text: 'W•', value: 'dot'},
                        ]}
                        bind:value={state.showOrbit}
                        />
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            <button class="button" on:click={() => state.showOrbit = 'regular'}>W</button> shows the Weyl orbit of the cursor, while
                            <button class="button" on:click={() => state.showOrbit = 'dot'}>W•</button> shows the rho-shifted Weyl orbit of the cursor.
                        </p>
                    </InfoTooltip>
                </td>
            </tr>

            <tr>
                <td>Character</td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'Weyl', value: 'weyl'},
                            {text: 'Demazure', value: 'demazure'},
                        ]}
                        bind:value={state.characterType}
                        />
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            <button type="button" on:click={() => state.characterType = 'weyl'}>Weyl</button> shows the character for the Weyl module (i.e. the irreducible module in characteristic zero).
                            <button type="button" on:click={() => state.characterType = 'demazure'}>Demazure</button> shows the character for a Demazure module.</p>
                    </InfoTooltip>
                </td>
            </tr>

            {#if state.characterType == 'demazure'}
                <tr>
                    <td>Demazure word:</td>
                    <td><input type="text" bind:value={state.demazureWord} on:input={(e) => state.demazureWord = filterDemazureWord(datum, e.target.value)}></td>
                    <td>
                        <InfoTooltip>
                            <p>Enter a word in the Coxeter generators, for example 122121. A longest word for this group is {reduc.longWord(datum).map(x => x+1).join('')}.</p>
                        </InfoTooltip>
                    </td>
                </tr>
            {/if}

            <tr>
                <td>Cursor (<span style="color: green;">green</span>)</td>
                <td>μ = {@html fmt.linComb(cursorWt, datum.latticeLabel)}</td>
            </tr>

            <tr>
                <td>Selected (<span style="color: red;">red</span>)</td>
                <td>λ = {@html fmt.linComb(selectedWt, datum.latticeLabel)}</td>
            </tr>

            <tr>
                <td>Dim V(λ)</td>
                <td>{reduc.weylDimension(datum, selectedWt).toLocaleString()}</td>
                <td>
                    <InfoTooltip>
                        <p>The dimension of the module as computed via the Weyl dimension formula.</p>
                    </InfoTooltip>
                </td>
            </tr>

            <tr>
                <td>Dim V{#if state.characterType == 'demazure'}<sub>{state.demazureWord}</sub>{/if}(λ)</td>
                <td>{datum.charAlg.applyFunctional(character, (wt) => 1n).toLocaleString()}</td>
                <td>
                    <InfoTooltip>
                        <p>The dimension of the module as computed via the sum of dimensions of its weight spaces.</p>
                    </InfoTooltip>
                </td>
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
                <td>Show character?</td>
                <td><input type="checkbox" id="showterms" bind:checked={state.showCharacter} /></td>
            </tr>
            {#if state.showCharacter}
                <WidgetLinearComb
                    character={character}
                    latticeLabel={datum.latticeLabel}
                    A={(state.characterType == 'weyl') ? 'χ' : ('Demazure(' + state.demazureWord + ')')}
                    B={'e'}
                    lambda={selectedWt}
                    />
            {/if}
        </table>


    </div>
</InteractiveMap>
