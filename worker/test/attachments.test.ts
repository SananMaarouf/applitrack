/**
 * Attachment coverage: upload to R2 through the Worker, download through the
 * signed same-origin URL the frontend opens, and cleanup on delete.
 */
import { SELF, env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TOKEN_A, TOKEN_B, api, createApplication, resetAttachments, resetDatabase } from "./helpers";

beforeEach(resetDatabase);
afterEach(resetAttachments);

type ApplicationBody = { id: number; attachment_key: string | null };

function pdfFile(name = "cv.pdf", size = 1024): File {
  return new File([new Uint8Array(size).fill(0x25)], name, { type: "application/pdf" });
}

async function upload(applicationId: number, file: File, token = TOKEN_A): Promise<Response> {
  const form = new FormData();
  form.append("file", file);
  return api(`/applications/${applicationId}/attachment`, { method: "POST", token, body: form });
}

async function attachmentKey(applicationId: number): Promise<string | null> {
  const row = await env.DB.prepare("SELECT attachment_key FROM applications WHERE id = ?")
    .bind(applicationId)
    .first<{ attachment_key: string | null }>();
  return row?.attachment_key ?? null;
}

describe("uploading an attachment", () => {
  it("stores the PDF in R2 and records the key", async () => {
    const id = await createApplication(TOKEN_A);

    const response = await upload(id, pdfFile());
    expect(response.status).toBe(200);

    const body = (await response.json()) as ApplicationBody;
    expect(body.attachment_key).toBe(`attachments/user_a/${id}/cv.pdf`);
    expect(await attachmentKey(id)).toBe(body.attachment_key);

    const stored = await env.ATTACHMENTS.get(body.attachment_key!);
    expect(stored).not.toBeNull();
    expect(stored!.httpMetadata?.contentType).toBe("application/pdf");
  });

  it("sanitises the filename and keeps a .pdf suffix", async () => {
    const id = await createApplication(TOKEN_A);
    const response = await upload(id, pdfFile("my cv (final)*.pdf"));

    const body = (await response.json()) as ApplicationBody;
    expect(body.attachment_key).toBe(`attachments/user_a/${id}/mycvfinal.pdf`);
  });

  it("replaces the previous attachment", async () => {
    const id = await createApplication(TOKEN_A);
    const first = (await (await upload(id, pdfFile("first.pdf"))).json()) as ApplicationBody;
    const second = (await (await upload(id, pdfFile("second.pdf"))).json()) as ApplicationBody;

    expect(second.attachment_key).toBe(`attachments/user_a/${id}/second.pdf`);
    expect(await env.ATTACHMENTS.get(first.attachment_key!)).toBeNull();
  });

  it("rejects a non-PDF file", async () => {
    const id = await createApplication(TOKEN_A);
    const response = await upload(id, new File(["hello"], "cv.txt", { type: "text/plain" }));

    expect(response.status).toBe(415);
    expect(await attachmentKey(id)).toBeNull();
  });

  it("rejects a file over 10 MB", async () => {
    const id = await createApplication(TOKEN_A);
    const response = await upload(id, pdfFile("big.pdf", 10 * 1024 * 1024 + 1));
    expect(response.status).toBe(413);
  });

  it("rejects a form without a file field", async () => {
    const id = await createApplication(TOKEN_A);
    const form = new FormData();
    form.append("note", "no file here");

    const response = await api(`/applications/${id}/attachment`, {
      method: "POST",
      token: TOKEN_A,
      body: form,
    });
    expect(response.status).toBe(422);
  });

  it("returns 404 for an unknown application", async () => {
    const response = await upload(999999999, pdfFile());
    expect(response.status).toBe(404);
  });

  it("returns 404 for another user's application", async () => {
    const id = await createApplication(TOKEN_A);
    const response = await upload(id, pdfFile(), TOKEN_B);

    expect(response.status).toBe(404);
    expect(await attachmentKey(id)).toBeNull();
  });
});

describe("downloading an attachment", () => {
  async function signedUrl(applicationId: number, token = TOKEN_A): Promise<string> {
    const response = await api(`/applications/${applicationId}/attachment/url`, { token });
    expect(response.status).toBe(200);
    return ((await response.json()) as { url: string }).url;
  }

  it("issues a same-origin URL that needs no Authorization header", async () => {
    const id = await createApplication(TOKEN_A);
    await upload(id, pdfFile("cv.pdf", 2048));

    const url = await signedUrl(id);
    expect(url).toMatch(new RegExp(`^/api/attachments/${id}\\?exp=\\d+&sig=[A-Za-z0-9_-]+$`));

    const download = await SELF.fetch(`http://example.com${url}`);
    expect(download.status).toBe(200);
    expect(download.headers.get("Content-Type")).toBe("application/pdf");
    expect(download.headers.get("Content-Disposition")).toContain("cv.pdf");
    expect((await download.arrayBuffer()).byteLength).toBe(2048);
  });

  it("rejects a tampered signature", async () => {
    const id = await createApplication(TOKEN_A);
    await upload(id, pdfFile());

    const url = await signedUrl(id);
    const tampered = url.replace(/sig=[A-Za-z0-9_-]+$/, "sig=deadbeef");
    const download = await SELF.fetch(`http://example.com${tampered}`);
    expect(download.status).toBe(403);
  });

  it("rejects an expired link", async () => {
    const id = await createApplication(TOKEN_A);
    await upload(id, pdfFile());

    const url = await signedUrl(id);
    const expired = url.replace(/exp=\d+/, "exp=1");
    expect((await SELF.fetch(`http://example.com${expired}`)).status).toBe(403);
  });

  it("returns 404 when the application has no attachment", async () => {
    const id = await createApplication(TOKEN_A);
    const response = await api(`/applications/${id}/attachment/url`, { token: TOKEN_A });
    expect(response.status).toBe(404);
  });

  it("returns 404 for another user's application", async () => {
    const id = await createApplication(TOKEN_A);
    await upload(id, pdfFile());

    const response = await api(`/applications/${id}/attachment/url`, { token: TOKEN_B });
    expect(response.status).toBe(404);
  });
});

describe("deleting an attachment", () => {
  it("removes the object from R2 and clears the key", async () => {
    const id = await createApplication(TOKEN_A);
    const uploaded = (await (await upload(id, pdfFile())).json()) as ApplicationBody;

    const response = await api(`/applications/${id}/attachment`, { method: "DELETE", token: TOKEN_A });
    expect(response.status).toBe(204);

    expect(await attachmentKey(id)).toBeNull();
    expect(await env.ATTACHMENTS.get(uploaded.attachment_key!)).toBeNull();
  });

  it("returns 404 when there is nothing to delete", async () => {
    const id = await createApplication(TOKEN_A);
    const response = await api(`/applications/${id}/attachment`, { method: "DELETE", token: TOKEN_A });
    expect(response.status).toBe(404);
  });

  it("removes the object when the application itself is deleted", async () => {
    const id = await createApplication(TOKEN_A);
    const uploaded = (await (await upload(id, pdfFile())).json()) as ApplicationBody;

    expect((await api(`/applications/${id}`, { method: "DELETE", token: TOKEN_A })).status).toBe(204);
    expect(await env.ATTACHMENTS.get(uploaded.attachment_key!)).toBeNull();
  });
});
