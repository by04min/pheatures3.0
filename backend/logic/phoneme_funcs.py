import sqlite3

# establish connection to the database
connection = sqlite3.connect("pheatures.db")
db = connection.cursor() # an object that lets you execute SQL commands

"""
01. QUERY SEGMENTS
    PURPOSE:
    - given some features, get all sounds from the database that having matching values for those features!
    
    PARAMS:
    - feature_list: a list of feature/value pairs
    - ex. [{"feature": "high", "value": "+"}, {"feature": "consonantal", "value": "-"}]
    
    RETURNS:
    - valid_sounds: a list of the ids of sounds that satisfy all feature/values in feature_list
    - ids come from the sqlite database, pheatures.db
"""
def query_segments(feature_list):
    
    valid_sounds = None
    
    # unpack feature/value pairs in the dictionary feature_list into ft, val
    for ft, val in feature_list.items():
        
        # get the corresponding feature id from the 'features' table in the database 
        # since we know every feature is unique, fetchone() is more just for semantics
        ft_id = db.execute(
            "SELECT id FROM features WHERE feature_name = ?", (ft["feature"],)
        ).fetchone()
        
        # catch any features in feature_list that are somehow non-existing in the db!
        if not ft_id:
            continue
        
         # fetchone returns ft_id as a tuple! unpack it
        ft_id = ft_id[0]
        
        # find all phoneme (ids) from the 'phoneme_features' table that matches the current ft and its value
        sound_ids = db.execute(
            "SELECT phoneme_id FROM phoneme_features WHERE feature_id = ? AND feature_value = ?", (ft_id, val)
        ).fetchall()
        
        # in the very first iteration when valid_sounds is uninitialized, keep all sound ids
        if valid_sounds is None:
            
            # fetchall returns a list of tuples; unpack it!
            # i.e. sound_ids might look like [(2,), (5,), (8,), (13,)]
            valid_sounds = set(id[0] for id in sound_ids)
            
        # otherwise, find intersection of curr valid_sounds and sound_ids
        else:
            valid_sounds = valid_sounds & set(id[0] for id in sound_ids)
    
    if not valid_sounds:
        return []
    
    return list(valid_sounds)


"""
02. GET PHONEME
    PURPOSE:
    - given a phoneme id, return the actual symbol
    - this is what's used in the frontend to display those sounds!
    
    PARAMS:
    - phoeneme_id: the id of a phoneme, as stored in the database
    
    RETURNS:
    - symbol: the corresponding symbol of the id, or None if no corresponding symbol was found
"""
def get_phoneme(phoneme_id):
    symbol = db.execute(
            "SELECT phoneme_symbol FROM phonemes WHERE id = ?", (phoneme_id,)
        ).fetchone()
        
    # since fetchone returns a tuple, unpack it!
    return symbol[0] if symbol else None