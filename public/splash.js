(function() {
  const style = document.createElement('style');
  style.innerHTML = `
    #eligetSplash {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: var(--bg, #F3F4F6); z-index: 99999;
      display: flex; justify-content: center; align-items: center;
      opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
    }
    #eligetSplash.show { opacity: 1; pointer-events: all; }
    .splash-content { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .splash-logo { font-family: 'Archivo', sans-serif; font-size: 2.5rem; font-weight: 900; color: var(--text, #111827); margin-bottom: 15px; }
    .splash-logo span { color: var(--green, #10B981); }
    .splash-text { font-family: 'Inter', sans-serif; font-size: 1rem; color: var(--text-muted, #6B7280); font-weight: 500; margin-bottom: 20px; }
    .splash-spinner { width: 32px; height: 32px; border: 3px solid var(--line, #E5E7EB); border-top-color: var(--green, #10B981); border-radius: 50%; animation: eligetSpin 0.8s linear infinite; }
    @keyframes eligetSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

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
        <div class="splash-text">${text}</div>
        <div class="splash-spinner"></div>
      </div>
    `;
    
    void splash.offsetWidth; // Force browser to apply opacity
    splash.classList.add('show');
    
    // No delay. Instantly navigate to the new page.
    window.location.href = url;
  };
})();
