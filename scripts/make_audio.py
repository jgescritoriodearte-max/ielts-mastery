#!/usr/bin/env python3
"""Generate pre-produced Listening/Speaking audio for IELTS Mastery with Piper (free, open-source neural TTS).

Runs in GitHub Actions (free for public repositories) or on your own computer:
    pip install "piper-tts>=1.2,<2"      # plus ffmpeg installed
    python scripts/make_audio.py dist
    node build.mjs --reindex

For every dist/packs/<id>/jobs.json it synthesises each job (one MP3 per Listening section or Speaking clip),
writes dist/packs/<id>/audio/<job>.mp3 and records duration + line timestamps in pack.json["audio"].
Results are cached in .audio-cache/ so unchanged scripts are not synthesised again.
"""
import hashlib, json, os, shutil, subprocess, sys, tempfile, urllib.request, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".audio-cache")
VOICE_DIR = os.path.join(CACHE, "voices")
HF_BASES = ["https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en", "https://huggingface.co/rhasspy/piper-voices/resolve/main/en"]

# logical voice -> list of Piper models to try (first that downloads wins)
VOICES = {
    "gb_m":  ["en_GB-alan-medium", "en_GB-northern_english_male-medium"],
    "gb_f":  ["en_GB-jenny_dioco-medium", "en_GB-southern_english_female-low", "en_GB-alba-medium"],
    "gb_m2": ["en_GB-northern_english_male-medium", "en_GB-alan-medium"],
    "sc_f":  ["en_GB-alba-medium", "en_GB-jenny_dioco-medium"],
    "us_f":  ["en_US-amy-medium", "en_US-lessac-medium"],
    "us_m":  ["en_US-ryan-medium", "en_US-joe-medium"],
}
PAUSE_S = 0.45
RATE = 22050


def model_urls(name, ext):
    locale, speaker, quality = name.split("-")
    return [f"{b}/{locale}/{speaker}/{quality}/{name}{ext}" for b in HF_BASES]


def ensure_model(name):
    os.makedirs(VOICE_DIR, exist_ok=True)
    onnx = os.path.join(VOICE_DIR, name + ".onnx")
    for ext in (".onnx", ".onnx.json"):
        p = os.path.join(VOICE_DIR, name + ext)
        if not os.path.exists(p):
            print(f"  downloading {name}{ext}")
            err = None
            for url in model_urls(name, ext):
                try:
                    urllib.request.urlretrieve(url, p + ".part")
                    os.replace(p + ".part", p)
                    err = None
                    break
                except Exception as e:
                    err = e
            if err:
                raise err
    return onnx


_loaded = {}
def load_voice(logical):
    if logical in _loaded:
        return _loaded[logical]
    from piper import PiperVoice  # imported lazily so --help works without piper
    last = None
    for name in VOICES.get(logical, VOICES["gb_m"]):
        try:
            v = PiperVoice.load(ensure_model(name))
            _loaded[logical] = (name, v)
            return _loaded[logical]
        except Exception as e:  # try next model
            last = e
            print(f"  voice {name} unavailable: {e}")
    raise RuntimeError(f"no voice available for {logical}: {last}")


def synth_line(voice, text, out_wav):
    raw = out_wav + ".raw.wav"
    with wave.open(raw, "wb") as wf:
        if hasattr(voice, "synthesize_wav"):
            voice.synthesize_wav(text, wf)       # piper-tts >= 1.3
        else:
            voice.synthesize(text, wf)           # piper-tts 1.2
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-ac", "1", "-ar", str(RATE), "-sample_fmt", "s16", out_wav], check=True)
    os.remove(raw)


def job_key(job):
    spec = {"lines": job["lines"], "voices": {sp: VOICES.get(v, VOICES["gb_m"])[0] for sp, v in (job.get("voices") or {}).items()}, "v": 2}
    return hashlib.sha1(json.dumps(spec, sort_keys=True).encode()).hexdigest()


def build_job(job, tmp):
    key = job_key(job)
    mp3_c, meta_c = os.path.join(CACHE, key + ".mp3"), os.path.join(CACHE, key + ".json")
    if os.path.exists(mp3_c) and os.path.exists(meta_c):
        return mp3_c, json.load(open(meta_c))
    voices = job.get("voices") or {}
    frames, marks, t = [], [], 0.0
    silence = b"\x00\x00" * int(RATE * PAUSE_S)
    for i, (speaker, text) in enumerate(job["lines"]):
        _, v = load_voice(voices.get(speaker, "gb_f" if speaker == "W" else "gb_m"))
        w = os.path.join(tmp, f"l{i}.wav")
        synth_line(v, text, w)
        with wave.open(w, "rb") as wf:
            data = wf.readframes(wf.getnframes())
        marks.append(round(t, 2))
        frames.append(data + silence)
        t += len(data) / 2 / RATE + PAUSE_S
    full = os.path.join(tmp, "full.wav")
    with wave.open(full, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", full, "-codec:a", "libmp3lame", "-b:a", "48k", "-ac", "1", mp3_c], check=True)
    meta = {"dur": round(t, 2), "marks": marks}
    json.dump(meta, open(meta_c, "w"))
    return mp3_c, meta


def main():
    dist = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist")
    packs = os.path.join(dist, "packs")
    os.makedirs(CACHE, exist_ok=True)
    total = failed = 0
    for pid in sorted(os.listdir(packs)):
        jobs_path = os.path.join(packs, pid, "jobs.json")
        if not os.path.exists(jobs_path):
            continue
        jobs = json.load(open(jobs_path))
        if not jobs:
            continue
        pack_path = os.path.join(packs, pid, "pack.json")
        pack = json.load(open(pack_path))
        os.makedirs(os.path.join(packs, pid, "audio"), exist_ok=True)
        print(f"{pid}: {len(jobs)} audio jobs")
        for job in jobs:
            total += 1
            try:
                with tempfile.TemporaryDirectory() as tmp:
                    mp3, meta = build_job(job, tmp)
                rel = f"audio/{job['id']}.mp3"
                shutil.copyfile(mp3, os.path.join(packs, pid, rel))
                pack["audio"][job["id"]] = {"file": rel, "dur": meta["dur"], "marks": meta["marks"]}
            except Exception as e:  # one failure must not break the site: the app falls back to device voice
                failed += 1
                print(f"  ! {job['id']}: {e}")
        json.dump(pack, open(pack_path, "w"))
    print(f"done: {total - failed}/{total} audio files")
    if total and failed == total:
        print("Piper could not generate any audio. The app will use Device Voice (Internet not required).")
        sys.exit(1)
    if failed:
        print(f"{failed} clip(s) failed and will use Device Voice; the rest use pre-produced audio.")


if __name__ == "__main__":
    main()
