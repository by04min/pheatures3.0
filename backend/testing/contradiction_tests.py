import sys
import os

# add the backend folder to Python's search path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from logic.contradiction_funcs import no_contradictions

"""
01. TEST: no_contradictions
"""

def test_contradictions():
    # this bundle SHOULD trigger a contradiction!
    invalid_bundle = [
    {"sonorant":"-"},
    {"approximant":"+"},
    {"coronal":"+"},
    {"distributed":"0"},
    
    # this one does NOT violate any rules, so we expect only the above two to be returned as violations
    {"spread gl":"-"},
    {"constr gl":"+"}
    ]
    
    # this bundle should NOT trigger a contradiction!
    valid_bundle = [
        {"high":"+"},
        {"front":"+"},
        {"consonantal":"-"}
    ]
    
    # recall no_contradiction returns a tuple, as (Bool, List)
    # where Bool represents whether no contradictiosn were found, and List consists of any violated rules
    
    test_fail = no_contradictions(invalid_bundle)
    assert (not test_fail[0])
    
    test_succeed = no_contradictions(valid_bundle)
    assert (test_succeed[0])