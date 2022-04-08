<script lang="ts">
    import { vec, aff, reduc, groups, fmt, draw, maps } from 'lielib'

    import Latex from '$lib/components/Latex.svelte'
    import ButtonGroup from '$lib/components/ButtonGroup.svelte'
    import WidgetLinearComb from './WidgetLinearComb.svelte'
    import PlotCharacter from './PlotCharacter.svelte'
    import Rank2WeightsDatum from './Rank2WeightsDatum.svelte'
    import InteractiveMap from './InteractiveMap.svelte'

    // Allowed groups for this visualisation.
    const allowedGroups = ['T2', 'A1xA1', 'GL2', 'SL3', 'B2', 'G2']

    // Form inputs.
    let groupName = 'SL3'
    let indicatePRestricted = true
    let P = 5
    let characterDisplay: 'bubbles' | 'numbers' = 'bubbles'
    let showWhat: 'simpsInWeyls' | 'weylsInSimps' | 'simpsInStd' = 'simpsInWeyls'
    let showCharacter = false

    // Set up allowed groups, first group, and coordinate systems.
    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let datum: reduc.BasedRootDatum & groups.EucEmbedding & groups.LatticeLabel

    $: datum = groups.basedRootSystemByName(groupName)
    $: [proj, sect] = groups.rank2eucProjSect(datum)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(proj, sect).then(userPort.aff),
    )

    let cursorWt = [0, 0]
    let frozenWt: null | number[] = null

    function maySelectWt(wt) {
        return wt != null && wt.every(x => !isNaN(x)) && reduc.isDominant(datum, wt)
    }
    $: selectedWt = [frozenWt, cursorWt, selectedWt, vec.zero(datum.rank)].filter(maySelectWt)[0]


    function computeChar(datum, P, selectedWt, showWhat) {
        let t = reduc.createTracker(datum, 20)
        let simpleDimension = reduc.trySimpleDimension(datum, P, selectedWt, t) || '???'
        if (showWhat == 'simpsInWeyls') {
            let char = reduc.trySimpleInWeyls(datum, P, selectedWt, t, 0)
            let dim = (char != null) ? maps.reduce(char, (acc, wt, mult) => acc + mult * reduc.weylDimension(datum, wt), 0n) : '?'
            return {char, dim, simpleDimension}
        }

        if (showWhat == 'weylsInSimps') {
            let char = reduc.tryWeylInSimplesInversion(datum, P, selectedWt, t)
            let dim = (char != null) ? maps.reduce(char, (acc, wt, mult) => acc + mult * reduc.trySimpleDimension(datum, P, wt, t), 0n) : '?'
            return {char, dim, simpleDimension}
        }

        if (showWhat == 'simpsInStd') {
            let char = reduc.trySimpleInWeyls(datum, P, selectedWt, t, 0)
            let dim = (char != null) ? maps.reduce(char, (acc, wt, mult) => acc + mult * reduc.weylDimension(datum, wt), 0n) : '?'
            if (char != null)
                char = datum.charAlg.tryApplyLinear(char, x => reduc.weylCharacter(datum, x))
            return {char, dim, simpleDimension}
        }

        throw new Error("unreachable")
    }

    $: ({char: character, dim: dimension, simpleDimension} = computeChar(datum, P, selectedWt, showWhat))
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
    on:pointHovered={(e) => cursorWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointSelected={(e) => frozenWt = D.fromPixelsClosestLatticePoint(e.detail)}
    on:pointDeselected={(e) => frozenWt = null}>
    <g slot="svg">
        <Rank2WeightsDatum
            {D}
            {datum}
            {P}
            dominantChamber={true}
            pRestricted={indicatePRestricted}
            wpWalls={true}
            />

        <!-- Plot the character, if the computation worked. -->
        {#if character != null}
            <PlotCharacter
                {D}
                {character}
                radius={(characterDisplay == 'bubbles') ? 4 : 0}
                showText={characterDisplay == 'numbers'}
                />
        {:else}
            <text x={D.port.centre[0]} y={D.port.centre[1]}>???????</text>
        {/if}

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
            <td><input type="checkbox" bind:checked={indicatePRestricted} id="prestricted"></td>
        </tr>

        <tr>
            <td><label>p = {P}</label></td>
            <td><input type="range" min={2} max={23} bind:value={P}></td>
        </tr>

        <tr>
            <td>Multiplicities</td>
            <td>
                <ButtonGroup
                    options={[
                        {text: "Dots", value: 'bubbles'},
                        {text: "Numbers", value: 'numbers'},
                    ]}
                    bind:value={characterDisplay}
                />
            </td>
        </tr>

        <tr>
            <td>Simples in Weyls</td>
            <td><input type="radio" bind:group={showWhat} value="simpsInWeyls"></td>
        </tr>
        <tr>
            <td>Weyls in simples</td>
            <td><input type="radio" bind:group={showWhat} value="weylsInSimps"></td>
        </tr>
        <tr>
            <td>Simples in weights</td>
            <td><input type="radio" bind:group={showWhat} value="simpsInStd"></td>
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
            <td>Dim V(λ) (Weyl)</td>
            <td>{reduc.weylDimension(datum, selectedWt).toLocaleString()}</td>
        </tr>

        <tr>
            <td>Dim L(λ) (simple)</td>
            <td>{simpleDimension.toLocaleString()}</td>
        </tr>


        <tr>
            <td>Show character?</td>
            <td><input type="checkbox" id="showterms" bind:checked={showCharacter} /></td>
        </tr>
        {#if showCharacter}
            <WidgetLinearComb
                character={character}
                latticeLabel={datum.latticeLabel}
                A={(showWhat == 'weylsInSimps') ? 'V' : 'L'}
                B={(showWhat == 'weylsInSimps') ? 'L' : (showWhat == 'simpsInStd') ? 'e' : 'χ'}
                lambda={selectedWt}
                />
        {/if}
    </table>
</InteractiveMap>
