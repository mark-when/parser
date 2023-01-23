import { ParsingContext } from "../ParsingContext";
import { MARKWHEN_COLORS } from "../ColorUtils";
import { TAG_REGEX } from "../regex";
import { RangeType } from "../Types";

export function checkTags(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const matches = line.matchAll(TAG_REGEX);
  if (matches) {
    for (let m of matches) {
      if (!context.tags[m[1]]) {
        context.tags[m[1]] = MARKWHEN_COLORS[context.paletteIndex++ % MARKWHEN_COLORS.length].rgb;
      }
      const indexOfTag = line.indexOf("#" + m[1]);
      const from = lengthAtIndex[i] + indexOfTag;
      context.ranges.push({
        type: RangeType.Tag,
        from,
        to: from + m[1].length + 1,
        lineFrom: {
          line: i,
          index: indexOfTag,
        },
        lineTo: {
          line: i,
          index: indexOfTag + m[1].length + 1,
        },
        content: { tag: m[1], color: context.tags[m[1]] },
      });
    }
  }
  return false;
}
