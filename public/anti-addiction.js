// Anti-Addiction Screen Time Tracker
(function() {
    // 1. Get current time spent today
    let timeSpent = parseInt(sessionStorage.getItem('eliget_time_spent') || '0');
    const LIMIT_SECONDS = 20 * 60; // 20 minutes limit
    const breakShown = sessionStorage.getItem('eliget_break_shown') === 'true';

    // 2. Create the UI for the popup if it doesn't exist
    if (!document.getElementById('addictionModal')) {
        const modalHTML = `
        <div id="addictionModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);">
            <div style="background:#FFFFFF; padding:30px 20px; border-radius:20px; text-align:center; max-width:350px; width:100%; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="width:70px; height:70px; background:#ecfdf5; border-radius:50%; display:flex; justify-content:center; align-items:center; margin:0 auto 20px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" width="36" height="36" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <h2 style="font-family:'Archivo', sans-serif; font-size:1.4rem; color:#111827; margin-bottom:10px;">Time for a Break!</h2>
                <p style="color:#6B7280; font-size:0.95rem; line-height:1.5; margin-bottom:25px;">
                    You've been on Eliget for 20 minutes. As an anti-addiction platform, we recommend stepping away for a bit, stretching, and enjoying the real world.
                </p>
                <button onclick="document.getElementById('addictionModal').style.display='none'" style="background:#10B981; color:white; border:none; padding:12px 24px; border-radius:999px; font-weight:600; font-size:1rem; cursor:pointer; width:100%;">I'll take a break</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 3. Timer logic
    setInterval(() => {
        timeSpent++;
        sessionStorage.setItem('eliget_time_spent', timeSpent);

        // Show popup only once per session after limit is hit
        if (timeSpent >= LIMIT_SECONDS && !breakShown) {
            document.getElementById('addictionModal').style.display = 'flex';
            sessionStorage.setItem('eliget_break_shown', 'true');
        }
    }, 1000);
})();
