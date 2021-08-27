import { rand } from "../src/rand"

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

// A sample run of the integer outputs of TinyMT is at
// https://github.com/MersenneTwister-Lab/TinyMT/blob/0f056950cdbe293a3e58c178444014a9907cdc69/tinymt/check32.out.txt.
// We are checking these outputs against our own.
//
// We are using the fact that TinyMT.create(seed) uses the same parameters as in that test.
registerSuite('rand', {
    'TinyMT seed=1'() {
        const expected = [
            2545341989, 981918433, 3715302833, 2387538352, 3591001365,
            3820442102, 2114400566, 2196103051, 2783359912, 764534509,
            643179475, 1822416315, 881558334, 4207026366, 3690273640,
            3240535687, 2921447122, 3984931427, 4092394160, 44209675,
            2188315343, 2908663843, 1834519336, 3774670961, 3019990707,
            4065554902, 1239765502, 4035716197, 3412127188, 552822483,
            161364450, 353727785, 140085994, 149132008, 2547770827,
            4064042525, 4078297538, 2057335507, 622384752, 2041665899,
            2193913817, 1080849512, 33160901, 662956935, 642999063,
            3384709977, 1723175122, 3866752252, 521822317, 2292524454,
        ]
        let gen = rand.TinyMT.create(1);
        assert.deepStrictEqual(gen.uint32s(50), expected);
    }
})