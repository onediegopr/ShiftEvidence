import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const collectorPath = path.join(
  process.cwd(),
  "public",
  "collectors",
  "proxmox",
  "shift-proxmox-target-collector.sh",
);

describe("Shift Evidence Proxmox target collector static safety", () => {
  const content = readFileSync(collectorPath, "utf8");
  const lower = content.toLowerCase();

  it("exists with Shift Evidence ownership and read-only header", () => {
    expect(content).toContain("Shift Evidence Proxmox Target Collector");
    expect(content).toContain("Copyright (c) Shift Evidence");
    expect(content).toContain("proprietary tooling");
    expect(content).toContain("read-only evidence collection");
    expect(content).toContain("does not modify infrastructure");
    expect(content).toContain("Version: 0.1.0");
    expect(content).toContain("Owner: Shift Evidence");
    expect(content).toContain("Mode: read-only");
    expect(content).toContain("Output schema: shift-evidence.proxmox-target.v1");
  });

  it("declares the expected collector schema and safety metadata", () => {
    expect(content).toContain("shift-evidence.proxmox-target.v1");
    expect(content).toContain("shift-proxmox-target-collector");
    expect(content).toContain('"persistentCredentialsStored": False');
    expect(content).toContain('"configurationChanged": False');
    expect(content).toContain('"rawSecretsIncluded": False');
    expect(content).toContain('"networkUploadPerformed": False');
    expect(content).toContain('"packagesInstalled": False');
    expect(content).toContain('"servicesRestarted": False');
  });

  it("uses read-only Proxmox API calls and does not attempt external upload", () => {
    expect(content).toContain("pvesh get");
    expect(lower).not.toContain("curl ");
    expect(lower).not.toContain("wget ");
    expect(lower).not.toContain("invoke-webrequest");
    expect(lower).not.toContain("invoke-restmethod");
  });

  it("does not contain obvious infrastructure write commands", () => {
    const forbiddenCommands = [
      "pvesh create",
      "pvesh set",
      "pvesh delete",
      "qm create",
      "qm set",
      "qm destroy",
      "pct create",
      "pct set",
      "pct destroy",
      "systemctl restart",
      "apt install",
      "apt-get install",
      "zpool create",
      "zfs create",
      "ceph osd destroy",
      "ip link add",
      "brctl addbr",
    ];

    for (const command of forbiddenCommands) {
      expect(lower).not.toContain(command);
    }
  });
});
