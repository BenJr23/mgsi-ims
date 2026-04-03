"use server";

import { hashPassword, verifyPassword } from "better-auth/crypto";

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

export async function signInWithEmailAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const invalidCredentialsMessage = "Invalid email or password";
  const email = input.email.trim().toLowerCase();
  const credentialProviderId = "credential";

  try {
    // Always validate credentials against external API first.
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

    if (!routeResponse.ok || !routeData.success) {
      return {
        ok: false,
        message: invalidCredentialsMessage,
      };
    }

    const fetchedUser = routeData.user;

    // Defensive guard: never provision local accounts for CLIENT/invalid roles.
    if (
      fetchedUser.role === "CLIENT" ||
      fetchedUser.role === null ||
      !["ADMIN", "MANAGER", "USER"].includes(fetchedUser.role)
    ) {
      return {
        ok: false,
        message: invalidCredentialsMessage,
      };
    }

    // Ensure local user + credential account exist and are aligned with external source.
    const localUser = await prisma.user.findUnique({
      where: { email: fetchedUser.email },
      include: {
        accounts: {
          where: { providerId: credentialProviderId },
          select: {
            id: true,
            password: true,
          },
          take: 1,
        },
      },
    });

    try {
      const passwordHash = await hashPassword(input.password);

      if (!localUser) {
        const createdUser = await prisma.user.create({
          data: {
            name: fetchedUser.name,
            email: fetchedUser.email,
            phoneNumber: fetchedUser.phoneNumber,
            role: fetchedUser.role,
            emailVerified: fetchedUser.emailVerified,
          },
          select: { id: true, email: true },
        });

        await prisma.account.create({
          data: {
            userId: createdUser.id,
            accountId: createdUser.id,
            providerId: credentialProviderId,
            password: passwordHash,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: localUser.id },
          data: {
            name: fetchedUser.name,
            phoneNumber: fetchedUser.phoneNumber,
            role: fetchedUser.role,
            emailVerified: fetchedUser.emailVerified,
          },
        });

        const credentialAccount = localUser.accounts[0];
        if (!credentialAccount) {
          await prisma.account.create({
            data: {
              userId: localUser.id,
              accountId: localUser.id,
              providerId: credentialProviderId,
              password: passwordHash,
            },
          });
        } else {
          let hasSamePassword = false;

          if (credentialAccount.password) {
            try {
              hasSamePassword = await verifyPassword({
                hash: credentialAccount.password,
                password: input.password,
              });
            } catch {
              hasSamePassword = false;
            }
          }

          if (!hasSamePassword) {
            await prisma.account.update({
              where: { id: credentialAccount.id },
              data: { password: passwordHash },
            });
          }
        }
      }
    } catch {
      return {
        ok: false,
        message: invalidCredentialsMessage,
      };
    }

    // Final local sign-in to create a Better Auth session cookie.
    await auth.api.signInEmail({
      body: {
        email: fetchedUser.email,
        password: input.password,
      },
    });

    return { ok: true, message: "Logged in successfully." };
  } catch {
    return {
      ok: false,
      message: invalidCredentialsMessage,
    };
  }
}
