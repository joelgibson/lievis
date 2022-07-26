
type SVGSnapshotOptions = {
    /** A selector of elements to hide before taking the snapshot, and unhide afterwards. */
    hideSelector: string,
}

/** Create a snapshot of an SVG element, returning a Blob URL thing. */
export function createSVGSnapshot(svgElem: SVGElement | null, options: Partial<SVGSnapshotOptions>): string | null {
    if (svgElem == null)
        return null

    if (options.hideSelector)
        document.querySelectorAll(options.hideSelector).forEach((x: HTMLElement) => x.style.display = 'none')

    let svgXml = new XMLSerializer().serializeToString(svgElem)
    let blob = new Blob([svgXml], {type: 'image/svg+xml'})
    let url = URL.createObjectURL(blob)

    if (options.hideSelector)
        document.querySelectorAll(options.hideSelector).forEach((x: HTMLElement) => x.style.display = 'inherit')

    return url
}
