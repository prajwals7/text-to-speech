"""
Text normalization utility for TTS synthesis.
Expands common abbreviations, collapses excessive whitespace,
and ensures proper sentence-ending punctuation for natural pauses.
"""

import re
from typing import List, Tuple

# Word abbreviation replacements (case-insensitive)
ABBREVIATIONS_IGNORECASE: List[Tuple[str, str]] = [
    (r"\be\.g\.,?", "for example,"),
    (r"\bi\.e\.,?", "that is,"),
    (r"\bapprox\b\.?", "approximately"),
    (r"(?:^|(?<=\s))w/(?=\s|$)", "with"),
    (r"(?:^|(?<=\s))w/o(?=\s|$)", "without"),
    (r"\betc\b\.?", "etcetera"),
    (r"\bvs\b\.?", "versus"),
    (r"\bdept\b\.?", "department"),
    (r"\bgovt\b\.?", "government"),
    (r"\bave\b\.?", "avenue"),
    (r"\brd\b\.?", "road"),
    (r"\bmins\b\.?", "minutes"),
    (r"\bmin\b\.?", "minute"),
    (r"\bhrs\b\.?", "hours"),
    (r"\bhr\b\.?", "hour"),
    (r"\bsecs\b\.?", "seconds"),
    (r"\bsec\b\.?", "second"),
    (r"\bincl\b\.?", "including"),
    (r"\bfig\b\.?", "figure"),
    (r"\bcorp\b\.?", "corporation"),
    (r"\binc\b\.?", "incorporated"),
    (r"\bltd\b\.?", "limited"),
    (r"\bco\b\.?", "company"),
]

# Title / Name abbreviation replacements (case-sensitive)
ABBREVIATIONS_CASESENSITIVE: List[Tuple[str, str]] = [
    (r"\bDr\b\.?", "Doctor"),
    (r"\bMr\b\.?", "Mister"),
    (r"\bMrs\b\.?", "Missus"),
    (r"\bMs\b\.?", "Miss"),
    (r"\bProf\b\.?", "Professor"),
    (r"\bGen\b\.?", "General"),
    (r"\bSt\b\.?", "Saint"),
    (r"\bNo\b\.", "Number"),
    (r"\bno\b\.", "number"),
]


def expand_abbreviations(text: str) -> str:
    """Expands common abbreviations into full pronounceable words."""
    result = text

    # Handle w/ and w/o before word-boundary passes
    result = re.sub(r"(?:^|(?<=\s))w/(?=\s|$)", "with", result)
    result = re.sub(r"(?:^|(?<=\s))w/o(?=\s|$)", "without", result)

    for pattern, replacement in ABBREVIATIONS_IGNORECASE:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    for pattern, replacement in ABBREVIATIONS_CASESENSITIVE:
        result = re.sub(pattern, replacement, result)

    # Symbol expansions for better speech cadence
    result = re.sub(r"(\d+)\s*%", r"\1 percent", result)
    result = re.sub(r"\s+&\s+", " and ", result)
    return result


def collapse_whitespace(text: str) -> str:
    """Collapses duplicate spaces and excessive newlines."""
    # Normalize Windows CRLF / CR to LF
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace horizontal whitespace (tabs, non-breaking spaces, multiple spaces) with single space
    text = re.sub(r"[ \t\u00A0]+", " ", text)
    # Collapse 3+ consecutive newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove leading/trailing spaces per line
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join(lines).strip()


def ensure_punctuation(text: str) -> str:
    """
    Ensures text and line paragraphs end with sentence-ending punctuation
    so speech engines pause naturally rather than rushing.
    """
    if not text:
        return text

    valid_endings = {".", "!", "?", "…", ":", ";", '"', "'", "”", "’", ")", "]", "}"}

    # Split into paragraphs/lines and ensure each non-empty sentence has terminal punctuation
    lines = text.split("\n")
    normalized_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            normalized_lines.append("")
            continue
        if stripped[-1] not in valid_endings:
            stripped += "."
        normalized_lines.append(stripped)

    result = " ".join(part for part in normalized_lines if part)
    # Final check on entire text
    if result and result[-1] not in valid_endings:
        result += "."
    return result


def normalize_text(text: str) -> str:
    """
    Main normalization pipeline:
    1. Expand abbreviations
    2. Collapse excessive whitespace
    3. Ensure proper punctuation
    """
    if not text or not isinstance(text, str):
        return ""

    cleaned = collapse_whitespace(text)
    if not cleaned:
        return ""

    expanded = expand_abbreviations(cleaned)
    normalized = ensure_punctuation(expanded)
    # Final whitespace cleanup
    normalized = collapse_whitespace(normalized)
    return normalized
