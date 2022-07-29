---
title: About Lievis
---

This collection of visualisations is a work-in-progress on making concepts from representation theory more visible and understandable.
It is my hope that this will be a valuable teaching and learning aid, as well as spark new ideas for other pictures/drawings/etc that could be done.
Being able to play with so much data interactively may even lead to novel new observations, or old observations which are hard to come by.

I think that _interactivity_ is one of the best ways of building intuition about a problem or a mathematical concept. For example, being able to tweak parameters in a graph and see how the graph changes _in real time_ is a fantastic way of building a mental model about how a class of graphs looks. However, this kind of interactivity has been lacking for other mathematical concepts such as representation theory – most of the software tools I know of have a very long feedback loop involving typing a question into a console, and even after that the user has to take a lot of steps to render that answer in any visual way.


## Get in contact

If you have found this site helpful and have any corrections or suggestions to make, please get in contact with me! My email address is my first name `@` this domain.


## Thanks to...

The vast majority of the Lievis code is written from scratch by Joel Gibson.
However, there are numerous books, papers, discussions, and open-source software projects that have allowed Lievis to happen.
On the mathematics side:

- The papers and essays of [Bill Casselman](https://personal.math.ubc.ca/~cass/) are fantastic reading for anyone wishing to implement root systems and Coxeter groups on a computer.
- The representation and construction of Coxeter groups in Lievis uses an algorithm due to Fokko du Cloux, published in [An abstract model for Bruhat intervals](https://doi.org/10.1006/eujc.1999.0343).
- Reading about the [LiE](http://wwwmathlabo.univ-poitiers.fr/~maavl/LiE/) software by van Leeuwen, Cohen, and Lisser has been extremely informative at guiding the structure, if not the algorithms themselves, of Lievis.
- Conversations with Joseph Baine, Geordie Williamson, and Oded Yacobi have been very useful to guide the interface design and mathematical direction of Lievis.


On the software side:

- [TypeScript](https://www.typescriptlang.org/), a typed version of Javascript, keeps errors down and greatly helps with structuring large projects.
- [Svelte](https://svelte.dev/), a framework/compiler for interactive web apps, does the heavy lifting for the user interfaces and some of the drawing code.
- [Vite](https://vitejs.dev/), a bundler for web projects, takes care of having a fast development environment, as well as compiling the site.
- [Pandoc](https://pandoc.org/) is used to turn markdown files into HTML.
- [KaTeX](https://katex.org/) is used to typeset the mathematics.
- [Canvas2SVG](https://gliffy.github.io/canvas2svg/) by Gliffy Inc. is used to render the canvas-based visualisations to SVG.
- The fonts used on the site are [Libertinus](https://github.com/alerque/libertinus) and [Fira Mono](https://github.com/mozilla/Fira).
