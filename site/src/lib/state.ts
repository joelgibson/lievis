/** Return a minimal (smallest number of keys) object delta such that modified = {...base, ...delta}. */
export function objectDelta<T>(base: T, modified: T): Partial<T> {
    let result: Partial<T> = {}
    for (let key in base)
        if (base[key] != modified[key])
            result[key] = modified[key]

    return result
}
