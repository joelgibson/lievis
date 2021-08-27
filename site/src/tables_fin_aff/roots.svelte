<script lang="ts">
    import { cartan, rtsys, vec } from 'lielib'
    import Latex from '$lib/components/Latex.svelte'

    const type = 'B'
    const rank = 3
    const rs = rtsys.createRootSystem(cartan.cartanMat(type, rank))
</script>

<p>{type}{rank} roots</p>

<figure>
<table>
    <thead>
        <tr>
            <th><Latex markup={`\\alpha`} /></th>
            <th><Latex markup={`\\varpi`} /></th>
            <th><Latex markup={`\\alpha^\\vee`} /></th>
            <th><Latex markup={`\\varpi^\\vee`} /></th>
        </tr>
    </thead>
    <tbody>
        {#each rs.posRoots as root}
        <tr>
            <td>{root.rt}</td>
            <td>{root.wt}</td>
            <td>{rs.posCoroots[root.index].rt}</td>
            <td>{rs.posCoroots[root.index].wt}</td>
        </tr>
        {/each}
    </tbody>
</table>
</figure>

<style>
    td { min-width: 3em; }
</style>
