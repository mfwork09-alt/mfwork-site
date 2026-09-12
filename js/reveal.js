/* スクロールに合わせた控えめなフェードイン
   画面に入った要素をふわりと表示する。動きは0.5秒・16pxの上移動のみ。
   「視差効果を減らす」設定の端末では動かさない。
   JSが動かない環境では、最初からすべて表示される（CSSで .reveal は透明だが、
   下の early-return で class を付けないため影響しない）。 */
(function () {
  'use strict';

  // 対応していない環境では何もしない（要素は通常表示のまま）
  if (!('IntersectionObserver' in window)) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // フェードインさせる要素
  var selectors = [
    '.section-head',
    '.problem-list li',
    '.problem-message',
    '.card',
    '.flow-steps li',
    '.service-block',
    '.case-block',
    '.column-card',
    '.result-summary',
    '.diag-promo',
    '.profile-card',
    '.stance',
    '.exp-grid li',
    '.trust-grid > div',
    '.article'
  ];

  var targets = document.querySelectorAll(selectors.join(','));
  if (!targets.length) return;

  Array.prototype.forEach.call(targets, function (el) {
    el.classList.add('reveal');
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  Array.prototype.forEach.call(targets, function (el) {
    io.observe(el);
  });

  // 念のため：何らかの理由で監視が働かない場合も、一定時間後には必ず表示する
  setTimeout(function () {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('is-in');
    });
  }, 3000);
})();
