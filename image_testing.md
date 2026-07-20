# Image Integration Testing Playbook (Emergent)

All image tests must use base64-encoded PNG/JPEG/WEBP with real visual content.
Do not use SVG, BMP, HEIC. Do not use blank/uniform-color images.
Extract first frame from animated formats. Resize oversized payloads before upload.
Always match the MIME type to the actual bytes after any transcode/compression.
