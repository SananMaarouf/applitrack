-- Add attachment_key column to store the Cloudflare R2 object key for PDF attachments
ALTER TABLE applications ADD COLUMN IF NOT EXISTS attachment_key TEXT;
