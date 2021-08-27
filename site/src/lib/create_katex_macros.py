import json
import os
import re

def letter_macros():
    r"""Shorthands for bold/calligraphic/fraktur letters, for example
        \bbR => \mathbb{R}  (lower and upper case)
        \cR => \mathcal{R}  (only upper case)
        \scR => \mathscr{R} (only upper case)
        \bR => \mathbf{R}   (upper case)
        \fR => \mathfrak{R} (lower and upper case)
    """

    # Create some macros. We want for example \bbR to expand to \mathbb{R}. We need to exclude
    # some here, for example it would be bad to override the \cr macro. But we can get by just
    # restricting whether we do lower and upper case or not.
    lower, upper = 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    font_shortnames = [
        ('mathbb', 'bb', lower + upper),
        ('mathcal', 'c', upper),
        ('mathscr', 'sc', upper),
        ('mathbf', 'b', lower + upper),
        ('mathfrak', 'f', lower + upper),
        ('mathsf', 'sf', lower + upper),
    ]
    candidates = [
        (f'\\{short}{letter}', f'{{\\{long}{{{letter}}}}}')
        for long, short, letters in font_shortnames
            for letter in letters
    ]
    disallowed = {r'\bf', r'\fi', r'\sfb'}
    return [(key, value) for key, value in candidates if key not in disallowed]


def lie_macros():
    """Shorthands for groups we use in Lie theory, with the Lie groups being in uppercase serif, and
    the Lie algebras being in lowercase mathfrak. For example, \GL will create an upper serif GL, and
    \fgl the corresponding Lie algebra."""

    group_names = ['GL', 'PGL', 'SL', 'PSL', 'SO', 'SU']

    lie_group_macros = [
        (f"\\{group}", f"\\operatorname{{{group}}}")
        for group in group_names]

    root_datum_macros = [
        (f"\\sf{group}", f"\\operatorname{{\\mathsf{{{group}}}}}")
        for group in group_names]

    lie_algebra_macros = [
        (f"\\f{group.lower()}", f"\\operatorname{{\mathfrak{{{group.lower()}}}}}")
        for group in group_names]

    return lie_group_macros + root_datum_macros + lie_algebra_macros


def simple_macros():
    """Simple macros which are simply \name replaced by \operatorname{name}"""

    operator_names = [
        # Set theory
        'im', 'pt',

        # Complex numbers etc
        're',

        # Category theory
        'id', 'Hom', 'End', 'Ob', 'Aut', 'Aff',

        # Maps between sets
        'Map',

        # Linear algebra
        # 'span' is spelt with a capital S, and is defined below in assorted_macros()
        'ev',
        'rank',
        'codim',
        # 'ker', is already provided.
        'corank',
        'tr',
        'diag',
        'Adj',
        'adj',
        'Mat',
        'span',

        # Multilinear algebra
        'Bil',
        'Quad',
        'SymBil',
        'Alt',
        'Sym',
        'Anti',
        'Sh',

        # Representation theory
        'wt',
        'Char', # Can't use lowercase 'char' since this interferes with something in katex.
        'res',
        'ind',
        'Irr',
        'Dist',
        'ch',
        'Part',

        # Lie theory
        'Lie',
        'Ad',
        'ad',
        'Gr',
        'St',

        # Algebraic geometry
        'Spec',
        'Cone',

        # Quivers
        'tail',
        'head',
        'Rep',

        # Stable subset
        'stable',

        # Standard deviation, covariance, and variance
        'Std',
        'Cov',
        'Var',
    ]

    return [(f"\\{name}", f"\\operatorname{{{name}}}") for name in operator_names]

def simple_serif_macros():
    """Simple macros which are simply \name replaced by \operatorname{\mathsf{name}}"""

    operator_names = [
        # Upward-closed, downward-closed, and support
        'up',
        'down',
        'Supp',

        # Rows and columns of a diagram
        'rows',
        'cols',
        'row',
    ]

    return [(f"\\{name}", f"\\operatorname{{\\mathsf{{{name}}}}}") for name in operator_names]


def assorted_macros():
    """More complicated macros, some of which take arguments."""

    assorted = {
        # Labelled arrows
        r'\xto': r'\xrightarrow{#1}',
        r'\xfrom': r'\xleftarrow{#1}',
        r'\xinjto': r'\xhookrightarrow{#1}',

        # This next arrow needs the following in the preamble:
        # \newcommand{\xtwoheadrightarrow}[2][]{\xrightarrow[#1]{#2}\mathrel{\mkern-14mu}\rightarrow}
        # TODO: Output this at the same time as the preamble.
        r'\xsurjto': r'\xtwoheadrightarrow{#1}',
        r'\partialto': r'\dashrightarrow',

        # Unlabelled arrows
        r'\injto': r'\hookrightarrow',
        r'\surjto': r'\twoheadrightarrow',
        r'\isoto': r'\xto{\sim}',

        # Serif font for categorical text
        r'\cat': r'\operatorname{\mathsf{#1}}',

        # Some common categorical maps and objects
        r'\bbone': r'\mathbb{1}',
        r'\sflip': r'\mathsf{flip}',

        # Internal hom: underlined
        r'\IHom': r'\underline{\operatorname{Hom}}',

        # Inner product, vector norm, scalar norm
        r'\innprod': r'\langle #1 \rangle',
        r'\norm': r'\lVert #1 \rVert',
        r'\abs': r'\lvert #1 \rvert',

        # Commutator bracket
        r'\comm': r'\left[ #1 \right]',

        # Sets
        r'\set': r'\left\{ #1 \right\}',

        # Category of modules, eg G-mod = G\dashmod
        r'\dashmod': r'\text{--}\cat{mod}',
        r'\dashalg': r'\text{--}\cat{alg}',
        r'\dashsmod': r'\text{--}\cat{smod}',

        # Conjugate, with a little space after to stop things like \conj{p} \conj{q} running together.
        r'\conj': r'\overline{#1}\,',

        # Kets and bras for quantum mech
        r'\ket': r'\left| #1 \right\rangle',
        r'\bra': r'\left \langle #1 \right|',

        # Span
        r'\Span': r'\operatorname{span}',

        # Clifford algeba
        r'\Cl': r'C \ell',

        # Shuffle operator
        r'\shuffle': r'⧢',

        # Quantum integer
        r'\quant': r'\left[ #1 \right]',

        # Quantum binomial coefficient
        r'\qbinom': r'\left[\begin{matrix} #1 \\ #2 \end{matrix}\right]',

        # Opposite algebra or category
        r'\opposite': r'\mathrm{op}',

        # ???
        r'\Isoo': r'{\operatorname{Iso}_0}',

        # Categorical quotient
        # Used to use \sslash but for some reason some fonts didn't like that macro name.
        r'\catquo': r'\mathbin{/\mkern-6mu/}',

        # Category of integrable modules
        r'\integrable': r'{\mathsf{int}}',

        # Parity-respecting points
        r'\partimes': r'\mathbin{\dot{\times}}',

        # Highest weight set of a crystal
        r'\hw': r'{\mathrm{h.w.}}',

        # Matrix of linear transformation relative to bases, with outgoing basis first.
        r'\linmat': r'\left[{^{\underline{#1}} #2 ^{\underline{#3}}}\right]',

        # An overset circle, for "finite-type"
        r'\fin': r'\overset{\circ}{#1}',
    }

    return list(assorted.items())


macros = letter_macros() + lie_macros() + simple_macros() + simple_serif_macros() + assorted_macros()

def javascript():
    """Return an ECMAScript module whose default export is the macros."""

    basename = os.path.basename(__file__)

    return f"""// AUTOGENERATED BY {basename}
// This will be automatically overwritten, do not make changes here.
// Make changes to {basename} instead.
export default {json.dumps(dict(macros), indent=2)}
// END AUTOGENERATED SECTION"""

def latex():
    """Return a multiline string containing latex commands to define each macro,
    suitable for the preamble of a latex document."""

    lines = []

    for key, value in macros:
        # Need to figure out how many arguments this macro takes. Since the value
        # will contain #1, #2, etc, we just count the number of those appearing.
        args = len(list(re.finditer(r'#\d', value)))

        lines.append(f"\\newcommand{{{key}}}" + (f'[{args}]' if args else '') + f"{{{value}}}")

    return '\n'.join(lines)


if __name__ == '__main__':
    import sys

    if sys.argv[1:] == ['latex']:
        print(latex())
    else:
        print(javascript())
