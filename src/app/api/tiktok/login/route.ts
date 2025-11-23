import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const REDIRECT_URI = process.env.REDIRECT_URI;

  if (!CLIENT_KEY) {
    return Response.json(
      { error: "CLIENT_KEY no está configurado" },
      { status: 500 }
    );
  }

  if (!REDIRECT_URI) {
    return Response.json(
      { error: "REDIRECT_URI no está configurado" },
      { status: 500 }
    );
  }

  // Construir la URL de autorización de TikTok
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=video.upload,video.publish,user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;

  // Redirigir al usuario a TikTok para autorización
  return Response.redirect(authUrl);
}
