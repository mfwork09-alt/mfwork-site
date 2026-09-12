/* 営業属人化・再現性 無料診断
   15問（5カテゴリ×3問）に1〜5で回答してもらい、カテゴリ別と総合のスコアを出す。
   質問文はHTML側に書いてあり、このスクリプトは「ステップ送り」と「集計」だけを担当する。
   JSが動かない環境では全15問がそのまま表示され、読み物としては成立する。

   将来の拡張（業種別の質問、結果の保存、AIコメント生成など）に備えて、
   カテゴリの定義とコメント文はこのファイル先頭のデータにまとめてある。
   質問を足すときはHTMLに <fieldset class="diag-q" data-cat="カテゴリID"> を追加すればよい。 */
(function () {
  'use strict';

  /* ---------- 診断の定義 ---------- */

  var LEVELS = { LOW: 'low', MID: 'mid', HIGH: 'high' };

  var LEVEL_LABEL = {
    low:  '低',
    mid:  '中',
    high: '高'
  };

  var CATEGORIES = [
    {
      id: 'process',
      name: '営業プロセスの標準化',
      focus: '「どの場面で何を確認し、どの条件で次へ進むか」を書き出す',
      comments: {
        high: '営業担当者ごとに進め方が異なっている可能性があります。どの場面で何を確認し、どの条件で次のステップへ進むかを整理すると、営業プロセスを共有しやすくなります。',
        mid:  '営業の流れはある程度そろっているものの、場面によっては担当者個人の判断に委ねられている可能性があります。進め方が分かれやすい場面を特定しておくと、認識を揃えやすくなります。',
        low:  '営業の進め方は比較的共有されているようです。今後メンバーが増える場面に備えて、現在の流れを言語化して残しておくと、この状態を保ちやすくなります。'
      }
    },
    {
      id: 'judgment',
      name: '会話中の判断基準',
      focus: '顧客の反応ごとに、次に確認することを整理する',
      comments: {
        high: '「ここで終了するか、もう一歩聞くか」など、会話中の判断が担当者個人に委ねられている可能性があります。顧客反応ごとの判断基準を整理することで、現場の迷いを減らせる可能性があります。',
        mid:  '会話中の判断には、ある程度共通の考え方があるようです。一方で、想定外の反応があった場面では対応が担当者ごとに分かれている可能性があります。',
        low:  '会話中の判断基準は比較的共有されているようです。判断が分かれた場面を記録しておくと、基準をさらに具体化できます。'
      }
    },
    {
      id: 'tacit',
      name: 'トップセールスの暗黙知共有',
      focus: '成果を出している担当者の判断を、場面ごとに聞き取って言語化する',
      comments: {
        high: '成果を出している担当者の判断や進め方が、組織の資産として共有されていない可能性があります。「何を話しているか」だけでなく、「どんな反応に対して何を判断しているか」を整理することが重要です。',
        mid:  '成果を出している担当者の進め方は、部分的には共有されているようです。話している内容に加えて「どんな反応に対して何を判断しているか」まで整理すると、共有の精度が上がります。',
        low:  '成果につながる進め方は、組織内で比較的共有されているようです。定期的に言語化する機会を持つと、内容を更新し続けられます。'
      }
    },
    {
      id: 'lead',
      name: '見込み判定・次回アクション',
      focus: '「見込みあり」と判断する条件と、追客をやめる条件を決める',
      comments: {
        high: '見込み判定や追客判断にばらつきがある可能性があります。見込み基準、追客条件、次回連絡の目的を言語化すると、営業管理もしやすくなります。',
        mid:  '見込み判定の考え方はある程度そろっているようです。判断に迷うケースを集めておくと、基準をより具体的にできます。',
        low:  '見込み判定や次回アクションの基準は比較的明確なようです。基準が実態に合っているかを定期的に見直す機会があると、より安定します。'
      }
    },
    {
      id: 'training',
      name: '新人育成・営業教育',
      focus: '新人が迷いやすい場面を洗い出し、判断の手がかりを用意する',
      comments: {
        high: '営業教育が、先輩や管理者の個別フォローに依存している可能性があります。新人が迷いやすいポイントを整理し、判断基準や営業プロセスを仕組み化する余地があります。',
        mid:  '育成の仕組みは一定程度あるものの、場面によっては個別のフォローに頼っている可能性があります。新人が迷いやすい場面を洗い出すと、補強すべき点が見えてきます。',
        low:  '営業教育は比較的仕組み化されているようです。新人がつまずいた箇所を記録していくと、内容を継続的に改善できます。'
      }
    }
  ];

  var TOTAL_COMMENTS = {
    low:  '営業プロセスや判断基準が比較的共有されている可能性があります。一方で、カテゴリ別にスコアが高い部分があれば、そこだけ個別に見直すとさらに再現性を高められる可能性があります。',
    mid:  '営業プロセスの一部が、担当者個人の経験や判断に依存している可能性があります。特にスコアの高いカテゴリから整理すると、営業組織全体の再現性を高めやすくなります。',
    high: '営業ノウハウや判断基準が、個人の経験・感覚・暗黙知に依存している可能性があります。営業プロセス、見込み判定、トップセールスの判断基準などを整理・言語化・仕組み化する余地がありそうです。'
  };

  var TOTAL_HEADLINE = {
    low:  '属人化の度合いは、現時点では低めのようです',
    mid:  '一部の判断が、担当者個人に依存している可能性があります',
    high: '営業の判断やノウハウが、個人に依存している可能性が高そうです'
  };

  /* カテゴリ（3問／3〜15点）の判定 */
  function categoryLevel(score) {
    if (score >= 11) return LEVELS.HIGH;
    if (score >= 7)  return LEVELS.MID;
    return LEVELS.LOW;
  }

  /* 総合（15問／15〜75点）の判定 */
  function totalLevel(score) {
    if (score >= 51) return LEVELS.HIGH;
    if (score >= 31) return LEVELS.MID;
    return LEVELS.LOW;
  }

  /* ---------- 画面の要素 ---------- */

  var form = document.getElementById('diagForm');
  if (!form) return;

  var intro     = document.getElementById('diagIntro');
  var startBtn  = document.getElementById('diagStart');
  var progress  = document.getElementById('diagProgress');
  var progFill  = document.getElementById('diagProgressFill');
  var progText  = document.getElementById('diagProgressText');
  var errorBox  = document.getElementById('diagError');
  var navBox    = document.getElementById('diagNav');
  var prevBtn   = document.getElementById('diagPrev');
  var nextBtn   = document.getElementById('diagNext');
  var submitBtn = document.getElementById('diagSubmit');
  var result    = document.getElementById('diagResult');
  var retryBtn  = document.getElementById('diagRetry');
  var ctaLink   = document.getElementById('diagCta');

  var steps = Array.prototype.slice.call(form.querySelectorAll('.diag-step'));
  if (!steps.length) return;

  var current = 0;

  /* JSが動いたので、ステップ表示モードに切り替える */
  document.body.classList.add('diag-js');

  /* ---------- GA4 イベント ---------- */

  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    try {
      window.gtag('event', name, params || {});
    } catch (e) {
      /* 計測の失敗で診断を止めない */
    }
  }

  /* ---------- 表示の切り替え ---------- */

  function showStep(index, opts) {
    current = index;
    steps.forEach(function (step, i) {
      step.hidden = (i !== index);
    });

    var total = steps.length;
    var pct = Math.round(((index + 1) / total) * 100);
    if (progFill) progFill.style.width = pct + '%';
    if (progText) progText.textContent = 'ステップ ' + (index + 1) + ' / ' + total;
    if (progress) {
      progress.setAttribute('aria-valuenow', String(index + 1));
      progress.hidden = false;
    }

    if (prevBtn)   prevBtn.hidden = (index === 0);
    if (nextBtn)   nextBtn.hidden = (index === total - 1);
    if (submitBtn) submitBtn.hidden = (index !== total - 1);

    hideError();

    if (opts && opts.focus !== false) {
      var heading = steps[index].querySelector('.diag-step-title');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      scrollToForm();
    }
  }

  function scrollToForm() {
    var top = form.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop);
    var offset = 88; /* 固定ヘッダー分 */
    window.scrollTo({ top: Math.max(0, top - offset), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  /* ---------- 回答の取得 ---------- */

  /* 指定した範囲の未回答の設問を返す */
  function unanswered(scope) {
    var questions = Array.prototype.slice.call(scope.querySelectorAll('.diag-q'));
    return questions.filter(function (q) {
      return !q.querySelector('input[type="radio"]:checked');
    });
  }

  function markUnanswered(list) {
    Array.prototype.forEach.call(form.querySelectorAll('.diag-q'), function (q) {
      q.classList.remove('is-missing');
    });
    list.forEach(function (q) {
      q.classList.add('is-missing');
    });
  }

  /* カテゴリごとの合計点を集める */
  function collectScores() {
    var scores = {};
    CATEGORIES.forEach(function (cat) { scores[cat.id] = 0; });

    Array.prototype.forEach.call(form.querySelectorAll('.diag-q'), function (q) {
      var cat = q.getAttribute('data-cat');
      var checked = q.querySelector('input[type="radio"]:checked');
      if (!cat || !checked) return;
      if (typeof scores[cat] !== 'number') return;
      scores[cat] += parseInt(checked.value, 10) || 0;
    });

    return scores;
  }

  /* ---------- 結果の描画 ---------- */

  function renderResult() {
    var scores = collectScores();
    var total = CATEGORIES.reduce(function (sum, cat) { return sum + scores[cat.id]; }, 0);
    var level = totalLevel(total);

    setText('resTotalScore', String(total));
    setText('resLevelLabel', LEVEL_LABEL[level]);
    setText('resHeadline', TOTAL_HEADLINE[level]);
    setText('resTotalComment', TOTAL_COMMENTS[level]);

    var badge = document.getElementById('resLevelBadge');
    if (badge) badge.className = 'diag-level-badge is-' + level;

    renderBars(scores);
    renderComments(scores);
    renderFocus(scores);

    if (intro) intro.hidden = true;
    form.hidden = true;
    if (progress) progress.hidden = true;
    if (navBox) navBox.hidden = true;
    result.hidden = false;

    result.setAttribute('tabindex', '-1');
    result.focus({ preventScroll: true });

    var top = result.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop);
    window.scrollTo({ top: Math.max(0, top - 88), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

    saveResult(total, level, scores);

    track('diagnosis_complete', {
      total_score: total,
      risk_level: level
    });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* 5カテゴリのスコアを横棒で見せる */
  function renderBars(scores) {
    var wrap = document.getElementById('resBars');
    if (!wrap) return;
    wrap.innerHTML = '';

    CATEGORIES.forEach(function (cat) {
      var score = scores[cat.id];
      var level = categoryLevel(score);
      var pct = Math.round((score / 15) * 100);

      var row = document.createElement('div');
      row.className = 'diag-bar-row';

      var head = document.createElement('div');
      head.className = 'diag-bar-head';

      var name = document.createElement('span');
      name.className = 'diag-bar-name';
      name.textContent = cat.name;

      var val = document.createElement('span');
      val.className = 'diag-bar-value';
      val.textContent = score + ' / 15（' + LEVEL_LABEL[level] + '）';

      head.appendChild(name);
      head.appendChild(val);

      var track_ = document.createElement('div');
      track_.className = 'diag-bar-track';
      track_.setAttribute('role', 'img');
      track_.setAttribute('aria-label', cat.name + ' ' + score + '点（15点満点）');

      var fill = document.createElement('span');
      fill.className = 'diag-bar-fill is-' + level;
      fill.style.width = pct + '%';
      track_.appendChild(fill);

      row.appendChild(head);
      row.appendChild(track_);
      wrap.appendChild(row);
    });
  }

  /* カテゴリごとの解説 */
  function renderComments(scores) {
    var wrap = document.getElementById('resComments');
    if (!wrap) return;
    wrap.innerHTML = '';

    CATEGORIES.forEach(function (cat) {
      var score = scores[cat.id];
      var level = categoryLevel(score);

      var block = document.createElement('div');
      block.className = 'diag-comment';

      var h = document.createElement('h4');
      h.innerHTML = '';
      h.appendChild(document.createTextNode(cat.name));

      var tag = document.createElement('span');
      tag.className = 'diag-tag is-' + level;
      tag.textContent = LEVEL_LABEL[level];
      h.appendChild(tag);

      var p = document.createElement('p');
      p.textContent = cat.comments[level];

      block.appendChild(h);
      block.appendChild(p);
      wrap.appendChild(block);
    });
  }

  /* スコアが高い順にカテゴリを並べ、注目すべきものを選ぶ */
  function topCategories(scores) {
    var ranked = CATEGORIES.slice().sort(function (a, b) {
      return scores[b.id] - scores[a.id];
    });

    var picked = ranked.filter(function (cat) { return scores[cat.id] >= 11; });
    if (!picked.length) picked = ranked.filter(function (cat) { return scores[cat.id] >= 7; });
    if (!picked.length) picked = ranked.slice(0, 1);
    return picked.slice(0, 3);
  }

  /* 結果をブラウザに一時保存する。
     お問い合わせページへ進んだときに「診断結果」欄へ自動で書き写すために使う。
     sessionStorage なのでタブを閉じれば消える。URLには載せない。 */
  function saveResult(total, level, scores) {
    if (!window.sessionStorage) return;
    try {
      sessionStorage.setItem('mfwork_diag_result', JSON.stringify({
        score: total,
        max: 75,
        level: LEVEL_LABEL[level],
        top: topCategories(scores).map(function (cat) {
          return cat.name + '（' + scores[cat.id] + '/15）';
        })
      }));
    } catch (e) {
      /* プライベートモードなどで保存できなくても診断は続行する */
    }
  }

  /* スコアの高いカテゴリから「見直すとよいポイント」を出す */
  function renderFocus(scores) {
    var wrap = document.getElementById('resFocus');
    if (!wrap) return;
    wrap.innerHTML = '';

    topCategories(scores).forEach(function (cat) {
      var li = document.createElement('li');
      var strong = document.createElement('strong');
      strong.textContent = cat.name;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(cat.focus));
      wrap.appendChild(li);
    });
  }

  /* ---------- 操作 ---------- */

  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (intro) intro.hidden = true;
      form.hidden = false;
      showStep(0);
      track('diagnosis_start');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      var missing = unanswered(steps[current]);
      if (missing.length) {
        markUnanswered(missing);
        showError('未回答の設問が ' + missing.length + ' 問あります。すべてお答えください。');
        missing[0].scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        return;
      }
      markUnanswered([]);
      if (current < steps.length - 1) showStep(current + 1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (current > 0) showStep(current - 1);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* 念のため全問をあらためて確認する */
    var missing = unanswered(form);
    if (missing.length) {
      markUnanswered(missing);
      var firstStep = steps.indexOf(missing[0].closest('.diag-step'));
      if (firstStep > -1 && firstStep !== current) {
        showStep(firstStep, { focus: false });
      }
      showError('未回答の設問が ' + missing.length + ' 問あります。すべてお答えください。');
      missing[0].scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      return;
    }

    markUnanswered([]);
    renderResult();
  });

  /* 回答したら、その設問の未回答マークを外す */
  form.addEventListener('change', function (e) {
    var target = e.target;
    if (!target || target.type !== 'radio') return;
    var q = target.closest('.diag-q');
    if (q) q.classList.remove('is-missing');
    if (!unanswered(steps[current]).length) hideError();
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      form.reset();
      markUnanswered([]);
      result.hidden = true;
      form.hidden = false;
      if (navBox) navBox.hidden = false;
      showStep(0);
    });
  }

  if (ctaLink) {
    ctaLink.addEventListener('click', function () {
      track('diagnosis_cta_click');
    });
  }

  /* 初期状態：紹介文だけ見せて、設問は開始ボタンまで隠す */
  form.hidden = true;
  if (progress) progress.hidden = true;
  steps.forEach(function (step, i) { step.hidden = (i !== 0); });

  track('diagnosis_view');
})();
