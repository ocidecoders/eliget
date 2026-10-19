(function() {
    const currentTheme = localStorage.getItem('eliget_theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    window.toggleTheme = function() {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('eliget_theme', theme);
        updateThemeIcon(theme);
    };

    function updateThemeIcon(theme) {
        const icons = document.querySelectorAll('.theme-toggle-icon');
        icons.forEach(icon => {
            if (theme === 'dark') {
                // Moon icon
                icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" fill="none" stroke-width="2"></path>`;
            } else {
                // Sun icon
                icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateThemeIcon(currentTheme);
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', window.toggleTheme);
        });
    });
})();
