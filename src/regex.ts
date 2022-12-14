// Amounts
export const MILLISECOND_AMOUNT_REGEX = /(milliseconds|ms)/i;
export const SECOND_AMOUNT_REGEX = /(seconds|second|secs|sec|s)/i;
export const MINUTE_AMOUNT_REGEX = /(minutes|minute|mins|min)/i;
export const HOUR_AMOUNT_REGEX = /(hours|hour|h)/i;
// export const DAY_AMOUNT_REGEX = /(?:work\s*)?(days|day|d)/i;
export const DAY_AMOUNT_REGEX =
  /(?:(week\s*|work\s*|business\s*)?(days|day|d))/i;
export const WEEK_AMOUNT_REGEX = /(weeks|week|w)/i;
export const MONTH_AMOUNT_REGEX = /(months|month)/i;
export const YEAR_AMOUNT_REGEX = /(years|year|y)/i;
export const AMOUNT_REGEX = new RegExp(
  `(\\d+\\W*)(${MILLISECOND_AMOUNT_REGEX.source}|${SECOND_AMOUNT_REGEX.source}|${MINUTE_AMOUNT_REGEX.source}|${HOUR_AMOUNT_REGEX.source}|${DAY_AMOUNT_REGEX.source}|${WEEK_AMOUNT_REGEX.source}|${MONTH_AMOUNT_REGEX.source}|${YEAR_AMOUNT_REGEX.source})(?:\\s*,\\s*|\\s*)`,
  "g"
);

export const EVENT_ID_REGEX = /(?:\W|^)(!\w+)/;
// So this regex is kind of wrong - we're using the global flag here to make multiple matches for the
// whole regex, even though we just want any repeated amounts (e.g., 3 days, 4 hours, 6 seconds).
// This works because the entire front part (`after !eventId plus`) is optional
export const RELATIVE_TIME_REGEX = new RegExp(
  `(by|before|after)?(\\s*${EVENT_ID_REGEX.source}\\s*)?(?:plus|\\+)?\\s*(${AMOUNT_REGEX.source})*`
);

export const FULL_MONTH_REGEX =
  /january|february|march|april|may|june|july|august|september|october|november|december/;
export const ABBR_MONTH_REGEX =
  /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/;
export const HUMAN_MONTH_REGEX = new RegExp(
  `(?:(${FULL_MONTH_REGEX.source})|(${ABBR_MONTH_REGEX.source}))`
);
export const DAY_FIRST_MONTH_REGEX = new RegExp(
  `(([0-3]?[0-9])\\s+${HUMAN_MONTH_REGEX.source})`
);
export const MONTH_FIRST_MONTH_REGEX = new RegExp(
  `(${HUMAN_MONTH_REGEX.source}\\s+([0-3]?[0-9](?!\\d)))`
);
export const TIME_REGEX =
  /((1|2|3|4|5|6|7|8|9|10|11|12)(:\d{2})?([ap]m)|([012]?[0-9])(:\d{2}))/;
export const CASUAL_MONTH_REGEX = new RegExp(
  `(?:(?:${DAY_FIRST_MONTH_REGEX.source}|${MONTH_FIRST_MONTH_REGEX.source}),?(?:\\s+(\\d{4}),?)?(?:\\s+${TIME_REGEX.source})?)|(${HUMAN_MONTH_REGEX.source}(?:\\s+(\\d{1,4}))?)`
);

export const ISO8601_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2,}(?:\.\d*)?Z/;
export const NOW_REGEX = /now/;
export const DATE_REGEX = new RegExp(
  `(\\d{1,5}(\\/\\d{1,5}(\\/\\d{1,5}(?:(?:,|\\s)+${TIME_REGEX.source})?)?)?)`
);

export const START_OR_END_TIME_REGEX = new RegExp(
  `(${ISO8601_REGEX.source})|(${NOW_REGEX.source})|${TIME_REGEX.source}|(${DATE_REGEX.source})|(${RELATIVE_TIME_REGEX.source})|${CASUAL_MONTH_REGEX.source}`
);

export const DATE_RANGE_REGEX = new RegExp(
  `((${START_OR_END_TIME_REGEX.source})(?:\\s*(?:-|to)\\s*(${START_OR_END_TIME_REGEX.source}))?)\\s*:`
);
export const EVENT_START_REGEX = new RegExp(
  `^(\\s*)${DATE_RANGE_REGEX.source}(.*)`,
  "i"
);

let index = 0;
export const eventStartWhitespaceMatchIndex = ++index;
export const datePartMatchIndex = ++index;
export const from_matchIndex = ++index;
export const from_isoMatchIndex = ++index;
export const from_nowMatchIndex = ++index;

export const from_timeOnlyMatchIndex = ++index;
export const from_timeOnlyMeridiemHourMatchIndex = ++index;
export const from_timeOnlyMeridiemMinuteMatchIndex = ++index;
export const from_timeOnlyMeridiemMeridiemMatchIndex = ++index;
export const from_timeOnly24HourHourMatchIndex = ++index;
export const from_timeOnly24HourMinuteMatchIndex = ++index;

export const from_slashDateFullMatchIndex = ++index;
export const from_slashDateMatchIndex = ++index;
export const from_slashDateMatchIndex1 = ++index;
export const from_slashDateMatchIndex2 = ++index;

export const from_slashDateTimeMatchIndex = ++index;
export const from_slashDateTimeMeridiemHourMatchIndex = ++index;
export const from_slashDateTimeMeridiemMinuteMatchIndex = ++index;
export const from_slashDateTimeMeridiemMeridiemMatchIndex = ++index;
export const from_slashDateTime24HourHourMatchIndex = ++index;
export const from_slashDateTime24HourMinuteMatchIndex = ++index;

export const from_relativeMatchIndex = ++index;
export const from_beforeOrAfterMatchIndex = ++index;
export const from_relativeTimeMatchIndex = ++index;
export const from_relativeEventIdMatchIndex = ++index;
export const from_relativeAmountsMatchIndex = ++index;
export const from_relativeAmountMatchIndex = ++index;
export const from_relativeAmountUnitMatchIndex = ++index;
export const from_relativeAmountMillisecondsUnitMatchIndex = ++index;
export const from_relativeAmountSecondsUnitMatchIndex = ++index;
export const from_relativeAmountMinutesUnitMatchIndex = ++index;
export const from_relativeAmountHoursUnitMatchIndex = ++index;
export const from_relativeAmountWeekDayMatchIndex = ++index;
export const from_relativeAmountDaysUnitMatchIndex = ++index;
export const from_relativeAmountWeeksUnitMatchIndex = ++index;
export const from_relativeAmountMonthsUnitMatchIndex = ++index;
export const from_relativeAmountYearsUnitMatchIndex = ++index;

export const from_dayFirstCasualMonthMatchIndex = ++index;
export const from_dayFirstCasualMonthDayMatchIndex = ++index;
export const from_dayFirstCasualMonthMonthFullMatchIndex = ++index;
export const from_dayFirstCasualMonthMonthAbbrMatchIndex = ++index;
export const from_monthFirstCasualMonthMatchIndex = ++index;
export const from_monthFirstCasualMonthMonthFullMatchIndex = ++index;
export const from_monthFirstCasualMonthMonthAbbrMatchIndex = ++index;
export const from_monthFirstCasualMonthDayMatchIndex = ++index;
export const from_casualMonthAndDayYearMatchIndex = ++index;

export const from_casualMonthTimeMatchIndex = ++index;
export const from_casualMonthTimeMeridiemHourMatchIndex = ++index;
export const from_casualMonthTimeMeridiemMinuteMatchIndex = ++index;
export const from_casualMonthTimeMeridiemMeridiemMatchIndex = ++index;
export const from_casualMonthTime24HourHourMatchIndex = ++index;
export const from_casualMonthTime24HourMinuteMatchIndex = ++index;

export const from_casualMonthMatchIndex = ++index;
export const from_casualMonthMonthFullMatchIndex = ++index;
export const from_casualMonthMonthAbbrMatchIndex = ++index;
export const from_casualMonthYearMatchIndex = ++index;

export const to_matchIndex = ++index;
export const to_isoMatchIndex = ++index;
export const to_nowMatchIndex = ++index;

export const to_timeOnlyMatchIndex = ++index;
export const to_timeOnlyMeridiemHourMatchIndex = ++index;
export const to_timeOnlyMeridiemMinuteMatchIndex = ++index;
export const to_timeOnlyMeridiemMeridiemMatchIndex = ++index;
export const to_timeOnly24HourHourMatchIndex = ++index;
export const to_timeOnly24HourMinuteMatchIndex = ++index;

export const to_slashDateFullMatchIndex = ++index;
export const to_slashDateMatchIndex = ++index;
export const to_slashDateMatchIndex1 = ++index;
export const to_slashDateMatchIndex2 = ++index;

export const to_slashDateTimeMatchIndex = ++index;
export const to_slashDateTimeMeridiemHourMatchIndex = ++index;
export const to_slashDateTimeMeridiemMinuteMatchIndex = ++index;
export const to_slashDateTimeMeridiemMeridiemMatchIndex = ++index;
export const to_slashDateTime24HourHourMatchIndex = ++index;
export const to_slashDateTime24HourMinuteMatchIndex = ++index;

export const to_relativeMatchIndex = ++index;
export const to_beforeOrAfterMatchIndex = ++index;
export const to_relativeTimeMatchIndex = ++index;
export const to_relativeEventIdMatchIndex = ++index;
export const to_relativeAmountsMatchIndex = ++index;
export const to_relativeAmountMatchIndex = ++index;
export const to_relativeAmountUnitMatchIndex = ++index;
export const to_relativeAmountMillisecondsUnitMatchIndex = ++index;
export const to_relativeAmountSecondsUnitMatchIndex = ++index;
export const to_relativeAmountMinutesUnitMatchIndex = ++index;
export const to_relativeAmountHoursUnitMatchIndex = ++index;
export const to_relativeAmountWeekDayMatchIndex = ++index;
export const to_relativeAmountDaysUnitMatchIndex = ++index;
export const to_relativeAmountWeeksUnitMatchIndex = ++index;
export const to_relativeAmountMonthsUnitMatchIndex = ++index;
export const to_relativeAmountYearsUnitMatchIndex = ++index;

export const to_dayFirstCasualMonthMatchIndex = ++index;
export const to_dayFirstCasualMonthDayMatchIndex = ++index;
export const to_dayFirstCasualMonthMonthFullMatchIndex = ++index;
export const to_dayFirstCasualMonthMonthAbbrMatchIndex = ++index;
export const to_monthFirstCasualMonthMatchIndex = ++index;
export const to_monthFirstCasualMonthMonthFullMatchIndex = ++index;
export const to_monthFirstCasualMonthMonthAbbrMatchIndex = ++index;
export const to_monthFirstCasualMonthDayMatchIndex = ++index;
export const to_casualMonthAndDayYearMatchIndex = ++index;

export const to_casualMonthTimeMatchIndex = ++index;
export const to_casualMonthTimeMeridiemHourMatchIndex = ++index;
export const to_casualMonthTimeMeridiemMinuteMatchIndex = ++index;
export const to_casualMonthTimeMeridiemMeridiemMatchIndex = ++index;
export const to_casualMonthTime24HourHourMatchIndex = ++index;
export const to_casualMonthTime24HourMinuteMatchIndex = ++index;

export const to_casualMonthMatchIndex = ++index;
export const to_casualMonthMonthFullMatchIndex = ++index;
export const to_casualMonthMonthAbbrMatchIndex = ++index;
export const to_casualMonthYearMatchIndex = ++index;

export const COMMENT_REGEX = /^\s*\/\/.*/;
export const TAG_COLOR_REGEX = /^\s*#(\w*):\s*(\S+)/;
export const TITLE_REGEX = /^\s*(title:)\s*(.+)\s*$/i;
export const VIEWERS_REGEX = /^\s*(view:)\s*(.*)$/i;
export const EDITORS_REGEX = /^\s*(edit:)\s*(.*)$/i;
export const DESCRIPTION_REGEX = /^\s*(description:)\s*(.+)\s*$/i;
export const DATE_FORMAT_REGEX = /dateFormat:\s*d\/M\/y/;

// Edited so that number only tags are excluded - #1, #21, etc.
// A negative lookbehind would have worked... if it was supported in safari: /(?: |^)#(\w+)(?<!\d+)/
export const TAG_REGEX = /(?:^|\s)#(?!\d+(?:\s|$))(\w+)/g;
export const GROUP_START_REGEX = /^(\s*)(group|section)(?:\s|$)/i;
export const GROUP_END_REGEX = /^(\s*)end(?:Group|Section)/i;
export const LIST_ITEM_REGEX = /^- .*/;
export const CHECKLIST_ITEM_REGEX = /^- (\[(x|X| )?\]).*/;
export const PAGE_BREAK = "\n_-_-_break_-_-_\n";
export const PAGE_BREAK_REGEX = /^_-_-_break_-_-_$/;

export const EDTF_DATE_REGEX = /(\d{4}(-\d{2}(-\d{2})?)?)/;
export const EDTF_RANGE_REGEX = new RegExp(
  `((?:${EDTF_DATE_REGEX.source}|(${RELATIVE_TIME_REGEX.source})|(${NOW_REGEX.source}))(\\s*/\\s*(?:${EDTF_DATE_REGEX.source}|(${RELATIVE_TIME_REGEX.source})|(${NOW_REGEX.source})))?)\\s*:`
);
export const EDTF_START_REGEX = new RegExp(
  `^(\\s*)${EDTF_RANGE_REGEX.source}(.*)`,
  "i"
);

let edtfIndex = 0;
export const edtfStartWhitespaceMatchIndex = ++edtfIndex;
export const edtfDatePartMatchIndex = ++edtfIndex;

export const from_edtfDateIndex = ++edtfIndex;
export const from_edtfDateMonthPart = ++edtfIndex;
export const from_edtfDateDayPart = ++edtfIndex;

export const from_edtfRelativeMatchIndex = ++edtfIndex;
export const from_edtfBeforeOrAfterMatchIndex = ++edtfIndex;
export const from_edtfRelativeTimeMatchIndex = ++edtfIndex;
export const from_edtfRelativeEventIdMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountsMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountMillisecondsUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountSecondsUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountMinutesUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountHoursUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountWeekDayMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountDaysUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountWeeksUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountMonthsUnitMatchIndex = ++edtfIndex;
export const from_edtfRelativeAmountYearsUnitMatchIndex = ++edtfIndex;

export const from_edtfNowMatchIndex = ++edtfIndex;

export const to_edtfIndex = ++edtfIndex;
export const to_edtfDateIndex = ++edtfIndex;
export const to_edtfDateMonthPart = ++edtfIndex;
export const to_edtfDateDayPart = ++edtfIndex;

export const to_edtfRelativeMatchIndex = ++edtfIndex;
export const to_edtfBeforeOrAfterMatchIndex = ++edtfIndex;
export const to_edtfRelativeTimeMatchIndex = ++edtfIndex;
export const to_edtfRelativeEventIdMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountsMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountMillisecondsUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountSecondsUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountMinutesUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountHoursUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountWeekDayMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountDaysUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountWeeksUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountMonthsUnitMatchIndex = ++edtfIndex;
export const to_edtfRelativeAmountYearsUnitMatchIndex = ++edtfIndex;

export const to_edtfNowMatchIndex = ++edtfIndex;
