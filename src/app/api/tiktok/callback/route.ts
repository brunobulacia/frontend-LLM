import { NextRequest } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI;

  if (!code) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error de TikTok</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Error</h1>
          <p>No llegó el código de TikTok.</p>
          <a href="/tiktok">Volver a intentar</a>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  if (!CLIENT_KEY || !CLIENT_SECRET) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error de configuración</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Error de configuración</h1>
          <p>CLIENT_KEY o CLIENT_SECRET no están configurados.</p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  try {
    // Mostrar todos los parámetros recibidos
    const queryData = Object.fromEntries(searchParams.entries());

    // Preparar los parámetros para obtener el token
    const params = new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI || "",
    });

    // Hacer la petición a TikTok para obtener el token
    const response = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Respuesta HTML con los datos
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Respuesta de TikTok</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            pre { background: #f5f5f5; padding: 20px; border-radius: 5px; overflow-x: auto; }
            .success { color: #28a745; }
            .section { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1 class="success">¡Autenticación exitosa!</h1>
          
          <div class="section">
            <h2>Datos de la query recibida</h2>
            <pre>${JSON.stringify(queryData, null, 2)}</pre>
          </div>

          <div class="section">
            <h2>Respuesta completa de TikTok</h2>
            <pre>${JSON.stringify(response.data, null, 2)}</pre>
          </div>

          <div class="section">
            <a href="/tiktok">Volver a la página de TikTok</a>
          </div>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error: any) {
    console.error("Error obteniendo token:", error?.response?.data || error);

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error obteniendo token</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            pre { background: #f5f5f5; padding: 20px; border-radius: 5px; overflow-x: auto; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">Error obteniendo token</h1>
          <pre>${JSON.stringify(
            error?.response?.data || error.message,
            null,
            2
          )}</pre>
          <a href="/tiktok">Volver a intentar</a>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
