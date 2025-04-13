import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  edtf_recurrenceMatchIndex,
  recurrence_recurrenceMatchIndex,
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
  });

  test("recurrence indices 2", () => {
    const matches = `09/09/1999 every 3 months x29: event title`.match(
      EVENT_START_REGEX
    );
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 3 months x29"
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
  });

  test("edtf recurrence indices 5", () => {
    const matches = `2019-01-01/now every 4 months x50: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(" every 4 months x50");
  });

  test("edtf recurrence indices 6", () => {
    const matches = `2019-01-01/now every other year: event title`.match(
      EDTF_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(" every other year");
  });

  test("edtf recurrence until 1", () => {
    const matches = `2025-04-04 / now every day til 2025-12-12: `.match(
      EDTF_START_REGEX
    );
    expect(matches).toBeTruthy();
  });

  test("edtf recurrence until 2", () => {
    const matches = `2025-04-04 every other week until 2025-12-12: `.match(
      EDTF_START_REGEX
    );
    expect(matches).toBeTruthy();
  });

  test("edtf recurrence until 3", () => {
    const matches = `2025-04-04 every other day | now: `.match(
      EDTF_START_REGEX
    );
    expect(matches).toBeTruthy();
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
