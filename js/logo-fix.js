/* Reemplaza el SVG placeholder por el logo real logo.jpeg */
(function () {
  function applyLogo() {
    var mark = document.querySelector('.nav-logo-mark');
    if (!mark) return;

    // Si ya es una imagen con el logo, no hacer nada
    if (mark.tagName === 'IMG' && mark.src && mark.src.indexOf('logo.jpeg') !== -1) return;

    var img = document.createElement('img');
    img.className = 'nav-logo-mark';
    img.src = 'logo.jpeg';
    img.alt = 'Khaos Deportivo';
    img.width = 44;
    img.height = 44;
    img.style.width = '44px';
    img.style.height = '44px';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';

    mark.parentNode.replaceChild(img, mark);

    // Favicon
    var link = document.querySelector("link[rel='icon']");
    if (link) {
      link.type = 'image/jpeg';
      link.href = 'logo.jpeg';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLogo);
  } else {
    applyLogo();
  }
})();
