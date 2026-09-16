import {
  InternalServerError,
  InternalServerErrorWith,
  InvalidArgumentError,
  NotFoundError,
  RequiredArgumentError,
  TwirpError,
  TwirpErrorCode,
} from "../errors.js";

describe("Twirp errors", () => {
  it("will render a full error", () => {
    const innerError = new Error("some error");
    const twirpError = new TwirpError(TwirpErrorCode.NotFound, "not found");

    twirpError.withCause(innerError, true);
    twirpError.withMeta("meta1", "value1");
    twirpError.withMeta("meta2", "value2");

    expect(twirpError.toJSON()).toEqual(
      JSON.stringify({
        code: TwirpErrorCode.NotFound,
        msg: "not found",
        meta: {
          cause: "some error",
          meta1: "value1",
          meta2: "value2",
        },
      })
    );
  });
});

describe("Standard Errors", () => {
  it("will render not found error", () => {
    const twirpError = new NotFoundError("not found");
    expect(twirpError.toJSON()).toEqual(
      JSON.stringify({
        code: TwirpErrorCode.NotFound,
        msg: "not found",
        meta: {},
      })
    );
  });

  it("will render invalid argument error", () => {
    const twirpError = new InvalidArgumentError("field", "error");
    expect(twirpError.toJSON()).toEqual(
      JSON.stringify({
        code: TwirpErrorCode.InvalidArgument,
        msg: "field error",
        meta: {
          argument: "field",
        },
      })
    );
  });

  it("will render required error", () => {
    const twirpError = new RequiredArgumentError("field");
    expect(twirpError.toJSON()).toEqual(
      JSON.stringify({
        code: TwirpErrorCode.InvalidArgument,
        msg: "field is required",
        meta: {
          argument: "field",
        },
      })
    );
  });

  it("will render internal server error", () => {
    const twirpError = new InternalServerError("internal");
    expect(twirpError.toJSON()).toEqual(
      JSON.stringify({
        code: TwirpErrorCode.Internal,
        msg: "internal",
        meta: {},
      })
    );
  });

  it("will render internal server error with inner", () => {
    const inner = new Error("inner");
    const twirpError = new InternalServerErrorWith(inner);
    expect(twirpError.toJSON()).toEqual(
      JSON.stringify({
        code: TwirpErrorCode.Internal,
        msg: "inner",
        meta: {
          cause: "Error",
        },
      })
    );
  });

  describe("cause", () => {
    it("exposes the wrapped error as the standard Error.cause", () => {
      const inner = new Error("boom");
      const twirpError = new InternalServerError("outer").withCause(inner);

      expect(twirpError.cause).toBe(inner);
    });

    it("normalises a non-Error cause", () => {
      const twirpError = new InternalServerError("outer").withCause("boom");

      expect(twirpError.cause).toBeInstanceOf(Error);
      expect(twirpError.cause?.message).toBe("boom");
    });

    it("keeps the cause off the wire", () => {
      const twirpError = new InternalServerError("outer").withCause(
        new Error("boom")
      );

      expect(JSON.parse(twirpError.toJSON())).toEqual({
        code: TwirpErrorCode.Internal,
        msg: "outer",
        meta: {},
      });
      expect(Object.keys(twirpError)).not.toContain("cause");
    });
  });

  describe("isTwirpError", () => {
    it("recognises its own instances", () => {
      expect(TwirpError.isTwirpError(new NotFoundError("nope"))).toBe(true);
    });

    it("recognises an instance from another copy of the package", () => {
      // What `new NotFoundError()` looks like when it came from a second copy
      // of twirp-ts in the tree: same shape, different class identity.
      const fromAnotherCopy = Object.defineProperty(
        new Error("nope"),
        Symbol.for("twirp-ts.TwirpError"),
        { value: true }
      );

      expect(fromAnotherCopy instanceof TwirpError).toBe(false);
      expect(TwirpError.isTwirpError(fromAnotherCopy)).toBe(true);
    });

    it("recognises an unbranded instance from an older copy", () => {
      const fromUpstream = Object.assign(new Error("nope"), {
        code: TwirpErrorCode.NotFound,
        msg: "nope",
      });

      expect(fromUpstream instanceof TwirpError).toBe(false);
      expect(TwirpError.isTwirpError(fromUpstream)).toBe(true);
    });

    it("rejects anything else", () => {
      expect(TwirpError.isTwirpError(new Error("plain"))).toBe(false);
      expect(TwirpError.isTwirpError({ code: "not_found", msg: "nope" })).toBe(
        false
      );
      expect(TwirpError.isTwirpError("nope")).toBe(false);
      expect(TwirpError.isTwirpError(null)).toBe(false);
      expect(TwirpError.isTwirpError(undefined)).toBe(false);
    });
  });
});
