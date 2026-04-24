import { link, lstat, readlink, stat, symlink, unlink } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const links = [resolve(root, "apps/api/.env")];

async function pathExists(path) {
	try {
		return await lstat(path);
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		throw error;
	}
}

async function isSameFile(pathA, pathB) {
	try {
		const [a, b] = await Promise.all([stat(pathA), stat(pathB)]);
		return a.dev === b.dev && a.ino === b.ino;
	} catch {
		return false;
	}
}

async function ensureEnvLink(linkPath) {
	const stat = await pathExists(linkPath);
	const relativeTarget = relative(dirname(linkPath), envPath).replaceAll(
		"\\",
		"/",
	);

	if (stat?.isSymbolicLink()) {
		const currentTarget = await readlink(linkPath);
		if (currentTarget === relativeTarget) {
			console.log(`ok ${relative(root, linkPath)} -> ${relativeTarget}`);
			return;
		}
		await unlink(linkPath);
	}

	if (stat && !stat.isSymbolicLink()) {
		if (await isSameFile(envPath, linkPath)) {
			console.log(`ok ${relative(root, linkPath)} is already linked to .env`);
			return;
		}
		console.log(
			`skip ${relative(root, linkPath)} because it already exists and is not a symlink`,
		);
		return;
	}

	try {
		await symlink(relativeTarget, linkPath, "file");
		console.log(`linked ${relative(root, linkPath)} -> ${relativeTarget}`);
	} catch (error) {
		if (error?.code !== "EPERM") throw error;
		await link(envPath, linkPath);
		console.log(
			`hardlinked ${relative(root, linkPath)} -> .env (symlink was denied by Windows)`,
		);
	}
}

const rootEnv = await pathExists(envPath);
if (!rootEnv) {
	throw new Error("Root .env does not exist. Create .env before running init.");
}

for (const link of links) {
	await ensureEnvLink(link);
}
