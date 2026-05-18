export type DiffOp = {
  type: 'equal' | 'insert' | 'delete';
  text: string;
};

export type DiffAlgorithm = 'none' | 'diff';

/**
 * Your own diff implementation goes here.
 * Takes two texts and returns per-side diff operations.
 */
export function computeCustomDiff(textA: string, textB: string): { diffA: DiffOp[], diffB: DiffOp[] } {
  // TODO: Write your own diff algorithm here
  return {
    diffA: [{ type: 'equal', text: textA }],
    diffB: [{ type: 'equal', text: textB }]
  };
}

export function computeDiff(algo: DiffAlgorithm, textA: string, textB: string): { diffA: DiffOp[], diffB: DiffOp[] } {
  if (!textA && !textB) return { diffA: [], diffB: [] };

  switch (algo) {
    case 'diff':
      return computeCustomDiff(textA, textB);
    case 'none':
    default:
      return {
        diffA: [{ type: 'equal' as const, text: textA }],
        diffB: [{ type: 'equal' as const, text: textB }]
      };
  }
}
