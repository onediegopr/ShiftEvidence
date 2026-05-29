(function () {
  var marker = "__srFresh";
  var currentUrl = new URL(window.location.href);

  if (currentUrl.searchParams.has(marker)) {
    return;
  }

  currentUrl.searchParams.set(marker, String(Date.now()));
  window.location.replace(currentUrl.toString());
})();
