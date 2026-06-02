export default function DemoWorkspaceBanner() {
  return (
    <aside className="demo-workspace-banner" aria-label="Demo Workspace read-only notice">
      <strong>Demo Workspace - synthetic data only.</strong>
      <span>
        You are exploring a read-only sample assessment created by Shift Evidence. This is not a real company and does
        not analyze your infrastructure. Uploads, edits and live AI Advisor are disabled in demo mode.
      </span>
    </aside>
  );
}
