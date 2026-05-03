import type { AttachedFile } from "../types";

export const ALLOWED_EXTENSIONS = [
  // Web
  "js",
  "ts",
  "tsx",
  "jsx",
  "mjs",
  "cjs",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "styl",
  "vue",
  "svelte",
  "astro",

  // Backend
  "py",
  "rb",
  "php",
  "java",
  "kt",
  "kts",
  "groovy",
  "cs",
  "fs",
  "fsx",
  "vb",
  "go",
  "rs",
  "swift",
  "dart",
  "c",
  "cpp",
  "cc",
  "cxx",
  "h",
  "hpp",
  "hxx",
  "scala",
  "clj",
  "cljs",
  "ex",
  "exs",
  "erl",
  "hrl",
  "lua",
  "pl",
  "pm",
  "r",
  "jl",
  "hs",
  "lhs",
  "nim",
  "zig",
  "v",
  "cr",

  // Shell / DevOps
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "psm1",
  "bat",
  "cmd",
  "dockerfile",
  "containerfile",

  // Data / Config
  "json",
  "jsonc",
  "json5",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "config",
  "xml",
  "xsl",
  "xslt",
  "plist",
  "csv",
  "tsv",
  "env",
  "env.local",
  "env.example",
  "properties",
  "dotenv",
  "hcl",
  "tf",
  "tfvars", // Terraform

  // Docs / Text
  "txt",
  "md",
  "mdx",
  "rst",
  "asciidoc",
  "adoc",
  "tex",
  "latex",
  "bib",
  "log",
  "diff",
  "patch",

  // Database
  "sql",
  "psql",
  "graphql",
  "gql",
  "prisma",
  "proto",

  // CI / Build
  "makefile",
  "mk",
  "cmake",
  "gradle",
  "pom",
  "gemfile",
  "podfile",
  "cartfile",
  "lock",

  // Misc
  "htm",
  "svg",
  "gitignore",
  "gitattributes",
  "editorconfig",
  "eslintrc",
  "prettierrc",
  "babelrc",
  "browserslistrc",
];

export const MAX_FILE_SIZE_KB = 64;

export const MAX_FILE_SIZE = MAX_FILE_SIZE_KB * 1024;
export const MAX_FILES = 3;

export async function readFiles(
  incoming: File[],
  existing: AttachedFile[],
): Promise<{ added: AttachedFile[]; error: string }> {
  const remaining = MAX_FILES - existing.length;
  const added: AttachedFile[] = [];
  let error = "";

  for (const file of incoming.slice(0, remaining)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      error = `Недопустимый тип: .${ext}`;
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      error = `Файл «${file.name}» превышает ${MAX_FILE_SIZE_KB} KB`;
      continue;
    }
    if (
      existing.find((f) => f.name === file.name) ||
      added.find((f) => f.name === file.name)
    )
      continue;
    added.push({
      name: file.name,
      content: await file.text(),
      size: file.size,
    });
  }

  if (incoming.length > remaining && !error) {
    error = `Максимум ${MAX_FILES} файлов на запрос`;
  }

  return { added, error };
}
