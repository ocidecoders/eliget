// Eliget Anti-Addiction Logic (20 Minute Warning)
(function() {
  // Inject CSS dynamically
  const style = document.createElement('style');
  style.innerHTML = `
    #eligetAddictionModal {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(6px);
      z-index: 99999; display: none; justify-content: center; align-items: center; padding: 20px;
      opacity: 0; transition: opacity 0.3s ease;
    }
    #eligetAddictionModal.show { display: flex; opacity: 1; }
    .addiction-box {
      background: var(--surface, #FFFFFF); width: 100%; max-width: 380px;
      border-radius: 24px; padding: 30px 25px; text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid var(--line, #E2E8F0);
      transform: translateY(20px); transition: transform 0.3s ease;
    }
    #eligetAddictionModal.show .addiction-box { transform: translateY(0); }
    .addiction-icon {
      width: 70px; height: 70px; border-radius: 50%; background: #ECFDF5;
      display: flex; justify-content: center; align-items: center; margin: 0 auto 20px auto;
      color: var(--green, #10B981);
    }
    .addiction-icon svg { width: 36px; height: 36px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .addiction-title { font-family: 'Archivo', sans-serif; font-size: 1.4rem; font-weight: 800; color: var(--text, #0F172A); margin-bottom: 10px; }
    .addiction-text { font-size: 0.95rem; color: var(--text-muted, #64748B); line-height: 1.5; margin-bottom: 25px; }
    .addiction-btn {
      width: 100%; padding: 14px; background: var(--green, #10B981); color: white;
      border: none; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer;
      transition: background 0.2s;
    }
    .addiction-btn:hover { background: var(--green-dark, #059669); }
  `;
  document.head.appendChild(style);

  // Create Modal HTML
  const modal = document.createElement('div');
  modal.id = 'eligetAddictionModal';
  modal.innerHTML = `
    <div class="addiction-box">
      <div class="addiction-icon">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </div>
      <div class="addiction-title">Time to take a break</div>
      <div class="addiction-text">You've been using Eliget for 20 minutes. Remember, real life happens offline. Take a deep breath, stretch, and enjoy the moment.</div>
      <button class="addiction-btn" onclick="document.getElementById('eligetAddictionModal').classList.remove('show')">I understand</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 20 Minutes in milliseconds (20 * 60 * 1000)
  const WARNING_TIME = 20 * 60 * 1000; 

  setTimeout(() => {
    // Only show if user is still on the page
    if (document.visibilityState === 'visible') {
      modal.classList.add('show');
    } else {
      // If they switched tabs, wait until they come back
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          modal.classList.add('show');
          document.removeEventListener('visibilitychange', onVisible);
        }
      };
      document.addEventListener('visibilitychange', onVisible);
    }
  }, WARNING_TIME);
})();
