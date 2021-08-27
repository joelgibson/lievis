<script lang="ts">
    import { vec, draw, fmt, reduc, groups, aff } from 'lielib'

    import Latex from '$lib/components/Latex.svelte'
    import Rank2WeightsDatum from './Rank2WeightsDatum.svelte'
    import PlotCharacter from './PlotCharacter.svelte'
    import InteractiveMap from './InteractiveMap.svelte'
    import WidgetLinearComb from './WidgetLinearComb.svelte'
    import ButtonGroup from '$lib/components/ButtonGroup.svelte'
    import InfoTooltip from '$lib/components/InfoTooltip.svelte'

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


    // Form inputs
    let groupName = 'SL3'
    let showPShiftedWalls = false
    let showDimensions: 'dots' | 'numbers' = 'dots'
    let showOrbit = 'none'
    let characterType: 'weyl' | 'demazure' = 'weyl'
    let showCharacter = false
    let demazureWordUnfiltered = '1'
    let demazureWord = '1'

    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let datum: reduc.BasedRootDatum & groups.EucEmbedding & groups.LatticeLabel

    $: datum = groups.basedRootSystemByName(groupName)
    $: [proj, sect] = groups.rank2eucProjSect(datum)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    $: cursorWt = vec.zero(datum.rank)                          // Weight under the cursor: always updates
    let frozenWt: number[] | null = null                        // Weight selected via a click and "frozen" in place.
    let selectedWt: number[]
    $: selectedWt = (frozenWt !== null) ? frozenWt : cursorWt   // Weight we want to compute stuff about.

    $: demazureWord = filterDemazureWord(datum, demazureWordUnfiltered)
    $: character = chooseCharacters[characterType](datum, selectedWt, demazureWord)
</script>

<style>
    div.sep {
        display: block;
        height: 0.5em;
    }
    input[type="text"] { width: 4em; }
    label.indent {
        width: 2rem;
    }
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
    on:pointSelected={(e) => frozenWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointHovered={(e) => cursorWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointDeselected={(e) => frozenWt = null}>
    <g slot="svg">
        <Rank2WeightsDatum
            {D}
            {datum}
            wpWalls={showPShiftedWalls}
            />

        <PlotCharacter
            {D}
            {character}
            radius={(showDimensions == 'dots') ? 2.5 : 0}
            showText={showDimensions == 'numbers'}
            />

        {#each [{wt: cursorWt, radius: 7, colour: 'green'}, {wt: selectedWt, radius: 9, colour: 'red'}] as {wt, radius, colour}}
            {#if showOrbit == 'none'}
                <!-- just show the selected point. -->
                <path d={D.circle(wt, radius)} fill="none" stroke={colour} />
            {:else if showOrbit == 'regular'}
                <!-- show the usual Weyl orbit. -->
                {#each reduc.weylOrbit(datum, wt) as wt}
                    <path d={D.circle(wt, radius)} fill="none" stroke={colour} />
                {/each}
            {:else}
                <!-- show the rho-shifted Weyl orbit. -->
                {#each reduc.weylOrbit(datum, vec.add(wt, datum.rho)) as wt}
                    <path d={D.circle(vec.sub(wt, datum.rho), radius)} fill="none" stroke={colour} />
                {/each}
            {/if}
        {/each}
    </g>
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
                <td><label>Show shifted walls</label></td>
                <td><input type="checkbox" bind:checked={showPShiftedWalls}></td>
            </tr>

            <tr>
                <td><label>Dimensions</label></td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'Dots', value: 'dots'},
                            {text: 'Numbers', value: 'numbers'},
                        ]}
                        bind:value={showDimensions}
                        />
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            <button class="button" on:click={() => showDimensions = 'dots'}>Dots</button> shows the dimension of a weight space as a circle whose area is proportional to <Latex markup={`\\abs{\\dim V_\\nu}`} />, with the colour indicating a positive or negative virtual dimension.
                            <button class="button" on:click={() => showDimensions = 'numbers'}>Numbers</button> shows this data explicitly as numbers.
                        </p>
                    </InfoTooltip>
                </td>
            </tr>

            <tr>
                <td><label>Weyl orbits</label></td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'None', value: 'none'},
                            {text: 'W', value: 'regular'},
                            {text: 'W•', value: 'dot'},
                        ]}
                        bind:value={showOrbit}
                        />
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            <button class="button" on:click={() => showOrbit = 'regular'}>W</button> shows the Weyl orbit of the cursor, while
                            <button class="button" on:click={() => showOrbit = 'dot'}>W•</button> shows the rho-shifted Weyl orbit of the cursor.
                        </p>
                    </InfoTooltip>
                </td>
            </tr>

            <tr>
                <td><label>Character</label></td>
                <td>
                    <ButtonGroup
                        options={[
                            {text: 'Weyl', value: 'weyl'},
                            {text: 'Demazure', value: 'demazure'},
                        ]}
                        bind:value={characterType}
                        />
                </td>
                <td>
                    <InfoTooltip>
                        <p>
                            <button type="button" on:click={() => characterType = 'weyl'}>Weyl</button> shows the character for the Weyl module (i.e. the irreducible module in characteristic zero).
                            <button type="button" on:click={() => characterType = 'demazure'}>Demazure</button> shows the character for a Demazure module.</p>
                    </InfoTooltip>
                </td>
            </tr>

            {#if characterType == 'demazure'}
                <tr>
                    <td><label>Demazure word:</label></td>
                    <td><input type="text" bind:value={demazureWordUnfiltered}></td>
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
                <td>Dim V{#if characterType == 'demazure'}<sub>{demazureWord}</sub>{/if}(λ)</td>
                <td>{datum.charAlg.applyFunctional(character, (wt) => 1).toLocaleString()}</td>
                <td>
                    <InfoTooltip>
                        <p>The dimension of the module as computed via the sum of dimensions of its weight spaces.</p>
                    </InfoTooltip>
                </td>
            </tr>

            <tr>
                <td>Show character?</td>
                <td><input type="checkbox" id="showterms" bind:checked={showCharacter} /></td>
            </tr>
            {#if showCharacter}
                <WidgetLinearComb
                    character={character}
                    latticeLabel={datum.latticeLabel}
                    A={(characterType == 'weyl') ? 'χ' : ('Demazure(' + demazureWord + ')')}
                    B={'e'}
                    lambda={selectedWt}
                    />
            {/if}
        </table>


    </div>
</InteractiveMap>
