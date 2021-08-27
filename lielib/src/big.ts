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

}
