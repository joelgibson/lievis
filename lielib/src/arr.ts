/** Array utilities. */
export namespace arr {

/** range(end) => All integers in [0, end). */
export function range(end: number): number[]

/** range(start, end) => All integers in [start, end). */
export function range(start: number, end: number): number[]

/** range(start, end, step) => All integers in [start, end) intersect [start, start + step, start + 2*step, ...]. */
export function range(start: number, end: number, step: number): number[]
export function range(a: number, b?: number, c?: number) {
    let start = (b === undefined) ? 0 : a
    let end = (b === undefined) ? a : b
    let step = (c === undefined) ? 1 : c

    let array: number[] = []
    for (let i = start; i < end; i += step)
        array.push(i)

    return array
}

/** The array [f(0), f(1), ..., f(size - 1)]. Equivalent to arr.range(size).map(f) */
export function fromFunc<T>(size: number, f: (i: number) => T): T[] {
    let array: T[] = []
    for (let i = 0; i < size; i++)
        array[i] = f(i)

    return array
}

/** Return a constant array (a repeated element). */
export function constant<T>(size: number, t: T): T[] {
    let array: T[] = []
    for (let i = 0; i < size; i++)
        array[i] = t

    return array
}

/** Compare two arrays for equality. */
export function isEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length != arr2.length)
        return false

    for (let i = 0; i < arr1.length; i++)
        if (arr1[i] != arr2[i])
            return false

    return true
}

/** The first index for which the predicate is satisfied, or -1 if there is no such index. */
export function indexWhere<T>(arr: T[], pred: (x: T) => boolean): number {
    for (let i = 0; i < arr.length; i++)
        if (pred(arr[i]))
            return i

    return -1
}

/** The sum of the elements of the array. */
export function sum(array: number[]): number {
    let sum = 0
    for (let i = 0; i < array.length; i++)
        sum += array[i]

    return sum
}

/** The product of the elements of the array. */
export function product(array: number[]): number {
    let prod = 1
    for (let i = 0; i < array.length; i++)
        prod *= array[i]

    return prod
}

/** Return the first item of the array achieving the maximum value fn(item). */
export function maximumBy<V>(array: V[], fn: (v: V) => number): V {
    if (array.length == 0)
        throw new Error("Maximum of empty array.")

    let v = array[0]
    let max = fn(v)
    for (let i = 1; i < array.length; i++) {
        let val = fn(array[i])
        if (val > max) {
            v = array[i]
            max = val
        }
    }

    return v
}

/** Return the first item of the array achieving the minimum value fn(item). */
export function minimumBy<V>(array: V[], fn: (v: V) => number): V {
    return maximumBy(array, (v) => 0 - fn(v))
}

/** Comparison function for lexicographic order,
 * for arrays over primitive types like number and string.
 */
export function cmpLex<V>(a: V[], b: V[]): number {
    if (a.length != b.length)
        return a.length - b.length

    for (let i = 0; i < a.length; i++)
        if (a[i] != b[i])
            return (a[i] > b[i]) ? 1 : -1

    return 0
}

}
