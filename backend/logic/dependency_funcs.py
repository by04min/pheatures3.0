import sqlite3
import json

# establish connection to the database
connection = sqlite3.connect("pheatures.db")
db = connection.cursor()

"""
01. APPLY DEPENDENCIES
    PURPOSE:
    - given a feature bundle and a changed feature, applies all matching dependency rules
    - uses a two pass evaluation to catch cascading consequences!

    PARAMS:
    - feature_bundle: a dictionary of all current features e.g. {"voice": "+", "nasal": "-", ...}
    - changed_feature: a dictionary with the single feature that just changed e.g. {"round": "+"}

    RETURNS:
    - updated: the feature bundle after all dependency rules have been applied
"""
def apply_dependencies(feature_bundle, changed_feature):

    # fetch all dependency rules from the database
    rules = db.execute("SELECT condition, consequence FROM dependencies").fetchall()

    # parse all rules into Python dictionaries upfront
    parsed_rules = []
    for rule in rules:
        condition = json.loads(rule[0])
        consequence = json.loads(rule[1])
        parsed_rules.append((condition, consequence))

    # work on a copy so we don't mutate the original
    updated = dict[str, str](feature_bundle)

    # unpack the changed feature name and value
    changed_name = list[str](changed_feature.keys())[0]
    changed_value = list[str](changed_feature.values())[0]

    # pass 1: only applies rules that have the changed feature in the condition
    # and, checks if all conditions in that rule match the current bundle
    for condition, consequence in parsed_rules:
        triggered = condition.get(changed_name) == changed_value
        all_match = all(updated.get(feature) == value for feature, value in condition.items())

        if triggered and all_match:
            for feature, value in consequence.items():
                updated[feature] = value

    # pass 2: run all rules on the updated bundle to catch anything that cascaded
    for condition, consequence in parsed_rules:
        if all(updated.get(feature) == value for feature, value in condition.items()):
            for feature, value in consequence.items():
                updated[feature] = value

    return updated