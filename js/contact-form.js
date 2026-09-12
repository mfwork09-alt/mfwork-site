/* お問い合わせフォームの補助
   1. どのページから来たか（?from=）を hidden 項目に記録する
   2. 診断ページで出た結果を「診断結果」欄へ自動で書き写す
   3. 「ご相談内容」が1つもチェックされていない場合に送信を止める

   JSが動かない環境では、1と2が省かれるだけで送信自体はできる。
   使わない項目は disabled にして、空欄のまま送信されないようにしている。 */
(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;

  /* ---------- 1. 流入元の記録 ---------- */

  var SOURCE_LABEL = {
    'sales-diagnosis': '営業属人化・再現性 無料診断ページ'
  };

  var sourceInput = document.getElementById('leadSource');
  var from = '';

  try {
    from = new URLSearchParams(window.location.search).get('from') || '';
  } catch (e) {
    from = '';
  }

  if (sourceInput) {
    if (from) {
      sourceInput.value = SOURCE_LABEL[from] || from;
      sourceInput.disabled = false;
    } else {
      sourceInput.disabled = true;
    }
  }

  /* ---------- 2. 診断結果の自動転記 ---------- */

  var diagRow   = document.getElementById('diagResultRow');
  var diagField = document.getElementById('diagResultText');
  var diagNote  = document.getElementById('diagResultNote');

  function readSavedResult() {
    if (!window.sessionStorage) return null;
    try {
      var raw = sessionStorage.getItem('mfwork_diag_result');
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.score !== 'number') return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function formatResult(data) {
    var text = '診断スコア ' + data.score + ' / ' + (data.max || 75) +
               '（属人化リスク ' + data.level + '）';
    if (data.top && data.top.length) {
      text += '\nスコアが高かった項目：' + data.top.join('、');
    }
    return text;
  }

  if (diagRow && diagField) {
    var saved = readSavedResult();

    if (saved) {
      diagField.value = formatResult(saved);
      diagRow.hidden = false;
      diagField.disabled = false;
      if (diagNote) diagNote.hidden = false;
    } else if (from === 'sales-diagnosis') {
      /* 診断ページから来たが結果が残っていない場合は、空欄で入力できるようにする */
      diagRow.hidden = false;
      diagField.disabled = false;
    } else {
      diagRow.hidden = true;
      diagField.disabled = true;
    }
  }

  /* ---------- 3. ご相談内容の必須チェック ---------- */

  var boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="相談内容[]"]'));
  var errorBox = document.getElementById('topicError');

  function anyChecked() {
    return boxes.some(function (b) { return b.checked; });
  }

  function showTopicError() {
    if (!errorBox) return;
    errorBox.textContent = 'ご相談内容を1つ以上お選びください。';
    errorBox.hidden = false;
  }

  function hideTopicError() {
    if (!errorBox) return;
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  form.addEventListener('submit', function (e) {
    if (!boxes.length) return;
    if (anyChecked()) {
      hideTopicError();
      return;
    }

    e.preventDefault();
    showTopicError();

    var grid = form.querySelector('.checkbox-grid');
    if (grid) grid.scrollIntoView({ block: 'center' });
    if (boxes[0]) boxes[0].focus({ preventScroll: true });
  });

  boxes.forEach(function (b) {
    b.addEventListener('change', function () {
      if (anyChecked()) hideTopicError();
    });
  });
})();
