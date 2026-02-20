import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(rootDir, "tsconfig.base.json");
const targetPaths = [
	resolve(rootDir, "apps/api/tsconfig.base.json"),
	resolve(rootDir, "packages/sdk/tsconfig.base.json"),
];

const content = readFileSync(sourcePath, "utf8");

for (const targetPath of targetPaths) {
	mkdirSync(dirname(targetPath), { recursive: true });
	writeFileSync(
		targetPath,
		content.endsWith("\n") ? content : `${content}\n`,
		"utf8",
	);
	console.log(`synced: ${targetPath}`);
}
