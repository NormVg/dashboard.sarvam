# Sarvam AI Frontend Intern Assignment: Developer Dashboard

A premium, highly interactive developer portal and playground built using React, TypeScript, and Next.js. It features a real-time multi-modal inference playground and a side-by-side token-level response diff viewer.

* **Live Deployment:** [https://dashboard-sarvam.vercel.app/](https://dashboard-sarvam.vercel.app/)
* **Repository Link:** [https://github.com/NormVg/dashboard.sarvam](https://github.com/NormVg/dashboard.sarvam)

---

## 🏛️ System Architecture Decisions

The application is structured as a single-page workspace wrapper utilizing modern React conventions and Next.js App Router:
1. **Next.js & React (TypeScript)**: Used for rapid rendering, standard route structure, and strong typing.
2. **TailwindCSS & CSS Modules**: Styles are structured to combine the utility speed of Tailwind with the modular scoping of CSS Modules (`dashboard.module.css`) to ensure layout stability.
3. **Framer Motion**: Enables smooth micro-animations, spring transitions, and sliding tab pills to achieve a premium UI/UX feel.
4. **Web Have Sounds**: Integrated to trigger subtle auditory click, pop, and drop cues, providing tactile feedback for actions.
5. **In-Memory Caching**: Implemented a global map cache for diff operations to prevent CPU-intensive recalculations.

---

## ⚡ Part A: Inference Playground Implementation

### 1. Multi-Modal Input
* **Voice and Text Toggles**: The interface features a prominent multi-modal selector. 
* **Audio Capture (`useMicrophone.ts`)**: Built a custom hook around the browser's native `MediaRecorder` API. It captures user speech and stops all active media streams upon completion to release the microphone hardware indicator.
* **Transcription Integration**: Transcribes recorded audio via a backend speech API proxy connecting directly to Sarvam AI's `v1/speech-to-text` (Whisper) endpoint.

### 2. Streaming Responses
* **Token-by-Token Rendering**: Built a stream processor using the `Fetch API` and `ReadableStream`.
* **Asynchronous Chunk Reader**: Decodes incoming UTF-8 bytes chunk-by-chunk using a `TextDecoder` and splits by line delimiter (`\n`). JSON payloads (such as delta tokens) are appended immediately to the state, ensuring that tokens appear live as they stream from the model.

### 3. Live Metrics Engine
* **Token Counter**: Increments a counter on every chunk received.
* **Tokens-per-Second (T/s)**: Calculates speed dynamically using `performance.now()`. The formula measures:
  $$\text{Tokens-per-second} = \frac{\text{Accumulated Token Count}}{\frac{\text{Current Time} - \text{Stream Start Time}}{1000}}$$
  Both metrics update continuously in the UI on every state change during streaming.

### 4. Error Handling Strategy
* **Failure Resilience**: The engine catches network drops, API time-outs, and abort signals during active streams.
* **Partial Output Preservation**: In case of a crash, the tokens streamed up to that point remain rendered in the chat bubble.
* **Visual Recovery States**: Renders an explicit red error message describing the failure (e.g. timeout or network disconnect) below the partial text, preventing sudden UI resets or blank screens.
* **Error Simulator**: Includes an toggle selector in settings to simulate timeouts, network drops, or interruptions for easy verification.

### 5. Accessibility (WCAG AA)
* **Semantic HTML**: Interactive elements use semantic markup (such as `button`, `select`, `input`, and `aside`).
* **Keyboard Navigable**: All fields and buttons are focusable and support standard keyboard interactions (`Tab`, `Space`, `Enter`).
* **Accessible Labeling**: Form inputs are paired with explicit `label` elements and `aria-labelledby`/`aria-checked` attributes.

---

## 🔍 Part B: Model Output Diff View & Algorithm Explanation

The side-by-side comparison interface compares outputs from Model A and Model B using a custom-built diff engine.

### 1. The Algorithm Used
The core diff engine implements a **Token-level Longest Common Subsequence (LCS)** algorithm paired with a contiguous segment grouping pass.

1. **Tokenization**:
   Splits strings into arrays of tokens (words and punctuation) using regular expressions to preserve whitespaces and capitalization formatting.
2. **Case-Insensitive LCS Dynamic Programming**:
   Generates a 2D grid of size $(U+1) \times (V+1)$ where $U$ and $V$ represent the token arrays. Matches are evaluated case-insensitively to ignore capitalization discrepancies (e.g., matching "The" with "the"), which is a common variance between models.
3. **Backtracking & Alignment**:
   Traverses the dynamic programming grid from the bottom-right corner. It categorizes tokens as:
   * `equal`: Present in both models (underlined for readability).
   * `delete`: Present only in Model A (highlighted red).
   * `insert`: Present only in Model B (highlighted green).
4. **Contiguous Grouping**:
   Merges sequential deletions or insertions into single blocks to improve readability.

---

### 2. Time & Space Complexity

Let $U$ be the number of tokens in Model A's output, and $V$ be the number of tokens in Model B's output.

* **Time Complexity**: $\mathcal{O}(U \times V)$
  Creating the Dynamic Programming matrix requires visiting every cell in a $U \times V$ grid. Backtracking through the matrix takes $\mathcal{O}(U + V)$ operations. Tokenization and contiguous grouping run in linear time $\mathcal{O}(U + V)$.
* **Space Complexity**: $\mathcal{O}(U \times V)$
  To store the dynamic programming grid of size $(U+1) \times (V+1)$.
* **Performance Optimization (Cache)**:
  Subsequent page toggles read from a cache map key (`${algo}:${textA}|||${textB}`), skipping matrix calculations entirely ($\mathcal{O}(1)$ time).

---

### 3. Selection Rationale: Why Token-level LCS over Alternatives?

#### 1. Why Token-level LCS over Standard Character-level LCS?
* **Character-level LCS** matches character-by-character. 
* **The Limitation**: Character-level comparison divides individual words when small changes occur. For example, comparing "cats" and "cot" highlights: `c[a->o]t[s]`. For large paragraph text, this creates a chaotic and unreadable wall of red and green highlights.
* **Our Selection**: Token-level LCS matches whole words and punctuation symbols. Changes are highlighted as complete word replacements (e.g. `[cats -> cot]`), matching how humans read. Additionally, token lengths are smaller than character lengths ($U \ll N$), reducing LCS matrix size and calculation times.

#### 2. Why Token-level LCS over Line-level LCS?
* **Line-level LCS** aligns text line-by-line.
* **The Limitation**: LLM outputs consist of long, continuous paragraphs of text without line breaks. A line-level diff engine would mark an entire multi-sentence paragraph as completely deleted and re-inserted if a single word or comma was changed.
* **Our Selection**: Comparing tokens detects changes *inside* sentences and paragraphs, mapping structural word-level alignments.

#### 3. Why Token-level LCS over Myers Diff?
* **Myers Diff** finds the Shortest Edit Script (SES) using a greedy search on an edit graph.
* **The Limitation**: Myers is optimized for line-oriented source code modifications (like Git patches), where code changes are block-structured. When applied to raw conversational text with word wrapping, Myers produces fragmented, non-contiguous edits that are difficult for human reviewers to parse.
* **Our Selection**: Token-level LCS paired with our contiguous grouping pass aligns continuous text blocks more naturally, grouping adjacent insertions or deletions into clean, human-readable blocks.

---

## 🛠️ Installation & Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/NormVg/dashboard.sarvam.git
   cd dashboard.sarvam
   ```
2. **Install packages**:
   ```bash
   pnpm install
   ```
3. **Run in development mode**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).
4. **Build production build**:
   ```bash
   pnpm build
   ```
