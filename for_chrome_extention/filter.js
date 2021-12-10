function getCommentList() {
    return new Promise(function(resolve, reject){
        var comment_list = document.querySelectorAll('#cbox_module > div > div.u_cbox_content_wrap > ul > li');

        var comments = [];

        for (var i = 0; i < comment_list.length; i++) {
            var comment = comment_list[i].querySelector('div.u_cbox_comment_box > div > div.u_cbox_text_wrap > span.u_cbox_contents');
            
            if (comment != null) {
                comments.push(comment.innerHTML)
            }
        };

        var json_data = {
            "comments" : comments
        };

        resolve(json_data);
    })
}

function markComment(predict_list) {
    var comment_list = document.querySelectorAll('#cbox_module > div > div.u_cbox_content_wrap > ul > li');

    var pre_idx = 0

    for (var i = 0; i < comment_list.length; i++) {
        var comment = comment_list[i].querySelector('div.u_cbox_comment_box > div > div.u_cbox_text_wrap > span.u_cbox_contents');
        
        if (comment != null) {
            if (predict_list[pre_idx] == 0) {
                comment.innerHTML = '◈ 뉴스필터에 의해 가려진 댓글입니다.';
                comment.style.color = "#999";
            };
            pre_idx += 1;
        };
    };
}

getCommentList().then(json_data => {
    const blob = new Blob([JSON.stringify(json_data, null, 2)], {type : 'application/json'});

    var myRequest = new Request('http://localhost:8080', {
        method: 'POST', 
        body: blob });
    

    fetch(myRequest)
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error('Something went wrong on api server!');
        }
    })
    .then(data => {
        data = JSON.parse(data);
        console.log(data["predict_val"]);

        return data["predict_val"];
    })
    .then(predict_list => markComment(predict_list))
    .catch(error => {
        console.error(error);
    });
})


