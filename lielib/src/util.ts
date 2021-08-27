export const EPS = 0.000001 // ❤️ floating point

export function assert(cond: boolean, message?: string): void {
    if (cond)
        return;
    throw new Error("Assertion failed: " + message)
}

export namespace util {
    /** Mathematical mod, returning values in the range [0, ..., n).  */
    export function mod(a: number, n: number): number {
        return ((a % n) + n) % n
    }

    export function gcd(a: number, b: number): number {
        if (b == 0)
            return a
        return gcd(b, a % b)
    }

    
    /** Comparison function for integers, for use with Array.sort(). */
    export function cmpInt(a: number, b: number): number {
        return a - b
    }
    
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

    /** Return the array [0, 1, ..., n-1] */
    export function range(n: number): number[] {
        let array: number[] = []
        for (let i = 0; i < n; i++)
            array[i] = i
        
        return array
    }

    /** Return the array [f(0), f(1), ..., f(n - 1)] */
    export function arrayFrom<T>(n: number, f: (i: number) => T): T[] {
        assert(n >= 0)
        let array: T[] = []
        for (let i = 0; i < n; i++)
            array[i] = f(i)
            
        return array
    }

    /** Return the constant array [v, v, ..., v] of length n. */
    export function arrayConst<V>(n: number, v: V): V[] {
        assert(n >= 0)

        let array: V[] = []
        for (let i = 0; i < n; i++)
            array[i] = v
        
        return array
    }

    export function arraysEqual<T>(a: T[], b: T[]): boolean {
        if (a.length != b.length)
            return false
        
        for (let i = 0; i < a.length; i++)
            if (a[i] != b[i])
                return false
        
        return true
    }

    export function minimumBy<V>(array: V[], fn: (v: V) => number): V {
        return maximumBy(array, (v) => 0 - fn(v))
    }

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

    export function product(ns: number[]): number {
        let prod = 1
        for (let i = 0; i < ns.length; i++)
            prod *= ns[i]
        
        return prod
    }

    export function factorial(n: number): number {
        let prod = 1
        for (let i = 2; i <= n; i++)
            prod *= i
        
        return prod
    }

    /** Returns the first index where test is true, or -1 otherwise. */
    export function indexWhere<T>(arr: T[], test: (x: T) => boolean): number {
        for (let i = 0; i < arr.length; i++)
            if (test(arr[i]))
                return i
        
        return -1
    }
}


export namespace num {
    // Numeric functions for dealing with fuzzy equality and rounding.

    export function nearZero(x: number, eps?: number): boolean {
        eps = eps || EPS
        return Math.abs(x) < eps
    }
    export function nearInteger(x: number, eps?: number): boolean {
        return nearZero(Math.round(x) - x, eps)
    }
}
