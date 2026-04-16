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
    - feature_bundle: a list of features
    
    RETURNS: a tuple of the form...
    - (True, []) if no contradictions were found
    - (False, [violated_rule1, violated_rule2, ...]), where [] is a list of rules that were violated
"""
def no_contradictions(feature_bundle):
    
    # fetch all of the contradictions from the database
    # each element in the contradiction is in tuples, like [({"feature": "blah", "value": blah}), ...]
    contradictory_rules = db.execute("SELECT bundle FROM contradictions").fetchall()
    
    # this keeps track of all contradiction rules that have been violated
    violated_rules = []
    
    for rule in contradictory_rules:
        
        # unpack tuple, and convert JSON format into a Python dictionary
        rule = json.loads(rule[0])
        
        # for each feature/value pair in the rule, check if it exists in the feature_bundle
        # the type of violation_found is a Bool
        violation_found = all(cond in feature_bundle for cond in rule)
        
        if violation_found:
            violated_rules.append(rule)
    
    if violated_rules:
        return (False, violated_rules)
    
    return (True, [])