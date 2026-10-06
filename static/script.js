document.addEventListener("DOMContentLoaded", function () {
  // 发布页字数统计
  var textarea = document.getElementById("post-content");
  var counter = document.getElementById("char-count");
  if (textarea && counter) {
    var update = function () {
      counter.textContent = textarea.value.length;
    };
    textarea.addEventListener("input", update);
    update();
  }

  // 提示消息自动消失
  var flashes = document.querySelectorAll(".flash");
  flashes.forEach(function (el) {
    setTimeout(function () {
      el.classList.add("fade-out");
      setTimeout(function () {
        el.remove();
      }, 500);
    }, 4000);
  });
});
