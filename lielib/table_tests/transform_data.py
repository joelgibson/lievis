#!/usr/bin/env python3

# Read tables from http://www.math.rwth-aachen.de/~Frank.Luebeck/chev/WMSmall/index.html?LANG=en
# and spit out some JSON. All of the tables on that site have been downloaded to the local directory.

import json
import re
import sys

TYPE = re.compile(r'Groups of type (.+?),')
NUMLIST = re.compile(r'\d+(\s*,\s*\d+)*')
HWT = re.compile(r'Highest weight')
REXP = re.compile(r'''
    <strong>Highest[ ]weight:</strong>(?P<highestweight>.+?)<br[ ]/>\s
    <strong>Characteristic:</strong>(?P<characteristic>.+?)<br[ ]/>\s
    <strong>Dimension:</strong>(?P<dimension>.+?)</p>
    .+?
    </th></tr>\s
    (?P<tablerows>.+?)
    </table>
''', re.VERBOSE | re.MULTILINE | re.DOTALL)

ROW = re.compile(r'''<tr><td>(?P<level>.+?)</td><td>(?P<weight>.+?)</td><td>(?P<multiplicity>.+?)</td><td>(?P<orbitlength>.+?)</td></tr>\s''')

# All the primes under test
PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]


def parse_file(filename):
    with open(filename) as f:
        contents = f.read()

    data = []
    group_name = TYPE.search(contents).group(1)

    for match in REXP.finditer(contents):
        highest_weight = match.groupdict()['highestweight']
        characteristic = match.groupdict()['characteristic']
        dimension = match.groupdict()['dimension']
        tablerows = match.groupdict()['tablerows']
        rows = [match.groupdict() for match in ROW.finditer(tablerows)]

        # Double-check we did actually find all the rows.
        assert(len(rows) == tablerows.count('<tr>'))

        data_entry = {
            'group': group_name,
            'weight': json.loads(highest_weight), # Convert weight to a list of ints.
            'dim': int(dimension),

            # Here we sort the domWtMults so they come out in the same order as .toPairs()
            'domWtMults': sorted([
                [
                    json.loads(row['weight']), # dominant weight
                    int(row['multiplicity']),  # multiplicity
                ] for row in rows
            ])
        }

        # Find all the p-restricted weights for this entry.
        p_restricted = [p for p in PRIMES if max(data_entry['weight']) < p]

        # There are three kinds of entries.
        # "Characteristic: all" means that the entry is valid for all primes such that the weight is p-restricted.
        # "Characteristic: not 2, 3" means that it works for all primes except 2, 3 such that the weight is p-restricted.
        # "Characteristic: 2" means the entry is only valid in characteristic 2.
        if 'not' in characteristic:
            exceptions = json.loads('[' + NUMLIST.search(characteristic).group(0) + ']')
            data_entry['primes'] = [x for x in p_restricted if x not in exceptions]
        elif 'all' in characteristic:
            data_entry['primes'] = p_restricted
        else:
            data_entry['primes'] = [int(characteristic)]

        data += [data_entry]

    # Check that we managed to read every table.
    table_count = contents.count('table class="wmtab"')
    if len(data) != table_count:
        print(f"Only found {len(data)} tables where there are really {table_count} in the file.", file=sys.stderr)
        assert(False)

    return data

data = [
    parse_file('A2-450.html'),
    parse_file('G2-700.html'),
    parse_file('B2-300.html'),
    # Uncomment this when experimenting with strategies to handle A3.
    # parse_file('A3-1000.html'),
]

# Flatten the array
result = [row for rows in data for row in rows]

# JSON dump of the result
result_json = json.dumps(result)

# Optional dodgy prettify-json step (fine to remove)
result_json = re.sub(r'(,)?\s*\{', r'\1\n  {', result_json)[:-1] + '\n]'

print(result_json)