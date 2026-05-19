# Sarvam AI Developer Dashboard

A high-performance developer portal and inference playground built with Next.js, TypeScript, and TailwindCSS.

* **Live Deployment**: [https://dashboard-sarvam.vercel.app/](https://dashboard-sarvam.vercel.app/)
* **Repository**: [https://github.com/NormVg/dashboard.sarvam](https://github.com/NormVg/dashboard.sarvam)

---

## 🚀 Key Features

* **Multi-Modal Input**: Toggle between text input and voice transcription powered by browser audio capture (`MediaRecorder`) and Sarvam's Speech-to-Text API.
* **Streaming Responses**: Live, token-by-token response rendering using `Fetch` and `ReadableStream`.
* **Real-Time Metrics**: Continuous calculation and display of active token count and speed (tokens/sec).
* **Fault Tolerance**: Partial outputs are preserved during mid-stream failures (e.g. network drops, timeouts) with clear error indicators.
* **Model Output Diff View**: Side-by-side comparison workspace using a custom-built, token-level comparison engine.

---

## 🔍 Core Diff Engine: Technical Details

### 1. The Algorithm Used
The diff viewer utilizes a **Token-level Longest Common Subsequence (LCS)** alignment algorithm.
* **Tokenization**: Input is split into punctuation and word tokens, preserving spacing.
* **Case-Insensitive DP Grid**: Computes a 2D dynamic programming grid to match tokens while ignoring casing variations.
* **Backtracking & Grouping**: Traverses the grid to categorize tokens as `equal` (shared), `delete` (Model A only), or `insert` (Model B only). Adjacent changes are grouped into contiguous visual blocks for readability.
* **Performance Caching**: In-memory `diffCache` provides $\mathcal{O}(1)$ retrieval for previously calculated diff pairs.

### 2. Complexity Analysis
Let $U$ and $V$ be the token lengths of Model A and Model B outputs respectively.
* **Time Complexity**: $\mathcal{O}(U \times V)$ to construct the dynamic programming grid. Backtracking and grouping run in $\mathcal{O}(U + V)$ time.
* **Space Complexity**: $\mathcal{O}(U \times V)$ to allocate the 2D grid matrix.

---

### 3. Selection Rationale: Why Token-Level LCS?

| Alternative | How It Works | Why Token LCS is Better |
| :--- | :--- | :--- |
| **Character-Level LCS** | Matches character-by-character. | Jarring visual splits (e.g. `c[a->o]t[s]`). Token-level aligns whole words (`[cats -> cot]`), matching human reading patterns. |
| **Line-Level LCS** | Aligns text line-by-line. | LLM outputs are long paragraphs; any small change would highlight an entire multi-sentence paragraph. |
| **Myers Diff** | Shortest Edit Script greedy search. | Optimized for line-oriented source code (Git patches). Produces fragmented, unreadable highlights on conversational prose. |

---

## 🛠️ Setup & Execution

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```
2. **Local Dev Server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).
3. **Production Build**:
   ```bash
   pnpm build
   ```
