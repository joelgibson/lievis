# Tables of p-restricted weights

Frank Lübeck has published a some tables of dimensions in *[Small Degree Representations of Finite Chevalley Groups in Defining Characteristic](https://doi.org/10.1112/S1461157000000838)*. After fixing a dominant weight, the table will give you all the dimensions of the simple modules for that dominant weight in any characteristic for which that weight is p-restricted. On [Lübeck's website](http://www.math.rwth-aachen.de/~Frank.Luebeck/chev/WMSmall/index.html?LANG=en), these tables are expanded to lengthier ones which also include dominant weight multiplicities inside simples.

I've downloaded the HTML files for those tables to this directory. Running

    python3 transform_data.py > table_data.json

will generate a JSON file from these tables which is more easily consumed from Javascript. The `table_data.json` file is checked-in, you only need to re-run this script if you're changing the format or including new tables. The `tables.test.ts` file actually runs the tests.
