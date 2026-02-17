import { prisma } from "@/lib/prisma";

export type SystemSettings = {
  allowPublicRegistration: boolean;
  defaultNewUserVerified: boolean;
  maintenanceMode: boolean;
  requireApprovalForJobs: boolean;
  requireApprovalForAccomplishments: boolean;
  adminAutoApproveOwnContent: boolean;
};

const SETTINGS_KEY = "admin_system_settings";

export const defaultSystemSettings: SystemSettings = {
  allowPublicRegistration: true,
  defaultNewUserVerified: false,
  maintenanceMode: false,
  requireApprovalForJobs: true,
  requireApprovalForAccomplishments: true,
  adminAutoApproveOwnContent: true,
};

let ensured = false;

async function ensureSettingsTable() {
  if (ensured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  ensured = true;
}

function normalizeSettings(input: unknown): SystemSettings {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    allowPublicRegistration:
      typeof source.allowPublicRegistration === "boolean"
        ? source.allowPublicRegistration
        : defaultSystemSettings.allowPublicRegistration,
    defaultNewUserVerified:
      typeof source.defaultNewUserVerified === "boolean"
        ? source.defaultNewUserVerified
        : defaultSystemSettings.defaultNewUserVerified,
    maintenanceMode:
      typeof source.maintenanceMode === "boolean"
        ? source.maintenanceMode
        : defaultSystemSettings.maintenanceMode,
    requireApprovalForJobs:
      typeof source.requireApprovalForJobs === "boolean"
        ? source.requireApprovalForJobs
        : defaultSystemSettings.requireApprovalForJobs,
    requireApprovalForAccomplishments:
      typeof source.requireApprovalForAccomplishments === "boolean"
        ? source.requireApprovalForAccomplishments
        : defaultSystemSettings.requireApprovalForAccomplishments,
    adminAutoApproveOwnContent:
      typeof source.adminAutoApproveOwnContent === "boolean"
        ? source.adminAutoApproveOwnContent
        : defaultSystemSettings.adminAutoApproveOwnContent,
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  await ensureSettingsTable();
  const rows = await prisma.$queryRaw<Array<{ value: unknown }>>`
    SELECT value
    FROM app_settings
    WHERE key = ${SETTINGS_KEY}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return defaultSystemSettings;
  }
  return normalizeSettings(rows[0].value);
}

export async function saveSystemSettings(settings: SystemSettings) {
  await ensureSettingsTable();
  await prisma.$executeRaw`
    INSERT INTO app_settings (key, value, "updatedAt")
    VALUES (${SETTINGS_KEY}, ${JSON.stringify(settings)}::jsonb, NOW())
    ON CONFLICT (key)
    DO UPDATE SET
      value = EXCLUDED.value,
      "updatedAt" = NOW()
  `;
}

export async function updateSystemSettings(patch: Partial<SystemSettings>) {
  const current = await getSystemSettings();
  const merged = normalizeSettings({ ...current, ...patch });
  await saveSystemSettings(merged);
  return merged;
}

