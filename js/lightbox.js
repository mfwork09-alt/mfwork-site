/* 画像の拡大表示（ライトボックス）
   .case-figure の画像をクリック／タップすると全画面で表示し、
   ×ボタン・背景クリック・Escキーで閉じられるようにする。
   JSが動かない環境では、元のリンク（別タブで画像を開く）がそのまま働く。 */
(function () {
  'use strict';

  var overlay, imgEl, capEl, closeBtn, lastFocused;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '拡大画像');
    overlay.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="閉じる">×</button>' +
      '<figure class="lightbox-inner">' +
      '<img alt="">' +
      '<figcaption></figcaption>' +
      '</figure>';
    document.body.appendChild(overlay);

    imgEl = overlay.querySelector('img');
    capEl = overlay.querySelector('figcaption');
    closeBtn = overlay.querySelector('.lightbox-close');

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === overlay.querySelector('.lightbox-inner')) close();
    });
  }

  function open(src, alt, caption) {
    if (!overlay) build();
    lastFocused = document.activeElement;
    imgEl.src = src;
    imgEl.alt = alt || '';
    capEl.textContent = caption || '';
    capEl.style.display = caption ? '' : 'none';
    overlay.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
    document.addEventListener('keydown', onKey);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    document.removeEventListener('keydown', onKey);
    imgEl.src = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') close();
  }

  function init() {
    var figures = document.querySelectorAll('.case-figure');
    Array.prototype.forEach.call(figures, function (fig) {
      var img = fig.querySelector('img');
      if (!img) return;

      var cap = fig.querySelector('figcaption');
      var capText = '';
      if (cap) {
        capText = cap.textContent.replace('（タップで拡大）', '').trim();
      }

      // 原寸の画像がリンクされていればそれを、なければ表示中の画像を使う
      var link = fig.querySelector('a');
      var fullSrc = link ? link.getAttribute('href') : img.getAttribute('src');

      var trigger = link || img;
      trigger.classList.add('is-zoomable');
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        open(fullSrc, img.getAttribute('alt'), capText);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
