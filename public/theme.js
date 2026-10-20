// Eliget Dark Mode Logic
(function() {
  // Check local storage for theme preference
  const savedTheme = localStorage.getItem('eliget_theme');
  
  // If saved theme exists, apply it. Otherwise, check system preference.
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  // Global function to toggle theme (called from settings page)
  window.toggleDarkMode = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('eliget_theme', newTheme);
  };
})();
