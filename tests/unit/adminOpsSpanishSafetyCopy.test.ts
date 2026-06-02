import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminPage = () => readFileSync("src/app/dashboard/admin/page.tsx", "utf8");
const billingPage = () => readFileSync("src/app/dashboard/admin/billing/page.tsx", "utf8");
const pricingPage = () => readFileSync("src/app/dashboard/admin/pricing/page.tsx", "utf8");
const unlockRequestsPage = () => readFileSync("src/app/dashboard/admin/unlock-requests/page.tsx", "utf8");

describe("admin operations Spanish safety copy", () => {
  it("keeps the main admin console guarded against unsafe internal notes", () => {
    const source = adminPage();

    expect(source).toContain("Consola interna segura");
    expect(source).toContain("No guardar secretos");
    expect(source).toContain("passwords, API keys");
  });

  it("keeps billing manual operations explicit and non-automated", () => {
    const source = billingPage();

    expect(source).toContain("Operacion interna sensible");
    expect(source).toContain("Wise/bank transfer es solicitud manual");
    expect(source).toContain("Stripe live debe permanecer desactivado");
    expect(source).toContain("Factura enviada");
    expect(source).toContain("Esta actualizacion no concede acceso ni crea transferencias Wise");
  });

  it("keeps pricing approvals separated from public prices and billing runtime", () => {
    const source = pricingPage();

    expect(source).toContain("No modifica precios");
    expect(source).toContain("publicos, billing runtime");
    expect(source).toContain("billing runtime, checkout, pagos ni entitlements automaticos");
    expect(source).toContain("Aprobar snapshots requiere fuente");
    expect(source).toContain("validada fuera de la plataforma");
  });

  it("keeps unlock request actions framed as manual access operations", () => {
    const source = unlockRequestsPage();

    expect(source).toContain("No concede acceso");
    expect(source).toContain("automaticamente salvo que la accion lo indique");
    expect(source).toContain("No completar si no verificaste el pago fuera de la");
    expect(source).toContain("plataforma, el assessment");
    expect(source).toContain("completar puede habilitar acceso real");
  });

  it("does not reintroduce Lemon copy in admin operation surfaces", () => {
    const adminSurfaces = [
      adminPage(),
      billingPage(),
      pricingPage(),
      unlockRequestsPage(),
    ].join("\n").toLowerCase();

    expect(adminSurfaces).not.toContain("lemon");
  });
});
