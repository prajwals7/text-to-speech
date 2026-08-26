"""
Unit tests for text normalization.
"""

import pytest
from backend.normalizer import (
    expand_abbreviations,
    collapse_whitespace,
    ensure_punctuation,
    normalize_text,
)


def test_expand_abbreviations():
    input_text = "e.g. Dr. Smith visited approx. 50% of the dept. w/ Mr. Jones"
    expanded = expand_abbreviations(input_text)
    assert "for example" in expanded
    assert "Doctor" in expanded
    assert "approximately" in expanded
    assert "50 percent" in expanded
    assert "department" in expanded
    assert "with" in expanded
    assert "Mister" in expanded


def test_collapse_whitespace():
    input_text = "  Hello    world!  \n\n\n\n  This is   a test.  \t  "
    cleaned = collapse_whitespace(input_text)
    assert cleaned == "Hello world!\n\nThis is a test."


def test_ensure_punctuation_missing_period():
    input_text = "This is a sentence without a period"
    result = ensure_punctuation(input_text)
    assert result.endswith(".")
    assert result == "This is a sentence without a period."


def test_ensure_punctuation_existing_punctuation():
    for punct in [".", "!", "?", "…", ":"]:
        text = f"Already punctuated{punct}"
        assert ensure_punctuation(text) == text


def test_ensure_punctuation_multiline():
    input_text = "First paragraph\nSecond paragraph"
    result = ensure_punctuation(input_text)
    assert result == "First paragraph. Second paragraph."


def test_full_normalize_text():
    raw = "  hello world   this is Dr. Watson w/ approx. 5 mins left  "
    normalized = normalize_text(raw)
    assert normalized.startswith("hello world this is Doctor Watson with approximately 5 minutes left.")
    assert normalized.endswith(".")
