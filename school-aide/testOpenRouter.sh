#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
OPENROUTER_KEY_URL="https://openrouter.ai/api/v1/key"
OPENROUTER_CHAT_URL="https://openrouter.ai/api/v1/chat/completions"
MODEL="${OPENROUTER_TEST_MODEL:-openrouter/auto}"

read_env_value() {
  local name="$1"
  local line key value

  [[ -f "$ENV_FILE" ]] || return 1

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"

    if [[ "$key" == "$name" ]]; then
      value="${value#"${value%%[![:space:]]*}"}"
      value="${value%"${value##*[![:space:]]}"}"
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      printf '%s' "$value"
      return 0
    fi
  done < "$ENV_FILE"

  return 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local output_file status

  output_file="$(mktemp)"
  if [[ -n "$body" ]]; then
    status="$(
      curl -sS -o "$output_file" -w '%{http_code}' \
        -X "$method" "$url" \
        -H "Authorization: Bearer ${VITE_OPENROUTER_API_KEY}" \
        -H "Content-Type: application/json" \
        -H "HTTP-Referer: http://localhost:5173" \
        -H "X-Title: school-aide" \
        --data "$body"
    )"
  else
    status="$(
      curl -sS -o "$output_file" -w '%{http_code}' \
        -X "$method" "$url" \
        -H "Authorization: Bearer ${VITE_OPENROUTER_API_KEY}"
    )"
  fi

  printf '%s\n%s\n' "$status" "$output_file"
}

summarize_json() {
  local file="$1"
  python3 - "$file" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
except Exception:
    print("Response was not JSON.")
    sys.exit(0)

if isinstance(data, dict) and "error" in data:
    error = data["error"]
    if isinstance(error, dict):
        message = error.get("message") or error.get("code") or error
    else:
        message = error
    print(f"Error: {message}")
    sys.exit(0)

if isinstance(data, dict) and isinstance(data.get("data"), dict):
    key_data = data["data"]
    remaining = key_data.get("limit_remaining", "<unknown>")
    print("Key recognized by OpenRouter.")
    print(f"Limit remaining: {remaining}")
    sys.exit(0)

choices = data.get("choices") if isinstance(data, dict) else None
if choices:
    first_choice = choices[0] if isinstance(choices[0], dict) else {}
    message = first_choice.get("message") or {}
    if isinstance(message, dict):
        content = message.get("content") or ""
    else:
        content = str(message)
    if content:
        print(f"Chat response: {content[:120]}")
    else:
        model = data.get("model", "<unknown model>")
        response_id = data.get("id", "<no id>")
        print(f"Chat completion accepted by {model}; response id: {response_id}")
    sys.exit(0)

print("JSON response received.")
PY
}

require_command curl
require_command python3

VITE_OPENROUTER_API_KEY="$(read_env_value VITE_OPENROUTER_API_KEY || true)"
if [[ -z "${VITE_OPENROUTER_API_KEY}" ]]; then
  echo "VITE_OPENROUTER_API_KEY is missing from ${ENV_FILE}." >&2
  exit 1
fi

if [[ "$VITE_OPENROUTER_API_KEY" != sk-or-* ]]; then
  echo "VITE_OPENROUTER_API_KEY is present but does not start with sk-or-." >&2
  exit 1
fi

echo "OpenRouter key found in ${ENV_FILE}; value is not printed."
echo

echo "1. Checking whether OpenRouter recognizes the API key..."
key_result="$(curl_json GET "$OPENROUTER_KEY_URL")"
key_status="$(printf '%s\n' "$key_result" | sed -n '1p')"
key_body="$(printf '%s\n' "$key_result" | sed -n '2p')"
trap 'rm -f "$key_body" "${chat_body:-}"' EXIT
echo "HTTP ${key_status} from ${OPENROUTER_KEY_URL}"
summarize_json "$key_body"

if [[ "$key_status" != 2* ]]; then
  echo
  echo "OpenRouter was reached, but the key was not accepted."
  exit 1
fi

echo
echo "2. Sending a tiny chat completion request with model: ${MODEL}"
chat_payload="$(
  MODEL="$MODEL" python3 <<'PY'
import json
import os

print(json.dumps({
    "model": os.environ["MODEL"],
    "max_tokens": 8,
    "messages": [
        {"role": "user", "content": "Reply with exactly: ok"}
    ],
}))
PY
)"

chat_result="$(curl_json POST "$OPENROUTER_CHAT_URL" "$chat_payload")"
chat_status="$(printf '%s\n' "$chat_result" | sed -n '1p')"
chat_body="$(printf '%s\n' "$chat_result" | sed -n '2p')"
echo "HTTP ${chat_status} from ${OPENROUTER_CHAT_URL}"
summarize_json "$chat_body"

if [[ "$chat_status" != 2* ]]; then
  echo
  echo "OpenRouter was reached and the key endpoint passed, but chat completion failed."
  echo "Try overriding the model, for example:"
  echo "  OPENROUTER_TEST_MODEL=openai/gpt-4o-mini ./testOpenRouter.sh"
  exit 1
fi

echo
echo "Success: OpenRouter is reachable, the API key is recognized, and chat completions work."
