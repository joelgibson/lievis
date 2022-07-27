---
title: LieVis Help
toc: false
---

Most of LieVis should be self-explanatory, but there are some more advanced features that can be used.


## Linking to visualisations

As you interact with some visualisations, you might find the *URL fragment* (the part of the URL after the `#` sign) changing.
If you copy this URL and paste it into a new window, you will find that the visualisation loads up with the same settings as you were using just before (or at least it should - let me know if it doesn't!).
This allows you to bookmark a configuration, send it to a friend, embed it in a lecture, link it from a paper, and so on.


## Downloading graphics

The easiest way to make a picture of a visualisation is to screenshot it: for example pressing `Cmd+Shift+4` on a mac will bring up a crosshair allowing you to select a rectangle of the screen and save it to a file.
In order to get the best quality picture using this method, take the screenshot on as large a window as possible (the fullscreen mode of a visualisation is useful for this), and using a high-DPI screen such as a Retina display.

Some visualisations are equipped with a `Create SVG` button which creates an SVG (Scalable Vector Graphics) file, which will always look perfect no matter how much the image is scaled up or down.
After clicking the `Create SVG` button, a snapshot link will appear below it: opening this snapshot link in a new tab will give a preview of the SVG file.
To download the actual SVG file, right-click the snapshot link and select `Save link as...`.

To include an SVG into a LaTeX document, it needs to be converted to another format first (PDF is a good choice).
I have had the most luck by downloading the `librsvg` library, and using the `rsvg-convert` command:

    rsvg-convert foo.svg --output foo.pdf --format pdf

In theory Inkscape should also be able to convert from SVG to PDF, but it seems to misinterpret some of the SVG files that come out of LieVis.

To perform touch-ups to the SVG, you can use a vector graphics editing program like Inkscape or Adobe Illustrator.
