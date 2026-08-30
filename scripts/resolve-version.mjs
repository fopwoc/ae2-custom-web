import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const semanticVersion = /^\d+\.\d+\.\d+$/;

function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function resolveVersion() {
  const injected = process.env.VERSION?.trim();
  if (injected) return injected;

  try {
    const exactTag = git("describe", "--tags", "--exact-match", "HEAD");
    if (semanticVersion.test(exactTag)) return exactTag;
  } catch {
    // Untagged revisions use the development identity below.
  }

  try {
    const date = git(
      "show",
      "-s",
      "--format=%cd",
      "--date=format:%Y%m%d",
      "HEAD",
    );
    const hash = git("rev-parse", "--short=8", "HEAD");
    return `${date}-${hash}`;
  } catch {
    throw new Error(
      "Version resolution requires a Git checkout or an explicit VERSION value.",
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${resolveVersion()}\n`);
}
