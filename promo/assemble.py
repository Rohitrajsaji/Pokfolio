#!/usr/bin/env python3
"""Cuts the recorded scenes to length and joins them: python3 assemble.py pro|social [music.wav]"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
CLIPS = HERE / "clips"
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

variant = sys.argv[1]
music = sys.argv[2] if len(sys.argv) > 2 else None
meta = json.loads((CLIPS / f"{variant}.json").read_text())
# The battle is long: keep how it opens and how the catch ends.
_b = meta[f"{variant}-battle"][0]
meta[f"{variant}-battle"] += [
    {"tag": "battle_a", "start": _b["start"], "end": _b["start"] + 7.5},
    {"tag": "battle_b", "start": _b["end"] - 8.5, "end": _b["end"]},
]

# (scene, segment tag, seconds wanted). Longer footage is sped up (at most MAX_SPEED), shorter is kept.
PLANS = {
    "pro": [
        ("title", "title", 3.5),
        ("town", "town", 7.0),
        ("battle", "battle_a", 5.0),
        ("battle", "battle_b", 6.0),
        ("shiny", "glitch", 3.0),
        ("shiny", "shiny", 3.5),
        ("end", "end", 2.5),
    ],
    "social": [
        ("shiny", "glitch", 3.0),
        ("shiny", "shiny", 4.0),
        ("title", "title", 3.0),
        ("town", "town", 6.0),
        ("battle", "battle_a", 3.5),
        ("battle", "battle_b", 5.5),
        ("end", "end", 2.5),
    ],
}
MAX_SPEED = 2.6
FPS = 30

parts = []
lengths = []
for scene, tag, want in PLANS[variant]:
    label = f"{variant}-{scene}"
    seg = next(s for s in meta[label] if s["tag"] == tag)
    if tag == "shiny":  # the battle's opening white flash isn't a good first frame
        seg = {**seg, "start": seg["start"] + 0.5}
    length = seg["end"] - seg["start"]
    speed = min(max(length / want, 1.0), MAX_SPEED)
    out_len = length / speed
    part = OUT / f"_{variant}-{tag}.mp4"
    subprocess.run(
        [
            "ffmpeg", "-loglevel", "error", "-y",
            "-ss", f"{seg['start']:.3f}", "-t", f"{length:.3f}",
            "-i", str(CLIPS / f"{label}.webm"),
            "-vf", f"setpts=PTS/{speed:.4f},fps={FPS},scale=1280:720:flags=neighbor,format=yuv420p",
            "-an", "-c:v", "libx264", "-crf", "16", "-preset", "medium", str(part),
        ],
        check=True,
    )
    print(f"{tag}: {length:.1f}s at {speed:.2f}x -> {out_len:.1f}s")
    parts.append(part)
    lengths.append((tag, out_len))


def build_bed(lengths):
    """The game's own music, a slice per scene (title, town or battle tune), one short fade at each join."""
    marks = json.loads((CLIPS / "music.json").read_text())
    order = ["title", "town", "battle", "end"]
    track_for = {"title": "title", "town": "town", "battle": "battle", "battle_a": "battle", "battle_b": "battle", "glitch": "battle", "shiny": "battle", "end": "title"}
    cursor = {}
    slices = []
    for (tag, out_len) in lengths:
        name = track_for[tag]
        begin = marks[name] + 0.4 + cursor.get(name, 0.0)
        limit = marks[order[order.index(name) + 1]] - 0.3 if name != "end" else marks["end"]
        if begin + out_len > limit:  # not enough left in the tune: start it again from its beginning
            begin = marks[name] + 0.4
            cursor[name] = 0.0
        cursor[name] = cursor.get(name, 0.0) + out_len
        piece = OUT / f"_{variant}-{tag}.wav"
        fade = 0.12
        subprocess.run(
            [
                "ffmpeg", "-loglevel", "error", "-y", "-ss", f"{begin:.3f}", "-t", f"{out_len:.3f}",
                "-i", str(CLIPS / "music.webm"),
                "-af", f"afade=t=in:d={fade},afade=t=out:st={out_len - fade:.3f}:d={fade}",
                "-ar", "48000", "-ac", "2", str(piece),
            ],
            check=True,
        )
        slices.append(piece)
    lst = OUT / f"_{variant}-bed.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p in slices))
    bed = OUT / f"_{variant}-bed.wav"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(bed)],
        check=True,
    )
    return str(bed)


if music == "auto":
    music = build_bed(lengths)

listing = OUT / f"_{variant}.txt"
listing.write_text("".join(f"file '{p.name}'\n" for p in parts))
joined = OUT / f"_{variant}-joined.mp4"
subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", str(joined)],
    check=True,
)

final = OUT / f"promo-{variant}.mp4"
if music:
    total = float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(joined)]
        )
    )
    subprocess.run(
        [
            "ffmpeg", "-loglevel", "error", "-y", "-i", str(joined), "-i", music,
            "-af", f"afade=t=in:d=0.5,afade=t=out:st={total - 1.2:.2f}:d=1.2",
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(final),
        ],
        check=True,
    )
else:
    joined.rename(final)
print("wrote", final)
