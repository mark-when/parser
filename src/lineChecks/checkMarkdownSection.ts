import { ParsingContext } from "../ParsingContext.js";
import { MARKDOWN_SECTION_REGEX, TAG_REGEX } from "../regex.js";
import { EventGroup, RangeType } from "../Types.js";
import { parseZone } from "../zones/parseZone.js";
import { parseProperties } from "../parseHeader.js";

/**
 * Check for markdown-style section headers (# through ######)
 * These are "greedy" sections that auto-close when a same or higher level section is encountered.
 */
export function checkMarkdownSection(
  lines: string[],
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): { end: number } | false {
  const line = lines[i];
  const match = line.match(MARKDOWN_SECTION_REGEX);

  if (!match) {
    return false;
  }

  const hashes = match[1];
  const level = hashes.length; // 1-6
  const titleText = match[2];

  // Close any open sections at the same level or deeper
  // sectionLevels tracks the level of each open section in currentPath
  // We need to close sections until we're at a level less than the new section
  while (context.sectionLevels.length > 0) {
    const lastLevel = context.sectionLevels[context.sectionLevels.length - 1];
    if (lastLevel >= level) {
      // Close this section
      context.sectionLevels.pop();
      context.endCurrentGroup(lengthAtIndex[i], {
        line: i,
        index: 0,
      });
    } else {
      break;
    }
  }

  // Create the range for syntax highlighting
  const range = {
    from: lengthAtIndex[i],
    to: lengthAtIndex[i] + line.length,
    type: RangeType.Section,
  };
  context.ranges.push(range);

  // Create the group
  const group = parseMarkdownSection(titleText, range);

  // Parse properties on subsequent lines
  const {
    properties,
    i: end,
    propOrder,
    range: propRange,
  } = parseProperties(lines, lengthAtIndex, i + 1, context);

  group.properties = properties;
  group.propOrder = propOrder;
  group.textRanges.properties = propRange;

  // Handle style property - default to 'group' if not specified
  if (properties.style === "section" || properties.style === "group") {
    group.style = properties.style;
  }

  // Handle timezone
  let tz = properties.timezone || properties.tz;
  if (typeof tz !== "string" && typeof tz !== "number") {
    tz = undefined;
  }
  if (tz) {
    const zone = parseZone(tz, context.cache);
    if (!zone) {
      context.parseMessages.push({
        type: "error",
        message: `Unable to parse timezone "${tz}"`,
        pos: [range.from, range.to],
      });
    }
  }

  // Push the group and track its level
  context.push(group);
  context.sectionLevels.push(level);

  context.startFoldableSection({
    type: RangeType.Section,
    startLine: i,
    startIndex: lengthAtIndex[i],
    endIndex: lengthAtIndex[i] + line.length,
    foldStartIndex: lengthAtIndex[i] + line.length,
  });

  return { end };
}

/**
 * Parse a markdown section header into an EventGroup
 */
function parseMarkdownSection(titleText: string, range: { from: number; to: number; type: RangeType }): EventGroup {
  const group = new EventGroup();
  group.tags = [];
  group.style = "group"; // Default style
  group.startExpanded = true; // Markdown sections start expanded by default
  group.textRanges = {
    whole: range,
    definition: {
      from: range.from,
      to: range.to,
      type: RangeType.SectionDefinition,
    },
  };

  // Extract tags from the title
  let title = titleText.replace(TAG_REGEX, (match, tag) => {
    if (!group.tags!.includes(tag)) {
      group.tags!.push(tag);
    }
    return "";
  });

  group.title = title.trim();
  return group;
}
