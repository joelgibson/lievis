import {Vec, Mat, vec, vecmut, mat} from './linear'
import {char} from './char'
import {maps} from './maps'

/** Functions for working with root data and characters of split reductive groups.
 *
 * This was my first foray into this kind of stuff, I would do things differently now.
 * For example I would use knowledge of the classification of root systems to decompose
 * things and so on. The approach used here is very much one that could verify theorems
 * from arbitrary data, wheras what I would use now is the theorems (decomposition into
 * root systems and so on) to inform the data structures involved.
 *
 * This code lives on to drive the simple characters visualisation.
*/
export namespace reduc {
    /** A root datum is the data of
     * 1. Two free abelian groups of finite rank in a perfect pairing. Here we will
     *    assume that we have identified each of them with ℤʳ, for some r >= 0, such
     *    that the perfect pairing is given by the dot product of vectors.
     * 2. Finite subsets R and R' of each of the groups, the roots and coroots, together
     *    with a bijection between them. Here our roots will be lists of vectors, and the
     *    bijection between them will be implicitly given by their order in the list.
     * Such that:
     * a. The pairing〈α, α'〉= 2 for each pair of root/coroot α, α', and
     * b. Each system is fixed under the automorphisms
     *    sα(λ) = λ -〈λ, α'〉α  and  sα'(μ) = μ -〈α, μ〉α'
     */
    export interface RootDatum {
        readonly rank: number
        readonly roots: Vec[]
        readonly coroots: Vec[]
    }

    /** (Φ, α, λ) ↦ sα(λ). Perform the reflection in the root indexed by i. */
    export function reflect(datum: RootDatum, i: number, weight: Vec): Vec {
        return vec.sub(weight, vec.scale(datum.roots[i], vec.dot(weight, datum.coroots[i])))
    }

    /** (Φ, α, k, λ) ↦ sαk(λ).
     * Perform the simple reflection in the root indexed by i, over the hyperplane defined by
     * the equation 〈α^_i, λ〉= k. */
    export function reflectAff(datum: BasedRootDatum, i: number, k: number, weight: Vec): Vec {
        return vec.sub(weight, vec.scale(datum.roots[i], vec.dot(weight, datum.coroots[i]) - k))
    }

    /** (Φ, α', μ) ↦ sα'(μ). Perform the reflection in the coroot indexed by i.  */
    export function coreflect(datum: RootDatum, i: number, coweight: Vec): Vec {
        return vec.sub(coweight, vec.scale(datum.coroots[i], vec.dot(datum.roots[i], coweight)))
    }

    /** A based root datum is determined by a choice of simple roots. We store some other information
     * which will be helpful, such as the positive roots, the value of ρ, the Cartan matrix, ...
     */
    export interface BasedRootDatum extends RootDatum {
        readonly ssrank: number
        readonly simpleIdxs: number[]
        readonly simples: Vec[]
        readonly cosimples: Vec[]
        readonly cartan: Mat
        readonly coxeter: Mat
        readonly positives: Vec[]
        readonly copositives: Vec[]

        /** In contrast with the rest of the data here, rho may not be integral. However, 2 rho
         * is integral.
        */
        readonly rho: Vec
        readonly corho: Vec
        readonly rho2: Vec

        /** Is the group simply-connected? */
        readonly simplyConn: boolean

        /** The group algebra of the character lattice. */
        readonly charAlg: char.CharAlg
    }

    /** Given the indices of a choice of simple roots, base the root datum. */
    export function baseBySimples(datum: RootDatum, simpleIdxs: number[]): BasedRootDatum {
        const ssrank = simpleIdxs.length
        const simples = simpleIdxs.map(i => datum.roots[i])
        const cosimples = simpleIdxs.map(i => datum.coroots[i])
        const cartan = mat.fromEntries(ssrank, ssrank, (i, j) => vec.dot(simples[j], cosimples[i]))
        const coxeter = mat.fromEntries(ssrank, ssrank, (i, j) => {
            const a = cartan.get(i, j) * cartan.get(j, i)
            return (i == j) ? 1 : [2, 3, 4, 6][a]
        })
        const simplesAsCols = mat.fromColumns(simples)
        const rootsInSimpleRootBasis = datum.roots.map(root => mat.solveLinear(simplesAsCols, root).map(x => Math.round(x) | 0))

        const positives = datum.roots.filter((root, i) => rootsInSimpleRootBasis[i].every(x => x >= 0))
        const rho2 = positives.reduce(vec.add, vec.zero(datum.rank))
        const rho = vec.scale(rho2, 1/2)

        const cosimplesAsCols = mat.fromColumns(cosimples)
        const copositives = datum.coroots.filter(root => mat.solveLinear(cosimplesAsCols, root).every(x => x >= 0))
        const corho = vec.scale(copositives.reduce((a, b) => vec.add(a, b), vec.zero(datum.rank)), 1/2)

        const simplyConn = vec.equal(
            (<number[]>[]).concat(...cosimples).sort((a, b) => b - a),
            vec.fromEntries(datum.rank * ssrank, i => (i < ssrank) ? 1 : 0))

        return {
            rank: datum.rank,
            roots: datum.roots,
            coroots: datum.coroots,
            ssrank,
            simpleIdxs,
            simples,
            cosimples,
            cartan,
            coxeter,
            positives,
            copositives,
            rho,
            rho2,
            corho,
            simplyConn,
            charAlg: new char.CharAlg(datum.rank)
        }
    }

    /** A based root datum is semisimple if its rank is the same as its semisimple rank. */
    export function isSemisimple(datum: BasedRootDatum): boolean {
        return datum.rank == datum.ssrank
    }

    /** (Φ, λ) ↦ dim Δ(λ), the Weyl dimension formula. */
    export function weylDimension(datum: BasedRootDatum, lambda: Vec): number {
        // The product of 〈α^, λ + ρ〉/ 〈α^, ρ〉where α^ ranges over all positive coroots.
        const lambdaRho = vec.add(lambda, datum.rho)
        let product = 1
        for (let i = 0; i < datum.copositives.length; i++) {
            let coroot = datum.copositives[i]
            product *= vec.dot(coroot, lambdaRho) / vec.dot(coroot, datum.rho)
        }
        return Math.round(product) | 0
    }

    /** (Φ, λ) ↦ true if λ is a dominant weight, otherwise false. */
    export function isDominant(datum: BasedRootDatum, weight: Vec): boolean {
        for (let i = 0; i < datum.cosimples.length; i++)
            if (vec.dot(weight, datum.cosimples[i]) < 0)
                return false

        return true
    }

    /** (Φ, λ) ↦ (w•λ, det w) where w is shortest such that w•λ is dominant. In the case that
     * there is no dominant weight in the •-orbit of λ, then (det w) will return as zero. */
    export function makeDominantDot(datum: BasedRootDatum, weight: Vec): [Vec, number] {
        let copy = weight.slice()
        let sign = makeDominantDotMut(datum, copy)
        return [copy, sign]
    }

    /** (Φ, λ) ↦ det w where w is shortest such that w•λ is dominant, and sets λ to w•λ.
     * Mutating version of the function makeDominantDot. */
    export function makeDominantDotMut(datum: BasedRootDatum, weight: Vec): number {
        let sign = 1

        for (;;) {
            let seenNegative = false
            for (let i = 0; i < datum.cosimples.length; i++) {
                // Pairing is the value of〈ρ + λ, α'〉for the simple root α'.
                let pairing = vec.dot(weight, datum.cosimples[i]) + 1

                if (pairing == 0)
                    return 0

                if (pairing <= 0) {
                    seenNegative = true
                    vecmut.addScaled(weight, weight, datum.simples[i], 0-pairing)
                    sign = 0 - sign
                }
            }
            if (!seenNegative)
                return sign
        }
    }

    /** (Φ, λ) ↦ det w where w is shortest such that wλ is dominant, and sets λ to wλ. */
    export function makeDominantMut(datum: BasedRootDatum, weight: Vec): number {
        let sign = 1

        for (;;) {
            let seenNegative = false
            for (let i = 0; i < datum.cosimples.length; i++) {
                // Pairing is the value of〈λ, α'〉for the simple root α'.
                let pairing = vec.dot(weight, datum.cosimples[i])

                if (pairing < 0) {
                    seenNegative = true
                    vecmut.addScaled(weight, weight, datum.simples[i], 0-pairing)
                    sign = 0 - sign
                }
            }
            if (!seenNegative)
                return sign
        }
    }

    /** Return a representative for the long word of the Weyl group, as indices of simple roots. */
    export function longWord(datum: BasedRootDatum): number[] {
        let word: number[] = []
        let testWt: number[] = []
        for (let i = 0; i < datum.rho2.length; i++)
            testWt[i] = 0 - datum.rho2[i]

        for (;;) {
            let seenNegative = false
            for (let i = 0; i < datum.cosimples.length; i++) {
                // Pairing is the value of〈λ, α'〉for the simple root α'.
                let pairing = vec.dot(testWt, datum.cosimples[i])

                if (pairing < 0) {
                    seenNegative = true
                    vecmut.addScaled(testWt, testWt, datum.simples[i], 0-pairing)
                    word.push(i)
                }
            }
            if (!seenNegative)
                break
        }

        return word
    }

    /** Iterate over the Weyl group orbits of an element. */
    export function weylOrbitIterate(datum: BasedRootDatum, weight: Vec, f: (weight: Vec) => void): void {
        let domWt: Vec = []
        vecmut.copy(domWt, weight)
        makeDominantMut(datum, domWt)

        let last = new char.CharElt()
        last.set(domWt, 1)
        f(domWt)

        let tmp: Vec = []

        while (last.size() != 0) {
            let next = new char.CharElt()
            for (let i = 0; i < last.entries.length; i++) {
                let entry = last.entries[i]
                for (let i = 0; i < datum.cosimples.length; i++) {
                    let evaluation = vec.dot(entry.key, datum.cosimples[i])
                    if (evaluation > 0) {
                        vecmut.addScaled(tmp, entry.key, datum.simples[i], 0-evaluation)
                        if (!next.contains(tmp)) {
                            next.set(tmp, 1)
                            f(tmp)
                        }
                    }
                }
            }
            last = next
        }
    }

    /** Return the orbit of a weight under the Weyl group action.  */
    export function weylOrbit(datum: BasedRootDatum, weight: Vec): Vec[] {
        let orbit: Vec[] = []
        weylOrbitIterate(datum, weight, (wt) => orbit.push(wt.slice()))
        return orbit
    }

    /** (Φ, α, λ) ↦ sα(λ). Perform the simple reflection in the simple root indexed by i. */
    export function simpReflect(datum: BasedRootDatum, i: number, weight: Vec): Vec {
        return vec.sub(weight, vec.scale(datum.simples[i], vec.dot(weight, datum.cosimples[i])))
    }

    /** (Φ, α', μ) ↦ sα'(μ). Perform the reflection in the coroot indexed by i.  */
    export function cosimpReflect(datum: BasedRootDatum, i: number, coweight: Vec): Vec {
        return vec.sub(coweight, vec.scale(datum.cosimples[i], vec.dot(datum.simples[i], coweight)))
    }

    /** A Demazure operator πᵢ */
    export function demazure(datum: BasedRootDatum, i: number, elt: char.CharElt): char.CharElt {
        // The simple root αi and coroot αi'
        let root = datum.simples[i]
        let coroot = datum.cosimples[i]
        let reflection: number[] = []

        let transient = new char.CharElt()
        let tmp: number[] = []

        for (let i = 0; i < elt.entries.length; i++) {
            let entry = elt.entries[i]

            vecmut.copy(tmp, entry.key)

            // The inner product〈λ, α'〉
            const pairing = vec.dot(tmp, coroot)

            // If 〈α^_i, λ〉>= 0, we add all the weights λ, λ - α, ..., s_i λ = λ - 〈α^_i, λ〉α.
            if (pairing >= 0) {
                for (let k = 0; k <= pairing; k++) {
                    transient.askEntry(tmp).value += entry.value
                    vecmut.sub(tmp, tmp, root)
                }
                continue
            }

            // If 〈α^_i, λ〉= -1, this term gets killed.
            if (pairing == -1)
                continue

            // If 〈α^_i, λ〉<= -2, we subtract all the weights
            // λ + α, ..., s_i λ - α = λ -〈α^_i, λ〉α - α
            for (let k = 1; k <= Math.abs(pairing + 1); k++) {
                vecmut.add(tmp, tmp, root)
                transient.askEntry(tmp).value -= entry.value
            }
        }

        return transient
    }

    /** The Demazure operator for the given pattern from the given weight. */
    export function demazureCharacter(datum: BasedRootDatum, pattern: number[], weight: Vec): char.CharElt {
        let char = datum.charAlg.basis(weight)

        // We need to apply the pattern in reverse order, since the rightmost element is applied first.
        for (let i = pattern.length - 1; i >= 0; i--)
            char = demazure(datum, pattern[i], char)

        return char.zerosRemoved()
    }

    /** The Weyl character for the given weight, in the standard basis. */
    export function weylCharacter(datum: BasedRootDatum, weight: Vec): char.CharElt {
        return demazureCharacter(datum, longWord(datum), weight)
    }

    /** Normalise a character in the Weyl basis so that every term lies in the dominant chamber. */
    export function weylCharacterNormalise(datum: BasedRootDatum, char: char.CharElt): char.CharElt {
        // For each term χ(λ) in the character, if w•λ is dominant for some element w of the Weyl group,
        // then replace χ(λ) by (det w) χ(w•λ). Otherwise, it must be the case that λ is on one of the
        // walls〈λ + ρ, α〉= 0 for some simple root α, and hence χ(λ) = 0.
        let result = datum.charAlg.zero()
        let tmp: number[] = []

        // TODO: Replace this with just a linear map, taking a weight w to (det w) w, or zero.
        char.forEach((weight, coeff) => {
            vecmut.copy(tmp, weight)
            let sign = makeDominantDotMut(datum, tmp)
            if (sign != 0)
                result.askEntry(tmp).value += sign * coeff
        })
        return result.zerosRemoved()
    }

    /** Multiply a character in the standard basis with a character in the Weyl basis, returning
     * the result in the Weyl basis.
     */
    export function standardMultWeyl(datum: BasedRootDatum, stdChar: char.CharElt, weylChar: char.CharElt): char.CharElt {
        return weylCharacterNormalise(datum, datum.charAlg.mul(stdChar, weylChar))
    }

    /** Tensor product multiplicities of Weyl modules. */
    export function tensorWeyls(datum: BasedRootDatum, weight1: Vec, weight2: Vec): char.CharElt {
        return standardMultWeyl(datum, weylCharacter(datum, weight1), datum.charAlg.basis(weight2))
    }

    /** ν_p(a) for a prime p and positive integer a is the exponent of the largest power
     *  of p dividing a. (The p-adic valuation of a). */
    export function nu(p: number, a: number): number {
        if (p < 2)
            throw new Error("p must be at least 2 for the p-adic valuation.")
        if (a == 0)
            throw new Error("a = 0 gives a valuation of infinity.")

        let count = 0
        while (a % p == 0) {
            a = a / p
            count += 1
        }
        return count
    }

    /** The chis appearing on the right side of the Jantzen filtration character sum.
     *  There will be non-dominant chis, to normalise these call makeChiDominant() on the
     *  resulting character.
     */
    export function computeJantzenMults(datum: BasedRootDatum, p: number, weight: Vec): char.CharElt {
        // This is a double sum of weighted Weyl characters. The first summation is over all positive
        // roots α (not just over simple roots), and the inner summation is over all positive integers
        // m satisfying 0 < mp <〈λ + ρ, α^〉. For each pair (α, m) in the sum, we get a factor of
        // ν(p, mp) χ(s(α, mp)•λ) where ν(p, -) is the p-adic valuation, and s(α, mp) is the affine
        // reflection fixing the hyperplane〈-, α^〉= mp. Writing out the formula in the dot action, we
        // get that χ(s(α, mp)•λ) = λ - (〈λ + ρ, α^〉- mp)α

        // The non-weight λ + ρ
        let lamrho: Vec = []
        vecmut.add(lamrho, weight, datum.rho)

        // We will accumulate all of the terms in the Weyl basis.
        let terms = datum.charAlg.zero()
        let tmp: Vec = []

        // Loop over the positive roots.
        for (let i = 0; i < datum.positives.length; i++) {
            // We have some positive root αi. Compute the evaluation 〈λ + ρ, αi^〉, which will be integral.
            let evaluation = Math.round(vec.dot(lamrho, datum.copositives[i])) | 0

            // Loop over all of the m satisfying the inequality.
            for (let m = 1; m * p < evaluation; m++) {
                // Compute χ(s(α, mp)•λ) = λ - (〈λ + ρ, α^〉- mp)α
                vecmut.addScaled(tmp, weight, datum.positives[i], 0 - (evaluation - m*p))

                // Compute the coefficient ν(p, mp) and save the term.
                terms.askEntry(tmp).value += nu(p, m*p)
            }
        }

        return terms
    }

    /** Decompose a weight λ into λ0 + p λ1 + p^2 λ2 + ..., where each λi is in X_1(T).
     *  This function only works in the basis of fundamental weights, so it is really rewriting
     *  a positive integer vector λ into λ0, λ1, ... such that each entry of λi lies in the interval
     *  [0, p). The return value is the nonempty list [λ0, λ1, ...]
     *
     * WARNING: This function is only valid for the weight lattice of fundamental weights.
    */
    export function steinbergDecomposeFundwt(p: number, wt: Vec): Vec[] {
        if (wt.some(x => x < 0))
            throw new Error("weight must be dominant")

        if (p < 2)
            throw new Error("p must be at least 2.")

        let lambdas: Vec[] = []
        while (wt.some(x => x != 0)) {
            let wtDigit = wt.map(x => x % p)
            let wtRest  = wt.map(x => (x / p) | 0)

            lambdas.push(wtDigit)
            wt = wtRest
        }

        // We don't want to return an empty list, which would happen for the zero weight here.
        if (lambdas.length == 0)
            return [wt]

        return lambdas
    }

    type BasisChange = maps.IMap<Vec, char.CharElt>
    export interface Tracker {
        depthLimit: number
        simpsInWeyls: BasisChange
        weylsInSimps: BasisChange
        jantzMults: BasisChange
    }

    export function createTracker(datum: BasedRootDatum, depthLimit: number): Tracker {
        return {
            depthLimit,
            simpsInWeyls: new maps.EntryVecMap(),
            weylsInSimps: new maps.EntryVecMap(),
            jantzMults: new maps.EntryVecMap(),
        }
    }

    export function tryWeylInSimplesInversion(datum: BasedRootDatum, p: number, lambda: Vec, t: Tracker): char.CharElt | null {
        // Invariant: chis + simps = χ(λ).
        let chis = datum.charAlg.basis(lambda)
        let simps = datum.charAlg.zero()

        const MAX_SAFE_INTEGER = 0x7fffffff

        while (chis.size() != 0) {
            // For each χ(μ) in chis, find L(μ) = χ(μ) + χ(...). This tells us that we can add L(μ) to our simples,
            // as long as we subtract χ(...) from our chis.
            let simpContrib = chis
            let chiContrib = datum.charAlg.tryApplyLinear(chis, wt => trySimpleInWeyls(datum, p, wt, t, 0))
            if (chiContrib == null)
                return null

            simps = datum.charAlg.add(simpContrib, simps)
            chis = datum.charAlg.sub(chis, chiContrib).zerosRemoved()
            let maxCoeff = maps.reduce(chis, (acc, key, val) => Math.max(acc, Math.abs(val)), 0)
            if (maxCoeff >= MAX_SAFE_INTEGER) {
                console.log("Bailing out because we saw a coefficient with magnitude", maxCoeff)
                return null
            }
        }

        return simps
    }

    /** Turn a weight in the Weyl basis into the simple basis. */
    export function tryWeylToSimple(datum: BasedRootDatum, p: number, lambda: Vec, t: Tracker, d: number): char.CharElt | null {
        // If λ is not dominant, an error has occurred.
        if (!isDominant(datum, lambda))
            throw new Error("Should normalise λ to being dominant first.")

        if (t.weylsInSimps.contains(lambda))
            return t.weylsInSimps.get(lambda)

        if (d > t.depthLimit) {
            console.log('Hit recursion depth of ', d)
            return null
        }

        // The fundamental alcove for the affine • action is C = {λ | 0 <〈λ + ρ, α^〉< p for all positive roots α}.
        // If λ lies in the closure of C, then L(λ) coincides with the Weyl module V(λ).
        let lamrho = vec.add(lambda, datum.rho)
        if (datum.copositives.every(coroot => vec.dot(lamrho, coroot) <= p)) {
            let result = datum.charAlg.basis(lambda)
            t.weylsInSimps.set(lambda, result)
            t.simpsInWeyls.set(lambda, result)
            return result
        }

        // Try to use the Jantzen filtration.
        if (!t.jantzMults.contains(lambda))
            t.jantzMults.set(lambda, weylCharacterNormalise(datum, computeJantzenMults(datum, p, lambda)))

        let jantzenMults = t.jantzMults.get(lambda)

        // If it happened to magically be zero, we know that the Weyl and the simple coincide here.
        if (jantzenMults.size() == 0) {
            let result = datum.charAlg.basis(lambda)
            t.weylsInSimps.set(lambda, result)
            t.simpsInWeyls.set(lambda, result)
            return result
        }

        // Now, let's try to break it down into a sum of simples, if we can.
        let jantzenInSimples = datum.charAlg.tryApplyLinear(jantzenMults, wt => tryWeylToSimple(datum, p, wt, t, d+1))?.zerosRemoved()

        // If we didn't know how to do that, give up.
        if (jantzenInSimples == null)
            return null

        // Make sure everything makes sense
        if (maps.some(jantzenInSimples, (wt, coeff) => coeff < 0))
            throw new Error("Got a character with a negative simple term.")

        // Tactic 1: if the summation in the Jantzen filtration is multiplicity-free when expanded into
        // simple characters, then we must have V^2 = 0 and hence ch V(λ) = ch L(λ) + ch V(λ, 1), where
        // ch V(λ, 1) is given by the Jantzen summation.
        if (maps.every(jantzenInSimples, (wt, mult) => mult == 1)) {
            // Since we have a multiplicity-free decomposition, we have the equation
            // ch V(λ) = ch L(λ) + (jantzen sum).
            let result = datum.charAlg.add(datum.charAlg.basis(lambda), jantzenInSimples).zerosRemoved()
            t.weylsInSimps.set(lambda, result)
            t.simpsInWeyls.set(lambda, datum.charAlg.sub(datum.charAlg.basis(lambda), jantzenMults).zerosRemoved())
            return result
        }

        // Tactic 2: if there is a single term with multiplicity 2 or 3, then we don't know whether it should
        // be assigned to the quotient ch V1/V2 or to the quotient-with-multiplicity 2 ch V2/V3 or 3 ch V3/V4.
        // However, we can suppose for a moment that it is that multiplicity and check that the resulting character
        // still makes sense (has no negative terms).

        // "Transpose" the jantzenInSimples expansion so it is in the form
        //    multiplicity => [list of weights occuring with that multiplicity]
        const maxMult = maps.reduce(jantzenInSimples, (acc, wt, mult) => Math.max(acc, mult), 0)
        const coeffMults: Vec[][] = []
        for (let i = 0; i <= maxMult; i++)
            coeffMults[i] = []

        // TODO: Fix annoying bugs like this where I forget to slice! We should probably introduce
        // a different interface where forPairs() does not need slicing, but forPairsMut() does or something.
        jantzenInSimples.forEach((wt, mult) => coeffMults[mult].push(wt.slice()))

        if (maxMult == 2 && coeffMults[2].length == 1) {
            // If the multiplicity-2 weight is in (ch V1/V2), it is counted correctly by the Jantzen sum.
            // If the multiplicity-2 weight is in (ch V2/V3), it is overcounted once by the Jantzen sum.

            // If the first case is true, then ch L(λ) = χ(λ) - JantzenSum(λ)
            let suspectedCharacterInChis = datum.charAlg.sub(datum.charAlg.basis(lambda), jantzenMults).zerosRemoved()
            let suspectedCharacterInEs = datum.charAlg.applyLinear(suspectedCharacterInChis, wt => weylCharacter(datum, wt)).zerosRemoved()
            let hasNegativeTerm = maps.reduce(suspectedCharacterInEs, (acc, wt, mult) => acc || (mult < 0), false)
            if (hasNegativeTerm) {
                // This cannot be a character! Therefore, the other possibility is true and the weight that has
                // multiplicity is overcounted by the Jantzen sum.
                let overcountedWeight = coeffMults[2][0]
                let result = datum.charAlg.add(datum.charAlg.basis(lambda), datum.charAlg.sub(jantzenInSimples, datum.charAlg.basis(overcountedWeight))).zerosRemoved()
                // TODO: Memoise
                return result
            }
        }

        // If we were not so lazy, we could extend the above strategy very easy to this case:
        if (maxMult == 3 && coeffMults[2].length == 0 && coeffMults[3].length == 1) {
            console.log(lambda, coeffMults)
        }

        // In fact, we could extend it to the general case by making a list of all possibilities for all multiplicities
        // >= 1 and taking their product. For each hypothetical in the product, try to rule it out somehow. If at the end
        // the list of hypotheticals has been struck down to a single item, we are in business.

        // In general, we are are looking for the number of ways that we can write n = 1a_1 + 2a_2 + 3a_3 + ..., and taking
        // the product of those possibilities for each weight.

        // Run out of ideas.
        return null
    }

    // The fundamental alcove for the affine • action is C = {λ | 0 <〈λ + ρ, α^〉< p for all positive roots α}.
    // This function returns whether λ lies in the closure of C. If p = 0, then the fundamental alcove is considered
    // to be C = {λ | 0 <〈λ + ρ, α^〉for all positive roots α}.
    export function inFundamentalShiftedAlcoveClosure(datum: BasedRootDatum, p: number, lambda: Vec): boolean {
        const lambdaRho = vec.add(lambda, datum.rho)
        return datum.copositives.every(coroot => {
            const evaluation = vec.dot(lambdaRho, coroot)
            return (p == 0) ? 0 <= evaluation : 0 <= evaluation && evaluation <= p
        })
    }

    /** Compute the character of a simple module for a simply-connected algebraic group, in the Weyl basis. */
    export function trySimpleInWeyls(datum: BasedRootDatum, p: number, lambda: Vec, t: Tracker, d: number): char.CharElt | null {
        // If λ is not dominant, an error has occurred.
        if (!isDominant(datum, lambda))
            throw new Error("Cannot compute ch L(λ) for non-dominant λ.")

        if (t.simpsInWeyls.contains(lambda))
            return t.simpsInWeyls.get(lambda)


        if (d > t.depthLimit) {
            console.log('Hit recursion depth of ', d)
            return null
        }

        // The fundamental alcove for the affine • action is C = {λ | 0 <〈λ + ρ, α^〉< p for all positive roots α}.
        // If λ lies in the closure of C, then L(λ) coincides with the Weyl module V(λ).
        if (inFundamentalShiftedAlcoveClosure(datum, p, lambda)) {
            let result = datum.charAlg.basis(lambda)
            t.simpsInWeyls.set(lambda, result)
            t.weylsInSimps.set(lambda, result)
            return result
        }

        // If the group is semisimple and simply-connected, we can attempt to decompose the weight via Steinberg.
        if (isSemisimple(datum) && datum.simplyConn && lambda.some(x => x >= p)) {
            let steinParts = steinbergDecomposeFundwt(p, lambda)
            let charParts = steinParts.map(wt => trySimpleInWeyls(datum, p, wt, t, d+1))
            if (charParts.every(x => x != null)) {
                // Result is a partial tensor product, expressed in the Weyl basis χ(-).
                let result = <char.CharElt>charParts[0]
                let power = p

                for (let i = 1; i < charParts.length; i++) {
                    let weylChar = <char.CharElt>charParts[i]
                    // weylChar is an expression of L(steinParts[i]) in terms of the Weyl basis χ(-). However,
                    // we need to dialate a Weyl character and re-express that in terms of Weyl characters. To
                    // do this, we expand the Weyl character in the standard basis, dialate it there, and then
                    // use the Weyl-standard multiplication formula.
                    let stdChar = <char.CharElt>datum.charAlg.tryApplyLinear(weylChar, wt => weylCharacter(datum, wt))
                    let dialatedStdChar = datum.charAlg.applyBasisMap(stdChar, v => vec.scale(v, power))
                    result = standardMultWeyl(datum, dialatedStdChar, result)
                    power *= p
                }
                result = result.zerosRemoved()
                t.simpsInWeyls.set(lambda, result)
                return result
            }
        }

        // Otherwise, let's see if we can express the Weyl module V(λ) in terms of simples.
        let weylInSimples = tryWeylToSimple(datum, p, lambda, t, d+1)
        if (weylInSimples != null) {
            // It worked! So we have V(λ) = Demazure(λ) = weylInSimples
            if (weylInSimples.get(lambda) != 1)
                throw new Error("Something went wrong, the simple should have multiplicity 1 here.")
            let remainder = datum.charAlg.sub(weylInSimples, datum.charAlg.basis(lambda))
            let remainderWeyl = datum.charAlg.tryApplyLinear(remainder, wt => trySimpleInWeyls(datum, p, wt, t, d+1))
            if (remainderWeyl != null) {
                let result = datum.charAlg.sub(datum.charAlg.basis(lambda), remainderWeyl).zerosRemoved()
                t.simpsInWeyls.set(lambda, result)
                return result
            }
        }

        // Ran out of ideas
        return null
    }

    /** Attempt to compute the dimension of a simple module. */
    export function trySimpleDimension(datum: BasedRootDatum, p: number, lambda: Vec, t?: Tracker): number | null {
        let tracker = t || createTracker(datum, 5)
        let simpleInWeyl = trySimpleInWeyls(datum, p, lambda, tracker, 0)
        return (simpleInWeyl != null)
            ? datum.charAlg.applyFunctional(simpleInWeyl, wt => weylDimension(datum, wt))
            : null
    }
}

/** Based root data for various groups. */
export namespace groups {
    /** We may want to equip a root datum with an embedding into Euclidean space (so that we can)
     * look at it nicely), and also with a section to lift our interactions back to the system.
     */
    export interface EucEmbedding {
        /** The transition matrix from the character space to the Euclidean space, and a section.
         * For example, for the A2 root system, the character space would be two-dimensional with basis
         * the fundamental weights, while the Euclidaen space would be the plane x + y + z = 0 in R3 */
        charToEuc: Mat
        eucToChar: Mat
    }

    /** The lattice space of a reductive group should be labelled in a standard way. For example, for the
     * semisimple systems we create out of Euclidean root system, the lattice space is labelled by ϖ1, ϖ2, etc.
     * On the other hand, for GLn its better to label these by ε
    */
    export interface LatticeLabel {
        latticeLabel: string
    }

    /** To produce a root datum from a root system (for example, the simply-connected or adjoint data),
     * we need some roots in a Euclidean space, we need to know the semisimple rank, and we need a normal
     * to choose the simple roots.
     */
    export interface EucRootSystem {
        ssrank: number,
        eucRoots: Vec[],
        eucNormal: Vec
    }

    /** Construct the root datum of simply-connected type from a given Euclidean root system. The
     *  root system will be based using the chamber selected by the normal. The eucSpace matrix
     *  should have orthonormal rows which span the root space, and will be used for rendering the
     *  resulting root system.
     */
    export function simplyConn({ssrank, eucRoots, eucNormal}: EucRootSystem): reduc.BasedRootDatum & EucEmbedding & LatticeLabel {
        // Check our normal makes sense.
        if (eucRoots.some(root => vec.dot(root, eucNormal) == 0))
            throw new Error("The normal given does not lie in the interior of a facet.")

        // Helper to find indivisible roots (slow!)
        function isIndivisible(eucRoot: Vec): boolean {
            return !eucRoots.some(r => vec.equal(vec.scale(r, 2), eucRoot))
        }
        // Helper to find the perpendicular distance from the normal hyperplane to a root.
        function dist(eucRoot: Vec): number {
            return vec.dot(eucRoot, vec.scaleToNorm(eucNormal, 1))
        }

        let isReduced = eucRoots.every(isIndivisible)

        // Find the simple roots, which will be closest to the hyperplane defined by the normal?
        // (I think this is true, should probably check it at some point).
        let eucSimples =
            eucRoots
            .filter(isIndivisible)                      // Remove indivisible roots
            .filter(r => vec.dot(r, eucNormal) > 0)     // Keep only positive roots
            .sort((r, s) => dist(r) - dist(s))          // Order by distance from hyperplane
            .slice(0, ssrank)                           // Keep only the first ssrank many.

        // Determine the corresponding coroots.
        let eucCosimples = eucSimples.map(vec.check)

        // Indices of the simple roots (this is a little fragile, and requires that our computation
        // of eucSimples preserved the vectors completely, as equality of javascript objects).
        let simplesIdxs = eucSimples.map(root => eucRoots.indexOf(root))

        // Now, our chosen basis for the characters will be the basis of fundamental weights, while
        // for the cocharacters it will be the simple coroots. We need to express all of the roots
        // in the basis of fundamental weights, which we can do by taking the inner product with the
        // simple coroots.
        let eucRootsToFund = mat.fromRows(eucCosimples)
        let roots = eucRoots.map(r => mat.multVec(eucRootsToFund, r))
        if (roots.some(r => r.some(r => Math.abs(Math.round(r) - r) > 0.0001))) {
            throw new Error("Roots were not close to integral")
        }
        roots = roots.map(r => r.map(Math.round).map(x => x | 0))

        // Our chosen basis for the cocharacters will be the basis of simple coroots. If the original root
        // system is not reduced, the simple coroots are not a lattice basis, but 1/2 the simple coroots are.
        let eucCosimplesCols = mat.fromColumns(eucCosimples)
        let coroots = eucRoots.map(vec.check).map(co => mat.solveLinear(eucCosimplesCols, co))
        if (isReduced && coroots.some(r => r.some(r => Math.abs(Math.round(r) - r) > 0.0001))) {
            throw new Error("Coroots were not close to integral, but the system is reduced.")
        }
        coroots = coroots.map(r => r.map(Math.round).map(x => x | 0))

        let datum = reduc.baseBySimples({rank: ssrank, roots, coroots}, simplesIdxs)
        let eucEmbedding = {
            charToEuc: mat.multMat(mat.fromColumns(eucSimples), mat.inverse(datum.cartan)),
            eucToChar: mat.fromRows(eucCosimples)
        }
        return {...datum, ...eucEmbedding, latticeLabel: 'ϖ'}
    }

    /** For a rank 2 EucEmbedding group, return the proj and sect matrices. */
    export function rank2eucProjSect(datum: EucEmbedding): [Mat, Mat] {
        let orthog = vec.gramSchmidt(mat.toColumns(datum.charToEuc))
        let proj = mat.multMat(mat.fromRows(orthog), datum.charToEuc)
        let sect = mat.inverse(proj)
        return [proj, sect]
    }

    /** The root datum of a split torus of rank n. */
    export function T(n: number): reduc.BasedRootDatum & EucEmbedding & LatticeLabel {
        let datum = reduc.baseBySimples({rank: n, roots: [], coroots: []}, [])
        let eucEmbedding = {charToEuc: mat.id(n), eucToChar: mat.id(n)}
        return {...datum, ...eucEmbedding, latticeLabel: 'ε'}
    }

    /** The root datum of GLn, in its usual basis. */
    export function GL(n: number): reduc.BasedRootDatum & EucEmbedding & LatticeLabel {
        let positives: Vec[] = []
        for (let gap = 1; gap < n; gap++)
            for (let i = 0; i < n - gap; i++)
                positives.push(vec.sub(vec.e(n, i), vec.e(n, i + gap)))

        let negatives = positives.map(vec.neg)
        let roots = positives.concat(negatives)
        let simpleIdxs = vec.fromEntries(n - 1, i => i)

        let datum = reduc.baseBySimples({
            rank: n,
            roots: roots,
            coroots: roots
        }, simpleIdxs)
        let eucEmbedding = {charToEuc: mat.id(n), eucToChar: mat.id(n)}
        return {...datum, ...eucEmbedding, latticeLabel: 'ε'}
    }

    export function SL(n: number): reduc.BasedRootDatum & EucEmbedding & LatticeLabel {
        let GLn = GL(n)

        // For SLn, if we add up all the positive roots
        // [1, -1,  0,  0]
        // [1,  0, -1,  0]
        // [1,  0,  0, -1]
        // [0,  1, -1,  0]
        // [0,  1,  0, -1]
        // [0,  0,  1, -1]
        // ===============
        // [3,  1, -1, -3]

        let normal = vec.fromEntries(n, i => n - 2 * i)
        return simplyConn({
            ssrank: n - 1,
            eucRoots: GLn.roots,
            eucNormal: normal
        })
    }

    /** Some small root systems. These should be fed into simplyConn in order to produce based root data. */
    export const rootSystems: {[s: string]: EucRootSystem} = {
        'A1': {
            ssrank: 1,
            eucRoots: [[1], [-1]],
            eucNormal: [1]
        },
        'BC1': {
            ssrank: 1,
            eucRoots: [[1], [-1], [2], [-2]],
            eucNormal: [1]
        },
        'A1xA1': {
            ssrank: 2,
            eucRoots: [[1, 0], [0, 1], [-1, 0], [0, -1]],
            eucNormal: [1, 1]
        },
        'A1xBC1': {
            ssrank: 2,
            eucRoots: [[1, 0], [0, 1], [-1, 0], [0, -1],
                       [2, 0], [-2, 0]],
            eucNormal: [1, 1]
        },
        'BC1xBC1': {
            ssrank: 2,
            eucRoots: [[1, 0], [0, 1], [-1, 0], [0, -1],
                       [2, 0], [0, 2], [-2, 0], [0, -2]],
            eucNormal: [1, 1]
        },
        'A2': {
            ssrank: 2,
            eucRoots: [[1, -1, 0], [1, 0, -1], [0, 1, -1],
                       [-1, 1, 0], [-1, 0, 1], [0, -1, 1]],
            eucNormal: [1, 0, -1]
        },
        'B2': {
            ssrank: 2,
            eucRoots: [[1, 0], [0, 1], [-1, 0], [0, -1],    // A copy of A1A1
                       [1, 1], [1, -1], [-1, -1], [-1, 1]], // Another copy of A1A1
            eucNormal: [2, 1]
        },
        'G2': {
            ssrank: 2,
            eucRoots: [[1, -1, 0], [1, 0, -1], [0, 1, -1],    // A copy of A2
                       [-1, 1, 0], [-1, 0, 1], [0, -1, 1],
                       [2, -1, -1], [-1, 2, -1], [-1, -1, 2], // Another copy of A2
                       [-2, 1, 1], [1, -2, 1], [1, 1, -2]],
            eucNormal: [3, 1, -2]
        },
        'BC2': {
            ssrank: 2,
            eucRoots: [[1, 0], [0, 1], [-1, 0], [0, -1],   // A copy of B2
                       [1, 1], [1, -1], [-1, -1], [-1, 1],
                       [2, 0], [0, 2], [-2, 0], [0, -2]],  // Add in some indivisible roots
            eucNormal: [2, 1]
        },
    }

    export function basedRootSystemByName(name: string): reduc.BasedRootDatum & EucEmbedding & LatticeLabel {
        if (rootSystems.hasOwnProperty(name)) {
            return simplyConn(rootSystems[name])
        }

        let parts = name.match(/(\w+)([1-9][0-9]*)/)
        if (parts != null) {
            let rank = parseInt(parts[2], 10)
            if (parts[1] == 'GL')
                return GL(rank)
            if (parts[1] == 'T')
                return T(rank)
            if (parts[1] == 'SL')
                return SL(rank)
            if (parts[1] == 'A')
                return SL(rank + 1)
        }

        throw new Error("No group called " + name)
    }
}
