import { DateTime } from "luxon";

export enum Weight {
  SECOND = 0,
  QUARTER_MINUTE = 1,
  MINUTE = 2,
  QUARTER_HOUR = 3,
  HOUR = 4,
  DAY = 5,
  MONTH = 6,
  YEAR = 7,
  DECADE = 8,
  CENT = 9,
}

export function dateScale(dateTime: DateTime) {
  if (dateTime.second === 0) {
    if (dateTime.minute === 0) {
      if (dateTime.hour === 0) {
        if (dateTime.day === 1) {
          if (dateTime.month === 1) {
            if (dateTime.year % 100 === 0) {
              return Weight.CENT;
            }
            if (dateTime.year % 10 === 0) {
              return Weight.DECADE;
            }
            return Weight.YEAR;
          }
          return Weight.MONTH;
        }
        return Weight.DAY;
      }
      return Weight.HOUR;
    } else if (dateTime.minute % 15 == 0) {
      return Weight.QUARTER_HOUR;
    }
    return Weight.MINUTE;
  } else if (dateTime.second % 15 === 0) {
    return Weight.QUARTER_MINUTE;
  }
  return Weight.SECOND;
}

export type DateFormap = {
  [w in Weight]: { format: string; separator?: string };
};

export const muricaMap: DateFormap = {
  [Weight.CENT]: {
    format: "yyyy",
    separator: " - ",
  },
  [Weight.DECADE]: {
    format: "yyyy",
    separator: " - ",
  },
  [Weight.YEAR]: {
    format: "yyyy",
    separator: " - ",
  },
  [Weight.MONTH]: {
    format: "MMM yyyy",
    separator: " - ",
  },
  [Weight.DAY]: {
    format: "MMM d yyyy",
    separator: " - ",
  },
  [Weight.HOUR]: {
    format: `MMM d yyyy h:mma`,
    separator: " - ",
  },
  [Weight.MINUTE]: {
    format: `MMM d yyyy h:mma`,
    separator: " - ",
  },
  [Weight.QUARTER_HOUR]: {
    format: `MMM d yyyy h:mma`,
    separator: " - ",
  },
  [Weight.QUARTER_MINUTE]: {
    format: `MMM d yyyy h:mma`,
    separator: " - ",
  },
  [Weight.SECOND]: {
    format: `yyyy-MM-ddThh:mm:ssZ`,
    separator: " - ",
  },
};

export const ISOMap: DateFormap = {
  [Weight.CENT]: {
    format: "yyyy",
    separator: "/",
  },
  [Weight.DECADE]: {
    format: "yyyy",
    separator: "/",
  },
  [Weight.YEAR]: {
    format: "yyyy",
    separator: "/",
  },
  [Weight.MONTH]: {
    format: "yyyy-MM",
    separator: "/",
  },
  [Weight.DAY]: {
    format: "yyyy-MM-dd",
    separator: "/",
  },
  [Weight.HOUR]: {
    format: `d MMM yyyy T`,
    separator: " - ",
  },
  [Weight.QUARTER_HOUR]: {
    format: `d MMM yyyy T`,
    separator: " - ",
  },
  [Weight.MINUTE]: {
    format: `d MMM yyyy T`,
    separator: " - ",
  },
  [Weight.QUARTER_MINUTE]: {
    format: `d MMM yyyy T`,
    separator: " - ",
  },
  [Weight.SECOND]: {
    format: `yyyy-MM-ddThh:mm:ssZ`,
    separator: " - ",
  },
};

export function dateRangeToString(
  {
    fromDateTime,
    toDateTime,
  }: {
    fromDateTime: DateTime;
    toDateTime: DateTime;
  },
  formap: DateFormap = ISOMap
) {
  const commonScale: Weight = Math.min(
    dateScale(fromDateTime),
    dateScale(toDateTime)
  );

  const format = formap[commonScale];
  return `${fromDateTime.toFormat(format.format)}${
    format.separator || " - "
  }${toDateTime.toFormat(format.format)}`;
}
