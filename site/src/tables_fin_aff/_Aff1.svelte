<script lang="ts">
    import { arr, mat, vec, cartan } from 'lielib'

    import DynkinDiagram from './_DynkinDiagram.svelte'
    import Latex from '$lib/components/Latex.svelte'
    import { RangeStore } from '$lib/stores'

    function createData(type: string, rank: number, store?: RangeStore) {
        const cartanMat = cartan.cartanMat(type, rank, 1)
        let [ai] = mat.kernel(cartanMat).map(k => k.map(x => Math.round(x * 10) / 10))
        // Correct A_2^{(2)}
        let minai = Math.min(...ai)
        if (minai < 1)
            ai = ai.map(x => x / minai)
        const [aicheck] = mat.kernel(mat.transpose(cartanMat)).map(k => k.map(x => Math.round(x * 10) / 10))
        const special = arr.fromFunc(cartanMat.nrows, (i) => i == cartanMat.nrows - 1)
        return {type, rank, cartanMat, ai, aicheck, special, store}
    }

    let rankA = new RangeStore(1, 8, 3)
    let rankB = new RangeStore(2, 8, 3)
    let rankC = new RangeStore(2, 8, 3)
    let rankD = new RangeStore(3, 8, 4)

    let A1 = createData('A', 1)
    $: An = createData('A', $rankA, rankA)
    $: Bn = createData('B', $rankB, rankB)
    $: Cn = createData('C', $rankC, rankC)
    $: Dn = createData('D', $rankD, rankD)
    let E6 = createData('E', 6)
    let E7 = createData('E', 7)
    let E8 = createData('E', 8)
    let F4 = createData('F', 4)
    let G2 = createData('G', 2)

    $: systems = [A1, An, Bn, Cn, Dn, E6, E7, E8, F4, G2]

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
    td.wide {
        width: 260px;
    }
    /* Hack to stop the D row from going wild based on height changes */
    table tr:nth-child(5) { height: 120px; }
</style>

<table>
    <thead>
        <tr>
            <th>Cartan type</th>
            <th>Dynkin diagram</th>
            <th title="Rank"><Latex markup={`|S|`} /></th>
            <th title="Coxeter number"><Latex markup={`h`} /></th>
            <th title="Marks"><Latex markup={`a_i`} /></th>
            <th title="Dual Coxeter number"><Latex markup={`h^\\vee`} /></th>
            <th title="Comarks"><Latex markup={`a_i^\\vee`} /></th>
        </tr>
    </thead>
    <tbody>
        {#each systems as {type, rank, cartanMat, ai, aicheck, special, store}, index (index)}
            <tr>
                <td>
                    <Latex markup={`${type}_{${rank}}^{(1)}`} />
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
                <td class="wide"><DynkinDiagram {cartanMat} vertDist={30} horizDist={30} {special} /></td>
                <td>{cartanMat.nrows}</td>
                <td>{vec.sum(ai)}</td>
                <td class="wide"><DynkinDiagram cartanMat={cartanMat} vertDist={30} horizDist={20} vertexLabels={(i) => ''+ai[i]}/></td>
                <td>{vec.sum(aicheck)}</td>
                <td class="wide"><DynkinDiagram cartanMat={cartanMat} vertDist={30} horizDist={20} vertexLabels={(i) => ''+aicheck[i]}/></td>
            </tr>
        {/each}
    </tbody>
</table>
