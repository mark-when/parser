import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  edtf_recurrence_recurrenceAmountDaysUnitMatchIndex,
  edtf_recurrence_recurrenceAmountMatchIndex,
  edtf_recurrence_recurrenceAmountMonthsUnitMatchIndex,
  edtf_recurrence_recurrenceAmountWeekDayMatchIndex,
  edtf_recurrenceMatchIndex,
  edtf_recurrence_repetitionsForAmountAmountMatchIndex,
  edtf_recurrence_repetitionsMatchIndex,
  recurrence_recurrenceAmountDaysUnitMatchIndex,
  recurrence_recurrenceAmountMatchIndex,
  recurrence_recurrenceAmountMonthsUnitMatchIndex,
  recurrence_recurrenceAmountWeekDayMatchIndex,
  recurrence_recurrenceAmountXNotationAmountMatchIndex,
  recurrence_recurrenceAmountXNotationMatchIndex,
  recurrence_recurrenceMatchIndex,
  recurrence_repetitionsForAmountAmountMatchIndex,
  recurrence_repetitionsMatchIndex,
  edtf_recurrence_recurrenceAmountXNotationMatchIndex,
  edtf_recurrence_recurrenceAmountXNotationAmountMatchIndex,
  edtf_recurrence_recurrenceAmountYearsUnitMatchIndex,
  edtfEventTextMatchIndex,
  eventTextMatchIndex,
  edtf_recurrence_untilMatchIndex,
  edtf_recurrence_untilDateIndex,
  edtf_recurrence_untilNowMatchIndex,
} from "../src/regex";

describe("regex indices", () => {
  test("recurrence indices 1", () => {
    const matches =
      `february 2 1989 every 3 days for 3 days: event title`.match(
        EVENT_START_REGEX
      );
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 3 days for 3 days"
    );
    expect(matches![recurrence_recurrenceAmountMatchIndex]).toBe("3");
    expect(matches![recurrence_recurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![recurrence_repetitionsMatchIndex]).toBe(" for 3 days");
    expect(matches![recurrence_repetitionsForAmountAmountMatchIndex]).toBe(
      "3 "
    );
  });

  test("recurrence indices 2", () => {
    const matches = `09/09/1999 every 3 months x29: event title`.match(
      EVENT_START_REGEX
    );
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 3 months x29"
    );
    expect(matches![recurrence_recurrenceAmountMatchIndex]).toBe("3");
    expect(matches![recurrence_recurrenceAmountMonthsUnitMatchIndex]).toBe(
      "months"
    );
    expect(matches![recurrence_repetitionsMatchIndex]).toBe(" x29");
    expect(matches![recurrence_recurrenceAmountXNotationMatchIndex]).toBe(
      " x29"
    );
    expect(matches![recurrence_recurrenceAmountXNotationAmountMatchIndex]).toBe(
      "29"
    );
  });

  test("recurrence indices 3", () => {
    const matches = `Dec 19 every 12 week days for 9 times: event title`.match(
      EVENT_START_REGEX
    );
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![recurrence_recurrenceAmountMatchIndex]).toBe("12");
    expect(matches![recurrence_recurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![recurrence_recurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![recurrence_repetitionsMatchIndex]).toBe(" for 9 times");
    expect(matches![recurrence_repetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 1", () => {
    const matches =
      `2019-01-01 every 12 week days for 9 times: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![edtf_recurrence_recurrenceAmountMatchIndex]).toBe("12");
    expect(matches![edtf_recurrence_recurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![edtf_recurrence_recurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![edtf_recurrence_repetitionsMatchIndex]).toBe(
      " for 9 times"
    );
    expect(matches![edtf_recurrence_repetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 2", () => {
    const matches =
      `2019-01-01 / 2022-08-07 every 12 week days for 9 times: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![edtf_recurrence_recurrenceAmountMatchIndex]).toBe("12");
    expect(matches![edtf_recurrence_recurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![edtf_recurrence_recurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![edtf_recurrence_repetitionsMatchIndex]).toBe(
      " for 9 times"
    );
    expect(matches![edtf_recurrence_repetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 3", () => {
    const matches =
      `2019-01-01/2022-08-07 every 12 week days for 9 times: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![edtf_recurrence_recurrenceAmountMatchIndex]).toBe("12");
    expect(matches![edtf_recurrence_recurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![edtf_recurrence_recurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![edtf_recurrence_repetitionsMatchIndex]).toBe(
      " for 9 times"
    );
    expect(matches![edtf_recurrence_repetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 4", () => {
    const matches =
      `2019-01-01 / 2022-08-07 every 3 days for 3 days: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 3 days for 3 days"
    );
    expect(matches![edtf_recurrence_recurrenceAmountMatchIndex]).toBe("3");
    expect(matches![edtf_recurrence_recurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![edtf_recurrence_repetitionsMatchIndex]).toBe(" for 3 days");
    expect(matches![edtf_recurrence_repetitionsForAmountAmountMatchIndex]).toBe(
      "3 "
    );
  });

  test("edtf recurrence indices 5", () => {
    const matches = `2019-01-01/now every 4 months x50: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(" every 4 months x50");
    expect(matches![edtf_recurrence_recurrenceAmountMatchIndex]).toBe("4");
    expect(matches![edtf_recurrence_recurrenceAmountMonthsUnitMatchIndex]).toBe(
      "months"
    );
    expect(matches![edtf_recurrence_recurrenceAmountXNotationMatchIndex]).toBe(
      " x50"
    );
    expect(
      matches![edtf_recurrence_recurrenceAmountXNotationAmountMatchIndex]
    ).toBe("50");
  });

  test("edtf recurrence indices 6", () => {
    const matches = `2019-01-01/now every other year: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(" every other year");
    expect(matches![edtf_recurrence_recurrenceAmountMatchIndex]).toBe("other");
    expect(matches![edtf_recurrence_recurrenceAmountYearsUnitMatchIndex]).toBe(
      "year"
    );
    expect(
      matches![edtf_recurrence_recurrenceAmountXNotationMatchIndex]
    ).toBeFalsy();
  });

  test("edtf recurrence until 1", () => {
    const matches = `2025-04-04 / now every day til 2025-12-12: `.match(
      EDTF_START_REGEX
    );
    expect(matches).toBeTruthy();

    expect(matches![edtf_recurrence_untilMatchIndex]).toBe(" til 2025-12-12");
    expect(matches![edtf_recurrence_untilDateIndex]).toBe("2025-12-12");
  });

  test("edtf recurrence until 2", () => {
    const matches = `2025-04-04 every other week until 2025-12-12: `.match(
      EDTF_START_REGEX
    );
    expect(matches).toBeTruthy();

    expect(matches![edtf_recurrence_untilMatchIndex]).toBe(" until 2025-12-12");
    expect(matches![edtf_recurrence_untilDateIndex]).toBe("2025-12-12");
  });

  test("edtf recurrence until 3", () => {
    const matches = `2025-04-04 every other day | now: `.match(
      EDTF_START_REGEX
    );
    expect(matches).toBeTruthy();

    expect(matches![edtf_recurrence_untilMatchIndex]).toBe(" | now");
    expect(matches![edtf_recurrence_untilNowMatchIndex]).toBe("now");
  });

  test("event text after date definition", () => {
    const matches = `2019-01-01/now every other year: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![edtfEventTextMatchIndex]).toBe(" event title");
  });

  test("event text after date definition", () => {
    const matches = `2019-01-01/now :  e v e n t   t i t l e  `.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![edtfEventTextMatchIndex]).toBe("  e v e n t   t i t l e  ");
  });

  test("event text after date definition", () => {
    const matches = `dec 2 1989 - now :  e v e n t   t i t l e  `.match(
      EVENT_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![eventTextMatchIndex]).toBe("  e v e n t   t i t l e  ");
  });
});
