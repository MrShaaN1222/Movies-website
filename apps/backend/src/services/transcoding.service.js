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
