(function() {
    const currentTheme = localStorage.getItem('eliget_theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    window.toggleTheme = function() {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('eliget_theme', theme);
        updateThemeUI(theme);
    };

    function updateThemeUI(theme) {
        const checkbox = document.getElementById('darkModeToggle');
        if (checkbox) {
            checkbox.checked = (theme === 'dark');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateThemeUI(currentTheme);
    });
})();
