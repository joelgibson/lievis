/** Implementation of single-variable Laurent polynomials. */
export namespace lpoly {

/** A Laurent polynomial is stored as a dense list of its coefficients, together with a
 * number botDeg which gives the degree of the first term in the list. For example,
 *     botDeg = -2, coeffs = [7, -3, 0, 4]
 * would represent the Laurent polynomial
 *     7 v^-2 - 3v^-1 + 4v
 * The list of coefficients must either be empty, or start and end with nonzero terms.
 * If the list of coefficients is empty (the zero polynomial), then botDeg should be zero.
 */
export interface LPoly {
    readonly botDeg: number
    readonly coeffs: readonly number[]
}

class LPolyImpl {
    // A Laurent polynomial is stored as a dense list of its coefficients, together with a
    // number botDeg which gives the degree of the first term in the list. For example,
    //   botDeg = -2, coeffs = [7, -3, 0, 4]
    // would represent the Laurent polynomial
    //   7 v^-2 - 3v^-1 + 4v
    // The list of coefficients must either be empty, or start and end with nonzero terms.
    // If the list of coefficients is empty (the zero polynomial), then botDeg should be zero.
    constructor(
        readonly botDeg: number,
        readonly coeffs: readonly number[],
    ) {
        if (coeffs.length > 0 && (coeffs[0] == 0 || coeffs[coeffs.length - 1] == 0))
            throw new Error("Coeffs list not normalised.")
        if (coeffs.length == 0 && botDeg != 0)
            throw new Error("Coeffs was empty, but botDeg is nonzero.")
    }
}

/** upperDeg is 1 + (the largest degree in the polynomial). */
function upperDeg(poly: LPoly): number { return poly.botDeg + poly.coeffs.length }

// Since LPolys are immutable, we can refer to common constants a lot.
export const zero = new LPolyImpl(0, [])
export const one = new LPolyImpl(0, [1])
export const vee = new LPolyImpl(1, [1])

/** Unit map, taking a scalar to a constant-term polynomial. */
export function unit(scalar: number): LPoly {
    return (scalar == 0) ? zero : new LPolyImpl(0, [scalar])
}

/** Construct a Laurent polynomial from a list of coefficients and a valuation.
 * The coefficients do not need to be normalised: they may have leading/trailing zeros
 * and so on.
*/
export function fromValCoeffs(val: number, coeffs: number[]): LPoly {
    let leadingZeros = 0
    for (let i = 0; i < coeffs.length && coeffs[i] == 0; i++) leadingZeros++
    let trailingZeros = 0
    for (let i = coeffs.length - 1; i >= 0 && coeffs[i] == 0; i--) trailingZeros++

    if (leadingZeros == coeffs.length)
        return zero

    let newCoeffs: number[] = []
    for (let i = leadingZeros; i < coeffs.length - trailingZeros; i++)
        newCoeffs[i - leadingZeros] = coeffs[i]

    return new LPolyImpl(val + leadingZeros, newCoeffs)
}

/** Multiply a Laurent polynomial by a scalar. */
export function scale(poly: LPoly, scalar: number): LPoly {
    return (scalar == 0) ? zero : new LPolyImpl(poly.botDeg, poly.coeffs.map(x => x * scalar))
}

/** Multiply a Laurent polynomial by v^shift. */
export function shift(poly: LPoly, shift: number): LPoly {
    return (shift == 0) ? poly : new LPolyImpl(poly.botDeg + shift, poly.coeffs)
}

/** Check whether this is the zero polynomial. */
export function isZero(poly: LPoly): boolean {
    return poly.coeffs.length == 0
}

/** The coefficient of v^pow in the Laurent polynomial. */
export function coefficient(poly: LPoly, pow: number): number {
    let index = pow - poly.botDeg
    return (0 <= index && index < poly.coeffs.length) ? poly.coeffs[index] : 0
}

/** Evaluate the Laurent polynomial at a number. */
export function evaluate(poly: LPoly, v: number): number {
    // Horner-evaluate the polynomial part, then scale by the valuation part.
    let acc = 0
    for (let i = poly.coeffs.length - 1; i >= 0; i--)
        acc = v * acc + poly.coeffs[i]

    return acc * Math.pow(v, 0 - poly.botDeg)
}

/** Add Laurent polynomials. */
export function add(p: LPoly, q: LPoly): LPoly {
    return ap_bq(1, p, 1, q)
}

/** Subtract Laurent polynomials. */
export function sub(p: LPoly, q: LPoly): LPoly {
    return ap_bq(1, p, -1, q)
}

/** Multiply Laurent polynomials. */
export function mul(p: LPoly, q: LPoly): LPoly {
    // Multiplication is actually easier than addition and subtraction. Since we have
    // normalised coeffs such that the first and last entries are nonzero, we know that
    // in the product we get a bottom nonzero term and a top nonzero term.
    if (p.coeffs.length == 0 || q.coeffs.length == 0)
        return zero

    // Perform regular polynomial multiplication on the polynomial parts.
    let coeffs: number[] = []
    for (let i = 0; i < p.coeffs.length + q.coeffs.length - 1; i++)
        coeffs[i] = 0

    for (let i = 0; i < p.coeffs.length; i++)
        for (let j = 0; j < q.coeffs.length; j++)
            coeffs[i + j] += p.coeffs[i] * q.coeffs[j]

    return new LPolyImpl(p.botDeg + q.botDeg, coeffs)
}

/** Create the polynomial a*p(v) + b*q(v). */
function ap_bq(a: number, p: LPoly, b: number, q: LPoly) {
    if (a == 0 && b == 0) return zero
    if (a == 0) return scale(q, b)
    if (b == 0) return scale(p, a)

    // Compute the largest and smallest possible terms of the sum, and zero an array of that size.
    let botDeg = Math.min(p.botDeg, q.botDeg)
    let topDeg = Math.max(upperDeg(p), upperDeg(q))
    let coeffs: number[] = []
    for (let i = 0; i < topDeg - botDeg; i++)
        coeffs[i] = 0

    // Add each term into its proper slot.
    for (let i = 0; i < p.coeffs.length; i++)
        coeffs[(i + p.botDeg) - botDeg] += a * p.coeffs[i]
    for (let i = 0; i < q.coeffs.length; i++)
        coeffs[(i + q.botDeg) - botDeg] += b * q.coeffs[i]

    // There may be cancellation, so we might need to strip leading and trailing zeros.
    let leadingZeros = 0
    for (let i = 0; i < coeffs.length && coeffs[i] == 0; i++) leadingZeros++
    let trailingZeros = 0
    for (let i = coeffs.length - 1; i >= 0 && coeffs[i] == 0; i--) trailingZeros++

    // We want to assume that leading and trailing zeros don't overlap (so we don't double count).
    // The only case where this happens is if things have cancelled to zero.
    if (leadingZeros == coeffs.length)
        return zero

    if (leadingZeros != 0)
        coeffs.copyWithin(0, leadingZeros)
    if (leadingZeros + trailingZeros != 0)
        coeffs.length = coeffs.length - (leadingZeros + trailingZeros)

    return new LPolyImpl(botDeg + leadingZeros, coeffs)
}

/** Format a polynomial to a string. */
export function fmt(poly: LPoly, opts?: Partial<FmtOptions>) {
    let format = (opts?.format) ? opts.format : 'unicode'
    let zeroIsEmptyString = (opts?.zeroIsEmptyString) ? true : false
    let varname = (opts?.varname) ? opts.varname : 'v'
    let shift = (opts?.shift) ? opts.shift : 0
    let scale = (opts?.scale) ? opts.scale : 1

    if (isZero(poly))
        return (zeroIsEmptyString) ? '' : '0'

    let output: string[] = []

    let expString =
        (format == 'text') ? (n: number) => '^' + n :
        (format == 'unicode') ? unicodeSuperscript :
        (n: number) => '<sup>' + n + '</sup>'

    for (let i = 0; i < poly.coeffs.length; i++) {
        let deg = (poly.botDeg + i + shift) * scale
        let coeff = poly.coeffs[i]
        if (coeff == 0)
            continue

        // If it is the first term, want coeff with its sign together later. If it is
        // not the first term, strip the sign off and put it before.
        if (i != 0) output.push((coeff > 0) ? ' + ' : ' - ')
        if (i != 0) coeff = Math.abs(coeff)

        if (coeff != 1 || deg == 0) output.push('' + coeff)

        if (deg == 0) output.push('')
        else if (deg == 1) output.push(varname)
        else output.push(varname + expString(deg))
    }

    return output.join('')
}

type FmtOptions = {
    format: 'text' | 'unicode' | 'html',
    zeroIsEmptyString: boolean,
    varname: string,
    shift: number,
    scale: number,
}

/** Convert a number into a superscript digit string. */
function unicodeSuperscript(n: number): string {
    let result = ''
    if (n < 0) {
        result = '⁻'
        n = Math.abs(n)
    }
    let numstring = '' + n
    let supers = '⁰¹²³⁴⁵⁶⁷⁸⁹'
    for (let i = 0; i < numstring.length; i++)
        result += supers[numstring.charCodeAt(i) - '0'.charCodeAt(0)]

    return result
}

}
