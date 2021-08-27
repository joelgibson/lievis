import {arr} from './arr'
import {bits} from './bits'
import {maps} from './maps'
import {digraph} from './digraph'

import type { Mat } from './linear'

// It would be better if we could make this an opaque type, but oh well.
export type CoxElt = number

/** Follow the algorithm outlined in "Computing Kazhdan-Lusztig Polynomials for Arbitrary Coxeter Groups"
 * by Fokko du Cloux.
 *
 * When the generating set is size |S| and N is the number of enumerated elements, I expect this to use
 * about 2N(|S| + 1) integers for the lengths, descents, rightgen, and leftgen tables, and a further
 * (approx, heuristic) 2N|S| integers to store the coatoms. This comes out to a total of
 * 4(|S| + 1)N integers.
 *
 * In B8 for example, enumerating the whole group should take 371M integers, or 1.5GB (if we assume that
 * each integer takes 4 bytes). E8 has about 70x more elements than B8, so is right out for total enumeration.
 */
export class EnumCox {
    /** The rank of the Coxeter group, i.e. the size of the Cartan matrix. */
    readonly rank: number

    /** Table mapping each element to its length. */
    private lengths: number[]

    /** Each descent set is packed into a number, with the right-most rank-many bits for right
     * multiplication, and the next rank-many bits for left multiplication. For this reason, we
     * limit the rank to 15.
     *
     * The question (xs < x)? can be answered with descents[x] & (1 << s) != 0.
     * The question (sx < x)? can be answered with descents[x] & (1 << (s + rank)) != 0.
     */
    private descents: number[]

    /** The coatoms of x are the y where y < x is a covering relation in the Bruhat order. */
    private coat: number[][]

    /** Action of the generators on the right. The result of xs is stored at rightgen[rank * x + s].
     * If the result of right multiplication is not yet enumerated, -1 is stored. */
    private rightgen: number[]
    private leftgen: number[]

    /** The identity element */
    readonly id: CoxElt = 0

    constructor(
        readonly coxeter: Mat
    ) {
        this.rank = coxeter.nrows
        if (this.rank > 15)
            throw new Error("Ranks larger than 15 are unsupported.")

        // Init tables for the identity element.
        this.lengths = [0]
        this.descents = [0]
        this.coat = [[]]

        this.rightgen = []
        this.leftgen = []
        for (let i = 0; i < this.rank; i++)
            this.rightgen.push(-1)
            this.leftgen.push(-1)
    }

    /** The number of currently enumerated elements. */
    size() {
        return this.lengths.length
    }

    /** The maximal currently enumerated element x, such that all the enumerated elements are
     * the interval [e, x]
     */
    maxEnumElt() {
        return this.lengths.length - 1
    }

    /** Return the element corresponding to the sth generator. */
    gen(s: number): CoxElt {
        this.growToLength(1)
        return this.multR(0, s)
    }

    isEnumerated(x: CoxElt): boolean {
        return 0 <= x && x < this.size()
    }
    length(x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return this.lengths[x]
    }
    _descendsR(x: CoxElt, s: number) { return (this.descents[x] & (1 << s)) != 0 }
    descendsR(x: CoxElt, s: number) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return this._descendsR(x, s)
    }
    _descendsL(s: number, x: CoxElt) { return (this.descents[x] & (1 << (s + this.rank))) != 0 }
    descendsL(s: number, x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return this._descendsL(s, x)
    }
    _multR(x: CoxElt, s: number) { return this.rightgen[this.rank * x + s] }
    multR(x: CoxElt, s: number) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        let result = this._multR(x, s)
        if (result == -1)
            throw new Error(`The product of ${x} with the generator ${s} is undefined so far.`)

        return result
    }
    isMultRDefined(x: CoxElt, s: number) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return this.rightgen[this.rank * x + s] >= 0
    }
    isMultLDefined(s: number, x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return this.leftgen[this.rank * x + s] >= 0
    }
    _multL(s: number, x: CoxElt) { return this.leftgen[this.rank * x + s] }
    multL(s: number, x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        let result = this._multL(s, x)
        if (result == -1)
            throw new Error(`The product of the generator ${s} with the element ${x} is undefined so far.`)

        return result
    }

    /** Return a token (bitmask) for a parabolic subgroup. */
    subgroupToken(gens: number[]): number {
        if (!gens.every(s => 0 <= s && s < this.rank))
            throw new Error(`Some generators in ${gens} out of bounds.`)

        return bits.toMask(gens)
    }

    /** Return true if the element is minimal in its right coset W_I x,
     * i.e. if every left multiplication by an element of I takes it up. */
    isRightMinimal(subGrpTok: number, x: CoxElt): boolean {
        if (!this.isEnumerated(x))
            throw new Error("Element not enumerated.")

        return (this.descents[x] & (subGrpTok << this.rank)) == 0
    }


    /** Returns a "token" representing a right quotient by the parabolic subgroup generated by gens. */
    rightQuotient(gens: number[]): number {
        if (!gens.every(s => 0 <= s && s < this.rank))
            throw new Error(`Some generators in ${gens} out of bounds.`)

        let bits = 0
        for (let s of gens)
            bits |= (1 << s)

        return bits << this.rank
    }

    isMinimal(token: number, x: CoxElt): boolean {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return (this.descents[x] & token) == 0
    }

    projectToMinimal(token: number, x: CoxElt): number {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        while ((this.descents[x] & token) != 0) {
            let s = 0
            for (;; s++) {
                if (((1 << s) & token) != 0 && (this.descents[x] & (1 << s)))
                    break
            }

            x = this.multR(x, s)
        }

        return x
    }

    /** Read a word to a Coxeter element, erroring if the resulting element is not enumerated. */
    readWord(word: number[]): CoxElt {
        for (let i = 0; i < word.length; i++)
            if (word[i] < 0 || word[i] >= this.rank)
                throw new Error(`Invalid generator ${word[i]} in readWord()`)

        let x = 0
        for (let i = 0; i < word.length; i++)
            x = this.multR(x, word[i])

        return x
    }

    /** Read a word to a Coxeter element, returning null if the resulting element is not enumerated. */
    readWordMaybe(word: number[]): CoxElt | null {
        for (let i = 0; i < word.length; i++)
            if (word[i] < 0 || word[i] >= this.rank)
                throw new Error(`Invalid generator ${word[i]} in readWord()`)

        let x = 0
        for (let i = 0; i < word.length; i++) {
            if (!this.isMultRDefined(x, word[i]))
                return null

            x = this.multR(x, word[i])
        }

        return x
    }

    /** Return the first s such that sx < x, or -1 for the identity. */
    firstDescentL(x: CoxElt) {
        for (let s = 0; s < this.rank; s++)
            if (this.descendsL(s, x))
                return s

        return -1
    }

    /** Return the left descent set as a list of generators. */
    leftDescentSet(x: CoxElt) { return bits.fromMask(this.descents[x] >>> this.rank) }
    rightDescentSet(x: CoxElt) { return bits.fromMask(this.descents[x] & ((1 << this.rank) - 1)) }
    lrBitset(x: CoxElt) { return this.descents[x] }

    /** Return the first s such that xs < x, or -1 for the identity. */
    firstDescentR(x: CoxElt) {
        for (let s = 0; s < this.rank; s++)
            if (this.descendsR(x, s))
                return s

        return -1
    }

    /** Return the coatoms of x: the y < x which are covering relations. */
    coatoms(x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        return this.coat[x]
    }

    /** TODO: Change this to a table-based one that fills as we grow. */
    inverse(x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        let y = 0
        while (x != 0) {
            let s = this.firstDescentL(x)
            if (!this.isMultRDefined(y, s))
                throw new Error(`The inverse element is not enumerated.`)

            y = this._multR(y, s)
            x = this._multL(s, x)
        }

        return y
    }

    /** Return the product of two elements, or null if we leave the enumerated set. */
    multMaybe(x: CoxElt, y: CoxElt): number | null {
        if (!this.isEnumerated(x) || !this.isEnumerated(y))
            return null

        while (x != 0) {
            let s = this.firstDescentR(x)
            if (!this.isMultLDefined(s, y))
                return null

            x = this._multR(x, s)
            y = this._multL(s, y)
        }

        return y
    }

    /** Return the ShortLex normal form of x. */
    shortLex(x: CoxElt) {
        let word: number[] = []
        let length = this.lengths[x]
        let i = 0
        while (x != 0) {
            let s = this.firstDescentL(x)
            word.push(s)
            x = this.multL(s, x)
            i += 1
            if (i > length)
                throw new Error(`Error while returning shortlex for ${x}`)
        }
        return word
    }

    /** Return the inverse short lex normal form of x. */
    invShortLex(x: CoxElt) {
        let word: number[] = []
        let length = this.lengths[x]
        let i = 0
        while (x != 0) {
            let s = this.firstDescentR(x)
            word.push(s)
            x = this.multR(x, s)
            i += 1
            if (i > length)
                throw new Error(`Error while returning invShortLex for ${x}`)
        }
        return word.reverse()
    }

    /** Return a vector of CoxElt => # reduced expressions for all elements in the enumeration. */
    countReducedExpressions(): number[] {
        let counts: number[] = [1]
        for (let x = 1; x < this.size(); x++) {
            counts[x] = 0
            for (let s = 0; s < this.rank; s++)
                if (this.descendsR(x, s))
                    counts[x] += counts[this.multR(x, s)]
        }
        return counts
    }

    /** Grow the enumerated part by right multiplication by s. */
    grow(s: number) {
        let size = this.lengths.length
        let added = 0

        for (let x = 0; x < size; x++) {
            // If right multiplication xs is already defined, ignore.
            if (this.rightgen[this.rank * x + s] >= 0)
                continue

            // Otherwise, xs is a new element we have not seen before. Assign it an index.
            const xs = size + added
            added += 1

            // We have its new length.
            this.lengths[xs] = 1 + this.lengths[x]

            // Currently we only know that xs has a right descent by s.
            this.descents[xs] = 1 << s

            // Fact: Coatoms(xs) = {zs | z in Coatoms(x) and zs > z} union {x}
            this.coat[xs] = []
            for (let i = 0; i < this.coat[x].length; i++) {
                let z = this.coat[x][i]
                if (!this._descendsR(z, s))
                    this.coat[xs].push(this._multR(z, s))
            }
            if (this.coat[xs].indexOf(x) < 0)
                this.coat[xs].push(x)

            // Make new space in the right and left multiplication tables.
            for (let i = 0; i < this.rank; i++) {
                this.rightgen[this.rank * xs + i] = -1
                this.leftgen[this.rank * xs + i] = -1
            }

            // x . s = xs (was previously undefined), and xs . s = x (new).
            this.rightgen[this.rank * x + s] = xs
            this.rightgen[this.rank * xs + s] = x

            // At this point we have yet to fill in the rest of the rightgen and leftgen tables,
            // as well as record the left and right descents of xs. We need to know how to find all
            // of the t such that xs . t < xs or t . xs < xs, as well as to know how to find the actual
            // elements xs . t or t . xs.
            //
            // First case: if l(xs) = 1, then xs = s.
            if (this.lengths[xs] == 1) {
                // Since xs = s, the only other generator that can take us down is left multiplication
                // by s.
                this.leftgen[this.rank * x + s] = xs
                this.leftgen[this.rank * xs + s] = x
                this.descents[xs] |= 1 << (s + this.rank)
                continue
            }



            // General case: l(xs) >= 2.
            // First fill in left multiplication by t.
            for (let t = 0; t < this.rank; t++) {
                // If t . xs < xs, then there is a single coatom z of xs such that t . z > z.
                // We will count the coatoms of xs satisfying this condition, and set z to the
                // last coatom in the list satisfying the condition.
                let count = 0
                let z = 0
                for (let i = 0; i < this.coat[xs].length; i++) {
                    if (!this._descendsL(t, this.coat[xs][i])) {
                        count += 1
                        z = this.coat[xs][i]
                    }
                }

                // If there were at least two, it must be the case that t . xs > xs, so we can ignore this.
                if (count >= 2)
                    continue

                if (count != 1)
                    throw new Error("Expected count = 1")

                // If [e, xs] is nondihedral, then we must have t . xs < xs. Hence t . xs = z.
                if (this.coat[xs].length != 2) {
                    this.leftgen[this.rank * z + t] = xs
                    this.leftgen[this.rank * xs + t] = z
                    this.descents[xs] |= 1 << (t + this.rank)
                } else {
                    // [e, xs] is dihedral, generated by (s, t). If we are at the top of the dihedral
                    // subgroup generated by s and t, then t . xs < xs. Otherwise, t . xs < xs if l(xs)
                    // is even.
                    // There is one hitch here: in our look we might have t = s. In which case we can
                    // find the actual other generator involved in the dihedral subgroup by looking for
                    // the unique element in the right descent set of x.
                    let gen = this.firstDescentR(x)
                    let mst = this.coxeter.get(s, gen)

                    // Cases where t . xs < xs:
                    const movesDown = (
                        // Case 1: We are at the top of the Dihedral subgroup generated by (t, gen).
                        (this.lengths[xs] == mst) ||

                        // Case 2: s = t. Since xs ends in s, left multiplication moves down if l(xs) odd.
                        (s == t && this.lengths[xs] % 2 == 1) ||

                        // Case 3: s != t. Since xs ends in s, left multiplication moves down if l(xs) even.
                        (s != t && this.lengths[xs] % 2 == 0)
                    )
                    if (movesDown) {
                        this.leftgen[this.rank * z + t] = xs
                        this.leftgen[this.rank * xs + t] = z
                        this.descents[xs] |= 1 << (t + this.rank)
                    }
                }
            }

            // Next fill in right multiplication by t.
            for (let t = 0; t < this.rank; t++) {
                let count = 0
                let z = 0
                for (let i = 0; i < this.coat[xs].length; i++) {
                    if (!this._descendsR(this.coat[xs][i], t)) {
                        count += 1
                        z = this.coat[xs][i]
                    }
                }

                if (count >= 2)
                    continue

                if (count != 1)
                    throw new Error("Expected count = 1")

                if (this.coat[xs].length != 2) {
                    this.rightgen[this.rank * z + t] = xs
                    this.rightgen[this.rank * xs + t] = z
                    this.descents[xs] |= 1 << t
                } else {
                    // Cases where xs . t < xs (note we already have s != t): only when we are at the
                    // top of the dihedral subgroup. Since s != t and xs ends in s, right multiplication
                    // by t will always move up.
                    let gen = this.firstDescentR(x)
                    let mst = this.coxeter.get(s, gen)
                    if (this.lengths[xs] == mst) {
                        this.rightgen[this.rank * z + t] = xs
                        this.rightgen[this.rank * xs + t] = z
                        this.descents[xs] |= 1 << t
                    }
                }
            }
        }

        return added
    }

    // Grow the enumerated part to at least the interval [e, word], where word is a word
    // in the generators. Some multiplication on word may still be undefined.
    growToWord(word: number[]) {
        let x = 0
        for (let i = 0; i < word.length; i++) {
            if (this.rightgen[this.rank * x + word[i]] < 0)
                this.grow(word[i])

            x = this.multR(x, word[i])
        }

        return x
    }

    /** Predicate saying whether the left and right multiplication tables for x are fully defined. */
    isFullyDefined(x: CoxElt): boolean {
        for (let s = 0; s < this.rank; s++)
            if (this.leftgen[this.rank * x + s] < 0 || this.rightgen[this.rank * x + s] < 0)
                return false

        return true
    }

    // Grow the enumerated part so that all elements up to some length are fully defined.
    growToLength(length: number) {
        for (let x = 0; x < this.size(); x++)
            if (this.length(x) <= length && !this.isFullyDefined(x))
                for (let s = 0; s < this.rank; s++)
                    if (this.rightgen[this.rank * x + s] < 0)
                        this.grow(s)
    }

    /** Returns true if all multiplications are defined. This will only happen for finite
     * groups, once the whole group has been enumerated.
     */
    isComplete(): boolean {
        return this.rightgen.every(x => x >= 0) && this.leftgen.every(x => x >= 0)
    }

    debugPrintMultTables(): void {
        let maxLength = arr.maximumBy(this.lengths, (x) => x)
        let maxIndexDigits = ('' + this.size()).length
        let leftCol = maxLength + maxIndexDigits + 3

        console.log(
            ''.padStart(leftCol),
            '|',
            (<string[]>[]).concat(
                'l',
                arr.fromFunc(this.rank, s => s + '.'),
                arr.fromFunc(this.rank, s => '.' + s),
                'coatoms'
            ).map(s => s.padStart(maxIndexDigits)).join(" | ")
        )

        for (let x = 0; x < this.size(); x++) {
            let data: string[] = (<string[]>[]).concat(
                // Length
                '' + this.lengths[x],

                // Left mult
                arr.range(this.rank)
                    .map(s => this.leftgen[this.rank * x + s])
                    .map(y => (y < 0) ? '*' : '' + y),

                // Right mult
                arr.range(this.rank)
                    .map(s => this.rightgen[this.rank * x + s])
                    .map(y => (y < 0) ? '*' : '' + y),

                // Coatoms
                this.coat[x].join(",")
            )

            console.log(
                this.shortLex(x).join('').padStart(maxLength),
                "=",
                ('' + x).padStart(maxIndexDigits),
                "|",
                data.map(s => s.padStart(maxIndexDigits)).join(" | ")
            )
        }
    }

    debugPrint(x: CoxElt) {
        if (!this.isEnumerated(x))
            throw new Error(`The element ${x} is not yet enumerated.`)

        let lines = [`Element ${x} with shortLex word ${this.shortLex(x)}`]
        lines.push(`  Length: ${this.length(x)}`)
        lines.push(`  Left descents:  ${arr.range(this.rank).filter(s => this.descendsL(s, x))}`)
        lines.push(`  Right descents: ${arr.range(this.rank).filter(s => this.descendsR(x, s))}`)
        lines.push(`         Coatoms: ${this.coat[x]}`)
        for (let line of lines)
            console.log(line)
    }

    /** Iterate over the direct descendents of x in the given order. */
    iterDescendents(x: CoxElt, order: 'leftweak' | 'rightweak' | 'bruhat' = 'bruhat', fn: (y: CoxElt) => void): void {
        switch (order) {
        case 'bruhat':
            for (let y of this.coat[x]) fn(y)
            return
        case 'leftweak':
            for (let s = 0; s < this.rank; s++)
                if (this.descendsL(s, x))
                    fn(this.multL(s, x))

            return
        case 'rightweak':
            for (let s = 0; s < this.rank; s++)
                if (this.descendsR(x, s))
                    fn(this.multR(x, s))

            return
        }
    }

    /** Return a list of the direct descendents of x in the given order. */
    descendents(x: CoxElt, order: 'leftweak' | 'rightweak' | 'bruhat' = 'bruhat'): CoxElt[] {
        let descendents: CoxElt[] = []
        this.iterDescendents(x, order, y => descendents.push(y))
        return descendents
    }

    /** A boolean array indexed by [0 .. high] indicating whether x <= high in the Bruhat order. */
    bruhatLower(high: CoxElt, order: 'leftweak' | 'rightweak' | 'bruhat' = 'bruhat'): boolean[] {
        if (!this.isEnumerated(high))
            throw new Error(`${high} is not enumerated.`)

        let isLower = arr.constant(high + 1, false)
        isLower[high] = true
        let stack: CoxElt[] = [high]
        while (stack.length > 0) {
            let x = stack.pop()!
            this.iterDescendents(x, order, (y) => {
                if (!isLower[y]) {
                    isLower[y] = true
                    stack.push(y)
                }
            })
        }

        return isLower
    }

    /** Return the Bruhat graph for the interval [id, high]. */
    bruhatGraph(high: CoxElt, parabolic?: number): digraph.Digraph<number, null, null> {
        if (!this.isEnumerated(high))
            throw new Error(`${high} is not enumerated.`)

        let isLower = this.bruhatLower(high)
        let G = new digraph.Digraph<CoxElt, null, null>(() => new maps.FlatIntMap())
        let para = (parabolic === undefined) ? 0 : parabolic

        for (let x = 0; x <= high; x++) {
            if (!isLower[x] || !this.isMinimal(para, x))
                continue

            G.addNode(x, null)
            for (let y of this.coat[x])
                if (this.isMinimal(para, y))
                    G.addEdge(y, x, null)
        }

        return G
    }

    /** Return all reduced expressions for an element. */
    reducedExpressions(x: CoxElt): number[][] {
        if (!this.isEnumerated(x))
            throw new Error(`Element ${x} is not enumerated.`)

        // helper(x) returns the reduced expressions of x.
        let helper = (x: CoxElt): number[][] => {
            // The identity element only has the empty word.
            if (x == 0)
                return [[]]

            // For each s such that xs < s, {Rexes of x ending in s} = {Rexes of xs} . s
            let expressions: number[][] = []
            for (let s = 0; s < this.rank; s++) {
                if (!this._descendsR(x, s))
                    continue

                let prefixes = helper(this._multR(x, s))
                for (let prefix of prefixes) {
                    prefix.push(s)
                    expressions.push(prefix)
                }
            }

            return expressions
        }

        return helper(x)
    }

    /** Returns a function for evaluating x.t, given the knowledge of gen = e.t,
     * and the action of each generator on an object of type t. Suppose that
     * l(x) > l(sx), then the function act(s, sxt, sx) is called to produce x.t from
     * sx.t. The parameter sx is optional.
     */
    leftMemo<T>(gen: T, act: (s: number, sxt: T, sx?: CoxElt) => T): (x: CoxElt) => T {
        const memoTable: T[] = [gen]

        // This helper function assumes that x is enumerated.
        let get = (x: CoxElt): T => {
            if (memoTable[x] !== undefined)
                return memoTable[x]

            let s = this.firstDescentL(x)
            let sx = this.multL(s, x)
            let sxt = get(sx)
            return memoTable[x] = act(s, sxt, sx)
        }

        return (x: CoxElt) => {
            if (!this.isEnumerated(x))
                throw new Error(`Element ${x} is not enumerated`)

            return get(x)
        }
    }
}
