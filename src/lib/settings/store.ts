import { promises as fs } from "node:fs";
import path from "node:path";

export interface AppSettings {
  operatorNickname: string;
  agentNickname: string;
}

const settingsPath = path.join(process.cwd(), "data", "settings.json");

const defaultSettings: AppSettings = {
  operatorNickname: "Operator",
  agentNickname: "Agent",
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      operatorNickname: parsed.operatorNickname?.trim() || defaultSettings.operatorNickname,
      agentNickname: parsed.agentNickname?.trim() || defaultSettings.agentNickname,
    };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = {
    operatorNickname: patch.operatorNickname?.trim() || current.operatorNickname,
    agentNickname: patch.agentNickname?.trim() || current.agentNickname,
  };
  await fs.writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
