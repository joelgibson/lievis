/** Utilities for working with bitwise operations. */
export namespace bits {

/** Cast a number to a 32-bit integer, then interpret it as being signed.
 * Should (in spirit) match ToInt32() in the ECMAScript spec: https://tc39.es/ecma262/#sec-toint32. */
export function toInt32(x: number): number {
    return x | 0;
}

/** Cast a number to a 32-bit integer, then interpret it as being unsigned.
 * Should (in spirit) match ToUint32() in the ECMAScript spec: https://tc39.es/ecma262/#sec-touint32/ */
export function toUint32(x: number): number {
    return x >>> 0;
}

/** Counts the number of bits set in a number. */
export function popCount(x: number): number {
    let count = 0
    for (; x != 0; x >>>= 1)
        count += x & 1

    return count
}

/** Convert a list of integers to a bitmask, treating them as a set (an integer appearing
 * more than once in the list is ignored and treated as though it appeared once). If an
 * integer 30 or more appears, throws an error.
 */
export function toMask(nums: number[]): number {
    let mask = 0
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] < 0 || nums[i] >= 30)
            throw new Error(`Cannot convert ${nums[i]} into a bitmask, out of bounds.`)

        mask |= 1 << nums[i]
    }

    return mask
}

/** Convert a bitmask back to a list of increasing integers. */
export function fromMask(mask: number): number[] {
    let result = []
    for (let i = 0; mask != 0; mask >>>= 1, i += 1)
        if (mask & 1)
            result.push(i)

    return result
}

/** Return true if the bitmask a is a subset of the bitmask b. */
export function isSubset(a: number, b: number) { return (a & b) == a }

/** Return all bitmasks representing a k-element subset of [0, ..., n). */
export function nCk(n: number, k: number): number[] {
    let results = []
    for (let i = 0; (i >>> n) == 0; i++)
        if (popCount(i) == k)
            results.push(i)

    return results
}

}
