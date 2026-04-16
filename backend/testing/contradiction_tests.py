import sys
import os

# add the backend folder to Python's search path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from logic.contradiction_funcs import no_contradictions

"""
01. TEST: no_contradictions
"""

# this bundle SHOULD trigger a contradiction!
invalid_bundle = [
    {"feature":"sonorant", "value":"-"},
    {"feature":"approximant", "value":"+"},
    
    {"feature":"coronal", "value":"+"},
    {"feature":"distributed", "value":"0"},
    
    # this one does NOT violate any rules, so we expect only the above two to be returned as violations
    {"feature":"spread gl", "value":"-"},
    {"feature":"constr gl", "value":"+"}
]

# this bundle should NOT trigger a contradiction!
valid_bundle = [
    {"feature":"high", "value":"+"},
    {"feature":"front", "value":"+"},
    {"feature":"consonantal", "value":"-"}
]


# recall no_contradiction returns a tuple, as (Bool, List)
# where Bool represents whether no contradictiosn were found, and List consists of any violated rules

print("=== EXPECTED: FAILURE ===")
expect_fail = no_contradictions(invalid_bundle)
if not expect_fail[0]:
    print("TEST SUCCEEDED!\n")
else:
    print("TEST FAILED!\n")
    
print("=== EXPECTED: SUCCESS ===")
expect_succeed = no_contradictions(valid_bundle)
if expect_succeed[0]:
    print("TEST SUCCEEDED!\n")
else:
    print("TEST FAILED!\n")
    print("violations found: " + str(expect_succeed[1]))