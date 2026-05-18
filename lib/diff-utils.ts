import * as diff from 'diff';

export type DiffOp = {
  type: 'equal' | 'insert' | 'delete';
  text: string;
};

export type DiffAlgorithm = 'none' | 'custom' | 'lcs' | 'myers';

export function computeMyersDiff(textA: string, textB: string): { diffA: DiffOp[], diffB: DiffOp[] } {
  // textA is old, textB is new.
  const changes = diff.diffWordsWithSpace(textA, textB);
  
  const diffA: DiffOp[] = [];
  const diffB: DiffOp[] = [];

  for (const change of changes) {
    if (change.added) {
      diffB.push({ type: 'insert', text: change.value });
    } else if (change.removed) {
      diffA.push({ type: 'delete', text: change.value });
    } else {
      diffA.push({ type: 'equal', text: change.value });
      diffB.push({ type: 'equal', text: change.value });
    }
  }

  return { diffA, diffB };
}

// Custom DP-based Longest Common Subsequence (word level)
export function computeLcsDiff(textA: string, textB: string): { diffA: DiffOp[], diffB: DiffOp[] } {
  const tokenize = (str: string) => str.match(/(\s+|\S+)/g) || [];
  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);

  const m = wordsA.length;
  const n = wordsB.length;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsWordsA: { text: string, lcs: boolean }[] = [];
  const lcsWordsB: { text: string, lcs: boolean }[] = [];

  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (wordsA[i - 1] === wordsB[j - 1]) {
      lcsWordsA.unshift({ text: wordsA[i - 1], lcs: true });
      lcsWordsB.unshift({ text: wordsB[j - 1], lcs: true });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      lcsWordsA.unshift({ text: wordsA[i - 1], lcs: false });
      i--;
    } else {
      lcsWordsB.unshift({ text: wordsB[j - 1], lcs: false });
      j--;
    }
  }

  while (i > 0) {
    lcsWordsA.unshift({ text: wordsA[i - 1], lcs: false });
    i--;
  }
  while (j > 0) {
    lcsWordsB.unshift({ text: wordsB[j - 1], lcs: false });
    j--;
  }

  const combine = (arr: { text: string, lcs: boolean }[], targetType: 'delete' | 'insert'): DiffOp[] => {
     const res: DiffOp[] = [];
     let currentType: DiffOp['type'] | null = null;
     let currentText = '';

     for(const item of arr) {
       const type = item.lcs ? 'equal' : targetType;
       if (currentType === type) {
          currentText += item.text;
       } else {
          if (currentType) res.push({ type: currentType, text: currentText });
          currentType = type;
          currentText = item.text;
       }
     }
     if (currentType) res.push({ type: currentType, text: currentText });
     return res;
  }

  return {
    diffA: combine(lcsWordsA, 'delete'),
    diffB: combine(lcsWordsB, 'insert'),
  }
}

export function computeCustomDiff(textA: string, textB: string): { diffA: DiffOp[], diffB: DiffOp[] } {
  // Placeholder for "mine own" implementation
  return {
    diffA: [{ type: 'equal', text: textA }],
    diffB: [{ type: 'equal', text: textB }]
  };
}

export function computeDiff(algo: DiffAlgorithm, textA: string, textB: string): { diffA: DiffOp[], diffB: DiffOp[] } {
  if (!textA && !textB) return { diffA: [], diffB: [] };

  switch (algo) {
    case 'myers':
      return computeMyersDiff(textA, textB);
    case 'lcs':
      return computeLcsDiff(textA, textB);
    case 'custom':
      return computeCustomDiff(textA, textB);
    case 'none':
    default:
      return {
        diffA: [{ type: 'equal', text: textA }],
        diffB: [{ type: 'equal', text: textB }]
      };
  }
}
