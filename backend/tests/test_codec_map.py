import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.codec_map import PT_TO_CODEC


def test_common_payload_types():
    assert PT_TO_CODEC[0] == "G.711u"
    assert PT_TO_CODEC[8] == "G.711a"
    assert PT_TO_CODEC[18] == "G.729"
    assert PT_TO_CODEC[9] == "G.722"
    assert PT_TO_CODEC[111] == "Opus"


def test_unknown_payload_type_not_in_map():
    assert 255 not in PT_TO_CODEC


def test_all_values_are_strings():
    for pt, codec in PT_TO_CODEC.items():
        assert isinstance(pt, int), f"Key {pt} is not int"
        assert isinstance(codec, str), f"Value {codec} is not str"
        assert len(codec) > 0, f"Empty codec for PT {pt}"


def test_dynamic_range():
    assert PT_TO_CODEC[96] == "Dynamic"
    assert PT_TO_CODEC[101] == "telephone-event"
