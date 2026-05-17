```javascript

import { SarvamAIClient } from "sarvamai";
import * as fs from "fs";

function audioFileToBase64(filePath) {
  return fs.readFileSync(filePath).toString("base64");
}

async function basicTranscription() {
  const audioData = audioFileToBase64("path/to/your/audio.wav");

  const client = new SarvamAIClient({
    apiSubscriptionKey: "YOUR_SARVAM_API_KEY"
  });

  // Connect — change mode as needed
  const socket = await client.speechToTextStreaming.connect({
    model: "saaras:v3",
    mode: "transcribe",
    "language-code": "en-IN",
    high_vad_sensitivity: "true"
  });

  socket.on("open", () => {
    socket.transcribe({
      audio: audioData,
      sample_rate: 16000,
      encoding: "audio/wav",
    });
  });

  socket.on("message", (response) => {
    console.log("Result:", response);
  });

  await socket.waitForOpen();
  await new Promise(resolve => setTimeout(resolve, 5000));
  socket.close();
}

basicTranscription();

```


```javascript

import { SarvamAIClient } from "sarvamai";

async function main() {
    const client = new SarvamAIClient({
        apiSubscriptionKey: "YOUR_API_KEY"
    });

    // Create batch job — change mode as needed
    const job = await client.speechToTextJob.createJob({
        model: "saaras:v3",
        mode: "transcribe",
        languageCode: "unknown",
        withDiarization: true,
        numSpeakers: 2
    });

    // Upload and process files
    const audioPaths = ["path/to/audio1.mp3", "path/to/audio2.mp3"];
    await job.uploadFiles(audioPaths);
    await job.start();

    // Wait for completion
    await job.waitUntilComplete();

    // Check file-level results
    const fileResults = await job.getFileResults();

    console.log(`\nSuccessful: ${fileResults.successful.length}`);
    for (const f of fileResults.successful) {
        console.log(`  ✓ ${f.file_name}`);
    }

    console.log(`\nFailed: ${fileResults.failed.length}`);
    for (const f of fileResults.failed) {
        console.log(`  ✗ ${f.file_name}: ${f.error_message}`);
    }

    // Download outputs for successful files
    if (fileResults.successful.length > 0) {
        await job.downloadOutputs("./output");
        console.log(`\nDownloaded ${fileResults.successful.length} file(s) to: ./output`);
    }
}

main().catch(console.error);

```
