# Sarvam AI Playground & Diff Dashboard

A premium, interactive AI dashboard featuring a single-model Playground (supporting voice transcription) and a side-by-side model response Diff Viewer. 

* **Live Deployment:** [https://dashboard-sarvam.vercel.app/](https://dashboard-sarvam.vercel.app/)

---

## Key Features

### 1. Model Playground (`/playground`)
* **Dual Providers**: Seamless support for streaming completions from **Sarvam AI** cloud models (e.g., `sarvam-105b`, `sarvam-30b`) and **Local Ollama** servers (`http://localhost:11434`).
* **Rich Settings Control**: Sidebar hyperparameters adjustment for Temperature, Top P, Max Tokens, and System Instructions.
* **Voice-to-Text Integration**: Hands-free voice messaging powered by `useMicrophone` browser capture and Sarvam's `v1/speech-to-text` (Whisper) endpoint.
* **Error Resilience Testing**: Simulate network drops, time-outs, or interrupted streams to test interface robustness.

### 2. Side-by-Side Diff Viewer (`/diff`)
* **Visual Word Alignment**: Compares responses from two different models (Model A and Model B) side-by-side.
* **Smart Highlighting**: Identifies exactly what changed. Common segments are underlined, while additions are marked green and deletions red.
* **Local State Caching**: Local settings (selected diff mode, model parameters) are synchronized with `localStorage`.
* **In-Memory Diff Cache**: Saves previously computed diff maps so toggling views is instantaneous and consumes zero redundant CPU cycles.

### 3. Tactile Audio & Animations
* **Spring Animations**: Uses `framer-motion` to animate settings drawers, active navigation tabs, and model provider pills.
* **Audio Feedback**: Subtle click, pop, and drop sound effects on button selections and sliders (using `@thenormvg/web-have-sounds`).

---

## Core Diff Engine: Technical Deep Dive

### The Algorithm Used

The Diff engine implements a custom **Token-level Longest Common Subsequence (LCS)** algorithm with backtracking and contiguous segment grouping.

1. **Tokenization**:
   The input texts $A$ and $B$ are split into tokens (words and punctuation) while preserving trailing whitespace and formatting. This ensures formatting remains intact when reconstructed.
2. **LCS Grid Generation**:
   A standard 2D dynamic programming grid is computed. Since JavaScript string conversions and comparisons are expensive, tokens are pre-normalized and comparisons are case-insensitive, drastically reducing CPU overhead.
3. **Backtracking**:
   The engine backtracks through the grid from the bottom-right corner to reconstruct the alignment path, categorizing token operations as:
   * `equal` (Token is in both outputs - underlined to guide reading).
   * `delete` (Token is only in Model A - highlighted in red).
   * `insert` (Token is only in Model B - highlighted in green).
4. **Contiguous Grouping**:
   Conjoining insert/delete blocks are grouped into single segments to prevent scattered word-by-word highlights and improve visual readability.

---

### Time & Space Complexity

Let $U$ be the number of tokens in text $A$, and $V$ be the number of tokens in text $B$.

* **Time Complexity**: $\mathcal{O}(U \times V)$
  Generating the LCS matrix requires filling a $U \times V$ grid. Backtracking through the matrix takes $\mathcal{O}(U + V)$ steps. Tokenization and segment post-processing run in linear time $\mathcal{O}(U + V)$.
* **Space Complexity**: $\mathcal{O}(U \times V)$
  To store the dynamic programming grid of size $(U+1) \times (V+1)$.
* **Optimization (In-Memory Cache)**:
  Subsequent diff calls for the same text pair run in $\mathcal{O}(1)$ time by reading from a global cache map key (`${algo}:${textA}|||${textB}`), eliminating matrix re-allocations on view toggles.

---

### Selection Rationale: Why LCS over Alternatives?

#### 1. Why Token-level LCS over Myers Diff?
* **Myers Diff** (used in `git diff`) finds the Shortest Edit Script (SES) in $\mathcal{O}(ND)$ time where $D$ is the edit distance. 
* **Myers' limitation**: Myers is heavily optimized for line-by-line code comparisons. It performs poorly on long paragraphs of natural text, marking entire paragraphs or sentences as deleted/added if even a single word changes. 
* **LCS Advantage**: Token-level LCS is specifically designed for text alignment. It aligns words across wraps and paragraphs, locating word-level variations within a sentence rather than highlighting entire lines.

#### 2. Why Token-level LCS over Character-level LCS?
* **Character-level LCS** matches character-by-character. 
* **Character-level limitation**: It creates visually jarring splits. For instance, comparing "cats" and "cot" might render as `c[a->o]t[s]`, splitting word roots. When comparing multi-sentence LLM responses, this level of granularity creates a noisy, unreadable wall of red and green highlights.
* **LCS Advantage**: Comparing token-by-token aligns words cleanly. A modified word is highlighted as a complete unit (e.g. `[cats -> cot]`), matching how humans read and write.

---

## Local Development Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NormVg/dashboard.sarvam.git
   cd dashboard.sarvam
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   NEXT_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key_here
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

5. **Build for production**:
   ```bash
   pnpm build
   ```
