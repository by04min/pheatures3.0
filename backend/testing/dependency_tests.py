import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from logic.dependency_funcs import apply_dependencies

"""
01. TEST: apply_dependencies
"""

def test_apply_dependencies():

    # test 1: +round should trigger +labial
    bundle = {
        "round": "+",
        "labial": "-",
        "voice": "+",
        "consonantal": "+"
    }
    result = apply_dependencies(bundle, {"round": "+"})
    assert result["labial"] == "+", "expected labial to become + after setting round to +"

    # test 2: +high should trigger -low
    bundle = {
        "high": "+",
        "low": "+",
        "consonantal": "-"
    }
    result = apply_dependencies(bundle, {"high": "+"})
    assert result["low"] == "-", "expected low to become - after setting high to +"

    # test 3: +front should trigger -back
    bundle = {
        "front": "+",
        "back": "+",
        "dorsal": "+"
    }
    result = apply_dependencies(bundle, {"front": "+"})
    assert result["back"] == "-", "expected back to become - after setting front to +"

    print("all tests passed!")