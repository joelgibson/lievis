import { mat, cartan, maps, hecke, lpoly } from 'lielib'

// An object mapping file names to promises, which will resolve to the json when requested.
const menu = import.meta.glob('./*.json')

// Describe the JSON schema coming from the Magma program.
export type MagmaJson = {
    /** Rows of the Cartan matrix, in Magma convention A[i, j] = <root i, coroot j> */
    cartan: number[][],

    /** Characteristic computed in. */
    char: number,

    /** Parabolic subset, with simple roots indexed from 1. */
    sphSubset: number[],

    /** Number of elements computed in the dataset. */
    count: number,

    /** p-canonical basis elements. */
    pcans: {[word: string]: {
        [word: string]: {
            val: number,
            coeffs: number[],
        }
    }}
}

export function readToHeckeAlg(alg: hecke.HeckeAlg, obj: MagmaJson): maps.IMap<number, hecke.HeckeElt> {
    // Ensure that the underlying Coxeter systems are compatible.
    let magmaCartan = mat.fromRows(obj.cartan)
    let magmaCoxeter = cartan.cartanMatToCoxeterMat(magmaCartan)
    if (!mat.equal(magmaCoxeter, alg.cox.coxeter))
        throw new Error("Incompatible Coxeter matrices")

    function wordToCox(word: string) {
        return alg.cox.growToWord(word.split('').map(x => +x - 1))
    }

    let basis = new maps.FlatIntMap<hecke.HeckeElt>()
    for (let topWord in obj.pcans) {
        let top = wordToCox(topWord)
        let c = new hecke.HeckeElt()
        for (let eltWord in obj.pcans[topWord]) {
            let elt = wordToCox(eltWord)
            let {val, coeffs} = obj.pcans[topWord][eltWord]
            c.terms.set(elt, lpoly.fromValCoeffs(val, coeffs))
        }
        basis.set(top, c)
    }

    return basis
}

export interface PcanConfig {
    promise: () => Promise<{default: MagmaJson}>

    niceName: string

    type: string
    rank: number
    aff: number
    parabolic: number[]
    char: number
}

function parseMenuItem(name: string, promise: () => Promise<{default: MagmaJson}>): PcanConfig {
    // We are parsing a string like ./out-type.A~2.I.12.char.3.json
    let [_, a, magmaType, b, magmaParabolic, c, magmaChar, d] = name.split(/\./g)
    let type = magmaType.match(/([A-Z])/)[1]
    let rank = +magmaType.match(/[0-9]+/)
    let aff = (magmaType.indexOf('~') >= 0) ? 1 : 0
    let parabolic = magmaParabolic.split('').map(c => +c - 1)
    let char = +magmaChar

    let niceName = `${(aff == 1) ? 'Affine ' : ''}${type}${rank} p=${char} ${(parabolic.length > 0) ? 'AS ' : ''} can basis`

    return {promise, niceName, type, rank, aff, parabolic, char}
}

function buildConfigs(): PcanConfig[] {
    const configs: PcanConfig[] = []
    for (let path in menu)
        configs.push(parseMenuItem(path, menu[path] as () => Promise<{default: MagmaJson}>))

    return configs
}

export const pcanConfigs: PcanConfig[] = buildConfigs()
