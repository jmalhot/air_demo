import { createServer } from 'node:http';
import sessionHandler from '../server/session.ts';

const PORT = 3001;

function headerMap(req: { headers: NodeJS.Dict<string | string[]> }): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

async function readJsonBody(req: { [Symbol.asyncIterator](): AsyncIterator<Buffer> }): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}

const server = createServer((req, res) => {
  void (async () => {
    const path = (req.url ?? '').split('?')[0];
    if (path !== '/api/session') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    let body: unknown = {};
    try {
      body = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    await sessionHandler(
      { method: req.method, headers: headerMap(req), body },
      {
        status(code: number) {
          return {
            json(payload: unknown) {
              res.statusCode = code;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
            },
          };
        },
      },
    );
  })().catch((error: unknown) => {
    console.error('[AIR_DEMO]', { event: 'local_api_failure', message: error instanceof Error ? error.message : 'unknown' });
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Demo not available' }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.info(`AIR Demo API http://127.0.0.1:${PORT}/api/session`);
});
