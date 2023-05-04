import { ParsingContext } from "../ParsingContext.js";
import { TAG_REGEX } from "../regex.js";
import { RangeType } from "../Types.js";

export function checkHeaderTags(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): string {
  const replacer = (
    match: string,
    preHashWhitespace: string,
    tagName: string,
    offset: number,
    str: string
  ) => {
    // Only add the tag if it is a key. It is a key if there is nothing before it,
    // i.e. its offset in the string is 0.
    if (offset === 0) {
      const from = lengthAtIndex[i] + offset + preHashWhitespace.length;
      context.ranges.push({
        type: RangeType.Tag,
        from,
        to: from + tagName.length + 1,
        lineFrom: {
          line: i,
          index: offset + preHashWhitespace.length,
        },
        lineTo: {
          line: i,
          index: offset + preHashWhitespace.length + 1 + tagName.length,
        },
        content: {
          tag: tagName
        }
      });
    }

    // Regardless of whether this was a tag/header key or not (could be hex color),
    // replace the hash with a right paren so we can parse it
    return `${preHashWhitespace})${tagName}`;
  };
  return line.replace(/(^|\W+)#(\w+)/g, replacer);
}

export function checkTags(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const matches = line.matchAll(TAG_REGEX);
  if (matches) {
    for (let m of matches) {
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
        content: { tag: m[1] },
      });

      // Add it to the header as a tag, that is, with a right paren
      // instead of hash
      if (!context.header[')' + m[1]]) {
        context.header[')' + m[1]] = undefined;
      }
    }
  }
  return false;
}
