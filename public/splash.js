(function() {
  // Inject Splash CSS dynamically so we don't have to add it to every HTML file
  const style = document.createElement('style');
  style.innerHTML = `
    #eligetSplash {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: var(--bg, #F8FAFC); z-index: 99999;
      display: flex; justify-content: center; align-items: center;
      opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
    }
    #eligetSplash.show { opacity: 1; pointer-events: all; }
    .splash-content { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .splash-logo { font-family: 'Archivo', sans-serif; font-size: 2.5rem; font-weight: 900; color: var(--text, #0F172A); margin-bottom: 10px; letter-spacing: -1px; }
    .splash-logo span { color: var(--green, #10B981); }
    .splash-text { font-family: 'Inter', sans-serif; font-size: 0.95rem; color: var(--text-muted, #64748B); font-weight: 500; margin-bottom: 25px; }
    .splash-spinner { width: 32px; height: 32px; border: 3px solid var(--line, #E2E8F0); border-top-color: var(--green, #10B981); border-radius: 50%; animation: eligetSpin 0.8s linear infinite; }
    @keyframes eligetSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  // Global function for navigation with splash screen
  window.navigateWithSplash = function(url, text) {
    let splash = document.getElementById('eligetSplash');
    if (!splash) {
      splash = document.createElement('div');
      splash.id = 'eligetSplash';
      document.body.appendChild(splash);
    }
    
    splash.innerHTML = `
      <div class="splash-content">
        <div class="splash-logo">Eli<span>get</span></div>
        <div class="splash-text">${text || 'Loading...'}</div>
        <div class="splash-spinner"></div>
      </div>
    `;
    
    // Force reflow to ensure transition applies
    void splash.offsetWidth; 
    splash.classList.add('show');
    
    // Instantly navigate. The new page will handle the rest.
    window.location.href = url;
  };
})();
