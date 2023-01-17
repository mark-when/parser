import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  recurrence_edtfRecurrenceAmountDaysUnitMatchIndex,
  recurrence_edtfRecurrenceAmountMatchIndex,
  recurrence_edtfRecurrenceAmountMonthsUnitMatchIndex,
  recurrence_edtfRecurrenceAmountWeekDayMatchIndex,
  recurrence_edtfRecurrenceMatchIndex,
  recurrence_edtfRepetitionsForAmountAmountMatchIndex,
  recurrence_edtfRepetitionsMatchIndex,
  recurrence_recurrenceAmountDaysUnitMatchIndex,
  recurrence_recurrenceAmountMatchIndex,
  recurrence_recurrenceAmountMonthsUnitMatchIndex,
  recurrence_recurrenceAmountWeekDayMatchIndex,
  recurrence_recurrenceAmountXNotationAmountMatchIndex,
  recurrence_recurrenceAmountXNotationMatchIndex,
  recurrence_recurrenceMatchIndex,
  recurrence_repetitionsForAmountAmountMatchIndex,
  recurrence_repetitionsMatchIndex,
  recurrence_edtfRecurrenceAmountXNotationMatchIndex,
  recurrence_edtfRecurrenceAmountXNotationAmountMatchIndex,
  recurrence_edtfRecurrenceAmountYearsUnitMatchIndex,
  edtfEventTextMatchIndex,
  eventTextMatchIndex,
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
    expect(matches![recurrence_edtfRecurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![recurrence_edtfRecurrenceAmountMatchIndex]).toBe("12");
    expect(matches![recurrence_edtfRecurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![recurrence_edtfRecurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![recurrence_edtfRepetitionsMatchIndex]).toBe(" for 9 times");
    expect(matches![recurrence_edtfRepetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 2", () => {
    const matches =
      `2019-01-01 / 2022-08-07 every 12 week days for 9 times: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![recurrence_edtfRecurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![recurrence_edtfRecurrenceAmountMatchIndex]).toBe("12");
    expect(matches![recurrence_edtfRecurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![recurrence_edtfRecurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![recurrence_edtfRepetitionsMatchIndex]).toBe(" for 9 times");
    expect(matches![recurrence_edtfRepetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 3", () => {
    const matches =
      `2019-01-01/2022-08-07 every 12 week days for 9 times: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![recurrence_edtfRecurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
    expect(matches![recurrence_edtfRecurrenceAmountMatchIndex]).toBe("12");
    expect(matches![recurrence_edtfRecurrenceAmountWeekDayMatchIndex]).toBe(
      "week "
    );
    expect(matches![recurrence_edtfRecurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![recurrence_edtfRepetitionsMatchIndex]).toBe(" for 9 times");
    expect(matches![recurrence_edtfRepetitionsForAmountAmountMatchIndex]).toBe(
      "9 "
    );
  });

  test("edtf recurrence indices 4", () => {
    const matches =
      `2019-01-01 / 2022-08-07 every 3 days for 3 days: event title`.match(
        EDTF_START_REGEX
      );

    expect(matches).toBeTruthy();
    expect(matches![recurrence_edtfRecurrenceMatchIndex]).toBe(
      " every 3 days for 3 days"
    );
    expect(matches![recurrence_edtfRecurrenceAmountMatchIndex]).toBe("3");
    expect(matches![recurrence_edtfRecurrenceAmountDaysUnitMatchIndex]).toBe(
      "days"
    );
    expect(matches![recurrence_edtfRepetitionsMatchIndex]).toBe(" for 3 days");
    expect(matches![recurrence_edtfRepetitionsForAmountAmountMatchIndex]).toBe(
      "3 "
    );
  });

  test("edtf recurrence indices 4", () => {
    const matches = `2019-01-01/now every 4 months x50: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![recurrence_edtfRecurrenceMatchIndex]).toBe(
      " every 4 months x50"
    );
    expect(matches![recurrence_edtfRecurrenceAmountMatchIndex]).toBe("4");
    expect(matches![recurrence_edtfRecurrenceAmountMonthsUnitMatchIndex]).toBe(
      "months"
    );
    expect(matches![recurrence_edtfRecurrenceAmountXNotationMatchIndex]).toBe(
      " x50"
    );
    expect(
      matches![recurrence_edtfRecurrenceAmountXNotationAmountMatchIndex]
    ).toBe("50");
  });

  test("edtf recurrence indices 4", () => {
    const matches = `2019-01-01/now every other year: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![recurrence_edtfRecurrenceMatchIndex]).toBe(
      " every other year"
    );
    expect(matches![recurrence_edtfRecurrenceAmountMatchIndex]).toBe("other");
    expect(matches![recurrence_edtfRecurrenceAmountYearsUnitMatchIndex]).toBe(
      "year"
    );
    expect(
      matches![recurrence_edtfRecurrenceAmountXNotationMatchIndex]
    ).toBeFalsy();
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
