/* カテゴリ絞り込み（コラム一覧・実績一覧で共用）
   .cat-filter のボタンを押すと、data-cat が一致する項目だけを表示する。
   見出し（data-section）は、その中に表示中の項目がなければ隠す。
   URLの #ai などを付けて開くと、その分類で絞り込んだ状態で表示される。
   JSが動かない環境では、すべての項目がそのまま表示される。 */
(function () {
  'use strict';

  var filterBar = document.querySelector('.cat-filter');
  if (!filterBar) return;

  // 絞り込み対象（コラムのカード、または実績のブロック）
  var items = document.querySelectorAll('.column-card, .case-block');
  if (!items.length) return;

  var buttons  = filterBar.querySelectorAll('button[data-filter]');
  var sections = document.querySelectorAll('[data-section]');
  var emptyMsg = document.querySelector('.filter-empty');

  var keys = Array.prototype.map.call(buttons, function (b) {
    return b.getAttribute('data-filter');
  }).filter(function (k) { return k !== 'all'; });

  function matches(item, key) {
    if (item.hasAttribute('data-static')) return key === 'all';
    if (key === 'all') return true;
    var cat = item.getAttribute('data-cat') || '';
    return cat.split(' ').indexOf(key) > -1;
  }

  // 各ボタンに件数を表示する
  Array.prototype.forEach.call(buttons, function (btn) {
    var key = btn.getAttribute('data-filter');
    var n = 0;
    Array.prototype.forEach.call(items, function (item) {
      if (item.hasAttribute('data-static')) return;
      if (matches(item, key)) n++;
    });
    var span = document.createElement('span');
    span.className = 'n';
    span.textContent = n;
    btn.appendChild(span);
  });

  // 見出しの直後から次の見出しまでに、表示中の項目があるか調べる
  function updateSections() {
    Array.prototype.forEach.call(sections, function (sec) {
      var visible = false;
      var el = sec.nextElementSibling;
      while (el && !el.hasAttribute('data-section')) {
        if ((el.classList.contains('column-card') || el.classList.contains('case-block')) && !el.hidden) {
          visible = true;
          break;
        }
        el = el.nextElementSibling;
      }
      sec.hidden = !visible;
    });
  }

  function apply(key) {
    var shown = 0;
    Array.prototype.forEach.call(items, function (item) {
      var ok = matches(item, key);
      if (ok && !item.hasAttribute('data-static')) shown++;
      item.hidden = !ok;
    });

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === key ? 'true' : 'false');
    });

    updateSections();
    if (emptyMsg) emptyMsg.hidden = shown > 0;
  }

  function fromHash() {
    var key = (location.hash || '').replace('#', '');
    return keys.indexOf(key) > -1 ? key : 'all';
  }

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

  // 実績ページは #case-xxxx で個別事例に飛ぶリンクがあるため、
  // 分類キーに一致しないハッシュのときは絞り込みをかけない
  apply(fromHash());

  window.addEventListener('hashchange', function () {
    var key = (location.hash || '').replace('#', '');
    if (keys.indexOf(key) > -1 || key === '') apply(fromHash());
  });
})();
