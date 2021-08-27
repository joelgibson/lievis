<script lang="ts">
    import { arr, cartan, rtsys } from 'lielib'

    import DynkinDiagram from './_DynkinDiagram.svelte'
    import Latex from '$lib/components/Latex.svelte'
    import { RangeStore } from '$lib/stores';

    function createData(type: string, rank: number, store?: RangeStore) {
        const rs = rtsys.createRootSystem(cartan.cartanMat(type, rank))
        const highrt = rtsys.highestRoot(rs)
        const special = arr.fromFunc(rank, (i) => highrt.wt[i] != 0)
        return {type, rank, rs, highrt, special, store}
    }

    let rankA = new RangeStore(1, 8, 3)
    let rankB = new RangeStore(2, 8, 3)
    let rankC = new RangeStore(2, 8, 3)
    let rankD = new RangeStore(3, 8, 4)

    $: An = createData('A', $rankA, rankA)
    $: Bn = createData('B', $rankB, rankB)
    $: Cn = createData('C', $rankC, rankC)
    $: Dn = createData('D', $rankD, rankD)
    let E6 = createData('E', 6)
    let E7 = createData('E', 7)
    let E8 = createData('E', 8)
    let F4 = createData('F', 4)
    let G2 = createData('G', 2)

    $: systems = [An, Bn, Cn, Dn, E6, E7, E8, F4, G2]

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
        width: 240px;
    }
</style>

<table>
    <thead>
        <tr>
            <th>Cartan type</th>
            <th>Dynkin diagram</th>
            <th title="Rank"><Latex markup={`|S|`} /></th>
            <th title="Number of roots"><Latex markup={`|R|`} /></th>
            <th title="Index of connection"><Latex markup={`|Q/P|`} /></th>
            <th title="Order of Weyl group"><Latex markup={`|W|`} /></th>
            <th title="Length of the longest element"><Latex markup={`l(w_0)`} /></th>
            <th title="Coxeter number"><Latex markup={`h`} /></th>
            <th title="Marks"><Latex markup={`a_i`} /></th>
            <th title="Dual Coxeter number"><Latex markup={`h^\\vee`} /></th>
            <th title="Comarks"><Latex markup={`a_i^\\vee`} /></th>
            <th title="Coxeter eigenvalues"><Latex markup={`m_i`} /></th>
        </tr>
    </thead>
    <tbody>
        {#each systems as {type, rank, rs, highrt, special, store}, index (index)}
            <tr>
                <td>
                    <Latex markup={`${type}_\{${rank}\}`} />
                    {#if type == 'A' || type == 'B' || type == 'C' || type == 'D'}
                        <input
                            type="range"
                            min={store.min}
                            max={store.max}
                            value={rank}
                            on:input={(e) => {store.set(toNumber(e))}}
                            />
                    {/if}
                </td>
                <td class="wide"><DynkinDiagram cartanMat={rs.cartan} vertDist={30} horizDist={30} special={special}/></td>
                <td>{rank}</td>
                <td>{2 * rs.posRoots.length}</td>
                <td>{rtsys.indexOfConnection(rs)}</td>
                <td>{rtsys.weylOrder(rs).toLocaleString()}</td>
                <td>{rtsys.longestWord(rs).length.toLocaleString()}</td>
                <td>{rtsys.coxeterNumber(rs)}</td>
                <td><DynkinDiagram cartanMat={rs.cartan} vertDist={30} horizDist={20} vertexLabels={(i) => ''+highrt.rt[i]}/></td>
                <td>{rtsys.dualCoxeterNumber(rs)}</td>
                <td><DynkinDiagram cartanMat={rs.cartan} vertDist={30} horizDist={20} vertexLabels={(i) => ''+rtsys.highestShortCoroot(rs).rt[i]}/></td>
                <td>{rtsys.coxeterEigenvalues(rs)}</td>
            </tr>
        {/each}
    </tbody>
</table>
