// Eliget - Light Mode Only (Dark Mode Removed)
// এই ফাইলটি এখন শুধু দুটি কাজ করে:
//   1. পুরনো user-দের localStorage থেকে 'eliget_theme' ক্লিয়ার করা
//   2. <html> element থেকে data-theme attribute রিমুভ করা
// এখানে কোনো toggle function নেই, কোনো dark logic নেই।

(function () {
  try {
    localStorage.removeItem('eliget_theme');
  } catch (e) {
    // localStorage unavailable (private mode) — ignore
  }
  document.documentElement.removeAttribute('data-theme');
})();
