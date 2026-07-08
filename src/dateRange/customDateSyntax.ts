import { DateTime, DurationLikeObject } from "luxon";
import { ParsingContext } from "../ParsingContext.js";
import {
  DateRangePart,
  DateTimeGranularity,
  GranularDateTime,
  Range,
  RangeType,
} from "../Types.js";
import { roundDateUp } from "./utils.js";

type CustomDateSyntaxPriority = "first" | "last" | "only";

type CustomDateSyntaxRule = {
  name?: string;
  pattern?: unknown;
  from?: unknown;
  fromFormat?: unknown;
  to?: unknown;
  toFormat?: unknown;
  duration?: unknown;
};

type CompiledCustomDateSyntaxRule = CustomDateSyntaxRule & {
  pattern: string;
  regex: RegExp;
};

export type CompiledCustomDateSyntax = {
  priority: CustomDateSyntaxPriority;
  rules: CompiledCustomDateSyntaxRule[];
};

const validPriorities = new Set(["first", "last", "only"]);

function syntaxConfig(context: ParsingContext) {
  const config = context.header?.dateSyntax;
  if (!config) {
    return;
  }
  if (Array.isArray(config)) {
    return {
      priority: "first",
      rules: config,
    };
  }
  if (typeof config === "object") {
    return {
      priority: config.priority,
      rules: config.rules,
    };
  }
}

function dateSyntaxError(context: ParsingContext, message: string) {
  context.parseMessages.push({
    type: "error",
    message: `Invalid dateSyntax: ${message}`,
    pos: [0, 0],
  });
}

export function getCustomDateSyntax(
  context: ParsingContext
): CompiledCustomDateSyntax | undefined {
  if (context.customDateSyntax) {
    return context.customDateSyntax;
  }

  const config = syntaxConfig(context);
  if (!config) {
    return;
  }

  let priority: CustomDateSyntaxPriority = "first";
  if (typeof config.priority !== "undefined") {
    if (validPriorities.has(config.priority)) {
      priority = config.priority as CustomDateSyntaxPriority;
    } else {
      dateSyntaxError(
        context,
        `priority must be one of "first", "last", or "only"`
      );
    }
  }

  let rules: CustomDateSyntaxRule[] = [];
  if (Array.isArray(config.rules)) {
    rules = config.rules;
  } else {
    dateSyntaxError(context, "rules must be a list");
    priority = "last";
  }
  const compiledRules: CompiledCustomDateSyntaxRule[] = [];

  rules.forEach((rule: CustomDateSyntaxRule, index) => {
    if (!rule || typeof rule !== "object") {
      return;
    }
    if (typeof rule.pattern !== "string") {
      context.parseMessages.push({
        type: "error",
        message: `Invalid dateSyntax rule ${index + 1}: pattern must be a string`,
        pos: [0, 0],
      });
      return;
    }
    try {
      compiledRules.push({
        ...rule,
        pattern: rule.pattern,
        regex: new RegExp(rule.pattern),
      });
    } catch (e) {
      context.parseMessages.push({
        type: "error",
        message: `Invalid dateSyntax rule ${index + 1} pattern: ${
          e instanceof Error ? e.message : `${e}`
        }`,
        pos: [0, 0],
      });
    }
  });

  context.customDateSyntax = { priority, rules: compiledRules };
  return context.customDateSyntax;
}

export function customDateSyntaxPriority(
  context: ParsingContext
): CustomDateSyntaxPriority {
  return getCustomDateSyntax(context)?.priority ?? "last";
}

export function isCustomDateSyntaxEventStart(
  line: string,
  context: ParsingContext
) {
  return !!matchCustomDateSyntaxRule(line, context);
}

function matchCustomDateSyntaxRule(line: string, context: ParsingContext) {
  const syntax = getCustomDateSyntax(context);
  if (!syntax?.rules.length) {
    return;
  }

  const lineMatch = line.match(/^(\s*)([^:]+)\s*:(.*)$/);
  if (!lineMatch) {
    return;
  }
  const [, leadingWhitespace, rawDatePart, eventText] = lineMatch;
  const datePart = rawDatePart.trimEnd();
  for (const rule of syntax.rules) {
    const match = datePart.match(rule.regex);
    if (match) {
      return {
        datePart,
        eventText,
        indexOfDateRange: leadingWhitespace.length,
        match,
        rule,
      };
    }
  }
}

function template(raw: unknown, match: RegExpMatchArray): string | undefined {
  if (typeof raw === "number") {
    return `${raw}`;
  }
  if (typeof raw !== "string") {
    return;
  }
  return raw.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? "");
}

function granularityFromFormat(format: string): DateTimeGranularity {
  if (/[dD]/.test(format)) {
    return "day";
  }
  if (/[WL]/.test(format)) {
    return "week";
  }
  if (/[M]/.test(format)) {
    return "month";
  }
  if (/[yku]/.test(format)) {
    return "year";
  }
  return "instant";
}

function parseDateTime(
  value: string,
  format: string,
  context: ParsingContext
): GranularDateTime | undefined {
  let dateTime: DateTime;
  try {
    dateTime = DateTime.fromFormat(value, format, {
      setZone: true,
      zone: context.timezone,
    });
  } catch {
    return;
  }
  if (!dateTime.isValid) {
    return;
  }
  return {
    dateTimeIso: dateTime.toISO()!,
    granularity: granularityFromFormat(format),
  };
}

function parseDatePart(
  part: unknown,
  format: unknown,
  match: RegExpMatchArray,
  context: ParsingContext
): GranularDateTime | undefined {
  if (typeof part === "object" && part !== null && !Array.isArray(part)) {
    const objectPart = part as Record<string, unknown>;
    const objectFormat = objectPart.format ?? format;
    if (typeof objectFormat !== "string") {
      return;
    }
    const group = objectPart.group;
    const value =
      typeof group === "number" || typeof group === "string"
        ? match[Number(group)]
        : template(objectPart.template ?? objectPart.value, match);
    if (!value) {
      return;
    }
    return parseDateTime(value, objectFormat, context);
  }

  const stringFormat = typeof format === "string" ? format : undefined;
  if (!stringFormat) {
    return;
  }
  const value =
    typeof part === "undefined" ? match[0] : template(part, match) ?? match[0];
  return parseDateTime(value, stringFormat, context);
}

function durationFromString(
  rawDuration: unknown,
  match: RegExpMatchArray
): DurationLikeObject | undefined {
  const duration = template(rawDuration, match);
  if (!duration) {
    return;
  }

  const result: DurationLikeObject = {};
  const durationRegex =
    /(-?\d+(?:\.\d+)?)\s*(quarters?|years?|months?|weeks?|days?|hours?|minutes?|seconds?|milliseconds?)/gi;
  let durationMatch: RegExpExecArray | null;
  while ((durationMatch = durationRegex.exec(duration))) {
    const amount = Number(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (Number.isNaN(amount)) {
      continue;
    }
    if (unit.startsWith("quarter")) {
      result.months = (result.months ?? 0) + amount * 3;
    } else if (unit.startsWith("year")) {
      result.years = (result.years ?? 0) + amount;
    } else if (unit.startsWith("month")) {
      result.months = (result.months ?? 0) + amount;
    } else if (unit.startsWith("week")) {
      result.weeks = (result.weeks ?? 0) + amount;
    } else if (unit.startsWith("day")) {
      result.days = (result.days ?? 0) + amount;
    } else if (unit.startsWith("hour")) {
      result.hours = (result.hours ?? 0) + amount;
    } else if (unit.startsWith("minute")) {
      result.minutes = (result.minutes ?? 0) + amount;
    } else if (unit.startsWith("second")) {
      result.seconds = (result.seconds ?? 0) + amount;
    } else if (unit.startsWith("millisecond")) {
      result.milliseconds = (result.milliseconds ?? 0) + amount;
    }
  }

  return Object.keys(result).length ? result : undefined;
}

export function getDateRangeFromCustomDateSyntaxMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): DateRangePart | undefined {
  const matched = matchCustomDateSyntaxRule(line, context);
  if (!matched) {
    return;
  }

  const dateRangeInText: Range = {
    type: RangeType.DateRange,
    from: lengthAtIndex[i] + matched.indexOfDateRange,
    to: lengthAtIndex[i] + matched.indexOfDateRange + matched.datePart.length,
  };

  const from = parseDatePart(
    matched.rule.from,
    matched.rule.fromFormat,
    matched.match,
    context
  );
  if (!from) {
    context.parseMessages.push({
      type: "error",
      message: `Invalid dateSyntax rule${
        matched.rule.name ? ` "${matched.rule.name}"` : ""
      }: unable to parse start date`,
      pos: [dateRangeInText.from, dateRangeInText.to],
    });
    return;
  }

  const fromDateTime = DateTime.fromISO(from.dateTimeIso, {
    setZone: true,
    zone: context.timezone,
  });
  let toDateTime: DateTime | undefined;
  const to = parseDatePart(
    matched.rule.to,
    matched.rule.toFormat,
    matched.match,
    context
  );
  if (to) {
    toDateTime = DateTime.fromISO(roundDateUp(to, context), {
      setZone: true,
      zone: context.timezone,
    });
  }

  if (!toDateTime) {
    const duration = durationFromString(matched.rule.duration, matched.match);
    if (duration) {
      toDateTime = fromDateTime.plus(duration);
    }
  }

  if (!toDateTime) {
    toDateTime = DateTime.fromISO(roundDateUp(from, context), {
      setZone: true,
      zone: context.timezone,
    });
  }

  context.ranges.push(dateRangeInText);

  const colonIndex = line.indexOf(":", matched.indexOfDateRange);
  const colon: Range = {
    type: RangeType.DateRangeColon,
    from: lengthAtIndex[i] + colonIndex,
    to: lengthAtIndex[i] + colonIndex + 1,
  };
  context.ranges.push(colon);

  if (+fromDateTime > +toDateTime) {
    context.parseMessages.push({
      message: "Illogical date range - start time is later than end time",
      type: "error",
      pos: [dateRangeInText.from, dateRangeInText.to],
    });
  }

  const definition: Range = {
    ...dateRangeInText,
    type: RangeType.EventDefinition,
    to: colon.to,
  };
  context.ranges.push(definition);

  return new DateRangePart({
    from: fromDateTime,
    to: toDateTime,
    originalString: matched.datePart,
    dateRangeInText,
    eventText: matched.eventText,
    isRelative: false,
    definition,
  });
}
