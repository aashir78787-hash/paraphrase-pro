import { DiffSegment, TextMetrics } from '../types';

export function calculateTextMetrics(text: string): TextMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      words: 0,
      characters: 0,
      sentences: 0,
      readingTimeSeconds: 0,
      fleschKincaidGrade: 0,
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;

  // Syllable estimation for Flesch-Kincaid
  const syllableCount = estimateSyllables(trimmed);
  const wordsPerSentence = words / sentences;
  const syllablesPerWord = words > 0 ? syllableCount / words : 0;
  
  // Flesch-Kincaid Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  let fleschKincaidGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  fleschKincaidGrade = Math.max(1, Math.min(Math.round(fleschKincaidGrade * 10) / 10, 18));

  // Average reading speed ~ 200 words per minute => 3.33 words/second
  const readingTimeSeconds = Math.max(1, Math.round((words / 200) * 60));

  return {
    words,
    characters,
    sentences,
    readingTimeSeconds,
    fleschKincaidGrade,
  };
}

function estimateSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length <= 3) {
      count += 1;
      continue;
    }
    const matches = clean.match(/[aeiouy]{1,2}/g);
    let wordSyllables = matches ? matches.length : 1;
    if (clean.endsWith('e') && !clean.endsWith('le') && wordSyllables > 1) {
      wordSyllables -= 1;
    }
    count += Math.max(1, wordSyllables);
  }
  return count;
}

// LCS-based word diffing
export function computeWordDiff(original: string, paraphrased: string): DiffSegment[] {
  const origWords = original.split(/(\s+)/);
  const paraWords = paraphrased.split(/(\s+)/);

  // Compute Longest Common Subsequence of tokens
  const n = origWords.length;
  const m = paraWords.length;

  // Simple optimization for large inputs
  if (n * m > 1000000) {
    // Return simple representation if too massive
    return [
      { type: 'unchanged', text: paraphrased }
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origWords[i - 1].toLowerCase() === paraWords[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const rawSegments: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1].toLowerCase() === paraWords[j - 1].toLowerCase()) {
      rawSegments.unshift({ type: 'unchanged', text: paraWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawSegments.unshift({ type: 'added', text: paraWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawSegments.unshift({ type: 'removed', text: origWords[i - 1] });
      i--;
    }
  }

  // Merge consecutive segments of same type
  const merged: DiffSegment[] = [];
  for (const seg of rawSegments) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

// Calculate lexical Jaccard distance for similarity / divergence
export function calculateDivergenceScore(original: string, paraphrased: string): number {
  const getTokens = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const setA = getTokens(original);
  const setB = getTokens(paraphrased);

  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  const jaccardSimilarity = intersection.size / union.size;
  // Divergence score is 1 - similarity
  const divergence = Math.round((1 - jaccardSimilarity) * 100);
  return Math.min(100, Math.max(0, divergence));
}
