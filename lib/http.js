function readBodyStream(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

async function parseJsonBody(req) {
  if (req.body && Object.keys(req.body).length > 0) {
    return req.body;
  }
  const raw = await readBodyStream(req);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Formato JSON non valido');
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res, allowed) {
  if (allowed?.length) {
    res.setHeader('Allow', allowed.join(', '));
  }
  sendJson(res, 405, { message: 'Metodo non consentito' });
}

function handleServerError(res, error) {
  console.error(error);
  sendJson(res, 500, { message: 'Errore interno' });
}

module.exports = {
  parseJsonBody,
  sendJson,
  methodNotAllowed,
  handleServerError,
};
