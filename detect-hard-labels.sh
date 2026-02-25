#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-src}"
OUT_DIR="${2:-./i18n-audit}"
TSV="$OUT_DIR/hard_labels.tsv"
SUMMARY="$OUT_DIR/summary.txt"

# You can tune these globs
EXCLUDES=(
  "!**/node_modules/**"
  "!**/dist/**"
  "!**/build/**"
  "!**/.next/**"
  "!**/coverage/**"
  "!**/*.min.*"
  "!**/*.map"
)

mkdir -p "$OUT_DIR"
: > "$TSV"
: > "$SUMMARY"

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: ripgrep (rg) not found. Install ripgrep and try again." >&2
  exit 1
fi

# Helper: run rg and append to TSV with a category column
run_rg() {
  local category="$1"
  local pattern="$2"
  shift 2

  # --pcre2 helps with some regexes; if your rg doesn't support it, remove --pcre2
  rg -n --pcre2 --no-heading --color=never \
    --glob "${EXCLUDES[@]}" \
    "$pattern" "$ROOT_DIR" "$@" \
    | while IFS= read -r line; do
        # rg output: file:line:match
        # Split only on first two ':' occurrences
        file="${line%%:*}"
        rest="${line#*:}"
        lineno="${rest%%:*}"
        match="${rest#*:}"

        # Normalize tabs/newlines
        match="${match//$'\t'/ }"
        match="${match//$'\r'/ }"
        match="${match//$'\n'/ }"

        printf "%s\t%s\t%s\t%s\n" "$category" "$file" "$lineno" "$match" >> "$TSV"
      done || true
}

echo "Scanning $ROOT_DIR ..."
echo "Output: $TSV"

# 1) JSX text nodes: >Texto<
# Tries to catch plain text between tags, ignoring {expressions} and nested tags.
run_rg "jsx_text" ">([^<{][^<]{2,})<"

# 2) Common UI props that usually contain labels
run_rg "ui_props_literal" "\b(title|label|placeholder|helperText|aria-label|alt|caption|description|tooltip)\s*=\s*{?\s*(['\"][^'\"]{2,}['\"])"

# 3) Buttons/Links with hard-coded children are common
run_rg "button_link_children" "<(button|a|Link)\b[^>]*>\s*[^<{][^<]{1,}\s*<\/(button|a|Link)>"

# 4) Toasts / alerts / confirms
run_rg "toasts_alerts" "\b(toast|sonner|alert|confirm)\b[^;\n]*(['\"][^'\"]{2,}['\"])"

# 5) Error messages / exceptions
run_rg "errors" "\b(new AppError|throw new Error|console\.error)\b[^;\n]*(['\"][^'\"]{2,}['\"])"

# 6) Zod messages (common patterns)
run_rg "zod_messages" "\.min\([^)]*['\"][^'\"]{2,}['\"]|\.max\([^)]*['\"][^'\"]{2,}['\"]|\.email\([^)]*['\"][^'\"]{2,}['\"]|message:\s*['\"][^'\"]{2,}['\"]"

# 7) PT-BR heuristic (optional): find Portuguese accents / common words
# Comment out if it becomes noisy.
run_rg "ptbr_heuristic" "([À-ÿ]{2,}|ção|ções|não|você|senha|entrar|aula|curso|progresso|simulação)"

# Summary
{
  echo "Hard labels audit - $(date)"
  echo
  echo "Total matches:"
  wc -l < "$TSV" | awk '{print "  " $1}'
  echo
  echo "By category:"
  awk -F'\t' '{c[$1]++} END {for (k in c) printf "  %-20s %d\n", k, c[k]}' "$TSV" | sort
  echo
  echo "Top files:"
  awk -F'\t' '{f[$2]++} END {for (k in f) printf "%d\t%s\n", f[k], k}' "$TSV" | sort -nr | head -20 | awk '{print "  " $0}'
} > "$SUMMARY"

echo "Done."
echo "Report:  $TSV"
echo "Summary: $SUMMARY"
echo
echo "Tip: open TSV in your editor or import into a spreadsheet."
