<script lang="ts">
    import { vec, mat, fmt } from 'lielib'

    import DynkinDiagram from './_DynkinDiagram.svelte'
    import Latex from '$lib/components/Latex.svelte'

    let rows = [
        {
            kind: 'A_1 \\times A_1', a: 0, m: 2,
            cartanMat: mat.fromRows([[2, 0], [0, 2]]),
            cartanDat: mat.fromRows([[2, 0], [0, 2]]),
        },
        {
            kind: 'A_2', a: 1, m: 3,
            cartanMat: mat.fromRows([[2, -1], [-1, 2]]),
            cartanDat: mat.fromRows([[2, -1], [-1, 2]]),
        },
        {
            kind: 'B_2, C_2', a: 2, m: 4,
            cartanMat: mat.fromRows([[2, -1], [-2, 2]]),
            cartanDat: mat.fromRows([[4, -2], [-2, 2]])
        },
        {
            kind: 'G_2', a: 3, m: 6,
            cartanMat: mat.fromRows([[2, -1], [-3, 2]]),
            cartanDat: mat.fromRows([[6, -3], [-3, 2]]),
        },
        {
            kind: 'A_1^{(1)}', a: 4, m: '\\infty',
            cartanMat: mat.fromRows([[2, -2], [-2, 2]]),
            cartanDat: mat.fromRows([[2, -2], [-2, 2]]),
        },
        {
            kind: 'A_2^{(2)}', a: 4, m: '\\infty',
            cartanMat: mat.fromRows([[2, -1], [-4, 2]]),
            cartanDat: mat.fromRows([[8, -4], [-4, 2]]),
        },
    ]

    function aboveLabels(i: number): string {
        return (i == 0) ? 'i' : 'j'
    }
</script>

<figure>
<table>
    <thead>
        <tr>
            <th>Kind</th>
            <th>Dynkin</th>
            <th><Latex markup={`[a_{ij}]`} /></th>
            <th><Latex markup={`a_{ij} a_{ji}`} /></th>
            <th><Latex markup={`m_{ij}`} /></th>
            <th><Latex markup={`[i \\cdot j]`} /></th>
            <!-- <th title="Rank"><Latex markup={`|S|`} /></th>
            <th title="Coxeter number"><Latex markup={`h`} /></th>
            <th title="Marks"><Latex markup={`a_i`} /></th>
            <th title="Dual Coxeter number"><Latex markup={`h^\\vee`} /></th>
            <th title="Comarks"><Latex markup={`a_i^\\vee`} /></th> -->
        </tr>
    </thead>
    <tbody>
        {#each rows as {kind, a, m, cartanMat, cartanDat}, index (index)}
            <tr>
                <td><Latex markup={kind} /></td>
                <td><DynkinDiagram {cartanMat} vertDist={30} horizDist={30} {aboveLabels} /></td>
                <td><Latex markup={fmt.matrix(cartanMat)} /></td>
                <td>{a}</td>
                <td><Latex markup={`${m}`} /></td>
                <td><Latex markup={fmt.matrix(cartanDat)} /></td>
            </tr>
        {/each}
    </tbody>
</table>
</figure>

<style>
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
    td { padding: 0.5em; }
</style>
