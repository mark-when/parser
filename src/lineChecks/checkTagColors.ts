import { ParsingContext } from "../ParsingContext";
import { hexToRgb, HUMAN_COLORS_MAP, HTML_COLORS_MAP, MARKWHEN_COLORS } from "../ColorUtils";
import { TAG_COLOR_REGEX } from "../regex";
import { RangeType } from "../Types";

export function checkTagColors(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const tagColorMatch = line.match(TAG_COLOR_REGEX);
  if (tagColorMatch) {
    const tagName = tagColorMatch.groups!.tagName;

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

    // One of the following is cases is guaranteed to be true based on how TAG_COLOR_REGEX is structured.
    if (tagColorMatch.groups!.color_named) {
      const colorDef = tagColorMatch.groups!.color_named.toLowerCase();
      if (HUMAN_COLORS_MAP.has(colorDef)) {
        context.tags[tagName] = HUMAN_COLORS_MAP.get(colorDef)!.rgb;
      } else {
        // Named color is not recognized. Default to the next markwhen color.
        context.tags[tagName] = MARKWHEN_COLORS[context.paletteIndex++ % MARKWHEN_COLORS.length].rgb;
      }
    }
    if (tagColorMatch.groups!.color_html) {
      const colorDef = tagColorMatch.groups!.color_html.toLowerCase();
      if (HTML_COLORS_MAP.has(colorDef)) {
        context.tags[tagName] = HTML_COLORS_MAP.get(colorDef)!.rgb;
      } else {
        // Named color is not recognized. Default to the next markwhen color.
        context.tags[tagName] = MARKWHEN_COLORS[context.paletteIndex++ % MARKWHEN_COLORS.length].rgb;
      }
    }
    if (tagColorMatch.groups!.color_hex) {
      const colorDef = tagColorMatch.groups!.color_hex;
      const rgb = hexToRgb(colorDef);
      if (rgb) {
        context.tags[tagName] = rgb;
      } else {
        // Named color is not recognized. Default to the next markwhen color.
        context.tags[tagName] = MARKWHEN_COLORS[context.paletteIndex++ % MARKWHEN_COLORS.length].rgb;
      }
    }

    const colorDef = tagColorMatch.groups!.colorDef;
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