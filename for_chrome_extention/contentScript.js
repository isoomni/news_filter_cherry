// popup에서 오는 message 받기
chrome.runtime.onMessage.addListener(gotMessage)

function gotMessage (message, sender, sendResponse) {
  console.log(message.hatred, message.trauma);
  if (message.hatred == "DPK") {
    setTimeout(run_model, 1000);
  }
}

// 새로 창을 열 때 실행
chrome.storage.sync.get(function(data) {
  if (data.selected_hatred == "DPK") {
    setTimeout(run_model, 1000);
  }
});

function afterDOMLoaded(){
  var more_comment = document.querySelector('#cbox_module > div:nth-child(2) > div.u_cbox_paginate > a');
  var more_comment2 = document.querySelector('#cbox_module > div > div.u_cbox_paginate > a');

  if(more_comment) {
    connecting_and_run(more_comment);
  }
  else if(more_comment2) {
    connecting_and_run(more_comment2);
  }
  else {
    console.log('버튼을 불러오지 못했습니다 ㅎㅎ');
  }
}

// 순공감순, 최신순, 공감비율순, 답글순, 과거순 ... 정렬 옵션이 있을 때
function sort_option_add_listener() {
  var sort_options = document.querySelectorAll('#cbox_module > div:nth-child(2) > div.u_cbox_sort > div.u_cbox_sort_option > div > ul > li');

  if (sort_options) {
    for (var i=0; i<sort_options.length; i++) {
      var sort_option = sort_options[i].querySelector('a');
      connecting_and_run(sort_option);
    }
  }
  else {
    console.log('sort option이 없습니다.')
  }
}

function run_model() {
  chrome.runtime.sendMessage({
    greeting: "hello"
  }, function(response) {
  console.log(response.farewell);
  });
}

function connecting_and_run(more_comment_obj) {
  console.log('DOM 연결 성공!!');

  more_comment_obj.addEventListener("click", () => {
      console.log('clicked!!!');
      setTimeout(run_model, 1000);
    })
}

setTimeout(sort_option_add_listener, 1000);
setTimeout(afterDOMLoaded, 1100);