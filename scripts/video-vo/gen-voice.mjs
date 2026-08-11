import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const PIPER = "/tmp/claude-1000/-home-thomasbatpro/e941ad00-21d1-4cf5-9636-e3e51f8dcac7/scratchpad/tts-env/bin/piper";
const MODEL = "voices/fr_FR-tom-medium.onnx";

const script = JSON.parse(readFileSync("script.json", "utf8"));

function getDuration(path) {
  const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path}"`).toString().trim();
  return parseFloat(out);
}

const timeline = [];
let cursor = 0.6; // small lead-in before the first line starts

for (const beat of script) {
  const wavPath = `voice/${beat.id}.wav`;
  execSync(`echo "${beat.text.replace(/"/g, '\\"')}" | ${PIPER} -m ${MODEL} -f ${wavPath} --length-scale 1.02`, { stdio: "inherit" });
  const dur = getDuration(wavPath);
  timeline.push({ id: beat.id, text: beat.text, start: Number(cursor.toFixed(2)), duration: Number(dur.toFixed(2)) });
  cursor += dur + 0.45; // gap between sentences
}

writeFileSync("voice-timeline.json", JSON.stringify(timeline, null, 2));
console.log("Total narration length:", cursor.toFixed(2), "s");
console.table(timeline.map((t) => ({ id: t.id, start: t.start, dur: t.duration })));
