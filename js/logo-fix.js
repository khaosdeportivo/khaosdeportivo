/* Khaos Deportivo - Activa el logo real */
(function () {
  function applyLogo() {
    try {
      var mark = document.querySelector('.nav-logo .nav-logo-mark, a.nav-logo > svg, a.nav-logo > .nav-logo-mark');
      if (!mark) mark = document.querySelector('.nav-logo-mark');
      if (!mark) return;
      if (mark.tagName === 'IMG' && (mark.getAttribute('src') || '').indexOf('logo.jpeg') !== -1) return;

      var img = document.createElement('img');
      img.className = 'nav-logo-mark';
      img.src = 'logo.jpeg';
      img.alt = 'Khaos Deportivo';
      img.width = 44;
      img.height = 44;
      img.style.cssText = 'width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;box-shadow:0 2px 12px rgba(212,175,55,0.3);';

      if (mark.parentNode) {
        mark.parentNode.replaceChild(img, mark);
      }

      var fav = document.querySelector("link[rel='icon']");
      if (fav) {
        fav.type = 'image/jpeg';
        fav.href = 'logo.jpeg';
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLogo);
  } else {
    applyLogo();
  }
  // Por si shared.js carga después
  setTimeout(applyLogo, 100);
  setTimeout(applyLogo, 500);
})();
