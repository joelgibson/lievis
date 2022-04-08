/** Bigint utilities */
export namespace big {

/** Factorial of n, returned as a bigint. */
export function factorial(n: number): bigint {
    if (n < 0)
        throw new Error("Cannot factorial a negative number.")

    let prod = 1n
    for (let i = 2; i <= n; i++)
        prod *= BigInt(i)

    return prod
}

/** Absolute value. */
export function abs(n: bigint): bigint {
    return (n >= 0) ? n : -n
}

/** Maximum. */
export function max(n: bigint, m: bigint): bigint {
    return (n >= m) ? n : m
}

}
