import { Request, Response } from 'express';
import { swaggerSpec } from '../config/swagger.config';

export class DocsController {
  getSwaggerJson(req: Request, res: Response) {
    res.json(swaggerSpec);
  }

  getSwaggerUI(req: Request, res: Response) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>InstaVibe Scalable API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui .topbar { background-color: #1e293b; border-bottom: 1px solid #334155; }
    .swagger-ui .topbar a { font-weight: 700; color: #38bdf8; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui img { filter: invert(100%) hue-rotate(180deg); }
    .header-banner { background: linear-gradient(135deg, #6366f1, #ec4899); padding: 1.5rem 2rem; color: white; }
    .header-banner h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
    .header-banner p { margin: 0; opacity: 0.9; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>InstaVibe Backend Architecture API</h1>
    <p>Enterprise scalable RESTful architecture with Controllers, Services, Repositories, Redis Cache, Worker Queue & Gemini AI</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}

export const docsController = new DocsController();
