import sys
import os
# add the backend folder to Python's search path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from logic.diacritic_funcs import apply_diacritic

"""
01. TEST_APPLY_DIACRITIC
"""

def test_apply_diacritic():
    
    # id of the sound, k
    bs_id = 74
    
    # id of the aspiration diacritic
    valid_dia_id = 11
    
    # id of the dental diacritic
    invalid_dia_id = 6
    
    # k can be aspirated, so the output should not be None
    good_result = apply_diacritic(bs_id, valid_dia_id)
    
    # these are the anticipated consequences of applying aspiration!
    assert good_result.get("spread gl") == "+"
    assert good_result.get("constr gl") == "-"
    
    # k cannot have a dental diacritic, so we expect the output to be 'None'
    assert (apply_diacritic(bs_id, invalid_dia_id) is None)