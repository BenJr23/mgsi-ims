import "server-only";

import { randomUUID } from "crypto";

function getSupabaseProjectUrl(): string {
	const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

	if (!projectUrl) {
		throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
	}

	return projectUrl.replace(/\/$/, "");
}

function getSupabaseBucketName(): string {
	const bucketName = process.env.SUPABASE_BUCKET_NAME?.trim() || process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME?.trim();

	if (!bucketName) {
		throw new Error("SUPABASE_BUCKET_NAME is not configured.");
	}

	return bucketName;
}

function getSupabaseApiKey(): string {
	const apiKey = process.env.IMS_API_SECRET_KEY?.trim();

	if (!apiKey) {
		throw new Error("IMS_API_SECRET_KEY is not configured.");
	}

	return apiKey;
}

function getFileExtension(file: File): string {
	const fromName = file.name.split('.').pop()?.trim();
	if (fromName && fromName.length <= 8 && !fromName.includes('/')) {
		return `.${fromName.toLowerCase()}`;
	}

	switch (file.type) {
		case 'image/jpeg':
			return '.jpg';
		case 'image/png':
			return '.png';
		case 'image/webp':
			return '.webp';
		case 'image/gif':
			return '.gif';
		default:
			return '';
	}
}

function sanitizeSegment(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

function buildPhotoObjectKey(folder: string, entityId: string, file: File): string {
	const safeEntityId = sanitizeSegment(entityId) || entityId;
	const extension = getFileExtension(file);
	const safeName = sanitizeSegment(file.name.replace(/\.[^.]+$/, '')) || 'photo';
	return `${folder}/${safeEntityId}/${randomUUID()}-${safeName}${extension}`;
}

export function buildSupabasePublicUrl(objectKey: string): string {
	const baseUrl = getSupabaseProjectUrl();
	const bucketName = getSupabaseBucketName();
	const encodedObjectKey = objectKey.split('/').map(encodeURIComponent).join('/');
	return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${encodedObjectKey}`;
}

async function uploadPhotoToSupabase(input: {
	folder: string;
	entityId: string;
	file: File;
}): Promise<{ objectKey: string; publicUrl: string }> {
	const apiKey = getSupabaseApiKey();
	const bucketName = getSupabaseBucketName();
	const objectKey = buildPhotoObjectKey(input.folder, input.entityId, input.file);
	const uploadUrl = `${getSupabaseProjectUrl()}/storage/v1/object/${encodeURIComponent(bucketName)}/${objectKey
		.split('/')
		.map(encodeURIComponent)
		.join('/')}`;

	const response = await fetch(uploadUrl, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			apikey: apiKey,
			'Content-Type': input.file.type || 'application/octet-stream',
			'x-upsert': 'true',
		},
		body: Buffer.from(await input.file.arrayBuffer()),
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Supabase upload failed (${response.status}): ${message}`);
	}

	return {
		objectKey,
		publicUrl: buildSupabasePublicUrl(objectKey),
	};
}

export async function uploadEquipmentModelPhotoToSupabase(input: {
	equipmentModelId: string;
	file: File;
}): Promise<{ objectKey: string; publicUrl: string }> {
	return uploadPhotoToSupabase({
		folder: 'equipment-models',
		entityId: input.equipmentModelId,
		file: input.file,
	});
}
