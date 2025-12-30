import { Text } from "@codemirror/state";

export const linesAndLengths = (timelineString: string | string[] | Text) => {
  const lines: string[] = [];

  if (timelineString instanceof Text) {
    // Use Text.iterLines when available to avoid serializing the entire document
    if (typeof (timelineString as any).iterLines === "function") {
      for (const line of (timelineString as any).iterLines()) {
        lines.push(line as string);
      }
    } else {
      lines.push(...timelineString.toJSON());
    }
  } else if (Array.isArray(timelineString)) {
    lines.push(...timelineString);
  } else {
    lines.push(...timelineString.split("\n"));
  }

  const lengthAtIndex: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      lengthAtIndex.push(0);
    }
    lengthAtIndex.push(
      (i === lines.length - 1 ? 0 : 1) +
        lines[i].length +
        lengthAtIndex[lengthAtIndex.length - 1] || 0
    );
  }
  return { lines, lengthAtIndex };
};