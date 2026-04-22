import sqlite3
import json

# establish connection to the database
connection = sqlite3.connect("pheatures.db")
db = connection.cursor() # an object that lets you execute SQL commands

"""
01. NO CONTRADICTIONS
    PURPOSE:
    - checks if a feature bundle contains any contradictory features!
    
    PARAMS:
    - feature_bundle: a dictionary of features and their values as key/value pairs e.g. {"voice": "+", "nasal": "-"}
    
    RETURNS: a tuple of the form...
    - (True, []) if no contradictions were found
    - (False, [violated_rule1, violated_rule2, ...]), where [] is a list of rules that were violated
"""
def no_contradictions(feature_bundle):
    
    # fetch all of the contradictions from the database
    contradictory_rules = db.execute("SELECT bundle FROM contradictions").fetchall()
    
    # this keeps track of all contradiction rules that have been violated
    violated_rules = []
    
    for rule in contradictory_rules:
        
        # unpack tuple, and convert JSON format into a Python dictionary
        rule = json.loads(rule[0])
        
        # for each feature/value pair in the rule, check if it exists in the feature_bundle
        violation_found = all(
            feature_bundle.get(feature) == value
            for feature, value in rule.items()
        )
        
        if violation_found:
            violated_rules.append(rule)
    
    if violated_rules:
        return (False, violated_rules)
    
    return (True, [])