import sys
import os

# add the backend folder to Python's search path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from logic.phoneme_funcs import query_segments, get_phoneme

"""
01. TEST: query_segments

    PURPOSE: 
    - test that given a list of feature bundles, query_segments returns a list of ids of the corresponding sounds
"""

def test_querying():
    
    features = [{"feature": "high", "value":"+"}, {"feature": "front", "value":"+"}, {"feature": "round", "value":"+"}]
    
    query = query_segments(features)
    
    # make sure return result is not empty
    assert (query != [])
    
    # make sure returned results are valid!
    expected = [135, 23, 25]
    assert (sorted(expected) == sorted(query)) # compare the sorted version, since == requires same ordering

"""
02. TEST: get_phoneme

    PURPOSE: 
    - given an id, returns the corresponding phoneme symbol
"""

def test_get_phoneme():
    
    # corresponds to ɑ
    test_1 = get_phoneme(2)
    assert (test_1 == "ɑ") 
    
    # corresponds to ɡ͡ɣ
    test_2 = get_phoneme(123)
    assert (test_2 == "ɡ͡ɣ")
    
    # if an invalid id is passed, None returned
    test_3 = get_phoneme(3532)
    assert (not test_3)
    
