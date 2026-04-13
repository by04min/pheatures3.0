import sqlite3
import json
import csv

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

"""
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
HELPER FUNCTION: given a sequence of feature name/value pairs, and convert to JSON string
    PURPOSE:
    - reusable in contradictions, dependencies, and diacritics parsing

    PARAMS:
    - text: a string of feature name/value pairs, separated by commas
    - ex. "+consonantal, -tense"

    RETURNS:
    - a JSON string of the bundle
"""
def create_bundle(text):
    bundle = []

    for item in text.split(","):
        item = item.strip()
        
        # catches empty items (results from extra commas!)
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

# open the contradictions file, with UTF-8 encoding
with open("./data/contradictions.rules", "r", encoding="utf-8") as file:
    # the file is not a CSV, but is separated by newlines
    contradiction_rules = file.readlines()

for row in contradiction_rules:
    row = row.strip() # remove any whitespace

    # skip empty rows (results from newline at end of file)
    if not row:
        continue

    bundle = create_bundle(row)
    # insert the bundle into the contradictions table
    db.execute(
        "INSERT INTO contradictions (bundle) VALUES (?)",
        (json.dumps(bundle),) # convert the bundle (python list) to a JSON string
    )

# commit the changes to the database
connection.commit()
print("SUCCESS: populated contradictions table!")

"""
========================================
03. DEPENDENCIES TABLE
"""

# open the dependencies file, with UTF-8 encoding
with open("./data/dependencies.rules", "r", encoding="utf-8") as file:
    dependency_rules = file.readlines()

for row in dependency_rules:
    row = row.strip()

    if not row:
        continue

    
    # dependency conditions and consequences are separated by a ">"
    split_idx = row.index(">")
    lhs = create_bundle(row[:split_idx].strip()) # convert the LHS (conditions) to a JSON string
    rhs = create_bundle(row[split_idx+1:].strip()) # convert the RHS (consequences) to a JSON string

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
with open("./data/diacritics.rules", "r", encoding="utf-8") as file:
    diacritic_rules = file.readlines()

for row in diacritic_rules:
    row = row.strip()
    
    if not row:
        continue

    # diacritics consist of name, symbol, and condition/consequence, separated by a ;
    first_split_idx = row.find(";") # find the index of the first ;
    second_split_idx = row.find(";", first_split_idx+1) # find the index of the second ;
    
    # parse the name, symbol, and rule
    name = row[:first_split_idx].strip()
    symbol = parse_symbol(row[first_split_idx+1:second_split_idx].strip())
    rule = row[second_split_idx+1:].strip() # condition/consequence

    # similar to dependencies, diacritics have a rule with condition and consequence separated by a ">"
    rule_split_idx = rule.index(">")
    lhs = create_bundle(rule[:split_idx].strip()) # convert the LHS (conditions) to a JSON string
    rhs = create_bundle(rule[split_idx+1:].strip()) # convert the RHS (consequences) to a JSON string

    db.execute(
        "INSERT INTO diacritics (diacritic_name, diacritic_symbol, condition, consequence) VALUES (?, ?, ?, ?)",
        (name, symbol, lhs, rhs)
    )
    
# commit the changes to the database
connection.commit()
print("SUCCESS: populated diacritics table!")

# close the connection
connection.close()