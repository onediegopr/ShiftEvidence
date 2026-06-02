#!/usr/bin/env bash
#
# Shift Evidence Proxmox Target Collector
# Copyright (c) Shift Evidence.
# Developed as proprietary tooling for Shift Evidence migration readiness assessments.
#
# Version: 0.1.0
# Owner: Shift Evidence
# Mode: read-only
# Output schema: shift-evidence.proxmox-target.v1
# Last reviewed: 2026-06-02
#
# This script is designed for read-only evidence collection from Proxmox VE.
# It does not modify infrastructure, create resources, delete resources,
# change configuration, restart services, install packages, or persist credentials.
#
# Review this script before execution.
# The generated output file can be inspected locally before upload to Shift Evidence.
#

set -u
set -o pipefail

COLLECTOR_NAME="shift-proxmox-target-collector"
COLLECTOR_VERSION="0.1.0"
SCHEMA="shift-evidence.proxmox-target.v1"
OUTPUT_FILE="./shift-proxmox-target-output.json"
OUTPUT_DIR=""
SKIP_CEPH="false"
SKIP_HA="false"
SKIP_NETWORK="false"
INCLUDE_RAW="false"
PRETTY="true"

WARNINGS_FILE="$(mktemp)"
ERRORS_FILE="$(mktemp)"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -f "$WARNINGS_FILE" "$ERRORS_FILE"
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

usage() {
  cat <<'USAGE'
Shift Evidence Proxmox Target Collector

Read-only collector for Proxmox VE target validation. It writes one local JSON file
that you can review before uploading to Shift Evidence.

Usage:
  ./shift-proxmox-target-collector.sh --output ./shift-proxmox-target-output.json

Options:
  --output <file>       Write JSON to this file.
  --output-dir <dir>    Write default output file inside this directory.
  --skip-ceph           Skip Ceph read-only endpoints.
  --skip-ha             Skip HA read-only endpoints.
  --skip-network        Skip network/bridge read-only endpoints.
  --include-raw false   Reserved; raw command output is not embedded by default.
  --pretty              Pretty-print JSON output when python3 is available.
  --help                Show this help.

Safety:
  This collector only calls read-oriented local commands and pvesh get endpoints.
  It does not upload data, install packages, restart services, persist credentials,
  or change Proxmox configuration.
USAGE
}

add_json_line() {
  local file="$1"
  local code="$2"
  local message="$3"
  local target="${4:-collector}"
  local severity="${5:-warning}"
  python3 - "$file" "$code" "$message" "$target" "$severity" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
entry = {
    "code": sys.argv[2],
    "message": sys.argv[3],
    "target": sys.argv[4],
    "severity": sys.argv[5],
}
with path.open("a", encoding="utf-8") as handle:
    handle.write(json.dumps(entry, separators=(",", ":")) + "\n")
PY
}

warn() {
  add_json_line "$WARNINGS_FILE" "$1" "$2" "${3:-collector}" "${4:-warning}"
}

error_nonfatal() {
  add_json_line "$ERRORS_FILE" "$1" "$2" "${3:-collector}" "${4:-error}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --skip-ceph)
      SKIP_CEPH="true"
      shift
      ;;
    --skip-ha)
      SKIP_HA="true"
      shift
      ;;
    --skip-network)
      SKIP_NETWORK="true"
      shift
      ;;
    --include-raw)
      INCLUDE_RAW="${2:-false}"
      shift 2
      ;;
    --pretty)
      PRETTY="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      warn "unknown_option" "Unknown option ignored." "$1"
      shift
      ;;
  esac
done

if [[ -n "$OUTPUT_DIR" ]]; then
  mkdir -p "$OUTPUT_DIR"
  OUTPUT_FILE="${OUTPUT_DIR%/}/shift-proxmox-target-output.json"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to assemble safe JSON output. No infrastructure changes were made." >&2
  exit 1
fi

if [[ "$INCLUDE_RAW" != "false" ]]; then
  warn "raw_output_disabled" "Raw output embedding is disabled in this collector version; normalized read-only output will be generated." "includeRaw"
  INCLUDE_RAW="false"
fi

run_pvesh_get() {
  local key="$1"
  local endpoint="$2"
  shift 2
  local output="$WORK_DIR/${key}.json"

  if ! command -v pvesh >/dev/null 2>&1; then
    warn "pvesh_unavailable" "pvesh command is not available; collector may not be running on a Proxmox VE node." "$endpoint"
    printf 'null' > "$output"
    return 0
  fi

  if pvesh get "$endpoint" "$@" --output-format json > "$output" 2>"$WORK_DIR/${key}.err"; then
    if [[ ! -s "$output" ]]; then
      printf 'null' > "$output"
      warn "empty_endpoint_output" "Endpoint returned empty output." "$endpoint"
    fi
  else
    printf 'null' > "$output"
    local err
    err="$(tr '\n' ' ' < "$WORK_DIR/${key}.err" | cut -c 1-220)"
    warn "endpoint_unavailable" "Read-only endpoint failed or is unavailable: ${err}" "$endpoint"
  fi
}

run_pvesh_get "version" "/version"
run_pvesh_get "cluster_status" "/cluster/status"
run_pvesh_get "nodes" "/nodes"
run_pvesh_get "storage" "/storage"
run_pvesh_get "resources" "/cluster/resources" "--type" "vm"

node_names="$(python3 - "$WORK_DIR/nodes.json" <<'PY'
import json
import sys

try:
    data = json.load(open(sys.argv[1], encoding="utf-8"))
except Exception:
    data = []
if not isinstance(data, list):
    data = []
for item in data:
    if isinstance(item, dict):
        name = item.get("node")
        if isinstance(name, str) and name:
            print(name)
PY
)"

node_index=0
for node in $node_names; do
  safe_node="$(printf '%s' "$node" | tr -c 'A-Za-z0-9_.-' '_')"
  run_pvesh_get "node_${node_index}_status_${safe_node}" "/nodes/${node}/status"
  run_pvesh_get "node_${node_index}_storage_${safe_node}" "/nodes/${node}/storage"
  if [[ "$SKIP_NETWORK" != "true" ]]; then
    run_pvesh_get "node_${node_index}_network_${safe_node}" "/nodes/${node}/network"
  fi
  if [[ "$SKIP_CEPH" != "true" ]]; then
    run_pvesh_get "node_${node_index}_ceph_${safe_node}" "/nodes/${node}/ceph/status"
  fi
  node_index=$((node_index + 1))
done

if [[ -z "$node_names" ]]; then
  warn "no_nodes_discovered" "No Proxmox nodes were discovered from /nodes." "/nodes"
fi

if [[ "$SKIP_HA" != "true" ]]; then
  run_pvesh_get "ha_resources" "/cluster/ha/resources"
  run_pvesh_get "ha_groups" "/cluster/ha/groups"
  run_pvesh_get "ha_status" "/cluster/ha/status/current"
else
  printf '[]' > "$WORK_DIR/ha_resources.json"
  printf '[]' > "$WORK_DIR/ha_groups.json"
  printf '[]' > "$WORK_DIR/ha_status.json"
  warn "ha_skipped" "HA endpoint collection was skipped by operator request." "ha"
fi

if [[ "$SKIP_CEPH" != "true" ]]; then
  run_pvesh_get "cluster_ceph_status" "/cluster/ceph/status"
else
  printf 'null' > "$WORK_DIR/cluster_ceph_status.json"
  warn "ceph_skipped" "Ceph endpoint collection was skipped by operator request." "ceph"
fi

python3 - "$WORK_DIR" "$WARNINGS_FILE" "$ERRORS_FILE" "$OUTPUT_FILE" "$COLLECTOR_NAME" "$COLLECTOR_VERSION" "$SCHEMA" "$PRETTY" <<'PY'
import glob
import json
import math
import os
import pathlib
import platform
import socket
import sys
from datetime import datetime, timezone

work_dir = pathlib.Path(sys.argv[1])
warnings_file = pathlib.Path(sys.argv[2])
errors_file = pathlib.Path(sys.argv[3])
output_file = pathlib.Path(sys.argv[4])
collector_name = sys.argv[5]
collector_version = sys.argv[6]
schema = sys.argv[7]
pretty = sys.argv[8] == "true"

def read_json(name, fallback=None):
    try:
        return json.loads((work_dir / f"{name}.json").read_text(encoding="utf-8"))
    except Exception:
        return fallback

def read_json_lines(path):
    entries = []
    if not path.exists():
        return entries
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                entries.append(parsed)
        except Exception:
            continue
    return entries

def as_list(value):
    return value if isinstance(value, list) else []

def as_dict(value):
    return value if isinstance(value, dict) else {}

def num(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)) and math.isfinite(value):
        return float(value)
    if isinstance(value, str):
        try:
            parsed = float(value)
            return parsed if math.isfinite(parsed) else None
        except Exception:
            return None
    return None

version = read_json("version", {})
cluster_status = read_json("cluster_status", [])
nodes = as_list(read_json("nodes", []))
storages = as_list(read_json("storage", []))
resources = as_list(read_json("resources", []))
ha_resources = as_list(read_json("ha_resources", []))
ha_groups = as_list(read_json("ha_groups", []))
ha_status = read_json("ha_status", [])
cluster_ceph_status = read_json("cluster_ceph_status", None)

node_status = []
node_storage = []
networks = []
node_ceph = []

for path in sorted(glob.glob(str(work_dir / "node_*_status_*.json"))):
    payload = read_json(pathlib.Path(path).stem, {})
    if isinstance(payload, dict):
        node_status.append(payload)

for path in sorted(glob.glob(str(work_dir / "node_*_storage_*.json"))):
    payload = read_json(pathlib.Path(path).stem, [])
    if isinstance(payload, list):
        node_storage.extend(payload)

for path in sorted(glob.glob(str(work_dir / "node_*_network_*.json"))):
    payload = read_json(pathlib.Path(path).stem, [])
    if isinstance(payload, list):
        networks.extend(payload)

for path in sorted(glob.glob(str(work_dir / "node_*_ceph_*.json"))):
    payload = read_json(pathlib.Path(path).stem, None)
    if payload not in (None, []):
        node_ceph.append(payload)

storage_types = [str(item.get("type", "")).lower() for item in storages if isinstance(item, dict)]
pbs_targets = [
    item for item in storages
    if isinstance(item, dict)
    and (str(item.get("type", "")).lower() == "pbs" or "backup" in str(item.get("content", "")).lower())
]

node_status_by_name = {
    str(item.get("node")): item
    for item in node_status
    if isinstance(item, dict) and item.get("node")
}

online_nodes = 0
total_memory = 0.0
used_memory = 0.0
total_cpu = 0.0
for item in nodes:
    if not isinstance(item, dict):
        continue
    name = str(item.get("node", ""))
    status_text = str(item.get("status", "")).lower()
    if status_text == "online":
        online_nodes += 1
    status = node_status_by_name.get(name, {})
    maxmem = num(status.get("memory", {}).get("total") if isinstance(status.get("memory"), dict) else status.get("maxmem"))
    memused = num(status.get("memory", {}).get("used") if isinstance(status.get("memory"), dict) else status.get("mem"))
    cpus = num(status.get("cpuinfo", {}).get("cpus") if isinstance(status.get("cpuinfo"), dict) else status.get("maxcpu"))
    total_memory += maxmem or 0
    used_memory += memused or 0
    total_cpu += cpus or 0

total_storage = 0.0
used_storage = 0.0
for item in node_storage:
    if not isinstance(item, dict):
        continue
    total = num(item.get("total")) or 0
    used = num(item.get("used")) or 0
    total_storage += total
    used_storage += used

vm_count = sum(1 for item in resources if isinstance(item, dict) and str(item.get("type", "")).lower() == "qemu")
ct_count = sum(1 for item in resources if isinstance(item, dict) and str(item.get("type", "")).lower() == "lxc")
bridge_count = sum(1 for item in networks if isinstance(item, dict) and str(item.get("type", "")).lower() in {"bridge", "OVSBridge".lower()})
vlan_bridge_count = sum(
    1 for item in networks
    if isinstance(item, dict)
    and str(item.get("type", "")).lower() in {"bridge", "ovsbridge"}
    and bool(item.get("bridge_vlan_aware") or item.get("vlan-aware") or item.get("vlan_aware"))
)

warnings = read_json_lines(warnings_file)
errors = read_json_lines(errors_file)
if len(nodes) <= 1:
    warnings.append({
        "code": "single_node_or_no_cluster",
        "message": "Single-node or no clustered target detected; HA readiness is limited.",
        "target": "cluster",
        "severity": "warning",
    })
if not pbs_targets:
    warnings.append({
        "code": "no_pbs_storage_detected",
        "message": "No PBS/backup-capable storage target was detected from storage evidence.",
        "target": "storage",
        "severity": "info",
    })
if cluster_ceph_status in (None, [], {}):
    warnings.append({
        "code": "ceph_not_detected",
        "message": "Ceph was not detected or its endpoint was unavailable.",
        "target": "ceph",
        "severity": "info",
    })

payload = {
    "schema": schema,
    "collector": {
        "name": collector_name,
        "displayName": "Shift Evidence Proxmox Target Collector",
        "version": collector_version,
        "owner": "Shift Evidence",
        "mode": "read-only",
    },
    "source": {
        "platform": "proxmox-ve",
        "hostname": socket.gethostname(),
        "kernel": platform.release(),
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "pveshAvailable": True,
        "includeRaw": False,
    },
    "safety": {
        "persistentCredentialsStored": False,
        "configurationChanged": False,
        "rawSecretsIncluded": False,
        "networkUploadPerformed": False,
        "packagesInstalled": False,
        "servicesRestarted": False,
    },
    "summary": {
        "nodeCount": len(nodes),
        "onlineNodeCount": online_nodes,
        "storageCount": len(storages),
        "sharedStorageCount": sum(1 for item in storages if isinstance(item, dict) and bool(item.get("shared"))),
        "vmCount": vm_count,
        "containerCount": ct_count,
        "haResourceCount": len(ha_resources),
        "pbsStorageCount": len(pbs_targets),
        "cephDetected": cluster_ceph_status not in (None, [], {}),
        "zfsDetected": "zfspool" in storage_types,
        "warningCount": len(warnings),
        "errorCount": len(errors),
    },
    "entities": {
        "cluster": {
            "status": cluster_status,
            "version": version,
        },
        "nodes": nodes,
        "nodeStatus": node_status,
        "storages": storages,
        "nodeStorage": node_storage,
        "networks": networks,
        "ha": {
            "resources": ha_resources,
            "groups": ha_groups,
            "status": ha_status,
        },
        "resources": resources,
        "ceph": {
            "cluster": cluster_ceph_status,
            "nodes": node_ceph,
        },
        "backupTargets": pbs_targets,
    },
    "warnings": warnings,
    "errors": errors,
}

output_file.parent.mkdir(parents=True, exist_ok=True)
output_file.write_text(
    json.dumps(payload, indent=2 if pretty else None, sort_keys=False),
    encoding="utf-8",
)
print(str(output_file))
PY
