document.addEventListener('DOMContentLoaded', () => {
    let hatred = document.getElementById("hatred");
    let trauma = document.getElementById("trauma");

    // 클라우드에 저장되어있는 정보 불러오기
    chrome.storage.sync.get(function(data) {
        for (var i=0; i<hatred.options.length; i++) {
            if (hatred.options[i].value == data.selected_hatred) {
                hatred.options[i].selected = "selected";
            }
        }

        for (var i=0; i<trauma.options.length; i++) {
            if (trauma.options[i].value == data.selected_trauma) {
                trauma.options[i].selected = "selected";
            }
        }
        sendOptions()
    });


    // hatred option 변경할 때
    hatred.addEventListener("change", () => {
        var selec_hatred = hatred.options[hatred.selectedIndex].value;

        chrome.storage.sync.set({
            selected_hatred: selec_hatred
        });
        sendOptions()
        // run_model_and_changeContent();
    });

    // trauma option 변경할 때
    trauma.addEventListener("change", () => {
        var selec_trauma = trauma.options[trauma.selectedIndex].value;

        chrome.storage.sync.set({
            selected_trauma: selec_trauma
        });
        sendOptions()
    })

    // contentScript에 hatred와 trauma 값 전송
    function sendOptions() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if(!tabs[0].url.includes('https://news.naver.com')) {
              console.log('please go to https://news.naver.com')
              return
            }
            var payload = {
              hatred : hatred.options[hatred.selectedIndex].value,
              trauma : trauma.options[trauma.selectedIndex].value
            }
            chrome.tabs.sendMessage(tabs[0].id, payload);
          });
    }
})

// 모델 수행
function run_model_and_changeContent() {
    chrome.tabs.executeScript({
        file: "filter.js"
    });
};


