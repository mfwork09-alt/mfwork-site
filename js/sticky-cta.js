/* スマホ用の追従お問い合わせボタン
   少しスクロールすると画面下に現れ、ページ下部のCTAに近づくと引っ込む。
   お問い合わせページ本体では表示しない。
   JSが動かない環境では表示されないだけで、閲覧に影響はない。 */
(function () {
  'use strict';

  // お問い合わせページとサンクスページでは不要
  var path = location.pathname;
  if (/contact\.html$/.test(path) || /thanks\.html$/.test(path)) return;

  var bar = document.createElement('div');
  bar.className = 'sticky-cta';
  bar.innerHTML =
    '<div class="sticky-cta-inner">' +
    '<p class="msg"><strong>何から始めるか分からなくても大丈夫です</strong>現状の整理からご一緒します</p>' +
    '<a href="' + (path.indexOf('/column/') > -1 ? '../contact.html' : 'contact.html') + '">相談する</a>' +
    '</div>';
  document.body.appendChild(bar);
  document.body.classList.add('has-sticky-cta');

  // ページ下部のCTA帯やフッターに重ならないよう、近づいたら隠す
  var tail = document.querySelector('.cta-band') || document.querySelector('.article-cta') || document.querySelector('.site-footer');

  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;
    var show = y > 600;

    if (show && tail) {
      var top = tail.getBoundingClientRect().top;
      if (top < window.innerHeight) show = false;
    }
    bar.classList.toggle('is-visible', show);
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update();
})();
