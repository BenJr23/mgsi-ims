"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuthResult = {
  ok: boolean;
  message: string;
};

type ExternalLoginSuccess = {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    phoneNumber: string | null;
    role: "ADMIN" | "MANAGER" | "USER" | "CLIENT" | null;
    emailVerified: boolean;
  };
};

type ExternalLoginError = {
  success: false;
  error?: string;
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

export async function signInWithEmailAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const traceId = `signin_action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    console.log("[Auth Action] Primary sign-in attempt", { traceId, email });
    await auth.api.signInEmail({
      body: {
        email,
        password: input.password,
      },
    });

    console.log("[Auth Action] Primary sign-in successful", { traceId, email });
    return { ok: true, message: "Logged in successfully." };
  } catch (error) {
    console.warn("[Auth Action] Primary sign-in failed, trying fallback flow", {
      traceId,
      email,
      reason: getErrorMessage(error, "Unknown error"),
    });
  }

  try {
    const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const routeResponse = await fetch(`${appUrl}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: input.password,
      }),
      cache: "no-store",
    });

    const routeData = (await routeResponse.json()) as ExternalLoginSuccess | ExternalLoginError;

    console.log("[Auth Action] External fallback response", {
      traceId,
      email,
      status: routeResponse.status,
      ok: routeResponse.ok,
      success: routeData.success,
    });

    if (!routeResponse.ok || !routeData.success) {
      return {
        ok: false,
        message: routeData.success ? "Unable to log in." : routeData.error || "Invalid login.",
      };
    }

    const fetchedUser = routeData.user;

    // Defensive guard: never provision local accounts for CLIENT/invalid roles.
    if (
      fetchedUser.role === "CLIENT" ||
      fetchedUser.role === null ||
      !["ADMIN", "MANAGER", "USER"].includes(fetchedUser.role)
    ) {
      console.warn("[Auth Action] Blocked provisioning due to invalid role", {
        traceId,
        email: fetchedUser.email,
        role: fetchedUser.role,
      });
      return {
        ok: false,
        message: "Invalid login.",
      };
    }

    // Create local user+account via Better Auth (if not already created), then retry sign-in.
    try {
      console.log("[Auth Action] Provisioning local account via Better Auth", {
        traceId,
        email: fetchedUser.email,
      });

      await auth.api.signUpEmail({
        body: {
          name: fetchedUser.name,
          email: fetchedUser.email,
          password: input.password,
        },
      });

      console.log("[Auth Action] Local account provisioned", { traceId, email: fetchedUser.email });
    } catch (signUpError) {
      // If account already exists due to race/retry, continue and attempt sign-in.
      console.warn("[Auth Action] Provisioning skipped/failed, continuing", {
        traceId,
        email: fetchedUser.email,
        reason: getErrorMessage(signUpError, "Unknown sign-up error"),
      });
    }

    // Ensure profile fields match external system mapping.
    try {
      await prisma.user.update({
        where: { email: fetchedUser.email },
        data: {
          name: fetchedUser.name,
          phoneNumber: fetchedUser.phoneNumber,
          role: fetchedUser.role,
          emailVerified: fetchedUser.emailVerified,
        },
      });
      console.log("[Auth Action] Local user profile synchronized", {
        traceId,
        email: fetchedUser.email,
        role: fetchedUser.role,
      });
    } catch (syncError) {
      console.warn("[Auth Action] Could not sync user profile", {
        traceId,
        email: fetchedUser.email,
        reason: getErrorMessage(syncError, "Unknown sync error"),
      });
    }

    // Final sign-in to create a session cookie for this request.
    await auth.api.signInEmail({
      body: {
        email: fetchedUser.email,
        password: input.password,
      },
    });

    console.log("[Auth Action] Fallback flow completed with session created", {
      traceId,
      email: fetchedUser.email,
    });

    return { ok: true, message: "Logged in successfully." };
  } catch (error) {
    console.error("[Auth Action] Fallback flow failed", {
      traceId,
      email,
      reason: getErrorMessage(error, "Unable to log in."),
    });

    return {
      ok: false,
      message: getErrorMessage(error, "Unable to log in."),
    };
  }
}
