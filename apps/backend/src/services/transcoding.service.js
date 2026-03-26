export async function createUploadIntent(fileName) {
  return {
    uploadUrl: `https://storage.example.com/upload/${encodeURIComponent(fileName)}`,
    objectKey: `uploads/${Date.now()}-${fileName}`,
  };
}

export async function queueTranscodeJob(objectKey) {
  return {
    jobId: `job_${Date.now()}`,
    objectKey,
    status: "queued",
  };
}

export function createSignedPlaybackUrl(hlsUrl, signingSecret) {
  if (!hlsUrl) return "";
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const tokenPayload = `${hlsUrl}|${expiresAt}|${signingSecret || "dev-signing-secret"}`;
  const token = Buffer.from(tokenPayload).toString("base64url");
  const separator = hlsUrl.includes("?") ? "&" : "?";
  return `${hlsUrl}${separator}token=${token}&expires=${expiresAt}`;
}
