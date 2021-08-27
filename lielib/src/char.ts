import {hash} from './hash'
import {maps} from './maps'

/** The char module implements multivariate Laurent polynomials, which will be used as the character
 * ring of an algebraic group (the group algebra of the character lattice). The CharElt type is
 * a Laurent polynomial, with the CharAlg type giving the algebra structure. Mutating operations
 * are all methods on a CharElt, whereas methods that create a new CharElt are on CharAlg.
 *
 * For example, to do a binomial-theorem-type calculation:
 * let alg = new CharAlg(2)             // Laurent polynomial algebra in 2 variables.
 * let x = alg.gen(0), y = alg.gen(2)   // Generating monomials x and y
 * let binom = alg.add(x, y)            // Binomial (x + y)
 * let pow = alg.mul(binom, binom)      // Binomial expansion (x + y)^2 = x^2 + 2xy + y^2
 */
export namespace char {

type Vec = number[]

export class CharElt extends maps.AbstractEntryHashTableFactory()<Vec, number> implements maps.IEntryMap<Vec, number> {
    protected defaultValue() { return 0 }
    protected appendPair(key: Vec, value: number) { this.entries.push({key: key.slice(), value}) }
    protected hash(key: Vec) { return hash.ivec(key) }
    protected equal(key1: Vec, key2: Vec) {
        if (key1.length != key2.length)
            return false

        for (let i = 0; i < key1.length; i++)
            if (key1[i] != key2[i])
                return false

        return true
    }
    protected cmp = maps.EntryVecMap.prototype.cmp

    mutScale(s: number): this {
        for (let i = 0; i < this.entries.length; i++)
            this.entries[i].value *= s

        return this
    }

    mutAddScaled(X: CharElt, scalar: number): this {
        for (let i = 0; i < X.entries.length; i++) {
            let x = X.entries[i]
            this.askEntry(x.key).value += x.value * scalar
        }
        return this
    }

    zerosRemoved(): CharElt {
        // Are there any zero values?
        let hasZeros = false
        for (let i = 0; i < this.entries.length; i++) {
            if (this.entries[i].value == 0) {
                hasZeros = true
                break
            }
        }

        if (!hasZeros)
            return this

        let char = new CharElt()
        for (let i = 0; i < this.entries.length; i++)
            if (this.entries[i].value != 0)
                char.set(this.entries[i].key, this.entries[i].value)

        return char
    }
}

/* dst <- a + b, returning dst. The number of entries set is determined by a.length. */
function mutadd(dst: Vec, a: Vec, b: Vec) {
    for (let i = 0; i < a.length; i++)
        dst[i] = a[i] + b[i]

    return dst
}

export class CharAlg {
    constructor(readonly nvars: number) {}

    /** Unit map, which inserts scalars into scalar multiples of the identity. */
    unit(scalar: number) {
        let elt = new CharElt()
        if (scalar != 0)
            elt.set(Array(this.nvars).fill(0), scalar)

        return elt
    }

    zero() { return this.unit(0) }
    one() { return this.unit(1) }

    /** Lifts a Vec to a monomial, eg [1, 0, 4] => xz^4. */
    basis(vec: Vec) {
        if (vec.length != this.nvars)
            throw new Error("Vector length incompatible with number of variables.")

        let elt = new CharElt()
        elt.set(vec, 1)
        return elt
    }

    /** A generating variable, in the range [0, nvars). Eg 0 => x, 1 => y, 2 => z.*/
    gen(i: number) {
        if (!(0 <= i && i < this.nvars))
            throw new Error("Generator index out of range.")

        let v = Array(this.nvars).fill(0)
        v[i] = 1
        return this.basis(v)
    }

    private readonly _zero = this.unit(0)
    protected ax_by(a: number, x:CharElt, b: number, y: CharElt) {
        if (a == 0 && b == 0)
            return this.unit(0)
        else if (a == 0)
            x = this._zero
        else if (b == 0)
            y = this._zero

        let result = new CharElt()
        for (let i = 0; i < x.entries.length; i++) {
            let entry = x.entries[i];
            result.askEntry(entry.key).value += a * entry.value
        }

        for (let i = 0; i < y.entries.length; i++) {
            let entry = y.entries[i];
            result.askEntry(entry.key).value += b * entry.value
        }

        return result
    }

    scale(x: CharElt, s: number): CharElt { return this.ax_by(s, x, 0, this._zero) }
    add(x: CharElt, y: CharElt): CharElt { return this.ax_by(1, x, 1, y) }
    sub(x: CharElt, y: CharElt): CharElt { return this.ax_by(1, x, -1, y) }

    mul(X: CharElt, Y: CharElt): CharElt {
        let result = new CharElt()
        let tmp: Vec = []
        for (let i = 0; i < X.entries.length; i++) {
            let x = X.entries[i]
            for (let j = 0; j < Y.entries.length; j++) {
                let y = Y.entries[j]
                result.askEntry(mutadd(tmp, x.key, y.key)).value += x.value * y.value
            }
        }

        return result
    }

    applyFunctional(X: CharElt, f: (basis: Vec) => number): number {
        let result = 0
        for (let i = 0; i < X.entries.length; i++) {
            let x = X.entries[i]
            result += f(x.key) * x.value
        }
        return result
    }

    applyBasisMap(X: CharElt, f: (basis: Vec) => Vec): CharElt {
        let result = new CharElt()
        for (let i = 0; i < X.entries.length; i++) {
            let x = X.entries[i]
            result.askEntry(f(x.key)).value += x.value
        }
        return result
    }

    applyLinear(X: CharElt, f: (basis: Vec) => CharElt): CharElt {
        let result = new CharElt()
        for (let i = 0; i < X.entries.length; i++) {
            let x = X.entries[i]
            result.mutAddScaled(f(x.key), x.value)
        }
        return result
    }

    tryApplyLinear(X: CharElt, f: (basis: Vec) => CharElt | null): CharElt | null {
        let result = new CharElt()
        for (let i = 0; i < X.entries.length; i++) {
            let x = X.entries[i]

            if (x.value == 0)
                continue

            let fElt = f(x.key)
            if (fElt == null)
                return null

            result.mutAddScaled(fElt, x.value)
        }
        return result
    }
}

}
