# Lievis

This is the software running the visualisations at <https://www.jgibson.id.au/lievis/>.

Lievis is a collection of Lie theory visualisations. It consists of two parts: a library *lielib* written in TypeScript, and a website written in a combination of [Pandoc markdown](https://pandoc.org/) and [Svelte](https://svelte.dev/). Instructions for getting the site up and running can be found in the [site README](site/README.md).

This is by no means polished code - it's been accumulated over time, and in order to get high performance in some places it is strangely written. There are two implementations of root systems for instance - a more limited, slower one written earlier, and a much better-designed one written later, but both are kept around since rewriting visualiations that already work is not a good use of my time.

There is always a tension here between spending time on implementing the mathematics (and making it go as fast as possible) and making complex visualisations which are easy to use. These are both fairly difficult programming tasks, and some things (maintainence, refactoring, etc) fall through the cracks. I try to keep the *lielib* part as nice as possible and maintained, but the visualisation code is very much a write-once-refactor-almost-never affair.

All of these things might make the code quite difficult to read in places. If you are interested in this kind of stuff and would like some explanation of the code, please reach out and contact me, I'll very happy to explain.
