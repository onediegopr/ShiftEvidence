import { ArrowRight } from 'lucide-react';

export default function Footer() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you! We will reach out to you with migration resources shortly.');
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <a href="#" className="logo-container" style={{ marginBottom: '0.5rem' }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="16" r="8" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                <path
                  d="M12 16H24M24 16L20 12M24 16L20 20"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                infrashift<span className="text-cyan">.</span>
              </span>
            </a>
            <p style={{ fontSize: '0.85rem' }}>
              Enterprise-grade VMware to Proxmox migration services. Fully automated checks, custom translation, and zero data loss, guaranteed.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">Platform</h4>
            <ul className="footer-links-list">
              <li><a href="#savings">Savings Calculator</a></li>
              <li><a href="#features">Core Features</a></li>
              <li><a href="#comparison">VMware vs Proxmox</a></li>
              <li><a href="#process">Migration Pipeline</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">Resources</h4>
            <ul className="footer-links-list">
              <li><a href="#">TCO Whitepaper</a></li>
              <li><a href="#">Ceph Sizing Guide</a></li>
              <li><a href="#">Proxmox Backup Server (PBS) Setup</a></li>
              <li><a href="#">Broadcom Price Updates</a></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">Get Free Migration Checklist</h4>
            <p style={{ fontSize: '0.85rem' }}>
              Stay updated on license saving calculators and pre-migration scripts.
            </p>
            <form onSubmit={handleSubmit} className="cta-form" style={{ marginTop: '0.5rem', width: '100%', gap: '0.5rem' }}>
              <input 
                type="email" 
                placeholder="Enter work email" 
                required 
                className="form-input" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', borderRadius: '9999px' }}
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Infrashift. All rights reserved.</span>
          <span>Open-Source Powered. Securely Configured.</span>
        </div>
      </div>
    </footer>
  );
}
