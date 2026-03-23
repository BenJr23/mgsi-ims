"use server";

import { auth } from "@/lib/auth";

type AuthResult = {
  ok: boolean;
  message: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }
  return fallback;
}

export async function signUpWithEmailAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
      },
    });

    return { ok: true, message: "Account created successfully." };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error, "Unable to create account."),
    };
  }
}

export async function signInWithEmailAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
      },
    });

    return { ok: true, message: "Logged in successfully." };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error, "Unable to log in."),
    };
  }
}
