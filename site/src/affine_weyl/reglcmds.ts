// Vestiges from a failed experiment of using WebGL (WebGL worked great, but other things
// got too hard, like being able to quickly make additions or modifications).

export {}

// import type REGL from 'regl'

// /** lineSegments draws a batch of line segments, all with the same colour and screen-width.
//  * Arguments:
//  *   - points: A buffer holding 2n pairs of (x, y) points. A line segment will be drawn between each pair.
//  *   - nsegments: The number of segments in points (n).
//  *   - thickness: % of width to draw lines. Eg {thickness: 4 / width} corresponds to 4 pixels.
//  *   - aspect: width / height
//  *   - color: The colour to draw the line segments, [R, G, B, A].
//  *   - viewport: {x, y, width, height}
//  */
// export function lineSegments(regl: REGL.Regl) {
//     // Roughly following https://wwwtyro.net/2019/11/18/instanced-lines.html
//     const segmentInstanceGeometry = [
//         // Two triangles forming a quad [0, 1] x [-0.5, 0.5]
//         [0, -0.5],
//         [1, -0.5],
//         [1, 0.5],
//         [0, -0.5],
//         [1, 0.5],
//         [0, 0.5]
//     ];

//     return regl({
//         vert: `
//         precision highp float;

//         uniform float thickness; // In terms of screen width, i.e. 0.01 = (1% width) thickness
//         uniform float aspect;    // Aspect ratio (width / height).
//         attribute vec2 position, pointA, pointB;
//         uniform mat4 projection;

//         void main() {
//             // Get points A and B in clip space.
//             vec4 clipA = projection * vec4(pointA, 0, 1);
//             clipA /= clipA.w;
//             vec4 clipB = projection * vec4(pointB, 0, 1);
//             clipB /= clipB.w;

//             // Vector pointing from A to B in clip space.
//             vec3 clipAB = clipB.xyz - clipA.xyz;

//             // Get a "perpendicular" to this vector. By perpendicular we mean so that it is perpendicular
//             // when drawn on the screen, i.e. we are just rotating in (x, y) space now, and perp is in the z=0 plane.
//             vec3 perp = normalize(vec3(-clipAB.y, clipAB.x, 0));
//             perp.y *= aspect;

//             // Transform the x-axis of the original geometry along the vector AB, and the y-axis perpendicular to it.
//             // Place back into normalised device coordinates (w = 1).
//             vec3 pos = clipA.xyz + position.x * clipAB + position.y * perp * thickness;
//             gl_Position = vec4(pos, 1);
//         }
//         `,

//         frag: `
//         precision highp float;
//         uniform vec4 color;
//         void main() {
//             gl_FragColor = color;
//         }
//         `,

//         primitive: 'triangles',
//         attributes: {
//             position: {
//                 buffer: regl.buffer(segmentInstanceGeometry),
//                 divisor: 0 // Indicates this attribute is identical for every instance.
//             },
//             pointA: {
//                 buffer: regl.prop('points' as never),
//                 divisor: 1,
//                 offset: Float32Array.BYTES_PER_ELEMENT * 0,
//                 stride: Float32Array.BYTES_PER_ELEMENT * 4,
//             },
//             pointB: {
//                 buffer: regl.prop('points' as never),
//                 divisor: 1,
//                 offset: Float32Array.BYTES_PER_ELEMENT * 2,
//                 stride: Float32Array.BYTES_PER_ELEMENT * 4,
//             }
//         },

//         uniforms: {
//             thickness: regl.prop('thickness' as never),
//             aspect: regl.prop('aspect' as never),
//             color: regl.prop('color' as never),
//             projection: regl.prop('projection' as never)
//         },
//         count: segmentInstanceGeometry.length,
//         instances: regl.prop('nsegments' as never),
//         viewport: regl.prop('viewport' as never)
//     })
// }

// export function drawTriangles(regl: REGL.Regl) {
//     return regl({
//         vert: `
//         precision highp float;
//         uniform mat4 projection;
//         attribute vec2 vertex;
//         attribute vec4 color;
//         varying vec4 fragColor;

//         void main() {
//             gl_Position = projection * vec4(vertex, 0, 1);
//             fragColor = color;
//         }
//         `,

//         frag: `
//         precision highp float;
//         varying vec4 fragColor;

//         void main() {
//             gl_FragColor = fragColor;
//         }
//         `,

//         attributes: {
//             vertex: {
//                 buffer: regl.prop('vertices' as never),
//                 offset: 0 * Float32Array.BYTES_PER_ELEMENT,
//                 stride: 2 * Float32Array.BYTES_PER_ELEMENT,
//             },
//             color: {
//                 buffer: regl.prop('color' as never),
//                 offset: 0 * Float32Array.BYTES_PER_ELEMENT,
//                 stride: 4 * Float32Array.BYTES_PER_ELEMENT,
//             },
//         },
//         uniforms: {
//             projection: regl.prop('projection' as never),
//         },
//         viewport: regl.prop('viewport' as never),
//         primitive: 'triangles',
//         offset: regl.prop('offset' as never),
//         count: regl.prop('count' as never),
//         depth: {enable: false},
//         blend: {
//             enable: true,
//             func: {
//                 src: 'one',
//                 dst: 'one minus src alpha',
//                 // srcRGB: 'src alpha',
//                 // srcAlpha: 'src alpha',
//                 // dstRGB: 'one',
//                 // dstAlpha: 'one minus src alpha',
//             }
//         },
//     })
// }
