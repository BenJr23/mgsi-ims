"use server";

export type BranchArea = {
	id: string;
	name: string;
	code: string | null;
	equipCount: number | null;
};

export type BranchItem = {
	id: string;
	name: string;
	code: string;
	address: string | null;
	areaCount?: number;
	equipCount?: number | null;
	areas?: BranchArea[];
};

type ExternalRoom = {
	id: string;
	roomName: string;
	roomCode: string | null;
	capacity: number;
	status: string;
	buildingId: string;
};

type ExternalBranch = {
	id: string;
	buildingName: string;
	buildingCode: string;
	address: string | null;
	status: string;
	rooms: ExternalRoom[];
};

type BranchesApiResponse = {
	success?: boolean;
	data?: {
		branches?: ExternalBranch[];
		rooms?: ExternalRoom[];
	};
	branches?: ExternalBranch[];
	rooms?: ExternalRoom[];
	error?: string;
};

type FetchBranchesResult =
	| {
			ok: true;
			branches: BranchItem[];
		}
	| {
			ok: false;
			message: string;
		};

const BRANCHES_API_URL = "http://localhost:3001/api/branches";

export async function fetchBranchesAction(): Promise<FetchBranchesResult> {
	const secretKey = process.env.BMS_SECRET_KEY?.trim();
	const traceId = `branches_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	if (!secretKey) {
		console.warn("[Branches Action] Missing BMS_SECRET_KEY", { traceId });
		return {
			ok: false,
			message: "BMS_SECRET_KEY is not configured.",
		};
	}

	try {
		console.log("[Branches Action] Fetching branches", {
			traceId,
			url: BRANCHES_API_URL,
		});

		const response = await fetch(BRANCHES_API_URL, {
			method: "GET",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${secretKey}`,
				"Content-Type": "application/json",
				"x-bms-secret-key": secretKey,
			},
			cache: "no-store",
		});

		console.log("[Branches Action] Response received", {
			traceId,
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
		});

		if (!response.ok) {
			console.warn("[Branches Action] Non-OK response", { traceId, status: response.status });
			return {
				ok: false,
				message: `Unable to fetch branches. Received ${response.status}.`,
			};
		}

		const payload = (await response.json()) as BranchesApiResponse;
		console.log("[Branches Action] Parsed payload", { traceId, payload });

		const rawBranches = payload.data?.branches ?? payload.branches ?? [];
		const branches = rawBranches.map((branch) => ({
			id: branch.id,
			name: branch.buildingName,
			code: branch.buildingCode,
			address: branch.address,
			areaCount: branch.rooms.length,
			equipCount: branch.rooms.reduce((sum, room) => sum + (room.capacity ?? 0), 0),
			areas: branch.rooms.map((room) => ({
				id: room.id,
				name: room.roomName,
				code: room.roomCode,
				equipCount: room.capacity,
			})),
		}));
		console.log("[Branches Action] Normalized branches", {
			traceId,
			count: branches.length,
		});

		return {
			ok: true,
			branches,
		};
	} catch {
		console.error("[Branches Action] Fetch failed", { traceId });
		return {
			ok: false,
			message: "Unable to fetch branches right now.",
		};
	}
}
