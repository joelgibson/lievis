<!-- SnapshotMenu - A menu for taking SVG snapshots of visualisations. -->

<script lang="ts">
    export let takeSnapshot: (() => {downloadName: string, blob: Blob}) | null

    let snapshots: {downloadName: string, url: string}[] = []
    let justCopied: {message: string, timeoutId: number} | null = null

    /** Ask the parent component for a blob, URLify it, and save. */
    function createSnapshot() {
        let {downloadName, blob} = takeSnapshot()
        let url = URL.createObjectURL(blob)
        snapshots = [...snapshots, {downloadName, url}]
    }

    /** Revoke the URLs (allows memory to be reclaimed) and clear the list. */
    function clearSnapshots() {
        for (let {url} of snapshots)
            URL.revokeObjectURL(url)

        snapshots = []
    }

    /** Set the justCopied text and set up a timer to clear it. */
    function setJustCopied(message: string) {
        if (justCopied != null)
            window.clearTimeout(justCopied.timeoutId)

        justCopied = {message, timeoutId: window.setTimeout(() => justCopied = null, 1500)}
    }

    /** Copy the current URL to the clipboard. */
    function copyURLToClipboard() {
        window.navigator.clipboard.writeText(document.location.href)
            .then(() => setJustCopied('Copied!'))
            .catch(() => setJustCopied('Error...'))
    }
</script>


<style>
    .SnapshotMenu {
        display: flex;
        flex-direction: column-reverse;
        /* max-width: 170px; */
        max-height: min(700px, 80vh);
        overflow-y: auto;
    }
    .SnapshotMenu > *:not(:first-child) { margin-bottom: 0.2rem; }
    .buttons button:not(:first-child) { margin-left: 0.2rem; }
    ul { max-width: 150px; }
    li { list-style-type: none; padding-bottom: 0.2rem; padding-top: 0.2rem }
    li:not(:first-child) { border-top: 1px solid #aaa; }

    .buttons { display: flex; flex-direction: row; justify-content: space-around; }

    .camerabutton::after {content: ' 📷'; }
    .camerabutton:hover::after {content: ' 📸'; }
</style>

<div class="SnapshotMenu">
    <div class="buttons">
        {#if window.navigator.clipboard}
            <button
                on:click={copyURLToClipboard}
                title="Copy a link to this particular configuration of this visualisation."
            >
                {#if justCopied}{justCopied.message}{:else}Copy 🔗{/if}
            </button>
        {/if}
        {#if takeSnapshot}
            <button
                on:click={createSnapshot}
                class="camerabutton"
                title="Take a snapshot of the visualisation. Click on the resulting image to download it, or open it in a new tab to view it."
            >Take</button>
        {/if}
        {#if snapshots.length > 0}
            <button
                on:click={clearSnapshots}
                title="Clear the list of snapshots."
            >Clear 📷</button>
        {/if}
    </div>
    <ul>
        {#each snapshots as {downloadName, url}}
            <li>
                <a
                    href={url}
                    download={downloadName}
                    title="Click to download, or open in a new tab to view."
                >
                    <img src={url} alt={downloadName}>
                </a>
            </li>
        {/each}
    </ul>
</div>
