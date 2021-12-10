chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      if (request.greeting == "hello") {
            chrome.tabs.executeScript({
                file: "filter.js"
            });
            sendResponse({farewell: "goodbye~"});
        }
    });