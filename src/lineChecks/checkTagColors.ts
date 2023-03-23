import { ParsingContext } from "../ParsingContext.js";
import { HUMAN_COLORS, hexToRgb, COLORS } from "../ColorUtils.js";
import { TAG_COLOR_REGEX } from "../regex.js";
import { RangeType } from "../Types.js";

export function checkTagColors(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const tagColorMatch = line.match(TAG_COLOR_REGEX);
  if (tagColorMatch) {
    const tagName = tagColorMatch[1];
    const colorDef = tagColorMatch[2];
    const humanColorIndex = HUMAN_COLORS.indexOf(colorDef);
    if (humanColorIndex === -1) {
      const rgb = hexToRgb(colorDef);
      if (rgb) {
        context.tags[tagName] = rgb;
      } else {
        context.tags[tagName] = COLORS[context.paletteIndex++ % COLORS.length];
      }
    } else {
      context.tags[tagName] = COLORS[humanColorIndex];
    }
    const indexOfTag = line.indexOf(tagName);
    const from = lengthAtIndex[i] + indexOfTag - 1;
    context.ranges.push({
      type: RangeType.Tag,
      from,
      to: from + tagName.length + 1,
      lineFrom: {
        line: i,
        index: indexOfTag - 1,
      },
      lineTo: {
        line: i,
        index: indexOfTag + tagName.length,
      },
      content: { tag: tagName, color: context.tags[tagName] },
    });

    const indexOfColorDefPlusLength = line.indexOf(colorDef) + colorDef.length;
    context.ranges.push({
      type: RangeType.tagDefinition,
      from,
      to: from + indexOfColorDefPlusLength,
      lineFrom: {
        line: i,
        index: indexOfTag - 1,
      },
      lineTo: {
        line: i,
        index: indexOfTag - 1 + indexOfColorDefPlusLength,
      },
      content: { tag: tagName, color: context.tags[tagName] },
    });
    return true;
  }
  return false;
}