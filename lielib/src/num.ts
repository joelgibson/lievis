/** Numerical utility functions. */
export namespace num {

/** Predicate testing whether a number is an integer. */
export function isInteger(n: number): boolean {
    return isFinite(n) && Math.floor(n) == n
}

/** Predicate testing whether a number is a power of 2. */
export function isPow2(n: number): boolean {
    if (n <= 0 || !isInteger(n))
        return false

    for (let i = 1; i <= n; i = i << 1)
        if (i == n)
            return true

    return false
}

/** Return the next power of 2 greater than or equal to n. */
export function nextPow2(n: number): number {
    // Subtract 1, then copy the highest bit down so that we make an all-1's number.
    // That number plus one is the answer.
    let x = ((n - 1) >>> 0)
    x |= x >>> 1
    x |= x >>> 2
    x |= x >>> 4
    x |= x >>> 8
    x |= x >>> 16
    return x + 1
}

/** Rudimentary is-prime function using trial division. */
export function isPrime(n: number): boolean {
    if (n <= 2)
        return false

    for (let i = 2; i*i <= n; i++)
        if (n % i == 0)
            return false

    return true
}

/** Mathematical mod, returning values in the range [0, ..., n).  */
export function mod(a: number, n: number): number {
    return ((a % n) + n) % n
}

/** Greatest common divisor. */
export function gcd(a: number, b: number): number {
    if (b == 0)
        return a
    return gcd(b, a % b)
}

/** Lowest common multiple. */
export function lcm(a: number, b: number): number {
    return ((a * b) / gcd(a, b)) | 0
}

/** Extended Euclidean algorithm.
 * bezout(u, v) = {d, s, t} such that d = gcd(u, v) >= 0 and su + tv = d. */
export function bezout(u: number, v: number): {d: number, s: number, t: number} {
    if (u == 0)
        return (v >= 0) ? {d: v, s: 0, t: 1} : {d: 0 - v, s: 0, t: -1}

    // From (v, u), find q, r such that v = qu + r and 0 <= r < |u|.
    let q = (u > 0) ? Math.floor(v / Math.abs(u)) : 0 - Math.floor(v / Math.abs(u))
    let r = v - q * u
    let {d, s, t} = bezout(r, u)
    return {d, s: t - (q * s | 0), t: s}
}

/** The factorial of n. Safe to call up to n=21. */
export function factorial(n: number): number {
    if (n > 21)
        throw new Error(`${n}! is too large.`)

    let prod = 1
    for (let i = 2; i <= n; i++)
        prod *= i

    return prod
}

}
