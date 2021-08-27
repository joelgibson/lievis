<script lang="ts">
    import { arr, mat, vec, cartan } from 'lielib'

    import DynkinDiagram from './_DynkinDiagram.svelte'
    import Latex from '$lib/components/Latex.svelte'
    import { RangeStore } from '$lib/stores'

    function createData(type: string, rank: number, aff: number, store?: RangeStore) {
        const invariant =
            (type == 'A' && rank == 2) ? `A_1` :
            (type == 'A' && rank % 2 == 0) ? `B_{${rank / 2}}` :
            (type == 'A' && rank % 2 == 1) ? `C_{${(rank + 1) / 2}}` :
            (type == 'D' && aff == 3) ? `G_2` :
            (type == 'D' && rank >= 3) ? `B_{${rank - 1}}` :
            (type == 'E' && rank == 6) ? `F_4` :
            '?';
        const cartanMat = cartan.cartanMat(type, rank, aff)
        let [ai] = mat.kernel(cartanMat).map(k => k.map(x => Math.round(x * 10) / 10))
        // Correct A_2^{(2)}
        let minai = Math.min(...ai)
        if (minai < 1)
            ai = ai.map(x => x / minai)
        const [aicheck] = mat.kernel(mat.transpose(cartanMat)).map(k => k.map(x => Math.round(x * 10) / 10))
        const special = arr.fromFunc(cartanMat.nrows, (i) => i == cartanMat.nrows - 1)
        return {type, rank, aff, cartanMat, invariant, ai, aicheck, special, store}
    }

    let rankA = new RangeStore(2, 12, 3)
    let rankD = new RangeStore(3, 8, 3)

    let A2 = createData('A', 2, 2)
    $: An = createData('A', $rankA, 2, rankA)
    $: Dn = createData('D', $rankD, 2, rankD)
    let E6 = createData('E', 6, 2)
    let D4 = createData('D', 4, 3)

    $: systems = [A2, An, Dn, E6, D4]

    function toNumber(e: InputEvent) {
        return +(e.target! as HTMLInputElement).value
    }
</script>

<style>
    input[type="range"] {
        width: 6em;
    }
    table {
        display: block;
    }
    table td, table th {
        text-align: center;
        padding-right: 1em;
    }
    table tr td:first-child {
        text-align: left;
    }
    table td {
        min-width: 2em;
    }
    td.wide {
        min-width: 250px;
    }

    /* Hack to stop the A row from going wild based on height changes */
    table tr:nth-child(2) { height: 100px; }
</style>

<table>
    <thead>
        <tr>
            <th>Cartan type</th>
            <th>Dynkin diagram</th>
            <th title="Rank"><Latex markup={`|S|`} /></th>
            <th><Latex markup={`\\fg_0`} /></th>
            <th title="Coxeter number"><Latex markup={`h`} /></th>
            <th title="Marks"><Latex markup={`a_i`} /></th>
            <th title="Dual Coxeter number"><Latex markup={`h^\\vee`} /></th>
            <th title="Comarks"><Latex markup={`a_i^\\vee`} /></th>
        </tr>
    </thead>
    <tbody>
        {#each systems as {type, rank, aff, cartanMat, invariant, ai, aicheck, store, special}, index (index)}
            <tr>
                <td>
                    <Latex markup={`${type}_{${rank}}^{(${aff})}`} />
                    {#if store}
                        <input
                            type="range"
                            min={store.min}
                            max={store.max}
                            value={rank}
                            on:input={(e) => {store.set(toNumber(e))}}
                            />
                    {/if}
                </td>
                <td class="wide"><DynkinDiagram cartanMat={cartanMat} vertDist={30} horizDist={30} {special} /></td>
                <td>{cartanMat.nrows}</td>
                <td><Latex markup={invariant} /></td>
                <td>{vec.sum(ai)}</td>
                <td class="wide"><DynkinDiagram cartanMat={cartanMat} vertDist={30} horizDist={20} vertexLabels={(i) => ''+ai[i]}/></td>
                <td>{vec.sum(aicheck)}</td>
                <td class="wide"><DynkinDiagram cartanMat={cartanMat} vertDist={30} horizDist={20} vertexLabels={(i) => ''+aicheck[i]}/></td>
            </tr>
        {/each}
    </tbody>
</table>
