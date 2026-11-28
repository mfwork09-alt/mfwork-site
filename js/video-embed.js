/* YouTube動画の遅延読み込み
   最初はサムネイル画像だけを置き、クリックされて初めてYouTubeを読み込む。
   そうしないと、動画を見ない人のブラウザにもYouTube側のCookieとスクリプトが入ってしまう。
   表示も軽くなる。
   読み込み先は youtube-nocookie.com（再生するまで追跡用Cookieを置かないドメイン）。
   JSが動かない環境では、サムネイルがYouTubeへのリンクとして機能する。 */
(function () {
  'use strict';

  var boxes = document.querySelectorAll('.video-embed[data-video]');
  if (!boxes.length) return;

  Array.prototype.forEach.call(boxes, function (box) {
    var id = box.getAttribute('data-video');
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;

    var trigger = box.querySelector('.video-embed-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();

      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id +
                  '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
      frame.title = box.getAttribute('data-title') || 'YouTube動画';
      frame.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.loading = 'lazy';

      var stage = box.querySelector('.video-embed-stage');
      if (!stage) return;
      stage.innerHTML = '';
      stage.appendChild(frame);
      box.classList.add('is-playing');

      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', 'video_play', { video_id: id });
        } catch (err) {
          /* 計測の失敗で再生を止めない */
        }
      }
    });
  });
})();
