export interface Chunk {
  content: string;
  chunkIndex: number;
  metadata: {
    startOffset: number;
    endOffset: number;
  };
}

type Range = {
  start: number;
  end: number;
};

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 150;

function findHeadingSplitPoints(text: string, start: number, end: number) {
  const slice = text.slice(start, end);
  const regex = /^#{1,3}\s.+$/gm;
  const points: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(slice)) !== null) {
    const absoluteIndex = start + match.index;
    if (absoluteIndex > start) {
      points.push(absoluteIndex);
    }
  }

  return points;
}

function findSeparatorSplitPoints(
  text: string,
  start: number,
  end: number,
  separator: string
) {
  const points: number[] = [];
  let cursor = start;

  while (cursor < end) {
    const index = text.indexOf(separator, cursor);
    if (index === -1 || index >= end) {
      break;
    }

    const splitPoint = index + separator.length;
    if (splitPoint > start && splitPoint < end) {
      points.push(splitPoint);
    }

    cursor = index + separator.length;
  }

  return points;
}

function findPunctuationSplitPoints(text: string, start: number, end: number) {
  const slice = text.slice(start, end);
  const regex = /[。.]/g;
  const points: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(slice)) !== null) {
    const splitPoint = start + match.index + 1;
    if (splitPoint > start && splitPoint < end) {
      points.push(splitPoint);
    }
  }

  return points;
}

function splitByPoints(start: number, end: number, points: number[]) {
  const ranges: Range[] = [];
  let cursor = start;

  for (const point of points) {
    if (point <= cursor || point >= end) {
      continue;
    }

    ranges.push({ start: cursor, end: point });
    cursor = point;
  }

  if (cursor < end) {
    ranges.push({ start: cursor, end });
  }

  return ranges;
}

function forceSplit(start: number, end: number, chunkSize: number) {
  const ranges: Range[] = [];

  for (let cursor = start; cursor < end; cursor += chunkSize) {
    ranges.push({
      start: cursor,
      end: Math.min(cursor + chunkSize, end),
    });
  }

  return ranges;
}

function getSplitPointsByLevel(
  text: string,
  start: number,
  end: number,
  level: number
) {
  if (level === 0) {
    return findHeadingSplitPoints(text, start, end);
  }

  if (level === 1) {
    return findSeparatorSplitPoints(text, start, end, "\n\n");
  }

  if (level === 2) {
    return findSeparatorSplitPoints(text, start, end, "\n");
  }

  if (level === 3) {
    return findPunctuationSplitPoints(text, start, end);
  }

  return [];
}

function mergeSmallRanges(ranges: Range[], chunkSize: number) {
  const merged: Range[] = [];
  let pending: Range | null = null;

  for (const range of ranges) {
    if (!pending) {
      pending = { ...range };
      continue;
    }

    if (range.end - pending.start <= chunkSize) {
      pending = {
        start: pending.start,
        end: range.end,
      };
      continue;
    }

    merged.push(pending);
    pending = { ...range };
  }

  if (pending) {
    merged.push(pending);
  }

  return merged;
}

function recursiveSplit(
  text: string,
  start: number,
  end: number,
  level: number,
  chunkSize: number
): Range[] {
  if (end - start <= chunkSize) {
    return [{ start, end }];
  }

  if (level > 3) {
    return forceSplit(start, end, chunkSize);
  }

  const points = getSplitPointsByLevel(text, start, end, level);
  if (points.length === 0) {
    return recursiveSplit(text, start, end, level + 1, chunkSize);
  }

  // 先按当前优先级切分，再把超长片段递归降级处理，确保尽量保留语义边界
  const splitRanges = splitByPoints(start, end, points);
  const normalizedRanges: Range[] = [];

  for (const range of splitRanges) {
    if (range.end - range.start <= chunkSize) {
      normalizedRanges.push(range);
      continue;
    }

    normalizedRanges.push(
      ...recursiveSplit(text, range.start, range.end, level + 1, chunkSize)
    );
  }

  return mergeSmallRanges(normalizedRanges, chunkSize);
}

function withOverlap(
  text: string,
  ranges: Range[],
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  const chunks: Chunk[] = [];

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];

    let startOffset = range.start;
    if (index > 0) {
      // 后一个 chunk 向前回退 overlap，保证检索时上下文连续
      startOffset = Math.max(0, range.start - chunkOverlap);
    }

    if (range.end - startOffset > chunkSize) {
      startOffset = range.end - chunkSize;
    }

    const content = text.slice(startOffset, range.end);
    if (!content.trim()) {
      continue;
    }

    chunks.push({
      content,
      chunkIndex: chunks.length,
      metadata: {
        startOffset,
        endOffset: range.end,
      },
    });
  }

  return chunks;
}

export function splitTextIntoChunks(
  text: string,
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
  }
) {
  if (!text.trim()) {
    return [];
  }

  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const ranges = recursiveSplit(text, 0, text.length, 0, chunkSize);
  return withOverlap(text, ranges, chunkSize, chunkOverlap);
}
