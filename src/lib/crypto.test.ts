// @vitest-environment node

import { beforeEach, describe, expect, it } from "vitest";

import { decrypt, encrypt } from "./crypto";

describe("crypto", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("encrypt 后的密文与原文不同", () => {
    const plaintext = "sk-test-123";
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
  });

  it("decrypt(encrypt(plaintext)) 等于原文", () => {
    const plaintext = "hello-agent";
    const ciphertext = encrypt(plaintext);

    expect(decrypt(ciphertext)).toBe(plaintext);
  });
});
