import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SavingsCalculator from './components/SavingsCalculator';
import Features from './components/Features';
import Process from './components/Process';
import Footer from './components/Footer';
import ReadinessValidator from './components/ReadinessValidator';
import { ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleCloseScanner = () => setIsScannerOpen(false);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScannerOpen(true);
  };

  return (
    <>
      {/* Scrollable Main Container */}
      <Navbar onOpenScanner={handleOpenScanner} />
      
      <main style={{ flexGrow: 1 }}>
        <Hero onOpenScanner={handleOpenScanner} />
        
        <SavingsCalculator />
        
        <Features />
        
        <Process />

        {/* Bottom Call-To-Action (CTA) Section */}
        <section className="section cta-section" style={{ background: 'rgba(6, 9, 19, 0.4)' }}>
          <div className="bg-mesh"></div>
          <div className="glow-orb" style={{ top: '30%', left: '40%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.1)' }}></div>
          
          <div className="container">
            <div className="glass-card cta-box">
              <div className="badge">Get Started</div>
              <h2 className="mb-4" style={{ color: 'white' }}>Assure Your Proxmox Shift</h2>
              <p className="mx-auto" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                Stop paying VMware renewal bills. Run our pre-flight cluster check to receive a detailed compatibility scorecard and technical migration plan.
              </p>

              <form onSubmit={handleCtaSubmit} className="cta-form">
                <input 
                  type="email" 
                  placeholder="Enter corporate email" 
                  required 
                  className="form-input" 
                />
                <button type="submit" className="btn btn-primary btn-glow">
                  Initialize Scan
                  <ArrowRight size={18} />
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck className="text-emerald" size={16} />
                  <span>No ESXi agents required</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <HelpCircle className="text-cyan" size={16} />
                  <span>Read-only configuration check</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Interactive Scan Diagnostic Modal */}
      <ReadinessValidator isOpen={isScannerOpen} onClose={handleCloseScanner} />
    </>
  );
}
