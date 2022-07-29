
type SVGSnapshotOptions = {
    /** A selector of elements to hide before taking the snapshot, and unhide afterwards. */
    hideSelector: string,
}

/** Create a snapshot of an SVG element, returning a Blob URL thing. */
export function createSVGSnapshot(svgElem: SVGElement, options: Partial<SVGSnapshotOptions>): string {
    return URL.createObjectURL(createSVGSnapshotBlob(svgElem, options))
}

/** Create a snapshot of an SVG element, returning a Blob. */
export function createSVGSnapshotBlob(svgElem: SVGElement, options: Partial<SVGSnapshotOptions>): Blob {
    if (svgElem == null)
        return null

    if (options.hideSelector)
        document.querySelectorAll(options.hideSelector).forEach((x: HTMLElement) => x.style.display = 'none')

    let svgXml = new XMLSerializer().serializeToString(svgElem)
    let blob = new Blob([svgXml], {type: 'image/svg+xml'})

    if (options.hideSelector)
        document.querySelectorAll(options.hideSelector).forEach((x: HTMLElement) => x.style.display = 'inherit')

    return blob
}
