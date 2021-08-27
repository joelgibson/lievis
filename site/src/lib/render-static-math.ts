/** This script goes through the whole document looking for <span class="math inline">
 * or <span class="math display">, and converts them into <span class="math-inline"> and
 * <div class="math-display">, with their insides rendered using KaTeX.
 */

import katex from '$lib/katex-v0.13.11/katex.mjs'
import macros from '$lib/katex_macros.js'

let mathSourceElts = Array.from(document.querySelectorAll('span.math'))
let mathRenderedElts = mathSourceElts.map(elt => {
    let isDisplay = elt.classList.contains('display')
    let newElt = document.createElement(isDisplay ? 'div' : 'span')
    newElt.classList.add(isDisplay ? 'math-display' : 'math-inline')
    katex.render(elt.textContent, newElt, {
        throwOnError: false,
        display: isDisplay,
        macros,
    })
    return newElt
})

for (let i = 0; i < mathSourceElts.length; i++)
    mathSourceElts[i].replaceWith(mathRenderedElts[i])
