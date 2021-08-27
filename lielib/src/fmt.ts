import {Mat, mat} from './linear'

export namespace fmt {
    // Format a number to LaTeX markup, recognising fractions with small denominators.
    export function frac(n: number): string {
        const EPS = 0.00001
        const MAXDENOM = 10

        // Find the denominator
        let denom = -1
        for (let i = 1; i < MAXDENOM; i++) {
            if (Math.abs(Math.round(n * i) - n * i) < EPS) {
                denom = i
                break
            }
        }

        if (denom == 1) {
            return '' + Math.round(n)
        }
        if (denom == -1) {
            return '' + n
        }
        return ((n < 0) ? '-' : '') + `\\frac{${Math.abs(Math.round(n * denom))}}{${denom}}`
    }

    // ([1, 5, -4], 'ϖ') => 1 ϖ₁ + 5 ϖ₂ - 4ϖ₃ (emits HTML <sub>scripts)
    export function linComb(wt: number[], symbol: string): string {
        const result = []
        for (let i = 0; i < wt.length; i++) {
            let sign = (wt[i] > 0) ? '+' : ((wt[i] < 0) ? '-' : '0')
            if ((sign == '+' || sign == '0') && i == 0)
                sign = ''
            if (sign == '0')
                sign = '+'
            if (i != 0)
                sign = ' ' + sign + ' '
            
            result.push(sign, Math.abs(wt[i]), ' ', symbol, '<sub>', i + 1, '</sub>')
        }
        return result.join('')
    }

    export function matrix(M: Mat): string {
        let strings = [`\\begin{pmatrix}\n`]
        for (let row of mat.toRows(M))
            strings.push(row.join(' & ') + ` \\\\\n`)
        strings.push(`\\end{pmatrix}`)
        return strings.join('')
    }
}

