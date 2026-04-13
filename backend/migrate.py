import sqlite3
import json
import csv

"""
========================================
00. SETUP!
"""
# establish connection to the database
connection = sqlite3.connect("pheatures.db")
db = connection.cursor() # an object that lets you execute SQL commands

# clear the database tables before each run to avoid duplicates!
db.execute("DELETE FROM phoneme_features")
db.execute("DELETE FROM features")
db.execute("DELETE FROM phonemes")
db.execute("DELETE FROM contradictions")
db.execute("DELETE FROM dependencies")
db.execute("DELETE FROM diacritics")
db.execute("DELETE FROM sqlite_sequence")  # resets all autoincrement counters
connection.commit()
print("SETUP: cleared all existing tables for a clean slate!")

"""
========================================
01. PHONEME & FEATURES TABLES
"""
# maps to store the IDs of features and phonemes to avoid mistakes later!
feature_ids = {} 

# open the feature table CSV file, with UTF-8 encoding
with open("./data/feature_table.csv", "r", encoding="utf-8") as file:
    reader = csv.reader(file)
    feature_table_rows = list(reader) # split the csv into rows of lists


"""
    1.1 POPULATE FEATURES TABLE
"""
# grab the feature names from the first row of the csv (first col is just whitespace!)
feature_names = feature_table_rows[0][1:]

# insert the feature names into the database
for name in feature_names:

    # put the feature into the 'features' table in the field 'feature_name'
    db.execute("INSERT INTO features (feature_name) VALUES (?)", (name,))

    feature_ids[name] = db.lastrowid # store the ID sql just assigned to this feature

"""
    1.2 POPULATE PHONEME TABLE, RELATE TO FEATURES (PHONEME FEATURES TABLE)
"""
# grab each phoneme symbol from the csv (first row is the feature names)
for row in feature_table_rows[1:]:
    symbol = row[0] # first column is the phoneme symbol

    # put the phoneme into the 'phonemes' table in the field 'phoneme_symbol'
    db.execute("INSERT INTO phonemes (phoneme_symbol) VALUES (?)", (symbol,))
    phoneme_id =  db.lastrowid

    # iterate over each feature value in the row (skipping the first col)
    for idx, value in enumerate(row[1:]):
        feature_name = feature_names[idx] 
        feature_id = feature_ids[feature_name] # grab the id of the curr feature from the features map

        # put the phoneme_id, feature_id, and feature_value into the phoneme_features table
        db.execute(
            "INSERT INTO phoneme_features (phoneme_id, feature_id, feature_value) VALUES (?, ?, ?)", 
            (phoneme_id, feature_id, value)
        )

# commit the changes to the database
connection.commit()
print("SUCCESS: populated phoneme, feature, and phoneme_features tables!")


"""
========================================
HELPER FUNCTION: given a sequence of ';' separated features, convert to a list, then JSON
    PURPOSE:
    - reusable in contradictions, dependencies, and diacritics parsing
    - certain rule conditions and consequences may contain multiple features
    - we want to store those as bundles of features! (consistent with schema.sql)

    PARAMS:
    - text: an object of feature value/feature pairs (either a list or string)
    - ex. "+consonantal; -tense"
    
    - delimeter: a character (;)
    - whereas contradictions already come in as a list (because of csv.reader), dependencies & diacritics 
    involve multiple features as a string sequence separated by ";"! to handle that, we pass it as a delimeter to make into a list

    RETURNS:
    - a JSON string of the bundle, now as a list {[+consonantal, -tense]}
"""
def create_bundle(text, delimeter=None):
    bundle = []
    
    # if delimeter passed, split text into a list using it!
    if delimeter:
        text = text.split(delimeter)
    
    # creates a list, using specified delimeter
    for item in text:
        
        # removes any whitespace
        item = item.strip()
        
        # catches empty items (catch mistakes like an extra ;!)
        if not item:
            continue

        value = item[0] # the first char is the value (+, -, 0)
        feature_name = item[1:] # the rest is the feature name

        # add the feature name and value to the bundle
        bundle.append({"feature":feature_name, "value":value})

    return json.dumps(bundle) # convert the bundle (python list) to a JSON string

"""
========================================
02. CONTRADICTIONS TABLE
"""

# open the contradictions csv, with UTF-8 encoding
with open("./data/contradictions.csv", "r", encoding="utf-8") as file:
    reader = csv.reader(file)
    contra_table_rows = list(reader)

# skip the first row, since that's just a title
contradiction_rules = contra_table_rows[1:][0:]

for row in contradiction_rules:
    # skip empty rows (in case there's an extra newline somewhere)
    if not row:
        continue

    # no delimeter, since csv.reader already makes the row into a list [feature1, feature2, etc.]
    contra_bundle = create_bundle(row)
    
    # insert the bundle into the contradictions table
    db.execute(
        "INSERT INTO contradictions (bundle) VALUES (?)",
        (contra_bundle,) # convert the bundle (python list) to a JSON string
    )

# commit the changes to the database
connection.commit()
print("SUCCESS: populated contradictions table!")

"""
========================================
03. DEPENDENCIES TABLE
"""

# open the dependencies file, with UTF-8 encoding
with open("./data/dependencies.csv", "r", encoding="utf-8") as file:
    reader = csv.reader(file)
    dependency_table_rows = list(reader)

# skip the first row, since that's just column headers
dependency_rules = dependency_table_rows[1:][0:]

for row in dependency_rules:
    if not row:
        continue

    # dependency conditions and consequences are parsed as a list [conditions, consequences]
    # this is what csv.reader does by default!
    
    # assumes there's always 2 columns (cond, consequence)
    # multiple features in cond/cons are separated by ";"
    lhs = create_bundle(row[0], ";") # convert the conditions into a bundle
    rhs = create_bundle(row[1], ";") # convert the consequences into a bundle

    db.execute(
        "INSERT INTO dependencies (condition, consequence) VALUES (?, ?)",
        (lhs, rhs)
    )

# commit the changes to the database
connection.commit()
print("SUCCESS: populated dependencies table!")

"""
========================================
04. DIACRITICS TABLE
"""

"""
HELPER FUNCTION: given a sequence of feature name/value pairs, and convert to JSON string
    PURPOSE:
    - some symbols in diacritics.rules are given as unicode integers, but we want to store them as characters

    PARAMS:
    - text: a string (unicode integer or character)

    RETURNS:
    - a character (either the original text or the unicode integer converted to a char)
"""
def parse_symbol(text):
    try:
        # if text is a valid unicode integer, convert it to a char symbol
        return chr(int(text))
    except:
        # otherwise, just return the original text
        return text

# open the diacritics file, with UTF-8 encoding
with open("./data/diacritics.csv", "r", encoding="utf-8") as file:
    reader = csv.reader(file)
    diacritic_table_rows = list(reader)

# skip the first row, since that's just column headers
diacritic_rules = diacritic_table_rows[1:][0:]

for row in diacritic_rules:
    if not row:
        continue
    
    # csv.reader represents each row as a list of 4 elements 
    # format: [diacritic name, symbol/unicode val, condition, consequence]
    
    # this works on the assumption that each row consists of exactly 4 elements (which we know it does, since i made diacritics.csv!)
    name = row[0].strip()
    symbol = parse_symbol(row[1].strip()) # cleanup whitespace before parsing
    
    # again, conditions/consequences may consist of multiple featues, separated by ";"
    lhs = create_bundle(row[2].strip(), ";")
    rhs = create_bundle(row[3].strip(), ";")
    
    db.execute(
        "INSERT INTO diacritics (diacritic_name, diacritic_symbol, condition, consequence) VALUES (?, ?, ?, ?)",
        (name, symbol, lhs, rhs)
    )
    
# commit the changes to the database
connection.commit()
print("SUCCESS: populated diacritics table!")

# close the connection
connection.close()