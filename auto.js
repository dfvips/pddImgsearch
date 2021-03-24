var basecode = getBase64Image(document.getElementsByTagName("img")[0]);
var a = document.createElement("script");
a.src = 'https://cdn.bootcdn.net/ajax/libs/jquery/1.10.0/jquery.min.js';
document.getElementsByTagName("head")[0].appendChild(a);
	$(document).on("click", ".goods-item", function() {
    	var url = "https://mobile.yangkeduo.com/goods.html?goods_id=" + $(this).attr("data-goods-id");
    	window.open(url, '_blank').location;
	});
	setInterval((function() {
	var num = $(".goods-item").length;
	$(".load-more-btn-draw-result").html("A total of "+num +" results.Power By Dreamfly.");
	document.title='拼多多识图(已加载'+num+'条结果)';
	}
	), 100);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    var img = document.getElementsByTagName("img")[0];
  	sendResponse(basecode);
});
function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
    var dataURL = canvas.toDataURL("image/" + ext);
    return dataURL;
}