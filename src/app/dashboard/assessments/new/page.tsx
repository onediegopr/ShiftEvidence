import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { createAssessmentAction } from "./actions";

type NewAssessmentPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function NewAssessmentPage({ searchParams }: NewAssessmentPageProps) {
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">New assessment</div>
          <h1>Create VMware to Proxmox readiness assessment</h1>
          <p>
            Cost / Risk Engine is included. Storage Destination Readiness stays optional.
          </p>
        </div>
      </section>

      {error ? <div className="dashboard-banner dashboard-banner-error">{error}</div> : null}

      <form action={createAssessmentAction} className="glass-card assessment-builder">
        <div className="assessment-builder-grid">
          <div>
            <label className="form-label">
              Assessment title
              <input
                name="title"
                className="form-input"
                type="text"
                placeholder="Example: EMEA VMware exit review"
              />
            </label>

            <label className="form-label">
              Client / company label
              <input
                name="clientLabel"
                className="form-input"
                type="text"
                placeholder="Optional enterprise or client label"
              />
            </label>
          </div>

          <div className="assessment-module-list">
            <div className="assessment-module included">
              <Check size={16} />
              <div>
                <strong>Cost / Risk Engine</strong>
                <span>Included in every assessment.</span>
              </div>
            </div>
            <div className="assessment-module optional">
              <Minus size={16} />
              <div>
                <strong>Storage Destination Readiness</strong>
                <span>Optional add-on for deeper target architecture validation.</span>
              </div>
            </div>
            <label className="assessment-toggle">
              <input name="storageReadinessEnabled" type="checkbox" />
              Include Storage Destination Readiness Analysis
            </label>
          </div>
        </div>

        <div className="assessment-builder-actions">
          <button type="submit" className="btn btn-primary btn-glow">
            Create draft assessment
            <ArrowRight size={16} />
          </button>
          <Link href="/dashboard/assessments" className="btn btn-secondary">
            Back to assessments
          </Link>
        </div>
      </form>
    </main>
  );
}
