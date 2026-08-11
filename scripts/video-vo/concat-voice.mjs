import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const timeline = JSON.parse(readFileSync("voice-timeline.json", "utf8"));

// Build a silence-padded concat list matching the timeline exactly (lead-in +
// each clip + inter-sentence gap), so the final narration.wav timestamps line
// up 1:1 with voice-timeline.json.
execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.6 -q:a 9 voice/_lead.wav`, { stdio: "inherit" });
execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.45 -q:a 9 voice/_gap.wav`, { stdio: "inherit" });

const listLines = ["file '_lead.wav'"];
timeline.forEach((beat, i) => {
  listLines.push(`file '${beat.id}.wav'`);
  if (i < timeline.length - 1) listLines.push(`file '_gap.wav'`);
});
writeFileSync("voice/concat-list.txt", listLines.join("\n"));

execSync(`ffmpeg -y -f concat -safe 0 -i voice/concat-list.txt -ar 44100 -ac 1 voice/narration.wav`, { stdio: "inherit" });
console.log("narration.wav built");
