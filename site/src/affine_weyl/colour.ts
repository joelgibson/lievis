export namespace colour {

/** Clamp n so that lower <= n <= upper is true. */
function clamp(lower: number, upper: number, n: number): number {
    return Math.max(lower, Math.min(upper, n))
}


/** Convert HSL to RGB (alpha is just passed through). Expects values in the range [0, 1]. */
export function hsla2rgba([h, s, l, a]: number[]): number[] {
    // Reduce HSLA into the correct ranges by wrapping H and clamping the others.
    h = ((h % 1) + 1) % 1
    s = clamp(0, 1, s)
    l = clamp(0, 1, l)
    a = clamp(0, 1, a)

    // Following https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
    function f(n: number): number {
        let k = (n + h / (30 / 360)) % 12
        let a = s * Math.min(l, 1-l)
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    }

    return [f(0), f(8), f(4), a]
}

/** Convert RGBA to an 8-digit hex string #rrggbbaa. Expects values in the range [0, 1]. */
export function rgba2hex([r, g, b, a]: number[]): string {
    // Clamp n between 0 and 1, scale to an integer between 0 and 255, and convert to 2 hex digits.
    function f(n: number) {
        let hex = '0123456789abcdef'
        let i = Math.round(clamp(0, 1, n) * 255)
        return hex[i >> 4] + hex[i & 0xf]
    }

    return '#' + f(r) + f(g) + f(b) + f(a)
}

/** Convert a 3, 4, 6, or 8-digit hex string to RGBA. */
export function hex2rgba(s: string): number[] {
    if (s.length == 4) // #rgb
        s += 'f' // Fallthrough to #rgba

    if (s.length == 5) // #rgba
        s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3] + s[4] + s[4] // Fallthrough to #rrggbbaa

    if (s.length == 7) // #rrggbb
        s += 'ff' // Fallthrough to #rrggbbaa

    return [
        parseInt(s.slice(1, 3), 16) / 0xff,
        parseInt(s.slice(3, 5), 16) / 0xff,
        parseInt(s.slice(5, 7), 16) / 0xff,
        parseInt(s.slice(7, 9), 16) / 0xff,
    ]
}

/** l in [0, 100], a and b in [-160, 160], alpha in [0, 1].
 * Returns RGBA in the range [0, 1]^4. Code copied from d3-color. */
export function lab2rgb([l, a, b, alpha]: number[]) {
    const
        Xn = 0.96422,
        Yn = 1,
        Zn = 0.82521,
        t0 = 4 / 29,
        t1 = 6 / 29,
        t2 = 3 * t1 * t1

    function lrgb2rgb(x: number) {
        return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    }

    function lab2xyz(t: number) {
        return t > t1 ? t * t * t : t2 * (t - t0);
    }

    let y = (l + 16) / 116
    let x = y + a / 500
    let z = y - b / 200
    x = Xn * lab2xyz(x)
    y = Yn * lab2xyz(y)
    z = Zn * lab2xyz(z)

    return [
        lrgb2rgb( 3.1338561 * x - 1.6168667 * y - 0.4906146 * z) / 255,
        lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z) / 255,
        lrgb2rgb( 0.0719453 * x - 0.2289914 * y + 1.4052427 * z) / 255,
        alpha,
    ]
}

/** Convert from CIEhcla to RGBa. h in [0, 1] (represents an angle),
 * c in [0, 160], l in [0, 100], opacity in [0, 1]. */
export function ciehcl2rgba([h, c, l, a]: number[]) {
    return lab2rgb([
        l,
        c * Math.cos(h * 2 * Math.PI),
        c * Math.sin(h * 2 * Math.PI),
        a
    ])
}


}
