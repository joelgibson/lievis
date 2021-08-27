<script lang="ts">
    import { arr, maps, mat, draw, EnumCox } from 'lielib'
    import type { Mat, Vec } from 'lielib'

    import Latex from '$lib/components/Latex.svelte'

    const width = 800
    const height = 500

    // Cochar is in the (w1, delta*) basis where w1 is the finite coweight. So V1 = w1 + delta*, V2 = delta* are the affine coweights.
    let proj = mat.fromRows([[1, 0], [0, 2]])
    let sect = mat.inverse(proj)
    let Cochar = draw.Coords.fromLegacy(width, height, [width/2, 0.75 * height], 80, proj, sect)

    // Char is in the (a1, delta) basis, with a2 = -a1 + delta
    let proj2 = mat.fromRows([[1, 0], [0, 1]])
    let sect2 = mat.inverse(proj)
    let char = draw.Coords.fromLegacy(0.2 * width, height, [0.2 * width/2, 0.75 * height], 40, proj2, sect2)


    let cox = new EnumCox(mat.fromRows([[1, 0], [0, 1]]))
    for (let i = 0; i < 100; i++)
        cox.grow(i%2)

    // Simple roots in the (alpha_1, delta) basis.
    let simpRoots = [[1, 0], [-1, 1]]
    let nroots = 50
    let roots = arr.fromFunc(nroots, i => [(i % 2 == 0) ? 1 : -1, Math.floor((i - nroots/2)/2)])
    let rootToIdx = new maps.EntryVecMap<number>()
    for (let i = 0; i < roots.length; i++)
        rootToIdx.set(roots[i], i)

    let makePositive = ([a, d]: number[]) => (d > 0 || (d == 0 && a > 0)) ? [a, d] : [0-a, 0-d]

    type Alcove = Vec[]
    let reflMats: [Mat, Mat] = [
        mat.fromRows([[-1, 0], [0, 1]]),
        mat.fromRows([[-1, 0], [2, 1]]),
    ]
    let actionMat = cox.leftMemo(mat.id(2), (s, m) => mat.multMat(reflMats[s], m))
    let idAlcove: Alcove = [[1, 0], [-1, 1]]
    let getAlcove = cox.leftMemo(idAlcove, (s, alcs) => alcs.map(alc => mat.multVec(reflMats[s], alc)))
    let getInvset = cox.leftMemo([], (s, sxinv, sx) => {
        let winv = actionMat(cox.inverse(sx))
        let newRoot = mat.multVec(winv, simpRoots[s])
        let newRootIdx = rootToIdx.get(makePositive(newRoot))
        return sxinv.concat(newRootIdx)
    })
    let selectedChamber = 0
    $: selectedInvSet = getInvset(selectedChamber)
    $: selectedAlphaImage = mat.multVec(actionMat(selectedChamber), [1, 0])
    let chambers = arr.range(20)

    let selectedRootIdx = Math.floor(nroots/2)
    $: selectedRoot = roots[selectedRootIdx]
    $: selectedOtherRootIdx = arr.indexWhere(roots, ([x, y]) => x == -selectedRoot[0] && y == -selectedRoot[1])
    $: isSelected = (i) => i == selectedRootIdx || i == selectedOtherRootIdx

    // Matrix multiplication is on the opposite side here because we're multiplying in a basis
    // dual to the original basis.
    let selectedCoPt = [1, 1]
    $: selectedPtCoOrbit = arr.fromFunc(30, i => mat.multVecLeft(selectedCoPt, actionMat(i)))

    let selectedPt = [1, 1]
    $: selectedPtOrbit = [selectedPt] //arr.fromFunc(30, i => mat.multVec(actionMat(i), selectedPt))

    function rootLabel([a1, d]: number[]) {
        a1 += d
        let a2 = d
        if (a1 >= 0)
            return `${a1},${a2}`
        else
            return `-${0-a1},${0-a2}`
    }

    function mouseMove(e: MouseEvent, which: 'dual' | 'primal') {
        let svg = e.currentTarget as HTMLCanvasElement
        let box = svg.getBoundingClientRect()
        let x = e.clientX - box.left
        let y = e.clientY - box.top
        if (which == 'dual')
            selectedCoPt = Cochar.fromPixels([x, y])
        else
            selectedPt = char.fromPixels([x, y])
    }
</script>

<figure class="row">
    <!-- Chambers in the dual -->
    <figure class="dual">
        <div class="wrapper">
            <svg width={width} height={height} on:mousemove={(e) => mouseMove(e, 'dual')}>
                <!-- Selected chamber -->
                <path
                    d={Cochar.openTriangle(...getAlcove(selectedChamber))}
                    stroke="none"
                    fill="lightgreen"
                    />

                <!-- Gridlines -->
                <path
                    d={Cochar.covector([1, 0], 1)}
                    stroke="grey"
                    stroke-width="1"
                    />
                <path
                    d={Cochar.covector([0, 1], 1)}
                    stroke="grey"
                    stroke-width="1"
                    />

                <!-- Coroot vectors -->
                <path
                    d={Cochar.vector([2, 0])}
                    stroke="blue"
                    stroke-width="2"
                    />
                <path
                    d={Cochar.vector([-2, 0])}
                    stroke="blue"
                    stroke-width="2"
                    />

                <!-- Coweight vectors -->
                <path
                    d={Cochar.vector([1, 1])}
                    stroke="blue"
                    stroke-width="2"
                    />
                <path
                    d={Cochar.vector([0, 1])}
                    stroke="blue"
                    stroke-width="2"
                    />
                <path
                    d={Cochar.vector([1, 0])}
                    stroke="blue"
                    stroke-width="2"
                    />


                <!-- delta=1 line -->
                <path
                    d={Cochar.line([0, 1], 1)}
                    stroke="blue"
                    stroke-width="1"
                    />

                <!-- Reflecting hyperplanes -->
                {#each roots as root, i}
                    <path
                        d={Cochar.line(root, 0)}
                        stroke={isSelected(i) ? "red" : "black"}
                        stroke-width={isSelected(i) ? 2 : 1}
                        />
                {/each}

                <!-- Orbit of selected point. -->
                {#each selectedPtCoOrbit as pt}
                    <circle
                        cx={Cochar.x(pt)}
                        cy={Cochar.y(pt)}
                        r="2"
                        fill="purple"
                        />
                {/each}

                <!-- Transparent chambers over the top, so that we can detect what chamber the mouse is in. -->
                {#each chambers as coxElt}
                    <path
                        d={Cochar.openTriangle(...getAlcove(coxElt))}
                        stroke="none"
                        fill="#00000000"
                        on:mouseover={() => selectedChamber = coxElt}
                        />
                {/each}
            </svg>

            <div style={Cochar.absPosition([-4.7, 1.07]) + " color: blue;"}>
                <Latex markup={`\\delta = 1`} />
            </div>
            <!-- Mark coroots -->
            <div style={Cochar.absPosition([2.2, 0.07])}><Latex markup={`\\alpha_1^\\vee`} /></div>
            <div style={Cochar.absPosition([-2.2, 0.07])}><Latex markup={`\\alpha_2^\\vee`} /></div>
            <!-- Mark affine coweights -->
            <div style={Cochar.absPosition([1.12, 0.90])}><Latex markup={`\\Lambda_1^\\vee`} /></div>
            <div style={Cochar.absPosition([-0.2, 0.93])}><Latex markup={`\\Lambda_2^\\vee`} /></div>
            <!-- Mark finite coweight and delta* -->
            <div style={Cochar.absPosition([0.2, 0.93])}><Latex markup={`\\delta^*`} /></div>
            <div style={Cochar.absPosition([1.2, -0.04])}><Latex markup={`\\varpi_1^\\vee`} /></div>
        </div>
    </figure>

    <!-- Roots in the primal -->
    <figure class="primal">
        <div class="wrapper">
            <svg width={char.port.width} height={char.port.height} on:mousemove={(e) => mouseMove(e, 'primal')}>
                <!-- Gridlines -->
                <path
                    d={char.line([0, 1], 0)}
                    stroke="grey"
                    stroke-width="1"
                    />
                <path
                    d={char.line([1, 0], 0)}
                    stroke="grey"
                    stroke-width="1"
                    />

                <!-- Image of alpha_1 under the Weyl group element -->
                <path
                    d={char.circle(selectedAlphaImage, 10)}
                    fill="lightgreen"
                    />

                <!-- Root vectors -->
                <path
                    d={char.vector([1, 0])}
                    stroke="blue"
                    stroke-width="2"
                    />
                <path
                    d={char.vector([-1, 1])}
                    stroke="blue"
                    stroke-width="2"
                    />
                <path
                    d={char.vector([0, 1])}
                    stroke="blue"
                    stroke-width="2"
                    />

                <!-- Show inversion set -->
                {#each selectedInvSet as rootIdx}
                    <path
                        d={char.circle(roots[rootIdx], 10)}
                        stroke="darkgreen"
                        stroke-width="2"
                        fill="none"
                        />
                {/each}

                <!-- Orbit of selected point. -->
                {#each selectedPtOrbit as pt}
                    <circle
                        cx={char.x(pt)}
                        cy={char.y(pt)}
                        r="2"
                        fill="purple"
                        />
                {/each}

                {#each roots as root, i}
                    <path
                        d={char.circle(root, (i == selectedRootIdx) ? 5 : 3)}
                        fill="black"
                        />
                    <path
                        d={char.circle(root, 10)}
                        fill="#00000000"
                        on:mouseover={() => {
                            selectedRootIdx = i
                        }}
                        />
                    <text
                        x={char.x(root) + ((root[0] > 0) ? 20 : -20)}
                        y={char.y(root)}
                        text-anchor="middle"
                        dominant-baseline="middle"
                    >
                        {rootLabel(root)}
                    </text>
                {/each}
            </svg>

            <!-- Mark roots -->
            <div style={char.absPosition([0.5, -0.3])}><Latex markup={`\\alpha_1`} /></div>
            <div style={char.absPosition([-0.7, 0.4])}><Latex markup={`\\alpha_2`} /></div>
            <div style={char.absPosition([0.3, 1])}><Latex markup={`\\delta`} /></div>
        </div>
    </figure>
    <div class="break" />
    <figcaption>
        Word: {cox.shortLex(selectedChamber).map(x => x + 1).join('')}
    </figcaption>
</figure>

<style>
    .wrapper {
        position: relative;
        overflow: hidden;
    }
    .wrapper div {
        word-wrap: nowrap;
        user-select: none;
    }

</style>
