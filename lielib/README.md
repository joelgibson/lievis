# Lielib - Typescript library for Lie theory visualisations

The library files are in `src/`, and are all imported into `index.ts` for package consumption.
Most of the library files export a single object, for example the `arr` object is a namespace for array utilities.
The order of imports in `index.ts` should be topological: there is a base collection (`arr`, `num`, `hash`, `imap`, etc) that everything else depends on.
This can help with reading order.

Very short functions are sometimes copied rather than being imported, in the sake of easing reading effort, reducing dependencies, and occasionally because I think that it will be able to be inlined better.


## Testing

Some tests present to identify regressions and validate some basic assumptions about how data structures behave: these tests are not exhaustive (nor are they indended to be). They can be run using

    pnpm run test

or to run tests only from one file, something like

    pnpx intern suites=tests/lpoly.test.ts

They use the [Intern](https://theintern.io/) testing library, with [Chai](https://www.chaijs.com/) as an assertion library.


## Benchmarking

This looks like a good article on how to actually get down to the guts of V8 somewhat: <https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html>.

Currently the benchmarks can be run via Vite.
