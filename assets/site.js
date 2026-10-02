// Menu navigasi untuk layar kecil
(function () {
  const nav = document.querySelector('.nav'), btn = document.querySelector('.menu-btn');
  if (!nav || !btn) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
})();
