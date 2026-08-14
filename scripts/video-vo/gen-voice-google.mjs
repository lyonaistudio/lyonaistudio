import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const KEY = readFileSync("/home/thomasbatpro/lyon ia studio /cle api/cleapigoogle.txt", "utf8").trim();
const VOICE = "fr-FR-Chirp3-HD-Puck";

const script = JSON.parse(readFileSync("script.json", "utf8"));

function getDuration(path) {
  const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path}"`).toString().trim();
  return parseFloat(out);
}

const timeline = [];
let cursor = 0.6;

for (const beat of script) {
  const wavPath = `voice/${beat.id}.wav`;
  const body = JSON.stringify({
    input: { text: beat.text },
    voice: { languageCode: "fr-FR", name: VOICE },
    audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 44100, speakingRate: 0.97 },
  });
  const res = execSync(
    `curl -s -X POST "https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}" -H "Content-Type: application/json" -d '${body.replace(/'/g, "'\\''")}'`
  ).toString();
  const json = JSON.parse(res);
  if (json.error) {
    console.error(beat.id, json.error);
    process.exit(1);
  }
  writeFileSync(`voice/${beat.id}.b64`, json.audioContent);
  execSync(`base64 -d voice/${beat.id}.b64 > ${wavPath}`);
  const dur = getDuration(wavPath);
  timeline.push({ id: beat.id, text: beat.text, start: Number(cursor.toFixed(2)), duration: Number(dur.toFixed(2)) });
  cursor += dur + 0.45;
  console.log(beat.id, "->", dur.toFixed(2), "s");
}

writeFileSync("voice-timeline.json", JSON.stringify(timeline, null, 2));
console.log("Total narration length:", cursor.toFixed(2), "s");
console.table(timeline.map((t) => ({ id: t.id, start: t.start, dur: t.duration })));
