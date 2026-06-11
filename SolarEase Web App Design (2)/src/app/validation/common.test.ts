import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  emailSchema,
  inclinationSchema,
  latitudeSchema,
  nameSchema,
  passwordLoginSchema,
} from "./common";
import { clientCreateSchema } from "./clientSchemas";
import { loginSchema } from "./authSchemas";

describe("common validation schemas", () => {
  it("accepts valid email", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("enforces name min length 2", () => {
    expect(nameSchema.safeParse("A").success).toBe(false);
    expect(nameSchema.safeParse("Ab").success).toBe(true);
  });

  it("enforces password min length 6", () => {
    expect(passwordLoginSchema.safeParse("12345").success).toBe(false);
    expect(passwordLoginSchema.safeParse("123456").success).toBe(true);
  });

  it("validates latitude bounds", () => {
    expect(latitudeSchema.safeParse(36.8).success).toBe(true);
    expect(latitudeSchema.safeParse(91).success).toBe(false);
  });

  it("validates inclination 0-90", () => {
    expect(inclinationSchema.safeParse(30).success).toBe(true);
    expect(inclinationSchema.safeParse(95).success).toBe(false);
  });
});

describe("clientCreateSchema", () => {
  it("accepts complete client", () => {
    const result = clientCreateSchema.safeParse({
      firstName: "Ahmed",
      lastName: "Ben Ali",
      email: "ahmed@test.tn",
      phone: "+216 98 123 456",
      city: "Tunis",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short first name", () => {
    const result = clientCreateSchema.safeParse({
      firstName: "A",
      lastName: "Ben Ali",
      email: "a@test.tn",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "secret1" }).success
    ).toBe(true);
  });
});

describe("getApiErrorMessage", () => {
  it("translates duplicate email", async () => {
    const { getApiErrorMessage } = await import("../utils/apiError");
    const msg = getApiErrorMessage({
      response: { data: { message: "Email already in use" } },
    });
    expect(msg).toContain("déjà enregistré");
  });
});
