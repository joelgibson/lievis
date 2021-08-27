# Bitwise operators in Javascript

Two "functions" defined in the specification are [ToInt32](https://tc39.es/ecma262/#sec-toint32) and [ToUint32](https://tc39.es/ecma262/#sec-touint32). These functions can be thought of doing some normalisation, followed by interpreting a bit-pattern as either a 32-bit signed or unsigned integer. We can "simulate" each of them by using bitwise operations:

- `ToInt32(x)` is roughly the same as `x | 0`, given the semantics defined for [bitwise operations](https://tc39.es/ecma262/#sec-numberbitwiseop).
- `ToUInt32(x)` is roughly the same as `x >>> 0`, given the semantics of [unsigned right shift](https://tc39.es/ecma262/#sec-numeric-types-number-unsignedRightShift).

So, to convert a number to a 32-bit something, either `x | 0` or `x >>> 0` can be used. Bitwise operations automatically perform this conversion (most use the signed version), and when using a string of bitwise operations we don't need to force convert anything. When finally returning a value, the difference between signed and unsigned can be important.