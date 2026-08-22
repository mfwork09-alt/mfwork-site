/* コラム一覧のカテゴリ絞り込み
   ボタンを押すと、data-cat が一致する記事だけを表示する。
   見出し（サイト内の記事／noteの記事）は、その中に表示中の記事がなければ隠す。
   URLの #ai などを付けて開くと、その分類で絞り込んだ状態で表示される。
   JSが動かない環境では、すべての記事がそのまま表示される。 */
(function () {
  'use strict';

  var filterBar = document.querySelector('.cat-filter');
  if (!filterBar) return;

  var buttons  = filterBar.querySelectorAll('button[data-filter]');
  var cards    = document.querySelectorAll('.column-card');
  var sections = document.querySelectorAll('.column-section-title[data-section]');
  var emptyMsg = document.querySelector('.filter-empty');

  // 各ボタンに件数を表示する
  function addCounts() {
    Array.prototype.forEach.call(buttons, function (btn) {
      var key = btn.getAttribute('data-filter');
      var n = 0;
      Array.prototype.forEach.call(cards, function (card) {
        if (card.hasAttribute('data-static')) return;
        var cat = card.getAttribute('data-cat') || '';
        if (key === 'all' || cat.split(' ').indexOf(key) > -1) n++;
      });
      var span = document.createElement('span');
      span.className = 'n';
      span.textContent = n;
      btn.appendChild(span);
    });
  }

  // 見出しの直後から次の見出しまでの間に、表示中の記事があるか調べる
  function updateSections() {
    Array.prototype.forEach.call(sections, function (sec) {
      var visible = false;
      var el = sec.nextElementSibling;
      while (el && !el.hasAttribute('data-section')) {
        if (el.classList.contains('column-card') && !el.hidden) { visible = true; break; }
        el = el.nextElementSibling;
      }
      sec.hidden = !visible;
    });
  }

  function apply(key) {
    var shown = 0;

    Array.prototype.forEach.call(cards, function (card) {
      var match;
      if (card.hasAttribute('data-static')) {
        match = (key === 'all');
      } else {
        var cat = card.getAttribute('data-cat') || '';
        match = (key === 'all') || cat.split(' ').indexOf(key) > -1;
        if (match) shown++;
      }
      card.hidden = !match;
    });

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === key ? 'true' : 'false');
    });

    updateSections();
    if (emptyMsg) emptyMsg.hidden = shown > 0;
  }

  addCounts();

  Array.prototype.forEach.call(buttons, function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-filter');
      apply(key);
      // 直接共有できるよう、URLの末尾に分類を残す（履歴は増やさない）
      if (history.replaceState) {
        history.replaceState(null, '', key === 'all' ? location.pathname : '#' + key);
      }
    });
  });

  var valid = ['ai', 'sns', 'web', 'biz'];

  function fromHash() {
    var key = (location.hash || '').replace('#', '');
    return valid.indexOf(key) > -1 ? key : 'all';
  }

  // URLに #ai などが付いていれば、その状態で開く
  apply(fromHash());

  // 戻る／進むや、外部からのリンクでハッシュが変わった場合にも追従する
  window.addEventListener('hashchange', function () { apply(fromHash()); });
})();
