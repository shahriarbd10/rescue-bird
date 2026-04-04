import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, unauthorized } from "@/lib/auth";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || "rescue-bird/voice-notes";
  return { cloudName, apiKey, apiSecret, folder };
}

export async function POST(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();

  const { cloudName, apiKey, apiSecret, folder } = getCloudinaryConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
      },
      { status: 501 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  if (!file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Only audio files are allowed" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signBase).digest("hex");

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  cloudinaryForm.append("api_key", apiKey);
  cloudinaryForm.append("timestamp", String(timestamp));
  cloudinaryForm.append("signature", signature);
  cloudinaryForm.append("folder", folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: cloudinaryForm
  });

  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok) {
    return NextResponse.json({ error: uploadJson?.error?.message || "Cloudinary upload failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: uploadJson.secure_url });
}
