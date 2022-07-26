<!-- Visualisation of Affine Weyl groups for A~2, B~2, C~2, G~2.

This uses a direct draw-everything-to-a-canvas-every-time approach, which is performant
enough and clear to read and write. I did do a large experiment into using WebGL at some
point, but certain operations were just too hard to specify.

-->

<script lang="ts">
    import Latex from '$lib/components/Latex.svelte'

    import DynkinDiagram from './DynkinDiagram.svelte'
    import InteractiveMap from '../rank2reps/InteractiveMap.svelte'

    import type { Vec, Mat, CoxElt } from 'lielib'
    import { maps, vec, arr, cartan, draw, EnumCox, mat, rt2d, rtsys, digraph, hecke as hk, aff, lpoly } from 'lielib'
    import type { MagmaJson } from './pcans/pcan'
    import { pcanConfigs, readToHeckeAlg } from './pcans/pcan'
    import {colour} from './colour'
    import { rison } from '$lib/rison';

    const MAX_LENGTH = 80

    type Rank2Type = 'A' | 'B' | 'C' | 'G'

    let userPort = {width: 0, height: 0, aff: aff.Aff2.id}
    let fullscreen = false
    let controlsShown = true

    // const vertexColours = ['blue', 'green', 'red']
	const vertexColours = [
		// Generated using https://coolors.co/004e64-419d78-e3b23c-995fa3-dc136c

		'#004e64', // Navy
		'#419d78', // Green
		'#dc136c', // Rose
		'#e3b23c', // Yellow
		'#995fa3', // Purple
	]

    /** This function attempts to create equally spaced colours, by going around an irrational turn on the CIEHCL colour
     * wheel for each index. (CIEHCL was chosen because it is perceptually uniform). If accent is true, the result is
     * lightened but is otherwise the same colour.
    */
    function randomColour(index: number, accent?: boolean): string {
        if (index == -1)
            return '#ddd'

        return colour.rgba2hex(colour.ciehcl2rgba([0.2 + (index * 2 / (1 + Math.sqrt(5))) % 1, 45, 75 + 5 * Math.floor(index/5) + (accent ? 10 : 0), 1]))
    }

    /** AlcoveData stores an alcove's index in the Weyl group, vertices, and an interior point in some basis. */
    type AlcoveData = {
        coxElt: number
        vertices: number[][]
        intPt: number[]
    }

    /** The RootData type sets up an affine root system and Weyl group. */
    interface RootData {
        type: Rank2Type
        finCartanMat: Mat
        finRootSystem: rtsys.IRootSystem
        affCartanMat: Mat
        cox: EnumCox
        hecke: hk.HeckeAlg
        asHecke: hk.HeckeAlg

        /** Return an alcove in the 2-dimensional space, in the basis of the finite coweights. */
        finAlcoveFor(x: number): AlcoveData

        toFin(v: Vec): Vec
        toAff(v: Vec): Vec

        /** 2x2 matrices going from the finite coweight basis to a Euclidean basis respecting the inner product. */
        proj: Mat
        sect: Mat

        /** Get the affine generator for the p-dialated Weyl group. */
        pDialatedGenerator(p: number): number
    }

    function setupRootDataFromType(type: Rank2Type): RootData {
        let finCartanMat = cartan.cartanMat(type, 2)
        let finRootSystem = rtsys.createRootSystem(finCartanMat)
        let affCartanMat = rtsys.affineCartan(finRootSystem)
        return setupRootDataFromAffMat(affCartanMat)
    }

    function setupRootDataFromAffMat(affCartanMat: Mat): RootData {
        let finCartanMat = mat.submatrix(affCartanMat, [0, 1], [0, 1])
        // Dodgy hack to deduce type
        let type: 'A' | 'B' | 'C' | 'G' =
            (mat.equal(finCartanMat, cartan.cartanMat('A', 2))) ? 'A' :
            (mat.equal(finCartanMat, cartan.cartanMat('B', 2))) ? 'B' :
            (mat.equal(finCartanMat, cartan.cartanMat('C', 2))) ? 'C' :
            'G'
        let finRootSystem = rtsys.createRootSystem(finCartanMat)
        if (!mat.equal(affCartanMat, rtsys.affineCartan(finRootSystem)))
            throw new Error("Invalid finite-affine pair")
        let affCoxeterMat = cartan.cartanMatToCoxeterMat(affCartanMat)
        let cox = new EnumCox(affCoxeterMat)
        let hecke = new hk.HeckeAlg(cox)

        let affFundAlcove: AlcoveData = {
            coxElt: cox.id,
            vertices: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ],
            intPt: [1/3, 1/3, 1/3],
        }

        let affAlcoveFor = cox.leftMemo(
            affFundAlcove,
            (s: number, alc: AlcoveData) => ({
                coxElt: cox.multL(s, alc.coxElt),
                vertices: alc.vertices.map(vert => rtsys.simpleReflection(affCartanMat, 'coweight', s, vert)),
                intPt: rtsys.simpleReflection(affCartanMat, 'coweight', s, alc.intPt),
            })
        )

        let [a0, a1] = rtsys.highestRoot(finRootSystem).rt
        function toFin(affPt: Vec): Vec {
            let delta = affPt[0] * a0 + affPt[1] * a1 + affPt[2]
            return [affPt[0] / delta, affPt[1] / delta]
        }
        function toAff(finPt: Vec): Vec {
            return [finPt[0], finPt[1], -a0 * finPt[0] - a1 * finPt[1] + 1]
        }

        let finAlcoves: AlcoveData[] = []
        function finAlcoveFor(coxElt: number): AlcoveData {
            if (finAlcoves[coxElt] !== undefined)
                return finAlcoves[coxElt]

            let affAlcove = affAlcoveFor(coxElt)
            return finAlcoves[coxElt] = {
                coxElt,
                vertices: affAlcove.vertices.map(toFin),
                intPt: toFin(affAlcove.intPt),
            }
        }

        let {proj, sect} = rt2d.euclideanProjSect(rtsys.createRootSystem(mat.transpose(finCartanMat)))

        // Grow the Coxeter group large enough that the next two operations are defined
        cox.growToLength(12)

        // Reflection in the highest root
        let {s, word} = rtsys.reflectionWord(finRootSystem, rtsys.highestRoot(finRootSystem))
        let highRef = cox.readWord([].concat(word, [s], word.slice().reverse()))

        // Translation by the highest short coroot
        let highTrans = cox.multL(2, highRef)

        // Return the affine p-dialated generator
        function pDialatedGenerator(p: number) {
            // Convert to words, so that the Coxeter group will automatically grow.
            let refWord = cox.shortLex(highRef)
            let transWord = cox.shortLex(highTrans)
            let genWord: number[] = []
            for (let i = 0; i < p; i++)
                genWord.push(...transWord)

            genWord.push(...refWord)

            return cox.growToWord(genWord)
        }

        return {type, finCartanMat, finRootSystem, affCartanMat, cox, hecke, asHecke: new hk.HeckeAlg(cox, cox.subgroupToken([0, 1])), toFin, toAff, finAlcoveFor, proj, sect, pDialatedGenerator}
    }

    let inputType: Rank2Type = 'A'
    $: recieveInputType(inputType)
    function recieveInputType(inputType: Rank2Type) {
        magmaJson = null
        pcanIndex = 'none'
    }


    let pcanIndex: string = 'none'
    let pcanPromise: Promise<any> | null = null
    $: pcanPromise = computePcanPromise(pcanIndex)
    let pcanBasis: maps.IMap<number, hk.HeckeElt>
    function computePcanPromise(pcanIndex: string): Promise<any> | null {
        if (pcanIndex == 'none')
            return null

        return pcanConfigs[+pcanIndex].promise().then(x => pushMagmaJson(x.default))
    }

    let magmaJson: MagmaJson | null = null
    function pushMagmaJson(magmaJsonin: MagmaJson) {
        magmaJson = magmaJsonin
        if (labelConfig.search('pcan') < 0)
            labelConfig = 'pcanincan'

        pDialationEnabled = true
        pDialation = magmaJsonin.char
    }

    let rtDat: RootData
    $: rtDat = (magmaJson == null) ? setupRootDataFromType(inputType) : setupRootDataFromAffMat(mat.fromColumns(magmaJson.cartan))
    let D = new draw.NewCoords(draw.viewPort(0, 0, 0, 0), aff.Aff2.id)
    $: D = new draw.NewCoords(
        draw.viewPort(0, 0, userPort.width, userPort.height),
        aff.Aff2.fromLinear(rtDat.proj, rtDat.sect).then(userPort.aff),
    )
    let shownCoxElts: number[] = []

    $: ({pcanBasis, shownCoxElts} = computeShownCoxElts(rtDat, magmaJson))
    function computeShownCoxElts(rtDat: RootData, magmaJson: MagmaJson | null) {
        if (magmaJson != null) {
            pcanBasis = readToHeckeAlg(rtDat.hecke, magmaJson)
            // Grow a bit further so that multiplication by the affine generator is always
            // defined on the shown elements
            for (let s of rtDat.cox.shortLex(rtDat.pDialatedGenerator(magmaJson.char)))
                rtDat.cox.grow(s)

            shownCoxElts = maps.keys(pcanBasis)
            return {pcanBasis, shownCoxElts}
        }

        rtDat.cox.growToLength(MAX_LENGTH + 12) // +12 for safety margin?
        shownCoxElts = arr.range(rtDat.cox.size()).filter(x => rtDat.cox.length(x) <= MAX_LENGTH)
        return {pcanBasis: new maps.FlatIntMap<hk.HeckeElt>(), shownCoxElts}
    }

    type LabelConfig = 'none' | 'rex' | 'length' | 'numrex' | 'klpoly' | 'mucoeff' | 'klpoly1' | 'asklpoly' | 'asklpoly1' | 'pmixedbasis' | 'aspmixedbasis' | 'pcanincan' | 'pcanincan1' | 'pcanmag' | 'pcaninstd' | 'pcaninstd1' | 'pcaninmixed'
    let labelConfig: LabelConfig = 'none'
    let shadeLabels: boolean = false

    type ShadeConfig = 'none' | 'bruhat' | 'rightweak' | 'leftweak' | 'conetype' | 'dihedral' | 'doublecoset'
    let shadeConfig: ShadeConfig = 'none'
    let shadeCoveringRel = false

    type CellConfig = 'none' | 'left' | 'right' | 'twosided'
    let cellConfig: CellConfig = 'none'

    let selCoxElt: number | null = null

    type TreeConfig = 'none' | 'shortLex' | 'invshortlex'
    let treeConfig: TreeConfig = 'none'

    let pDialation = 5
    let pDialationEnabled = false

    type SimpLabelConfig = 'zero' | 'one' | 'stu'
    let simpLabelConfig: SimpLabelConfig = 'stu'
    let simpLabelFn = {
        'zero'(s: number) { return '012'[s] },
        'one'(s: number) { return '123'[s] },
        'stu'(s: number) { return 'stu'[s] },
    }

    function shorten(word: string, limit: number) {
        const HALF = limit >> 1
        if (word.length >= limit + 3) {
            return word.slice(0, HALF) + '...' + word.slice(word.length - HALF)
        }
        return word
    }

    type PCanConfig = {
        char: number
        paraBits: number
    }

    type UserConfig = {
        controls: boolean
        fullscreen: boolean
        type: Rank2Type
        labels: LabelConfig
        labelShade: boolean
        shade: ShadeConfig
        cells: CellConfig
        nfTree: TreeConfig
        pDialation: number
        pDialationEnabled: boolean
        pCan: string
        simples: SimpLabelConfig
    }

    const defaultUserConfig: UserConfig = {
        controls: true,
        fullscreen: false,
        type: 'A',
        labels: 'none',
        labelShade: false,
        shade: 'none',
        cells: 'none',
        nfTree: 'none',
        pDialation: 5,
        pDialationEnabled: false,
        pCan: 'none',
        simples: 'stu',
    }

    /** Return the delta of changes against the default settings. */
    function configChanges<T>(base: T, modified: T): Partial<T> {
        let result: Partial<T> = {}
        for (let key in base)
            if (base[key] != modified[key])
                result[key] = modified[key]

        return result
    }

    let userConfig: UserConfig
    $: userConfig = {
        controls: controlsShown,
        fullscreen,
        type: inputType,
        labels: labelConfig,
        labelShade: shadeLabels,
        shade: shadeConfig,
        cells: cellConfig,
        nfTree: treeConfig,
        pDialation,
        pDialationEnabled,
        pCan: pcanIndex,
        simples: simpLabelConfig,
    }

    function loadFromHash(fragment: string) {
        let delta: Partial<UserConfig>
        try {
            delta = rison.decode(fragment)
        } catch (e) {
            console.log("Error while trying to decode", fragment, e)
            return
        }

        let newConfig: UserConfig = {...defaultUserConfig, ...delta}
        pushUserConfig(newConfig)
    }

    // replaceState changes the URL without triggering a hashchange event.
    $: history.replaceState(null, null, document.location.pathname + '#' + rison.encode(configChanges(defaultUserConfig, userConfig)))

    /** Completely reset the state from a config. */
    function pushUserConfig(config: UserConfig) {
        controlsShown = config.controls
        fullscreen = config.fullscreen
        inputType = config.type
        labelConfig = config.labels
        shadeLabels = config.labelShade
        shadeConfig = config.shade
        cellConfig = config.cells
        treeConfig = config.nfTree
        pDialation = config.pDialation
        pDialationEnabled = config.pDialationEnabled
        pcanIndex = config.pCan
        simpLabelConfig = config.simples
    }

    type DisplayConfig = {
        selCoxElt: number | null
        shownCoxElts: number[]
        labelConfig: LabelConfig
        shadeConfig: ShadeConfig
        shadeLabels: boolean
        shadeCoveringRel: boolean
        cellConfig: CellConfig
        treeConfig: TreeConfig
        simpLabelConfig: SimpLabelConfig
    }

    let displayConfig: DisplayConfig
    $: displayConfig = {selCoxElt, shownCoxElts, labelConfig, shadeLabels, shadeConfig, shadeCoveringRel, cellConfig, treeConfig, simpLabelConfig}

    // A label function returns a function giving each Coxeter element a label. The label can be a string or a number,
    // empty strings and zeros are completely ignored.
    type LabelFn = (rtDat: RootData, displayConfig: DisplayConfig, pcanBasis: maps.IMap<number, hk.HeckeElt>, pDialatedGenerator: number) => ((w: CoxElt) => string | number)
    const labelFns: {[name in LabelConfig]: LabelFn} = {
        none() { return () => 0 },
        rex({type, cox}, {simpLabelConfig}) {
            return w => {
                if (cox.length(w) >= 9 || (cox.length(w) >= 7 && type == 'G')) {
                    return ''
                }
                return cox.shortLex(w).map(simpLabelFn[simpLabelConfig]).join('')
            }
        },
        length({cox}) { return (w) => cox.length(w) },
        numrex({cox}) { let rexes = cox.countReducedExpressions(); return w => rexes[w] },
        klpoly({cox, hecke}, {selCoxElt}) {
            if (selCoxElt == null)
                return w => ''

            let canElt = hecke.can(selCoxElt)
            // This is for returning KL-normalisation
            //return w => canElt.get(w).fmt({format: 'unicode', zeroIsEmptyString: true, shift: cox.length(w) - cox.length(selCoxElt), scale: -1/2, varname: 'q'})
            return w => lpoly.fmt(canElt.get(w), {format: 'unicode', zeroIsEmptyString: true})
        },
        klpoly1({hecke}, {selCoxElt}) {
            let canElt = (selCoxElt == null) ? hecke.zero : hecke.can(selCoxElt)
            return w => lpoly.evaluate(canElt.get(w), 1)
        },
        mucoeff({hecke}, {selCoxElt}) {
            let muvec = hecke.muvec(selCoxElt || 0) // Using the fact that the identity has no mu coefficients.
            return w => muvec.getWithDefault(w, 0)
        },
        asklpoly({asHecke}, {selCoxElt}) {
            if (selCoxElt == null)
                return w => ''

            let canElt = asHecke.can(selCoxElt)
            return w => lpoly.fmt(canElt.get(w), {format: 'unicode', zeroIsEmptyString: true})
        },
        asklpoly1({asHecke}, {selCoxElt}) {
            let canElt = (selCoxElt == null) ? asHecke.zero : asHecke.can(selCoxElt)
            return w => lpoly.evaluate(canElt.get(w), 1)
        },
        pmixedbasis({hecke, cox}, {selCoxElt}, pCanBasis, pDialatedGenerator) {
            if (selCoxElt == null) return w => ''
            let mixed = pMixedBasisElt(hecke, cox, pDialatedGenerator, selCoxElt)
            return w => mixed.getWithDefault(w, 0)
        },
        aspmixedbasis({asHecke, cox}, {selCoxElt}, pCanBasis, pDialatedGenerator) {
            if (selCoxElt == null) return w => ''
            let mixed = pMixedBasisElt(asHecke, cox, pDialatedGenerator, selCoxElt)
            return w => mixed.getWithDefault(w, 0)
        },
        pcanincan({asHecke}, {selCoxElt}, pCanBasis) {
            let pcanElt = (selCoxElt == null) ? asHecke.zero : pCanBasis.getWithDefault(selCoxElt, asHecke.zero)
            return w => lpoly.fmt(pcanElt.get(w), {format: 'unicode', zeroIsEmptyString: true})
        },
        pcanincan1({asHecke}, {selCoxElt}, pCanBasis) {
            let pcanElt = (selCoxElt == null) ? asHecke.zero : pCanBasis.getWithDefault(selCoxElt, asHecke.zero)
            return w => lpoly.evaluate(pcanElt.get(w), 1)
        },
        pcaninstd({asHecke}, {selCoxElt}, pCanBasis) {
            let pcanElt = (selCoxElt == null) ? asHecke.zero : pCanBasis.getWithDefault(selCoxElt, asHecke.zero)
            let stdElt = asHecke.applyLinear(pcanElt, w => asHecke.can(w))
            return w => lpoly.fmt(stdElt.get(w), {format: 'unicode', zeroIsEmptyString: true})
        },
        pcaninstd1({asHecke}, {selCoxElt}, pCanBasis) {
            let pcanElt = (selCoxElt == null) ? asHecke.zero : pCanBasis.getWithDefault(selCoxElt, asHecke.zero)
            let stdElt = asHecke.applyLinear(pcanElt, w => asHecke.can(w))
            return w => lpoly.evaluate(stdElt.get(w), 1)
        },
        pcanmag({}, {}, pcanBasis) { return w => '' + pcanBasis.ask(w).supportSize()},
        pcaninmixed({asHecke, cox}, {selCoxElt}, pCanBasis, pDialatedGenerator) {
            let pcanElt = (selCoxElt == null) ? asHecke.zero : pCanBasis.getWithDefault(selCoxElt, asHecke.zero)
            let stdElt = asHecke.applyLinear(pcanElt, w => asHecke.can(w))
            let mixedElt = intoPMixedBasis(asHecke, cox, pDialatedGenerator, stdElt.eval(1))
            return w => mixedElt.getWithDefault(w, 0)
        }
    }

    // Compute labels into shownLabels.
    let shownLabels: maps.IMap<number, string>
    $: shownLabels = createLabels(rtDat, displayConfig, pcanBasis, pDialatedGenerator)
    function createLabels(
        rtDat: RootData,
        displayConfig: DisplayConfig,
        pcanBasis: maps.IMap<number, hk.HeckeElt>,
        pDialatedGenerator: number,
    ): maps.IMap<number, string> {
        let fn = labelFns[displayConfig.labelConfig](rtDat, displayConfig, pcanBasis, pDialatedGenerator)
        let map = new maps.FlatIntMap<string>()
        for (let i = 0; i < displayConfig.shownCoxElts.length; i++) {
            let w = displayConfig.shownCoxElts[i]
            let s = fn(w)
            if (s === 0 || s == '')
                continue
            map.set(w, '' + s)
        }
        return map
    }

    // Compute a shaded set for ordering
    let shadedSet: maps.IMap<number, string>
    $: shadedSet = createShadedSet(rtDat, displayConfig)
    function createShadedSet(rtDat: RootData, displayConfig: DisplayConfig): maps.IMap<number, string> {
        let map = new maps.FlatIntMap<string>()
        if (displayConfig.shadeConfig == 'dihedral') {
            return maps.fromKeysValFn(
                maps.FlatIntMap,
                displayConfig.shownCoxElts.filter(elt => rtDat.cox.coatoms(elt).length <= 2),
                elt => '#00000022',
            )
        }

        if (displayConfig.shadeConfig == 'none' || displayConfig.selCoxElt == null)
            return map

        if (displayConfig.shadeConfig == 'conetype') {
            for (let elt of displayConfig.shownCoxElts) {
                let prod = rtDat.cox.multMaybe(displayConfig.selCoxElt, elt)
                if (prod !== null && rtDat.cox.length(prod) == rtDat.cox.length(displayConfig.selCoxElt) + rtDat.cox.length(elt))
                    map.set(elt, '#00000022')
            }

            return map
        }

        if (displayConfig.shadeConfig == 'doublecoset') {
            let para = (1<<3) | (1<<4) | (1<<0) | (1<<1)
            return maps.fromKeysValFn(
                maps.FlatIntMap,
                displayConfig.shownCoxElts.filter(w => rtDat.cox.isMinimal(para, w)),
                w => '#00000022',
            )
        }

        let lower = rtDat.cox.bruhatLower(displayConfig.selCoxElt, displayConfig.shadeConfig)
        for (let elt of displayConfig.shownCoxElts)
            if (lower[elt])
                map.set(elt, '#00000022')

        if (displayConfig.shadeCoveringRel) {
            rtDat.cox.descendents(displayConfig.selCoxElt, displayConfig.shadeConfig).forEach(y => {
                if (displayConfig.shownCoxElts.indexOf(y) >= 0)
                    map.set(y, '#00ff0022')
            })
        }

        return map
    }


    // Compute the cells. We pre-compute the strong components directly from cellConfig, so that it is cached.
    let cellSccs: hk.SCCReturnType | null
    $: cellSccs = (cellConfig == 'none') ? null : rtDat.hecke.cells(35, 21)[cellConfig]
    $: cellLayout = (cellConfig == 'none')
        ? undefined
        : digraph.layoutPoset(cellSccs.G, {orientation: 'up'})
    let cellColours: maps.FlatIntMap<string>
    $: cellColours = createCellColours(rtDat, cellSccs, displayConfig)
    function createCellColours(rtDat: RootData, cellSccs: hk.SCCReturnType | null, displayConfig: DisplayConfig): maps.FlatIntMap<string> {
        let map = new maps.FlatIntMap<string>()
        if (displayConfig.cellConfig == 'none' || cellSccs == null)
            return map

        let numScc = cellSccs.G.nodeCount()
        let selectedScc = (displayConfig.selCoxElt == null) ? -1 : cellSccs.scc[displayConfig.selCoxElt]
        let numToColour = arr.fromFunc(numScc, scc => randomColour(scc, scc == selectedScc))
        for (let elt of displayConfig.shownCoxElts)
            if (cellSccs.scc[elt] >= 0)
                map.set(elt, numToColour[cellSccs.scc[elt]])
        return map
    }


    /** Return edges of the tree, as a list of dicts {from, to, s}*/
    type TreeEdge = {from: number, to: number, s: number}
    let treeEdges: TreeEdge[]
    $: treeEdges = computeTreeEdges(rtDat, shownCoxElts, treeConfig)
    function computeTreeEdges(rtDat: RootData, shownCoxElts: CoxElt[], treeConfig: TreeConfig): TreeEdge[] {
        if (treeConfig == 'none')
            return []

        // The identity does not have a predecessor, hence start from 1.
        let edges: TreeEdge[] = []
        for (let elt of shownCoxElts) {
            // Need to skip the identity: it never has an incoming edge.
            if (elt == 0)
                continue

            if (treeConfig == 'invshortlex') {
                // For ShortInvLex, the last element of NF(x) is the smallest s such that sx < x.
                // We can then recover the prefix of NF(x) as NF(xs).
                let s = rtDat.cox.firstDescentR(elt)
                edges.push({from: rtDat.cox.multR(elt, s), to: elt, s})
            } else {
                // For ShortLex, we do the dumb thing and just truncate the last element of the word.
                let word = rtDat.cox.shortLex(elt)
                let s = word.pop()!
                edges.push({from: rtDat.cox.readWord(word), to: elt, s})
            }
        }

        return edges
    }

    /** Showing p-dilated subgroup. */
    let pDialatedGenerator: number
    $: pDialatedGenerator = rtDat.pDialatedGenerator(pDialation)
    function setPDialation(p: null | number, magmaJson: MagmaJson | null) {
        if (magmaJson != null) return
        if (p == null) pDialationEnabled = false
        else {
            pDialationEnabled = true
            pDialation = p
        }
    }

    /** Factorise an element into a product of W_p x ^p W. The left term is "contracted", i.e. in order to multiply these to return
     * the original input, the affine generator in the left term will need to be replaced by the p-dialated generator.
     */
    function pDialatedFactorise(cox: EnumCox, pDialatedGenerator: number, elt: number): [number, number] {
        let gens = [cox.gen(0), cox.gen(1), pDialatedGenerator]
        let left = cox.id
        let right = elt

        for (;;) {
            let i: number
            for (i = 0; i < gens.length; i++) {
                let prod = cox.multMaybe(gens[i], right)
                if (prod == null)
                    throw new Error("Null product")

                if (cox.length(prod) < cox.length(right))
                    break
            }

            if (i == gens.length)
                break

            left = (i == 2) ? cox.multR(left, 2) : cox.multMaybe(left, gens[i])
            right = cox.multMaybe(gens[i], right)
        }
        return [left, right]
    }

    /** Treat elt as sitting in the p-dialated subgroup, and include it into the group.
     * This corresponds to replacing the affine generator with a product representing the
     * p-dialated affine generator.
    */
    function pDialatedInclusion(cox: EnumCox, pDialatedGenerator: number, elt: number): number {
        let prod = cox.id
        while (elt != cox.id) {
            let s = cox.firstDescentL(elt)
            elt = cox.multL(s, elt)
            if (s <= 1)
                prod = cox.multR(prod, s)
            else
                prod = cox.multMaybe(prod, pDialatedGenerator)
        }

        return prod
    }

    /** Return the p-mixed basis element corresponding to elt. */
    function pMixedBasisElt(heckeAlg: hk.HeckeAlg, cox: EnumCox, pDialatedGenerator: number, elt: number): maps.IMap<number, number> {
        let [left, right] = pDialatedFactorise(cox, pDialatedGenerator, elt)
        let gpelt = heckeAlg.can(left).eval(1)

        let newgpelt = new maps.FlatIntMap<number>()
        gpelt.forEach((key, value) => {
            if (value == 0)
                return

            let prod = cox.multMaybe(pDialatedInclusion(cox, pDialatedGenerator, key), right)
            newgpelt.set(prod, value)
        })

        return newgpelt
    }

    /** Express an element in the p-mixed basis. */
    function intoPMixedBasis(heckeAlg: hk.HeckeAlg, cox: EnumCox, pDialatedGenerator: number, gpelt: maps.IMap<number, number>): maps.IFlatMap<number, number> {
        // Make a copy of gpelt
        let copy = new maps.FlatIntMap<number>()
        gpelt.forEach((key, value) => copy.set(key, value))

        // Until copy is empty, keep iterating through it looking for a maximal-length
        // nonzero element. Subtract off the correct multiple of the mixed basis element,
        // and add that multiple to a new linear combination.
        let inpmixed = new maps.FlatIntMap<number>()
        for (let iters = 0;; iters++) {
            let maxLength = -1
            let maxElt = -1
            for (let i = 0; i < copy.keys.length; i++) {
                if (copy.values[i] == 0) continue
                let length = cox.length(copy.keys[i])
                if (length > maxLength) {
                    maxLength = length
                    maxElt = copy.keys[i]
                }
            }

            if (maxLength == -1)
                break

            let multiple = copy.get(maxElt)
            let pmixed = pMixedBasisElt(heckeAlg, cox, pDialatedGenerator, maxElt)

            pmixed.forEach((key, value) => {
                copy.set(key, copy.getWithDefault(key, 0) - multiple * value)
            })


            inpmixed.set(maxElt, multiple)

            if (iters > 5000)
                throw new Error("Infinite loop")
        }

        return inpmixed
    }



    let pxDialatedAlcoves: AlcoveData[] = []
    $: pxDialatedAlcoves = computePxDialatedAlcoves(D, rtDat, shownCoxElts, pDialation, pDialationEnabled)
    function computePxDialatedAlcoves(D: draw.NewCoords, rtDat: RootData, shownCoxElts: number[], pDialation: number, pDialationEnabled: boolean) {
        if (!pDialationEnabled)
            return []

        let pxAlcoves: AlcoveData[] = []
        for (let elt of shownCoxElts)
            pxAlcoves[elt] = {
                coxElt: elt,
                vertices: rtDat.finAlcoveFor(elt).vertices.map((v) => D.aff2.xy(vec.scale(v, pDialation))),
                intPt: D.aff2.xy(vec.scale(rtDat.finAlcoveFor(elt).intPt, pDialation)),
            }

        return pxAlcoves
    }

    /** FixedGeometry only changes when the or set of shown Coxeter elements changes.
     * For each triangle, the vertices are stored as three adjacent rows in an 3Nx3 matrix,
     * where N is the number of shown Coxeter elements. Each row is in projectivised weight
     * coordinates, i.e. [wt_x, wt_y, 1]. */
    type FixedGeometry = {
        coxEltToIdx: maps.IMap<number, number>
        vertices: Mat
        intpts: Mat
    }
    let fixedGeometry: FixedGeometry
    $: fixedGeometry = calcFixedGeometry(rtDat, shownCoxElts)
    function calcFixedGeometry({finAlcoveFor}: RootData, shownCoxElts: number[]) {
        let coxEltToIdx = new maps.FlatIntMap<number>()
        for (let i = 0; i < shownCoxElts.length; i++)
            coxEltToIdx.set(shownCoxElts[i], i)

        let verticesRows: number[][] = []
        let verticesIntpts: number[][] = []
        for (let i = 0; i < shownCoxElts.length; i++) {
            let alcove = rtDat.finAlcoveFor(shownCoxElts[i])
            let [p, q, r] = alcove.vertices
            verticesRows.push(p.concat(1), q.concat(1), r.concat(1))

            verticesIntpts.push([(p[0] + q[0] + r[0])/3, (p[1] + q[1] + r[1])/3, 1])
        }

        return {coxEltToIdx, vertices: mat.fromRows(verticesRows), intpts: mat.fromRows(verticesIntpts)}
    }

    type ViewportGeometry = {
        coxEltToIdx: maps.IMap<number, number>
        eucVertices: Mat
        eucIntpts: Mat
    }
    let viewportGeometry: ViewportGeometry
    $: viewportGeometry = calcViewportGeometry(fixedGeometry, D.aff2.fwd)
    function calcViewportGeometry({coxEltToIdx, vertices, intpts}: FixedGeometry, fwd: Mat) {
        // Since we are storing vectors in rows instead of columns, transpose the matrix then multiply.
        return {
            coxEltToIdx,
            eucVertices: mat.multMat(vertices, mat.transpose(fwd)),
            eucIntpts: mat.multMat(intpts, mat.transpose(fwd)),
        }
    }

    function drawCanvas(
        canvasElt: HTMLCanvasElement,
        D: draw.NewCoords,
        rtDat: RootData,
        pDialation: number,
        pDialationEnabled: boolean,
        pDialatedGenerator: number,
        pxDialatedAlcoves: AlcoveData[],
        selCoxElt: null | number,
        shownLabels: maps.IMap<number, string>,
        shadedSet: maps.IMap<CoxElt, string>,
        cellColours: maps.FlatIntMap<string>,
        treeEdges: TreeEdge[],
        {coxEltToIdx, eucVertices, eucIntpts}: ViewportGeometry,
        frame: number,
        userPort: {width: number, height: number, aff: aff.Aff2},
    ) {
        let dpr = window.devicePixelRatio
        let [cssWidth, cssHeight] = [D.port.width, D.port.height]
        let [width, height] = [dpr * cssWidth, dpr * cssHeight]
        if (canvasElt.width != width || canvasElt.height != height) {
            canvasElt.width = width
            canvasElt.height = height
        }

        // D.affProj is taking us from weight space to CSS pixel space. We need to transform CSS pixel space
        // [0, cssWidth) x [0, cssHeight) back to clip space [-1, 1) x [-1, 1). The other difference between
        // these spaces is that the origin is at the bottom-left of clip space, but the top-left in CSS space.
        //
        // Why do we need to do the vertical flip? The other stuff measuring the screen (finding the mouse
        // cursor etc) is all happening in CSS space, and has the y-coordinate increasing down the screen.



        // Show labels
        let ctx = canvasElt.getContext('2d')
        ctx.resetTransform()
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, cssWidth, cssHeight)

        function fillTriangle(x: CoxElt, fillStyle: string) {
            let i = coxEltToIdx.get(x)
            ctx.fillStyle = fillStyle

            ctx.beginPath()
            ctx.moveTo(eucVertices.get(3*i + 0, 0), eucVertices.get(3*i + 0, 1))
            ctx.lineTo(eucVertices.get(3*i + 1, 0), eucVertices.get(3*i + 1, 1))
            ctx.lineTo(eucVertices.get(3*i + 2, 0), eucVertices.get(3*i + 2, 1))
            ctx.closePath()
            ctx.fill()
        }

        // Draw cell colours
        cellColours.forEach((elt, colour) => fillTriangle(elt, colour))

        // Colour the identity element
        fillTriangle(0, '#00aa9977')

        // Colour the selected element
        if (selCoxElt != null && coxEltToIdx.contains(selCoxElt)) {
            fillTriangle(selCoxElt, '#dc93eb')

            // Colour the factorisation of the selected element in the p-dialated piece of the minimal length coset rep.
            if (pDialationEnabled) {
                let [left, right] = pDialatedFactorise(rtDat.cox, pDialatedGenerator, selCoxElt)
                if (coxEltToIdx.contains(right))
                    fillTriangle(right, '#dc93eb77')
                // if (coxEltToIdx.contains(left))
                //     fillTriangle(ctx, '#dc93eb44', pxDialatedAlcoves[left].vertices)
            }
        }

        // Shaded Bruhat set
        shadedSet.forEach((elt, shade) => fillTriangle(elt, shade))

        // If we are shading the support of the labels, do that.
        if (displayConfig.shadeLabels) {
            shownLabels.forEach((elt, label) => {
                if (label != '')
                    fillTriangle(elt, '#ffaaaa')
            })
        }

        // Draw chamber walls
        let C = new draw.CanvasCoords(ctx, D.port, D.aff2.fwd, D.aff2.rev)
        ctx.save()
        ctx.strokeStyle = '#00000044'
        ctx.lineWidth = 0.05 * userPort.aff.detScale()
        let coroots = rtDat.finRootSystem.posRoots
        ctx.beginPath()
        for (let i = 0; i < coroots.length; i++)
            C.line(coroots[i].rt)
        ctx.stroke()

        // Draw the rest of the integral evaluations of covectors.
        ctx.lineWidth = 0.015 * userPort.aff.detScale()
        for (let i = 0; i < coroots.length; i++)
            C.covector(coroots[i].rt, 1)
        ctx.stroke()


        // If we are in the p-settings, draw the p-walls.
        if (pDialationEnabled) {
            for (let pow of [1, 2, 3, 4]) {
                ctx.beginPath()
                ctx.lineWidth = (pow + 3) * 0.015 * userPort.aff.detScale()
                for (let i = 0; i < coroots.length; i++)
                    C.covector(coroots[i].rt, Math.pow(pDialation, pow))
                ctx.stroke()
            }
        }
        ctx.restore()

        // Draw alcove walls, colour-by-colour.
        for (let s = 0; s < 3; s++) {
            // Each alcove is made out of three vertices: the s-wall is the line segment made by omitting
            // the vertex labelled s.
            let t = (s + 1) % 3
            let u = (s + 2) % 3
            ctx.strokeStyle = vertexColours[s]
            ctx.lineWidth = 0.015 * userPort.aff.detScale()
            ctx.beginPath()
            for (let i = 0; i < displayConfig.shownCoxElts.length; i++) {
                ctx.moveTo(eucVertices.get(3*i + s, 0), eucVertices.get(3*i + s, 1))
                ctx.lineTo(eucVertices.get(3*i + t, 0), eucVertices.get(3*i + t, 1))
            }
            ctx.stroke()
        }

        // Show the tree
        treeEdges.forEach(({from, to, s}) => {
            let p = coxEltToIdx.get(from)
            let q = coxEltToIdx.get(to)
            ctx.strokeStyle = vertexColours[s]
            ctx.beginPath()
            ctx.moveTo(eucIntpts.get(p, 0), eucIntpts.get(p, 1))
            ctx.lineTo(eucIntpts.get(q, 0), eucIntpts.get(q, 1))
            ctx.stroke()
        })

        // Draw labels
        if (shownLabels.size() > 0) {
            ctx.fillStyle = 'black'
            ctx.font = `${0.15 * userPort.aff.detScale()}px "Libertinus Serif"`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            shownLabels.forEach(function (elt, label) {
                // let intPt = rtDat.finAlcoveFor(elt).intPt
                // ctx.fillText(label, D.aff2.x(intPt[0], intPt[1]), D.aff2.y(intPt[0], intPt[1]))
                let i = coxEltToIdx.get(elt)
                ctx.fillText(label, eucIntpts.get(i, 0), eucIntpts.get(i, 1))
            })
        }
    }

    let canvasElt: HTMLCanvasElement

    function hoverPoint(xy: number[]) {
        let wt = D.aff2.uv(xy)
        let word = rtsys.makeDominantWord(rtDat.affCartanMat, 'coweight', rtDat.toAff(wt), 2000)
        let elt = rtDat.cox.readWordMaybe(word)
        selCoxElt = (shownCoxElts.indexOf(elt) >= 0) ? elt : null
    }

    let frame: number = 0
    $: if (canvasElt != null) { drawCanvas(canvasElt, D, rtDat, pDialation, pDialationEnabled, pDialatedGenerator, pxDialatedAlcoves, selCoxElt, shownLabels, shadedSet, cellColours, treeEdges, viewportGeometry, frame, userPort) }

    // Perhaps load from the hash
    if (document.location.hash.substring(0, 2) == '#(')
        loadFromHash(document.location.hash.substring(1))
</script>

<style>
    canvas {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }
    table { display: block; border-collapse: collapse; width: 23em;}
    table td { padding: 0.5px; }
    table, tr:not(:first-child) td {
        padding-top: 3px;
    }
    td:not(:first-child) { padding-left: 4px; }
    td:nth-child(1) { white-space: nowrap; }
    td:nth-child(2) { width: 100%; text-align: right; }
</style>

<svelte:window on:hashchange={(e) => loadFromHash(document.location.hash.substr(1))} />

<InteractiveMap
    minScale={10}
    maxScale={400}
    initScale={120}
    bind:fullscreen
    bind:userPort
    bind:controlsShown
    on:pointHovered={(e) => hoverPoint(e.detail)}
    >
    <svelte:fragment slot="other">
        <canvas bind:this={canvasElt} />
    </svelte:fragment>
    <div slot="controls">
        <div style="height: 5px;"></div>
        <table>
            <tr>
                <td><DynkinDiagram cartanMat={rtDat.affCartanMat} colours={vertexColours}/></td>
            </tr>
            <tr>
                <td><label for="inputType">Type:</label></td>
                <td>
                    <select id="inputType" bind:value={inputType}>
                        <option value="A">Affine A2</option>
                        <option value="B">Affine B2</option>
                        <option value="C">Affine C2</option>
                        <option value="G">Affine G2</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="labelConfig">Labels:</label></td>
                <td>
                    <select id="labelConfig" bind:value={labelConfig}>
                        <option value="none">None</option>
                        <option value="rex">Rex</option>
                        <option value="length">Length</option>
                        <option value="numrex"># Reduced expressions</option>
                        <option value="klpoly">KL polynomials</option>
                        <option value="mucoeff">μ-coefficients</option>
                        <option value="klpoly1">KL polynomials (v = 1)</option>
                        <option value="asklpoly">AS KL polynomials</option>
                        <option value="asklpoly1">AS KL polynomials (v = 1)</option>
                        <option value="pmixedbasis" disabled={!pDialationEnabled}>p-mixed basis</option>
                        <option value="aspmixedbasis" disabled={!pDialationEnabled}>AS p-mixed basis</option>
                        <option value="pcanincan" disabled={magmaJson == null}>p-can in can</option>
                        <option value="pcanincan1" disabled={magmaJson == null}>p-can in can (v = 1)</option>
                        <option value="pcanmag" disabled={magmaJson == null}>#p-can in can</option>
                        <option value="pcaninstd" disabled={magmaJson == null}>p-can in std</option>
                        <option value="pcaninstd1" disabled={magmaJson == null}>p-can in std (v = 1)</option>
                        <option value="pcaninmixed" disabled={magmaJson == null}>p-can in mixed</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="shadeLabels">Shade labels</label></td>
                <td><input type="checkbox" id="shadeLabels" bind:checked={shadeLabels}></td>
            </tr>
            <tr>
                <td><label for="shadeConfig">Shade:</label></td>
                <td>
                    <select id="shadeConfig" bind:value={shadeConfig}>
                        <option value="none">None</option>
                        <option value="bruhat">Bruhat</option>
                        <option value="rightweak">Right weak</option>
                        <option value="leftweak">Left weak</option>
                        <option value="conetype">Cone type</option>
                        <option value="dihedral">Dihedral elements</option>
                        <option value="doublecoset">Minimal double coset reps</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="shadeCoveringRel">Covering?</label></td>
                <td><input type="checkbox" disabled={shadeConfig == 'none'} bind:checked={shadeCoveringRel} /></td>
            </tr>
            <tr>
                <td><label for="cellConfig">Show cells:</label></td>
                <td>
                    <select id="cellConfig" bind:value={cellConfig}>
                        <option value="none">Cells...</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="twosided">Two-sided</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="treeKind">NF Tree:</label></td>
                <td>
                    <select id="treeKind" bind:value={treeConfig}>
                        <option value="none">NF Tree...</option>
                        <option value="shortlex">ShortLex</option>
                        <option value="invshortlex">InvShortLex</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="pDialationEnabled">Enable <Latex markup={`W_p`} />?</label></td>
                <td><input id="pDialationEnabled" type="checkbox" bind:checked={pDialationEnabled}></td>
            </tr>
            <tr>
                <td><span style="width: 2.5em">p = {pDialation}</span></td>
                <td><input type="range" min="2" max="13" bind:value={pDialation} on:input={function(e) {setPDialation(+this.value, magmaJson)}} disabled={magmaJson !== null}></td>
            </tr>
            <tr>
                <td><label for="pcan">p-can</label></td>
                <td>
                    <select id="pcan" bind:value={pcanIndex}>
                        <option value="none">p-canonical...</option>
                        {#each pcanConfigs as conf, i}
                            <option value={i}>{conf.niceName}</option>
                        {/each}
                    </select>
                </td>
            </tr>
            <tr>
                <td><label for="simpLabel">Simples</label></td>
                <td>
                    <select id="simpLabel" bind:value={simpLabelConfig}>
                        <option value="zero">012</option>
                        <option value="one">123</option>
                        <option value="stu">stu</option>
                    </select>
                </td>
            </tr>
        </table>

        <div class="row">
            {#if selCoxElt !== null}
                Left/Right descents:
                {`{`}{rtDat.cox.leftDescentSet(selCoxElt).map(simpLabelFn[simpLabelConfig])}{`}`}
                /
                {`{`}{rtDat.cox.rightDescentSet(selCoxElt).map(simpLabelFn[simpLabelConfig])}{`}`}
            {/if}
        </div>
        <div class="row">
            {#if selCoxElt !== null}
                ShortLex Rex: {shorten(rtDat.cox.shortLex(selCoxElt).map(simpLabelFn[simpLabelConfig]).join(''), 20)}
            {/if}
        </div>

        {#if magmaJson !== null}
            Showing {pcanBasis.size()} {magmaJson.char}-canonical basis elements
        {/if}

        {#if cellConfig != 'none'}
        <div class="row"><strong>Cell poset:</strong></div>
        <div class="row">
            <svg width="{cellLayout.width + 20}" height="{cellLayout.height + 20}">
                <g transform="translate(10, 10)">
                {#each cellSccs.G.edges() as edge}
                    <line
                        x1={cellLayout.nodeX(edge.src)}
                        y1={cellLayout.nodeY(edge.src)}
                        x2={cellLayout.nodeX(edge.dst)}
                        y2={cellLayout.nodeY(edge.dst)}
                        stroke="black"
                        stroke-width="1"
                        />
                {/each}
                {#each cellSccs.G.nodes() as node}
                    <circle
                        cx={cellLayout.nodeX(node)}
                        cy={cellLayout.nodeY(node)}
                        r="5"
                        fill="{randomColour(node.index, false)}"
                        />
                    {#if cellSccs.scc[selCoxElt] == node.index}
                        <circle
                            cx={cellLayout.nodeX(node)}
                            cy={cellLayout.nodeY(node)}
                            r="8"
                            fill="none"
                            stroke="black"
                            stroke-width="1"
                            />
                    {/if}
                {/each}
                </g>
            </svg>
        </div>
        {/if}
    </div>
</InteractiveMap>
