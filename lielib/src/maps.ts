// Beware: there are some light eval() shenanigans going on in this file (they can be removed easily if they cause
// a problem). Skip to the definition of AbstractBaseHashTableFactory() to read more.

import { hash } from './hash'

/** The maps namespace exports map interfaces, utility functions, and a flexible hashtable implementation. */
export namespace maps {

/** Base map interface, agnostic about how in particular its keys and values are stored. */
export interface IMap<K, V> {
    size(): number
    contains(key: K): boolean
    get(key: K): V
    getWithDefault(key: K, defaultValue: V): V
    ask(key: K): V
    set(key: K, value: V): void
    forEach(fn: (key: K, value: V) => void): void
}

/** Map storing keys and values in two parallel arrays. */
export interface IFlatMap<K, V> extends IMap<K, V> {
    keys: K[]
    values: V[]
}


/** Map storing a single array of key-value pairs, called entries. */
export interface IEntryMap<K, V> extends IMap<K, V> {
    entries: IEntry<K, V>[]
}
type IEntry<K, V> = {key: K, value: V}

export function reduce<K, V, T>(map: IMap<K, V>, fn: (acc: T, key: K, value: V) => T, init: T): T {
    let acc = init
    map.forEach((key, value) => {acc = fn(acc, key, value)})
    return acc
}

export function some<K, V>(map: IMap<K, V>, pred: (key: K, value: V) => boolean): boolean {
    let result = false
    map.forEach((key, value) => {result = result || pred(key, value)})
    return result
}

export function every<K, V>(map: IMap<K, V>, pred: (key: K, value: V) => boolean): boolean {
    let result = true
    map.forEach((key, value) => {result = result && pred(key, value)})
    return result
}

export function mapValues<K, V1, V2, T extends IMap<K, V2>>(Class: new () => T, map: IMap<K, V1>, fn: (key: K, value: V1) => V2 | null): T {
    let result = new Class()
    map.forEach((key, value) => {
        let newValue = fn(key, value)
        if (newValue != null)
            result.set(key, newValue)
    })
    return result
}

/** Return a copy of the keys of map. */
export function keys<K, V>(map: IMap<K, V>): K[] {
    let result: K[] = []
    map.forEach((key, value) => result.push(key))
    return result
}

/** Return a copy of the values of the map. */
export function values<K, V>(map: IMap<K, V>): V[] {
    let result: V[] = []
    map.forEach((key, value) => result.push(value))
    return result
}

export function fromKeysValFn<K, V, T extends IMap<K, V>>(Class: new () => T, keys: K[], fn: (key: K) => V): T {
    let result = new Class()
    for (let i = 0; i < keys.length; i++)
        result.set(keys[i], fn(keys[i]))

    return result
}

/** Set all pairs in order, then return the map. */
export function assignPairs<K, V>(map: IMap<K, V>, pairs: [K, V][]): IMap<K, V> {
    for (let [key, val] of pairs)
        map.set(key, val)

    return map
}

export function singleton<K, V>(map: IMap<K, V>, key: K, value: V): IMap<K, V> {
    map.set(key, value)
    return map
}

// Tunable parameters
const STARTING_SLOTS = 16       // Must be a power of 2
const GROWTH_RATE = 4           // Must be a power of 2
const MAX_LOAD_FACTOR = 0.8     // Between 0.5 and 0.9 is sensible


// The hash map is made of two parts: a table part which stores hashes and indices into a second array,
// and a second array which stores key-value pairs. Both arrays are needed for a lookup, since once we
// find a matching hash in the first array we need to double-check that the key matches.
//
// The table is made of some number of "slots" which all start empty. A slot is made up of two adjacent
// entries, the first entry storing the hash, and the second storing the index the slot refers to. The
// following diagram shows a hashmap where the table has four slots, and two keys are stored, which gives
// a rough picture of how things work. (Of course the real story is more complicated by collisions).
//
//   table         keys
// -----------     ---------
// 0: 0xf0,  1     0: (key hashing to 0xc4)
// 2: 0x00, -1     1: (key hashing to 0xf0)
// 4: 0xc4,  0
// 6: 0x00, -1
//
// In the example, -1 is used to indicate an empty slot. The program logic only relies on an empty slot
// having a negative number in the index place.
//
// Some rough performance benchmarking in Firefox and Chrome suggests that it is good to make the slot
// table a typed array rather than a regular array. In the past I've found that creating many small
// typed arrays performs poorly though, so let's keep an eye on this.

/** Return an empty table with a given number of slots. */
function emptyTable(nslots: number): Int32Array {
    let table = new Int32Array(nslots * 2)
    for (let i = 0; i < 2 * nslots; i += 2)
        table[i+1] = -1

    return table
}

/** Given a number of slots, return the number of keys after which the table should be grown. */
function resizeThreshold(nslots: number): number {
    return Math.floor(MAX_LOAD_FACTOR * nslots)
}

/** The base hash table is agnostic of how exactly its keys and values are stored, aside from the
 * fact that they are indexed starting from zero in insertion order.
 */
export abstract class AbstractBaseHashTable<K, V> {
    // A predicate for equality of keys, and compatible hash function.
    protected abstract equal(k1: K, k2: K): boolean
    protected abstract hash(k: K): number

    // For easy testing, it's good to have keys be comparable so that toPairs() comes out in a
    // predicatable order.
    protected abstract cmp(k1: K, k2: K): number

    // The interface to the backing key-value store. The function appendPair must deal with taking
    // defensive copies of keys if need be.
    protected abstract keyAtIndex(i: number): K
    protected abstract valueAtIndex(i: number): V
    protected abstract setValueAtIndex(i: number, value: V): void
    protected abstract appendPair(k: K, v: V): void
    public abstract forEach(fn: (key: K, value: V) => void): void

    // Override this function if values have a sensible default.
    protected defaultValue(): V { throw new Error("No default value set") }

    protected count: number           // Number of key-value pairs stored.
    protected table: Int32Array       // table.length = 2 * nslots
    protected nslots: number          // slot(hash) = hash % nslots = hash & (nslots - 1)
    protected mask: number            // mask = nslots - 1
    protected resizeThreshold: number // Once there are this many keys in the map, grow the table.

    constructor() {
        this.count = 0
        this.nslots = STARTING_SLOTS
        this.mask = STARTING_SLOTS - 1
        this.table = emptyTable(STARTING_SLOTS)
        this.resizeThreshold = resizeThreshold(STARTING_SLOTS)
    }

    /** A very unsafe method which resets the internals of this hash table to copies of the
     * internals from another. Callers of this method should copy the keys and values somehow
     * as well. */
    protected copyInternalsFrom<K1, V1, T extends AbstractBaseHashTable<K1, V1>>(other: T) {
        this.count = other.count
        this.nslots = other.nslots
        this.mask = other.mask
        this.table = other.table.slice()
        this.resizeThreshold = other.resizeThreshold
    }

    protected slotIsEmpty(slot: number) { return this.table[(slot << 1) + 1] < 0 }
    protected slotIsOccupied(slot: number) { return this.table[(slot << 1) + 1] >= 0 }
    protected slotForHash(hash: number) { return hash & this.mask }

    // If hash were placed into slot, how far away is this from the ideal place for the hash?
    protected hashProbeDistance(hash: number, slot: number): number {
        return (slot + this.nslots - this.slotForHash(hash)) & this.mask
    }

    /** Return the index for (hash, key), or -1 if the key is not in the table. */
    protected getIndex(hash: number, key: K) {
        let slot = this.slotForHash(hash)
        let dist = 0
        for (; dist < this.nslots; slot = (slot + 1) & this.mask, dist += 1) {
            if (this.slotIsEmpty(slot))
                return -1

            let slotHash = this.table[(slot << 1) + 0]
            let slotIndex = this.table[(slot << 1) + 1]
            if (dist > this.hashProbeDistance(slotHash, slot))
                return -1

            if (hash == slotHash && this.equal(this.keyAtIndex(slotIndex), key))
                return slotIndex
        }

        throw new Error("Wrapped around table while searching.")
    }

    /** Given a (hash, key), attempts to place (hash, key) into the table.
     *  1. If (hash, key) is already in the table, its existing index is returned.
     *  2. If (hash, key) is not in the table, it is placed using newIndex as an index, and newIndex is returned.
     */
    protected getInsertionIndex(hash: number, key: K, newIndex: number): number {
        let slot = this.slotForHash(hash)
        let index = newIndex
        let dist = 0
        for (; dist < this.nslots; slot = (slot + 1) & this.mask, dist += 1) {
            // If we encounter an empty slot, the key is not in the table and this
            // is our insertion location.
            if (this.slotIsEmpty(slot)) {
                this.table[(slot << 1) + 0] = hash
                this.table[(slot << 1) + 1] = index
                return newIndex
            }

            // If we find the same (hash, key) pair, return the index for this slot.
            let slotHash = this.table[(slot << 1) + 0]
            let slotIndex = this.table[(slot << 1) + 1]
            if (slotHash == hash && this.equal(this.keyAtIndex(slotIndex), key))
                return slotIndex

            // If the current slot has a smaller probe distance than us, we must place the
            // current (hash, index) pair in, pop the old one out, and continue with it.
            if (this.hashProbeDistance(slotHash, slot) < dist) {
                let tmpHash = this.table[(slot << 1) + 0]
                this.table[(slot << 1) + 0] = hash
                hash = tmpHash

                let tmpIndex = this.table[(slot << 1) + 1]
                this.table[(slot << 1) + 1] = index
                index = tmpIndex
            }
        }

        throw new Error("Wrapped around table while searching.")
    }

    protected maybeGrow() { if (this.count >= this.resizeThreshold) this.grow() }

    protected grow(): void {
        let oldTable = this.table
        this.table = emptyTable(this.nslots * GROWTH_RATE)
        this.nslots *= GROWTH_RATE
        this.mask = this.nslots - 1
        this.resizeThreshold = resizeThreshold(this.nslots)

        for (let i = 0; i < oldTable.length; i += 2) {
            let oldHash = oldTable[i + 0]
            let oldIndex = oldTable[i + 1]
            if (oldIndex < 0)
                continue

            let index = this.getInsertionIndex(oldHash, this.keyAtIndex(oldIndex), oldIndex)
            if (index != oldIndex)
                throw new Error("Error while resizing: found an existing index that should not have been there.")
        }
    }

    /** The number of key-value pairs stored in the map. */
    size() { return this.count }

    /** Test if a key is in the map. */
    contains(key: K) { return this.getIndex(this.hash(key), key) >= 0 }

    /** Return the value associated to a key, or throw an error if the key is not in the map. */
    get(key: K) {
        let index = this.getIndex(this.hash(key), key)
        if (index < 0)
            throw new Error("Key not in map")

        return this.valueAtIndex(index)
    }

    /** Return the value associated to a key, or a default value if the key is not in the map. */
    getWithDefault(key: K, defaultValue: V) {
        let index = this.getIndex(this.hash(key), key)
        return (index < 0) ? defaultValue : this.valueAtIndex(index)
    }

    /** Return the value associated to a key, or the default value if the key is not in the map. */
    ask(key: K) {
        let index = this.getIndex(this.hash(key), key)
        return (index < 0) ? this.defaultValue() : this.valueAtIndex(index)
    }

    /** Get the value associated to a key, first creating a key-value pair in the map with the
     * default value if the key does not exist. */
    getCreatingDefault(key: K) {
        this.maybeGrow()
        let index = this.getInsertionIndex(this.hash(key), key, this.count)
        if (index == this.count) {
            this.appendPair(key, this.defaultValue())
            this.count++
        }

        return this.valueAtIndex(index)
    }

    /** Set a (key, value) pair in the map, overwriting any existing value. */
    set(key: K, value: V) {
        this.maybeGrow()
        let index = this.getInsertionIndex(this.hash(key), key, this.count)
        if (index == this.count) {
            this.appendPair(key, value)
            this.count++
        } else
            this.setValueAtIndex(index, value)
    }

    /** Return the key-value pairs of the map in sorted key order. */
    toPairs(): [K, V][] {
        let pairs: [K, V][] = []
        this.forEach((key, value) => pairs.push([key, value]))
        return pairs.sort(([akey, aval], [bkey, bval]) => this.cmp(akey, bkey))
    }
}

// We have re-used code by choosing to override methods on subclasses. Unfortunately, since we are going
// to override these methods in significantly different ways, the JIT is going to notice and change these
// overrides to be virtual, degrading performance significantly (by about half!). One way to trick it is to
// literally copy-paste the class definition above, and then use one copy to specialise one way, and one the
// other. Instead of this, we take a real "yikes" approach and turn the class definition into a string and
// eval it. If this causes a problem down the track, it is safe to just return AbstractBaseHashTable instead,
// and likewise for the other factory functions in this file.
export function AbstractBaseHashTableFactory(): typeof AbstractBaseHashTable {
    return eval("(" + AbstractBaseHashTable.toString() + ")")
}


/** The entry hash table stores key-value pairs as actual key-value pairs in a single array. */
export const AbstractEntryHashTable = AbstractEntryHashTableFactory()
export function AbstractEntryHashTableFactory() {
    const Base = AbstractBaseHashTableFactory()

    abstract class AbstractEntryHashTable<K, V> extends Base<K, V> {
        entries: IEntry<K, V>[] = []

        protected override keyAtIndex(i: number) { return this.entries[i].key }
        protected override valueAtIndex(i: number) { return this.entries[i].value }
        protected override setValueAtIndex(i: number, value: V) { this.entries[i].value = value }
        protected override appendPair(key: K, value: V) { this.entries.push({key, value})}
        override forEach(fn: (key: K, value: V) => void) {
            for (let i = 0; i < this.entries.length; i++)
                fn(this.entries[i].key, this.entries[i].value)
        }

        /** Return the entry associated to a key, or throw an error if the key is not in the map. */
        getEntry(key: K): IEntry<K, V> {
            let index = this.getIndex(this.hash(key), key)
            if (index < 0)
                throw new Error("Key not in map")

            return this.entries[index]
        }

        /** Return the entry associated to a key, creating it with the default value if it is not in the map. */
        askEntry(key: K): IEntry<K, V> {
            this.maybeGrow()
            let index = this.getInsertionIndex(this.hash(key), key, this.count)
            if (index == this.count) {
                this.appendPair(key, this.defaultValue())
                this.count++
            }

            return this.entries[index]
        }
    }

    return eval("(" + AbstractEntryHashTable.toString() + ")") as typeof AbstractEntryHashTable
}

/** The flat hash table stores its key-value pairs as parallel arrays.
 * This can reduce allocations if the keys or values (or both) are a basic type like integers or floats. */
export const AbstractFlatHashTable = AbstractFlatHashTableFactory()
export function AbstractFlatHashTableFactory() {
    abstract class AbstractFlatHashTable<K, V> extends AbstractBaseHashTableFactory()<K, V> {
        keys: K[] = []
        values: V[] = []

        protected override keyAtIndex(i: number) { return this.keys[i] }
        protected override valueAtIndex(i: number) { return this.values[i] }
        protected override setValueAtIndex(i: number, value: V) { this.values[i] = value }
        protected override appendPair(k: K, v: V) { this.keys.push(k); this.values.push(v); }
        override forEach(fn: (key: K, value: V) => void) {
            for (let i = 0; i < this.keys.length; i++)
                fn(this.keys[i], this.values[i])
        }
    }

    return eval("(" + AbstractFlatHashTable.toString() + ")") as typeof AbstractFlatHashTable
}


export class EntryIntMap<V> extends AbstractEntryHashTableFactory()<number, V> {
    protected override equal(k1: number, k2: number) { return k1 == k2 }
    protected override hash(k: number) { return hash.int(k) }
    protected override cmp(a: number, b: number) { return a - b }
}

export class FlatIntMap<V> extends AbstractFlatHashTableFactory()<number, V> {
    protected override equal(k1: number, k2: number) { return k1 == k2 }
    protected override hash(k: number) { return hash.int(k) }
    protected override cmp(a: number, b: number) { return a - b }

    clone() {
        let clone = new FlatIntMap<V>()

        clone.count = this.count
        clone.nslots = this.nslots
        clone.mask = this.mask
        clone.table = this.table.slice()
        clone.resizeThreshold = this.resizeThreshold
        clone.keys = this.keys.slice()
        clone.values = this.values.slice()

        return clone
    }
}

type Vec = number[]
export class EntryVecMap<V> extends AbstractEntryHashTableFactory()<Vec, V> {
    protected override appendPair(key: Vec, value: V) { this.entries.push({key: key.slice(), value}) }
    protected override hash(key: Vec) { return hash.ivec(key) }
    protected override equal(key1: Vec, key2: Vec) {
        if (key1.length != key2.length)
            return false

        for (let i = 0; i < key1.length; i++)
            if (key1[i] != key2[i])
                return false

        return true
    }
    override cmp(key1: Vec, key2: Vec) {
        if (key1.length != key2.length)
            return key1.length - key2.length

        for (let i = 0; i < key1.length; i++)
            if (key1[i] != key2[i])
                return key1[i] - key2[i]

        return 0
    }
}

}
