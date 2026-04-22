import sqlite3
import json

# establish connection to the database
connection = sqlite3.connect("pheatures.db")
db = connection.cursor() # an object that lets you execute SQL commands

"""
01. APPLY DIACRITIC
    PURPOSE:
    - given a sound and a diacritic, checks if the diacritic can be applied to that sound, and returns the updated feature bundle
    
    PARAMS:
    - base_sound: the id of a selected phoneme
    - diacritic: the id of a selected diacritic
    
    RETURNS:
    - None: not a valid diacritic application
    - updated_fearures = the new features of the base sound as a result of applying the diacritic
"""

def apply_diacritic(base_sound, diacritic):
    
    # fetch condition and consequence for this diacritic
    result = db.execute(
        "SELECT condition, consequence FROM diacritics WHERE id = ?", (diacritic,)
    ).fetchone()
    
    if not result:
        return None
    
    # unpack tuples, convert from JSON to python dictionary
    condition = json.loads(result[0])
    consequence = json.loads(result[1])
    
    # fetch the base sound's feature and corresponding values using JOIN
    bs_features = db.execute("""
        SELECT features.feature_name, phoneme_features.feature_value
        FROM phoneme_features
        JOIN features ON phoneme_features.feature_id = features.id
        WHERE phoneme_features.phoneme_id = ?
    """, (base_sound,)).fetchall()
    
    # convert to a dictionary for easy lookup: {"voice": "+", "nasal": "-", ...}
    bs_dict = {row[0]: row[1] for row in bs_features}
    
    # check whether base sound meets all conditions
    for feature, value in condition.items():
        if bs_dict.get(feature) != value:
            return None
    
    # apply the consequence by updating the base sound's features
    updated_features = dict(bs_dict)
    # items() gives you key-value pairs in a dictionary as a list of tuples
    for feature, value in consequence.items():
        updated_features[feature] = value
    
    return updated_features
    
    
    
    

