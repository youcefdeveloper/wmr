#!/usr/bin/env bash
#
# Replaces a Vercel project's environment variables with the contents of a
# local env file: every existing variable is removed, then every variable in
# the file is added to Production and Preview.
#
#   ./scripts/sync-vercel-env.sh                      # dry run (prints the plan)
#   ./scripts/sync-vercel-env.sh --apply
#   ./scripts/sync-vercel-env.sh --file .env.local --project wmr --apply
#
# Values are stored as Config so `vercel env pull` can read them back. Pass
# --sensitive to store them as Secrets instead, which cannot be read back —
# the file you sync from then becomes the only copy.
set -euo pipefail

PROJECT=wmr
FILE=.env.vercel
APPLY=0
TYPE_FLAG=--no-sensitive

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    --sensitive) TYPE_FLAG=--sensitive; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."
[[ -f "$FILE" ]] || { echo "No such file: $FILE" >&2; exit 1; }

# Injected by the platform, or local-only. Syncing these either fails
# (reserved names) or points production at a developer's machine.
is_excluded() {
  case "$1" in
    VERCEL_*|NX_*|TURBO_*|VERCEL) return 0 ;;
    MYSQL_URL|DATABASE_URL_UNPOOLED|PUBLIC_BACKEND_URL) return 0 ;;
    *) return 1 ;;
  esac
}

# Match on the type column rather than a line offset: the CLI's banner and
# footer vary, so counting header lines silently loses variables.
current_keys() {
  vercel env ls --project "$PROJECT" 2>/dev/null \
    | awk '$1 ~ /^[A-Z][A-Z0-9_]*$/ && ($3 == "Config" || $3 == "Secret") {print $1}' || true
}

# Keys the source file will restore, so the removal pass can warn about any
# variable that would be deleted and not come back.
source_keys=" $(grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' "$FILE" | sed 's/=$//' | tr '\n' ' ')"

echo "Project:  $PROJECT"
echo "Source:   $FILE"
echo "Storing:  ${TYPE_FLAG#--}"
[[ $APPLY -eq 1 ]] || echo "Mode:     DRY RUN (pass --apply to execute)"
echo

echo "== Removing =="
existing=()
while read -r key; do
  [[ -n "$key" ]] && existing+=("$key")
done < <(current_keys)

orphaned=()
for key in ${existing[@]+"${existing[@]}"}; do
  if [[ "$source_keys" == *" $key "* ]]; then
    echo "  - $key"
  else
    echo "  - $key  ** not in $FILE — would NOT be restored **"
    orphaned+=("$key")
  fi
done
[[ ${#existing[@]} -gt 0 ]] || echo "  (nothing to remove)"

# Checked before anything is deleted: a wipe that cannot be undone by the
# following add pass is almost always a mistake.
if [[ ${#orphaned[@]} -gt 0 ]]; then
  echo >&2
  echo "Refusing to run: ${#orphaned[@]} variable(s) are on the project but not in $FILE:" >&2
  printf '  %s\n' "${orphaned[@]}" >&2
  echo "Add them to $FILE first, or delete them by hand if they are obsolete." >&2
  exit 1
fi

removed=0
for key in ${existing[@]+"${existing[@]}"}; do
  if [[ $APPLY -eq 1 ]]; then
    vercel env rm "$key" --project "$PROJECT" -y >/dev/null 2>&1 \
      || echo "      failed to remove $key" >&2
  fi
  removed=$((removed + 1))
done

echo
echo "== Adding =="
added=0; skipped=0
while IFS= read -r line; do
  [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
  key=${line%%=*}
  value=${line#*=}
  # Strip one layer of surrounding quotes, as written by `vercel env pull`.
  [[ "$value" == \"*\" ]] && value=${value:1:${#value}-2}
  [[ "$value" == \'*\' ]] && value=${value:1:${#value}-2}

  if is_excluded "$key"; then
    echo "  ~ $key (excluded)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "  + $key (len ${#value})"
  if [[ $APPLY -eq 1 ]]; then
    printf '%s' "$value" \
      | vercel env add "$key" production,preview --project "$PROJECT" "$TYPE_FLAG" --force >/dev/null 2>&1 \
      || echo "      failed to add $key" >&2
  fi
  added=$((added + 1))
done < "$FILE"

echo
echo "Removed $removed, added $added, excluded $skipped."
if [[ $APPLY -eq 0 ]]; then
  echo "Dry run — nothing changed. Re-run with --apply."
else
  echo "Redeploy for the new values to take effect: vercel redeploy --project $PROJECT"
fi
