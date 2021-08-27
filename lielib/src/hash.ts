/** Hashing functions, suitable for use in a hash table implementation. */
export namespace hash {

/** imul() is 32-bit integer multiplication. Defaults to Math.imul() if available.  */
const imul = (Math.imul !== undefined) ? Math.imul : function(opA: number, opB: number) {
    /* Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul */
    opB |= 0; // ensure that opB is an integer. opA will automatically be coerced.
    // floating points give us 53 bits of precision to work with plus 1 sign bit
    // automatically handled for our convienence:
    // 1. 0x003fffff /*opA & 0x000fffff*/ * 0x7fffffff /*opB*/ = 0x1fffff7fc00001
    //    0x1fffff7fc00001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
    var result = (opA & 0x003fffff) * opB;
    // 2. We can remove an integer coersion from the statement above because:
    //    0x1fffff7fc00001 + 0xffc00000 = 0x1fffffff800001
    //    0x1fffffff800001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
    if (opA & 0xffc00000 /*!== 0*/) result += (opA & 0xffc00000) * opB |0;
    return result |0;
}

/** Rotate the bits of x left by n places. The high bits rotate around to the low bits. */
function rol(x: number, n: number): number {
    return (x << n) | (x >>> (0 - n))
}

interface IHasher {
    readonly seed: number
    mix(hash: number, key: number): number
    finish(hash: number, length: number): number
}

// Murmur3 hash, from
// https://github.com/clojure/clojurescript/blob/a4673b880756531ac5690f7b4721ad76c0810327/src/main/cljs/cljs/core.cljs#L902

const m3_c1 = 0xcc9e2d51
const m3_c2 = 0x1b873593

/** Murmur3 hash. */
export const murmur3: IHasher = {
    seed: <number> 0,

    mix(hash: number, key: number): number {
        let keyi = key | 0
        keyi = imul(keyi, m3_c1)
        keyi = rol(keyi, 15)
        keyi = imul(keyi, m3_c2)

        let hashi = hash | 0
        hashi = hashi ^ keyi
        hashi = rol(hashi, 13)
        hashi = imul(hashi, 5) + 0xe6546b64
        return hashi
    },

    finish(hash: number, length: number): number {
        let hashi = hash | 0
        hashi ^= (length | 0)
        hashi ^= hashi >>> 16
        hashi = imul(hashi, 0x85ebca6b)
        hashi ^= hashi >>> 13
        hashi = imul(hashi, 0xc2b2ae35)
        hashi ^= hashi >>> 16
        return hashi
    },
} as const


const fnv_offset = 0x811c9dc5
const fnv_prime = 0x01000193

/** FNV-1a hash */
export const fnv1a: IHasher = {
    seed: <number> fnv_offset,

    mix(hash: number, key: number): number {
        hash = ((key >>> 0) & 0xff) ^ imul(hash, fnv_prime)
        hash = ((key >>> 8) & 0xff) ^ imul(hash, fnv_prime)
        hash = ((key >>> 16) & 0xff) ^ imul(hash, fnv_prime)
        hash = ((key >>> 24) & 0xff) ^ imul(hash, fnv_prime)
        return hash
    },

    finish(hash: number, length: number): number {
        return hash ^ length
    },
}

/** Default hasher, currently fnv1a since it seems to run faster and is just as good quality. */
export const hasher = fnv1a

/** Hash an integer. */
export function int(n: number): number {
    // The following code inlines hasher.finish(hasher.mix(hasher.seed, n), 1).
    // This produces a noticable speedup on Firefox (80ms spent hashing vs 15ms).

    let hash = 0x811c9dc5
    hash = ((n >>> 0) & 0xff) ^ imul(hash, 0x01000193)
    hash = ((n >>> 8) & 0xff) ^ imul(hash, 0x01000193)
    hash = ((n >>> 16) & 0xff) ^ imul(hash, 0x01000193)
    hash = ((n >>> 24) & 0xff) ^ imul(hash, 0x01000193)
    return hash ^ 1
}

/** Hash an integer array. */
export function ivec(xs: number[]): number {
    // Again we'll inline the function manually here.

    let hash = 0x811c9dc5
    
    for (let i = 0; i < xs.length; i++) {
        hash = ((xs[i] >>> 0) & 0xff) ^ imul(hash, 0x01000193)
        hash = ((xs[i] >>> 8) & 0xff) ^ imul(hash, 0x01000193)
        hash = ((xs[i] >>> 16) & 0xff) ^ imul(hash, 0x01000193)
        hash = ((xs[i] >>> 24) & 0xff) ^ imul(hash, 0x01000193)
    }

    return hash ^ xs.length
}

}
