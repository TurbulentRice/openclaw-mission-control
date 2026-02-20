import { promises as fs } from "node:fs";
import path from "node:path";

export interface MemoryDoc {
  id: string;
  title: string;
  filePath: string;
  updatedAtMs: number;
  content: string;
}

async function resolveWorkspaceRoot() {
  const configured = process.env.OPENCLAW_WORKSPACE_DIR;
  if (configured?.trim()) return configured;

  try {
    const settingsPath = path.join(process.cwd(), "data", "settings.json");
    const raw = await fs.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as { openclawWorkspaceDir?: string };
    if (parsed.openclawWorkspaceDir?.trim()) return parsed.openclawWorkspaceDir.trim();
  } catch {
    // ignore and fallback
  }

  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".openclaw", "workspace");
}

function displayTitle(filePath: string) {
  const base = path.basename(filePath);
  if (base.toLowerCase() === "memory.md") return "Long-term Memory";
  if (base.match(/^\d{4}-\d{2}-\d{2}\.md$/)) return `Daily Memory · ${base.replace(".md", "")}`;
  return base;
}

function normalize(text: string) {
  return text.toLowerCase();
}

export async function listMemoryDocs(query?: string): Promise<MemoryDoc[]> {
  const root = await resolveWorkspaceRoot();
  const memoryDir = path.join(root, "memory");

  const files: string[] = [];
  const topMemory = path.join(root, "MEMORY.md");
  try {
    await fs.access(topMemory);
    files.push(topMemory);
  } catch {
    // ignore missing file
  }

  try {
    const entries = await fs.readdir(memoryDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        files.push(path.join(memoryDir, entry.name));
      }
    }
  } catch {
    // ignore missing memory dir
  }

  const docs: MemoryDoc[] = [];
  for (const filePath of files) {
    try {
      const [content, stat] = await Promise.all([
        fs.readFile(filePath, "utf8"),
        fs.stat(filePath),
      ]);
      docs.push({
        id: filePath,
        title: displayTitle(filePath),
        filePath: path.relative(root, filePath),
        updatedAtMs: stat.mtimeMs,
        content,
      });
    } catch {
      // ignore unreadable files
    }
  }

  docs.sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  const q = query?.trim();
  if (!q) return docs;

  const nq = normalize(q);
  return docs.filter((doc) => normalize(`${doc.title}\n${doc.content}`).includes(nq));
}
