# Lievis site

This site is an ongoing project to create interactive visualisations inspired by concepts in representation theory and Lie theory.


# Building the site

The two main tools needed are `pandoc` and `pnpm`. [Pandoc](https://pandoc.org/MANUAL.html) is a tool which converts markdown files (`.md`) to html, and [pnpm](https://pnpm.io/installation) is a Javascript package manager like `npm`, but in many ways better. These can both be installed by following the links (there is a good chance you can find `pandoc` in your favourite UNIX package manager, too). Once you have these tools, get the site running locally:

    pnpm install    # Fetches Javascript dependencies
    make            # Generates all the .html pages from .md
    pnpm run dev    # Starts up the dev server

The dev server will automatically watch for file changes and reload. However, it is watching the generated `.html` files rather than the source `.md` files. So either remember to run `make` after every modification to a `.md` file, or install the `fswatch` tool and run

    ./pandoc-watch.fish     # Watches `.md` files and re-runs make automatically.

To make a build of the site to `_site/`:

    make clean      # Force the HTML files to be rebuilt.
    make
    pnpm run build

The build options (minification and so on) can be edited in `vite.config.js`, for which you can find the options at the [Vite site](https://vitejs.dev/config/#build-target).

When I build the site I mount it to the subdirectory `/lievis/` at my website: <https://www.jgibson.id.au/lievis/>. This subdirectory can be changed by modifying the `base_url` file, and re-running the build process.


# To-do list

Next I'll be working on:

- Displaying elements in the affine Weyl visualisation, both as words, and as the finite group semidirect product the root lattice.
- Implement the periodic Hecke module for the affine Weyl visualisation.


# Technical internals

Some conventions that are used internally.

## Coordinate systems

Pretty much all code works in two coordinate systems: the "natural" coordinates for the problem (for example the fundamental weight basis), and what I'll call "CSS coordinates". In CSS coordinates, the units are CSS pixels, the `x`-coordinate increases to the right, the `y`-coordinate increases down the page, and `(0, 0)` is in the top left of the rectangle. These are the natural coordinates for SVG, and the coordinates that the browser will report whenever a mouse or pointer action is taken.

When drawing to a `<canvas>` element, a DPR (device pixel ratio) correction needs to be done, but this can be treated as an output-only problem that only needs to be known about when the canvas and its drawing context are set up. After that, we draw to canvas elements using CSS coordinates.

When drawing using WebGL, we need to make the DPR correction, and then put everything into "clip space", a coordinate box of dimensions `[-1, 1]^3`. This is again treated mostly as an output-only problem that our `REGL` drawing routines need to deal with (we may have to pass through the aspect ratio to inform it how that square will end up getting bent).


# Design decisions

Some brief rationale and comments on why certain pieces of tech are used in the way that they are.


## Reusability

I am using a component framework ([Svelte](https://svelte.dev/)), but it is an _explicit non-goal_ to extract everything possible into a tidy little component, unless it should 100% obviously be its own component (see the `Latex` and `InfoTooltip` comonents in `src/lib/components/` for example).

The reason for this non-goal is that (in my experience) visualisation code tends to be pretty unique depending on what you want to display, and premature factoring into components and so on slows down the process. Copy-pasting a similar component and modifying it is often the fastest way to create something new, without having to worry about creating a new abstraction which fits all the needs. The other benefit on a sporadically updated site like this is that copying and pasting to starting something new will never break existing code, wheras modifying a common component for something new has the potential to break something.

Some common "components" have started emerging, but they don't really seem "right" to me yet.


## PNPM

[PNPM](https://pnpm.io/) seems to be the best Javascript package manager out there -- far better than NPM, and somewhat on-par with Yarn. Some of the reasons I've preferred it:

- Support for multiple packages in a single git repository (`pnpm` calls these "workspaces", or support for _monorepos_).
- Only makes dependencies you've actually declared visible in `node_modules`, so that you can't access transitive dependencies from code without declaring them as actual dependencies.
- Installs super fast, and uses disk space in a very efficient way: `node_modules` folders are essentially full of symlinks that eventually resolve to a single shared repository on your local machine.

By the way, "npm" is both the name of a _package manager_, and of a _repository_. PNPM replaces the package manager, but still uses the npm package repository.


## Javascript libraries

I tend to use very few Javascript libraries, since I want my code to work essentially forever. The biggest bets I've taken here are on Svelte and Vite, but even if Svelte development stops tomorrow it should be not too much trouble to switch to something else and just compile old components with the current version of the Svelte compiler. I use TypeScript extensively (obviously that's not going away any time soon), and the only other libraries that are used really are some parts of D3, and Regl for WebGL stuff.


## Svelte

Svelte is a framework for writing components. Some of the things I like about Svelte:

- It compiles to very fast Javascript.
- It has a mini-language for declaring "dependency graphs" in components, so that an update to one part dominos on to all the affected parts.
- It has HTML+CSS+JS (or typescript) all in the same file.
- It has many escape hatches for when you need to get around how things are done.

The dependency graph feature (the [svelte docs](https://svelte.dev/docs#2_Assignments_are_reactive) call this "reactive" assignments or statements) must be used with great care. The Svelte compiler will not look inside closures, so for example the following code will not always update `greeting` when the value of `name` changes:

```javascript
let name = 'blah'
function makeGreeting() {
    return `Hello ${name}`
}
$: greeting = makeGreeting() // Does the wrong thing
```

The compiler _will_ look at all explicit arguments on the right of an assignent though, so this code does the right thing:

```javascript
let name = 'blah'
function makeGreeting(name) {
    return `Hello ${name}`
}
$: greeting = makeGreeting(name) // Does the right thing
```

As long as we're careful to write code with all explicit dependencies however, Svelte works like a charm.


## Rendering mathematics in the browser

Mathematics is rendered in two ways: when it appears in markdown files, Pandoc will replace (for example) `$x = y$` with `<span class="math inline">x = y</span>`. We can then run a short script in the browser which loops over all relevant elements and renders them using [KaTeX](https://katex.org/). The other way it appears is inside Svelte components, using the `<Latex>` (`src/lib/components/Latex.svelte`) component, also calling KaTeX.

One option I experimented with was using KaTeX to render all of the mathematics from markdown on the server-side. Unfortunately this produces a bunch of div soup that inflates the size of the file massively: 44K/11K compressed vs 540K/32K compressed. Given that the whole size of the compressed KaTeX javascript library is only 70K, this seems like a silly trade-off to make, so I stuck with client-side mathematics rendering all the way.


## SvelteKit (no longer using)

I started building the site using [SvelteKit](https://kit.svelte.dev/), which was amazing but a little too magic and often broke (it is still very much in beta as of July 2021). It supports server-side rendering (which is amazing), but doesn't have very easy tools to control when it does and doesn't happen -- there are many components that I _didn't_ want server-side rendered because they create giant complex SVGs, and it is way faster to just generate them from scratch in Javascript.

I was using another cool project called [mdsvex](https://mdsvex.pngwn.io/) which allowed intermingling of markdown regular syntax in `.svelte` files, this worked fairly well, but didn't support all of the markdown features that I wanted. The markdown libraries that mdsvex is built on are in that classic `npm` style of a single program being broken up into a zillion tiny pieces, and it's up to the developer to try to track down micro-libraries for every feature of markdown they want - ugh. Much better to switch to battle-tested all-batteries-included Pandoc.

I still loved the development style I got in SvelteKit, which is why I'm still using Vite as a build tool. Perhaps I will come back to SvelteKit in the future, when it's a bit more stable and I can re-think the strategy for including pandoc-style markdown into it.


# Other notes-to-self


## WebGL

I tried using WebGL for the affine Weyl visualisation, which was successful in that it displayed things (and displayed them fast), but was a failed experiment in that it slowed me down majorly from being able to add or modify things in the visualisation.

- Data goes in in whatever coordinates you like (I am usually using weight coordinates).
- The vertex shader outputs a point [x:y:z:w] in P^4, which will be transformed to [x/w, y/w, z/w] automatically when going to clip space.
- "Clip space" or "normalised device coordinates" is a [-1, 1]^3 cube which is drawn to the screen. In WebGL, the (x, y) coordinates in clip space
    map to the screen via the viewport, eg a viewport of ((0, 0), (width, height)) maps (-1, -1) the bottom left of the canvas and (-1, 1) to the
    top left of the canvas. The z-coordinate in clip space is used for depth.

- Blending: https://limnu.com/webgl-blending-youre-probably-wrong/
- Line rendering: https://mattdesl.svbtle.com/drawing-lines-is-hard
- Instanced line rendering: https://wwwtyro.net/2019/11/18/instanced-lines.html
