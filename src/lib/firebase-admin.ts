import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function resolveProjectId(): string | undefined {
  const envId = process.env.FIREBASE_PROJECT_ID?.trim() || process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  if (envId) return envId;

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed?.projectId) return String(parsed.projectId);
    }
  } catch {
    // fallback if config file is unavailable in serverless bundle
  }
  return undefined;
}

if (!getApps().length) {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (serviceAccountRaw) {
    try {
      const serviceAccount = JSON.parse(serviceAccountRaw);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || resolveProjectId(),
      });
    } catch {
      initializeApp({
        projectId: resolveProjectId(),
      });
    }
  } else {
    initializeApp({
      projectId: resolveProjectId(),
    });
  }
}

export const adminAuth = getAuth();
