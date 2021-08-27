/** Seedable random number generation. */
export namespace rand {

// The random number generator used is "TinyMT", the "Tiny Mersenne Twister". The implementation here is based
// on the reference implementation created by the authors:
// https://github.com/MersenneTwister-Lab/TinyMT/tree/0f056950cdbe293a3e58c178444014a9907cdc69.
//
// The TinyMT actually has three 32-bit parameters (mat1, mat2, and tmat) as well as a 32-bit seed. These
// parameters seem mostly useful only if we are trying to create several RNGs which are intended to be run in
// parallel (for example, in a distributed computation) which also need to be statistically independent from one
// another.
//
// The private constructor for TinyMT accepts these three parameters as well as the seed, but for now we have only
// exposed the create() function, which uses a fixed choice of parameters and a variable seed.

const SH0 = 1
const SH1 = 10
const SH8 = 8

const MASK = 0x7fffffff | 0
const MIN_LOOP = 8
const PRE_LOOP = 8

/** TinyMT - Tiny Mersenne Twister (state of 4x32 bits). */
export class TinyMT {
    private state = new Uint32Array(4);

    /** This constructor should only be called with Int32's, not general Javascript numbers. */
    private constructor(
        readonly mat1: number,
        readonly mat2: number,
        readonly tmat: number,
        seed: number
    ) {
        this.state[0] = seed
        this.state[1] = mat1
        this.state[2] = mat2
        this.state[3] = tmat

        for (let i = 1; i < MIN_LOOP; i++)
            this.state[i&3] ^= i + Math.imul(0x6c078965 | 0, this.state[(i-1)&3] ^ (this.state[(i-1)&3]>>>30))

        // Throw an error if the period is less than 2^127 - 1.
        if (this.has_small_period())
            throw new Error("TinyMT random number period is too small!")

        for (let i = 0; i < PRE_LOOP; i++)
            this.next_state()
    }

    private has_small_period(): boolean {
        return (
            (this.state[0] & MASK) == 0
            && this.state[1] == 0
            && this.state[2] == 0
            && this.state[3] == 0
        )
    }

    private next_state() {
        let y = this.state[3]
        let x = (this.state[0] & MASK) ^ this.state[1] ^ this.state[2]
        x ^= (x << SH0)
        y ^= (y >>> SH0) ^ x

        this.state[0] = this.state[1]
        this.state[1] = this.state[2]
        this.state[2] = x ^ (y << SH1)
        this.state[3] = y

        let a = -(y & 1) & this.mat1
        let b = -(y & 1) & this.mat2
        this.state[1] ^= a
        this.state[2] ^= b
    }

    private uint32_temper(): number {
        let t0 = this.state[3]
        let t1 = this.state[0] + (this.state[2] >>> SH8)
        t0 ^= t1
        if ((t1&1) != 0)
            t0 ^= this.tmat

        return t0 >>> 0
    }

    /** Create a TinyMT random number generator, with fixed parameter set and variable seed. */
    public static create(seed: number) {
        // These parameters are from the TinyMT check program:
        // https://github.com/MersenneTwister-Lab/TinyMT/blob/master/tinymt/check32.out.txt
        return new TinyMT(
            0x8f7011ee | 0,
            0xfc78ff1f | 0,
            0x3793fdff | 0,
            seed | 0,
        )
    }

    /** Generate a 32-bit unsigned integer. */
    public uint32(): number {
        this.next_state()
        return this.uint32_temper()
    }

    /** Generate a list of 32-bit unsigned integers. */
    public uint32s(length: number): number[] {
        let result: number[] = []
        for (let i = 0; i < length; i++)
            result[i] = this.uint32()

        return result
    }

    /** Generate a random floating-point number in the interval [0.0, 1.0). */
    public float32(): number {
        this.next_state()
        return this.uint32_temper() * (1.0 / 4294967296.0)
    }

    /** Generate a list of random floating-point numbers in the interval [0.0, 1.0). */
    public float32s(length: number): number[] {
        let result: number[] = []
        for (let i = 0; i < length; i++)
            result[i] = this.float32()

        return result;
    }

    /** Generate a random integer in the interval [min, max). */
    public int(min: number, max: number): number {
        let range = max - min
        return min + Math.floor(this.float32() * range)
    }

    /** Generate a list of random integers in the interval [min, max). */
    public ints(min: number, max: number, length: number): number[] {
        let result: number[] = []
        for (let i = 0; i < length; i++)
            result[i] = this.int(min, max)

        return result
    }
}

}
