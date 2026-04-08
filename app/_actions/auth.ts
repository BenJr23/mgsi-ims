"use server";

import { hashPassword, verifyPassword } from "better-auth/crypto";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuthResult = {
  ok: boolean;
  message: string;
};

type LocalRole = "ADMIN" | "MANAGER" | "USER";

type ExternalUser = {
  id: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  role: "CLIENT" | "ADMIN" | "SUPERADMIN" | "STAFF";
  companyId: string | null;
  passwordVerified: boolean;
};

type ExternalLoginSuccess = {
  success: true;
  user: ExternalUser;
  token?: string;
  tokenType?: string;
  expiresAt?: string;
};

type ExternalLoginError = {
  success: false;
  error?: string;
};

function mapExternalRoleToInternal(externalRole: ExternalUser["role"]): LocalRole | null {
  const roleMap: Record<ExternalUser["role"], LocalRole | null> = {
    CLIENT: null,
    SUPERADMIN: "ADMIN",
    ADMIN: "MANAGER",
    STAFF: "USER",
  };

  return roleMap[externalRole];
}

export async function signInWithEmailAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const invalidCredentialsMessage = "Invalid email or password";
  const email = input.email.trim().toLowerCase();
  const credentialProviderId = "credential";

  try {
    // Always validate credentials against external API first.
    const externalApiUrl = "https://mgsi-bms-superadmin.vercel.app/api/users/integrated-login";
    const bmsSecretKey = process.env.BMS_SECRET_KEY;

    if (!bmsSecretKey) {
      return {
        ok: false,
        message: invalidCredentialsMessage,
      };
    }

    const externalResponse = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bmsSecretKey}`,
      },
      body: JSON.stringify({
        email,
        password: input.password,
      }),
      cache: "no-store",
    });

    const externalData = (await externalResponse.json()) as ExternalLoginSuccess | ExternalLoginError;

    if (!externalResponse.ok || !externalData.success) {
      return {
        ok: false,
        message: invalidCredentialsMessage,
      };
    }

    const externalUser = externalData.user;

    // Ensure local user + credential account exist and are aligned with external source.
    const localUser = await prisma.user.findUnique({
      where: { email },
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

    const mappedRole = mapExternalRoleToInternal(externalUser.role);
  const effectiveRole: LocalRole | null = localUser?.role ?? mappedRole;

    // Existing users always keep their local role.
    // New users are provisioned only if the external role maps to an allowed local role.
    if (!effectiveRole) {
      return {
        ok: false,
        message: invalidCredentialsMessage,
      };
    }

    const fetchedUser = {
      id: externalUser.id,
      email: externalUser.email,
      name: externalUser.name,
      phoneNumber: externalUser.phoneNumber,
      role: effectiveRole,
      emailVerified: externalUser.passwordVerified,
    };

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
        const shouldUpdateUser =
          localUser.name !== fetchedUser.name ||
          localUser.phoneNumber !== fetchedUser.phoneNumber ||
          localUser.emailVerified !== fetchedUser.emailVerified;

        if (shouldUpdateUser) {
          await prisma.user.update({
            where: { id: localUser.id },
            data: {
              name: fetchedUser.name,
              phoneNumber: fetchedUser.phoneNumber,
              emailVerified: fetchedUser.emailVerified,
            },
          });
        }

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

export async function signOutAction(): Promise<AuthResult> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });

    return { ok: true, message: "Signed out successfully." };
  } catch {
    return { ok: false, message: "Unable to sign out." };
  }
}
