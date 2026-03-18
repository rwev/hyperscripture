#!/usr/bin/env python3
"""
download-biblegateway.py

Downloads Bible translations from Bible Gateway using the `meaningless` package,
then converts them into the per-book JSON format used by Hyperscripture.

Usage:
    python3 scripts/download-biblegateway.py

Requires: pip install meaningless
"""

import json
import os
import sys
import time
import re

from meaningless import JSONDownloader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT, "scripts", "raw")
OUTPUT_DIR = os.path.join(ROOT, "public", "data", "translations")

TRANSLATIONS = ["AMP", "NIV", "ESV"]

# Canonical book order with abbreviations and Bible Gateway names
BOOKS = [
    ("Gen",    "Genesis"),
    ("Exod",   "Exodus"),
    ("Lev",    "Leviticus"),
    ("Num",    "Numbers"),
    ("Deut",   "Deuteronomy"),
    ("Josh",   "Joshua"),
    ("Judg",   "Judges"),
    ("Ruth",   "Ruth"),
    ("1Sam",   "1 Samuel"),
    ("2Sam",   "2 Samuel"),
    ("1Kgs",   "1 Kings"),
    ("2Kgs",   "2 Kings"),
    ("1Chr",   "1 Chronicles"),
    ("2Chr",   "2 Chronicles"),
    ("Ezra",   "Ezra"),
    ("Neh",    "Nehemiah"),
    ("Esth",   "Esther"),
    ("Job",    "Job"),
    ("Ps",     "Psalms"),
    ("Prov",   "Proverbs"),
    ("Eccl",   "Ecclesiastes"),
    ("Song",   "Song of Solomon"),
    ("Isa",    "Isaiah"),
    ("Jer",    "Jeremiah"),
    ("Lam",    "Lamentations"),
    ("Ezek",   "Ezekiel"),
    ("Dan",    "Daniel"),
    ("Hos",    "Hosea"),
    ("Joel",   "Joel"),
    ("Amos",   "Amos"),
    ("Obad",   "Obadiah"),
    ("Jonah",  "Jonah"),
    ("Mic",    "Micah"),
    ("Nah",    "Nahum"),
    ("Hab",    "Habakkuk"),
    ("Zeph",   "Zephaniah"),
    ("Hag",    "Haggai"),
    ("Zech",   "Zechariah"),
    ("Mal",    "Malachi"),
    ("Matt",   "Matthew"),
    ("Mark",   "Mark"),
    ("Luke",   "Luke"),
    ("John",   "John"),
    ("Acts",   "Acts"),
    ("Rom",    "Romans"),
    ("1Cor",   "1 Corinthians"),
    ("2Cor",   "2 Corinthians"),
    ("Gal",    "Galatians"),
    ("Eph",    "Ephesians"),
    ("Phil",   "Philippians"),
    ("Col",    "Colossians"),
    ("1Thess", "1 Thessalonians"),
    ("2Thess", "2 Thessalonians"),
    ("1Tim",   "1 Timothy"),
    ("2Tim",   "2 Timothy"),
    ("Titus",  "Titus"),
    ("Phlm",   "Philemon"),
    ("Heb",    "Hebrews"),
    ("Jas",    "James"),
    ("1Pet",   "1 Peter"),
    ("2Pet",   "2 Peter"),
    ("1John",  "1 John"),
    ("2John",  "2 John"),
    ("3John",  "3 John"),
    ("Jude",   "Jude"),
    ("Rev",    "Revelation"),
]

# Regex to strip any residual unicode superscript digits that might leak through
SUPERSCRIPT_RE = re.compile(r"^[\u2070\u00b2\u00b3\u00b9\u2074-\u2079\u2080-\u2089]+\s*")


def clean_verse_text(text):
    """Strip leading superscript numbers and collapse excessive whitespace."""
    if not text:
        return ""
    text = SUPERSCRIPT_RE.sub("", text)
    # Collapse internal newlines into spaces (verse text should be a single line)
    text = re.sub(r"\s*\n\s*", " ", text)
    # Collapse multiple spaces
    text = re.sub(r"  +", " ", text)
    return text.strip()


def download_translation(translation):
    """Download all 66 books for a translation from Bible Gateway."""
    raw_dir = os.path.join(RAW_DIR, translation)
    os.makedirs(raw_dir, exist_ok=True)

    downloader = JSONDownloader(
        translation=translation,
        show_passage_numbers=False,
        default_directory=raw_dir,
        enable_multiprocessing=True,
    )

    print(f"\n{'='*60}")
    print(f"  Downloading {translation}")
    print(f"{'='*60}")

    for i, (abbr, book_name) in enumerate(BOOKS):
        raw_path = os.path.join(raw_dir, f"{book_name}.json")

        # Skip if already downloaded (resume support)
        if os.path.exists(raw_path) and os.path.getsize(raw_path) > 100:
            print(f"  [{i+1:2d}/66] {book_name:<25s} (cached)")
            continue

        print(f"  [{i+1:2d}/66] {book_name:<25s} downloading...", end="", flush=True)
        start = time.time()

        try:
            result = downloader.download_book(book_name)
            elapsed = time.time() - start
            if result == 1:
                print(f" done ({elapsed:.1f}s)")
            else:
                print(f" FAILED (returned {result})")
        except Exception as e:
            print(f" ERROR: {e}")
            # Brief pause before continuing
            time.sleep(2)

    print(f"\n  Raw files saved to {raw_dir}")


def convert_translation(translation):
    """Convert raw meaningless JSON files to Hyperscripture app format."""
    raw_dir = os.path.join(RAW_DIR, translation)
    out_dir = os.path.join(OUTPUT_DIR, translation)
    os.makedirs(out_dir, exist_ok=True)

    print(f"\n  Converting {translation} to app format...")

    total_books = 0
    total_verses = 0

    for i, (abbr, book_name) in enumerate(BOOKS):
        raw_path = os.path.join(raw_dir, f"{book_name}.json")

        # Fallback: meaningless may capitalize "Of" -> "Song Of Solomon.json"
        if not os.path.exists(raw_path):
            alt_name = book_name.replace(" of ", " Of ")
            alt_path = os.path.join(raw_dir, f"{alt_name}.json")
            if os.path.exists(alt_path):
                raw_path = alt_path
            else:
                # Try case-insensitive scan of the directory
                found = False
                for fname in os.listdir(raw_dir):
                    if fname.lower() == f"{book_name.lower()}.json":
                        raw_path = os.path.join(raw_dir, fname)
                        found = True
                        break
                if not found:
                    print(f"    WARNING: Missing {book_name}.json, skipping")
                    continue

        with open(raw_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        # The book data is keyed by the book name (case may vary)
        book_data = None
        for key in raw_data:
            if key != "Info":
                book_data = raw_data[key]
                break

        if not book_data:
            print(f"    WARNING: No book data in {raw_path}, skipping")
            continue

        # Convert: { "chapterStr": { "verseStr": "text" } }
        #      ->  { "chapterStr": [ { "v": int, "t": "text" } ] }
        chapters = {}
        for ch_str, verses_dict in sorted(book_data.items(), key=lambda x: int(x[0])):
            verse_list = []
            for v_str, text in sorted(verses_dict.items(), key=lambda x: int(x[0])):
                cleaned = clean_verse_text(text)
                if cleaned:
                    verse_list.append({"v": int(v_str), "t": cleaned})
                    total_verses += 1
            chapters[ch_str] = verse_list

        app_data = {
            "name": book_name,
            "abbr": abbr,
            "chapters": chapters,
        }

        filename = f"{str(i + 1).zfill(2)}-{abbr}.json"
        out_path = os.path.join(out_dir, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(app_data, f, ensure_ascii=False)

        total_books += 1

    print(f"    {total_books} books, {total_verses} verses -> {out_dir}")


def main():
    print("Hyperscripture - Bible Gateway Downloader")
    print("==========================================")
    print(f"Translations: {', '.join(TRANSLATIONS)}")
    print(f"Books per translation: {len(BOOKS)}")
    print()

    # Phase 1: Download raw data from Bible Gateway
    for translation in TRANSLATIONS:
        download_translation(translation)

    # Phase 2: Convert to app format
    print(f"\n{'='*60}")
    print("  Converting to Hyperscripture format")
    print(f"{'='*60}")

    for translation in TRANSLATIONS:
        convert_translation(translation)

    print("\nDone.")


if __name__ == "__main__":
    main()
