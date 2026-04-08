"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LocalRole = "ADMIN" | "MANAGER" | "USER";

type ProfilePageData = {
  id: string;
  name: string;
  email: string;
  role: LocalRole;
  image: string | null;
  phoneNumber: string | null;
  companyId: string | null;
  createdAt: string | null;
  lastLogin: string | null;
};

type ProfilePageDataResult =
  | {
      success: true;
      data: ProfilePageData;
    }
  | {
      success: false;
      message: string;
    };

export async function getProfilePageDataCached(): Promise<ProfilePageDataResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "User session not found.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        phoneNumber: user.phoneNumber,
        companyId: null,
        createdAt: user.createdAt.toISOString(),
        lastLogin: null,
      },
    };
  } catch {
    return {
      success: false,
      message: "Unable to load profile data.",
    };
  }
}
