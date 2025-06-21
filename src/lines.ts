import { Text } from "@codemirror/state";

export const linesAndLengths = (timelineString: string | string[] | Text) => {
  const lines =
    timelineString instanceof Text
      ? timelineString.toJSON()
      : Array.isArray(timelineString)
      ? timelineString
      : timelineString.split("\n");
  let lengthAtIndex: number[] = [];
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