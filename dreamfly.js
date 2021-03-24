var optId = chrome.contextMenus.create({
		"title" : chrome.i18n.getMessage("title"),
		"contexts" : ["image"],
		"onclick" : search
	});

function search(info, tab) {
	var url = info.srcUrl;
	if(url.indexOf("alicdn.com")!=-1){
	   	url = url.replace(/.(\d+x\d+).*|.jpg_(\d+x\d+).*/,'.jpg')
	}
	var fName = url.substring(url.lastIndexOf('/') + 1);
	if(!url.startsWith("file")){
	var getxhr = new XMLHttpRequest();
	getxhr.open('GET', url, true);
	getxhr.responseType = 'arraybuffer';
	getxhr.onreadystatechange = function (e) {
		if (getxhr.readyState === 4 && getxhr.status === 200) {
			contentType = getxhr.getResponseHeader('Content-Type');
			if (contentType === 'image/jpeg' || contentType == 'image/png') {
				uploadImage(getxhr.response, tab, fName, contentType);
			} else {
				var blob = new Blob([new Uint8Array(getxhr.response)], {
						type : contentType
					});
				var url = URL.createObjectURL(blob);
				var img = new Image();
				img.onload = function () {

					var canvas = document.createElement("canvas");
					canvas.width = this.width;
					canvas.height = this.height;
					var ctx = canvas.getContext("2d");
					ctx.drawImage(this, 0, 0);
					var imagedata = canvas.toDataURL("image/jpeg");
					imagedata = imagedata.replace(/^data:image\/(png|jpeg);base64,/, "");
					bimageData = base64DecToArr(imagedata).buffer;
					uploadImage(bimageData, tab, fName, "image/jpeg")
				}
				img.src = url;
			}
		} else if (getxhr.readyState === 4 && getxhr.status !== 200) {
			console.log("查询失败 " + xhr.status);
		}
	};
	getxhr.send();

}else{
			chrome.tabs.query({
			  active: true,
			  currentWindow: true
			}, (tabs) => {
			  let message = {
			    //这里的内容就是发送至content-script的内容
			    info: info.srcUrl
			  }
			  chrome.tabs.sendMessage(tabs[0].id, message, res => {
			    console.log('bg=>content')
			    var imagedata = res;
			    imagedata = imagedata.replace(/^data:image\/(png|jpeg);base64,/, "");
				bimageData = base64DecToArr(imagedata).buffer;
				uploadImage(bimageData, tab, fName, "image/jpeg");
			  })
			})
}
}

function uploadImage(img, tab, fName, imgType) {
		var hash=new Date().getTime()+'rAuTLZI3l3BRRkyG';
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.addEventListener("readystatechange", function() {
	  if(this.readyState === 4) {
	    var d = JSON.parse(xhr.response);
	    upload(img, tab, fName, imgType,d['signature']);
	  }
	});
	xhr.open("POST", "https://api.pinduoduo.com/file/signature?pdduid=5002102670437&xcx=20161201&xcx_version=v6.7.8.2&xcx_hash="+hash);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.setRequestHeader("Accept", "*/*");
	xhr.setRequestHeader("Accept-Language", "en-us");
	xhr.setRequestHeader("AccessToken", "4WIJLKOD5QM5FJWDWXY6ZWZREBHEDYCMXMRJCTMF3URBCPBSTZ2Q11065a0");
	xhr.send('{"bucket_tag":"search-img-extractor-app","xcx_version":"v7.6.3"}');
}

function upload(img, tab, fName, imgType,sign){
	var imgLength = img.byteLength;
	var xhr = new XMLHttpRequest();
	var boundary = generateBoundary('s.taobao.com', 16);
	xhr.open('POST', 'https://file.pinduoduo.com/general_file?sign='+sign, true);
	xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
	xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*;q=0.01');

	xhr.onload = function (e) {
		if (xhr.readyState === 4 && xhr.status === 200) {
			var d = JSON.parse(xhr.response);
			if (d['url'] != null) {
				   openChildWin('https://minicdn.yangkeduo.com/ssr_hawaii/pic_search?pic_url='+d['url']+'&page_name=pic_search&app_name=yangkeduo&app_version=v7.6.3&token=4WIJLKOD5QM5FJWDWXY6ZWZREBHEDYCMXMRJCTMF3URBCPBSTZ2Q11065a0&uid=5002102670437&trace_id=6892766158197367&xcx_new_user=0&network=1&sceneid=1106&session_id=rmuKtzCu0UVD6UU4C6BCSHr6cI3crnb4&openid=ogJUI0X6iHH2vMj6gzveVX81hY7Q&openId=ogJUI0X6iHH2vMj6gzveVX81hY7Q&sdk_version=2.16.0&refer_page_name=index&refer_page_sn=10002&refer_page_id=10002_1616546417308_KL62GfQDY0&uin=PMJW4FAL4TG4POCHLJWT2ZAL5A_GEXDA&wxVersion=8.0.2&xcx_user_tag=gs');
			} else {
					console.log("查询失败，请更换图片重试!")
			}
		} else if (xhr.readyState === 4 && xhr.status !== 200) {
			console.log("查询失败 " + xhr.status);
		}
	};

	var CRLF = "\r\n";
	var request = "--" + boundary + CRLF;
	var blob = new Blob([new Uint8Array(img)], {
			type : imgType
		});
	var reader = new FileReader();
	reader.onloadend = function () {
		request += 'Content-Disposition: form-data; name=\"name\"\r\n\r\n'+ fName + CRLF;
		request += "--" + boundary + CRLF;
		request += 'Content-Disposition: form-data; name=\"file\"; filename=\"' + fName + '\"' + CRLF;
		request += "Content-Type: " + imgType + CRLF + CRLF;
		request += reader.result+ CRLF + CRLF;
		request += "--" + boundary + "--";

		var nBytes = request.length,
		ui8Data = new Uint8Array(nBytes);
		for (var nIdx = 0; nIdx < nBytes; nIdx++) {
			ui8Data[nIdx] = request.charCodeAt(nIdx) & 0xff;
		}
		xhr.timeout = 5000; // s seconds timeout, is too long?
		// data.append("file", ui8Data);
        xhr.ontimeout = function () { console.log("查询超时，请稍后重试!"); }
        // xhr.send(data);
		xhr.send(ui8Data);
	}
	reader.readAsBinaryString(blob);
}

function base64DecToArr(sBase64, nBlocksSize) {

	var
	sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
	nInLen = sB64Enc.length,
	nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
	taBytes = new Uint8Array(nOutLen);

	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}

	return taBytes;
}
function b64ToUint6(nChr) {

	return nChr > 64 && nChr < 91 ?
	nChr - 65
	 : nChr > 96 && nChr < 123 ?
	nChr - 71
	 : nChr > 47 && nChr < 58 ?
	nChr + 4
	 : nChr === 43 ?
	62
	 : nChr === 47 ?
	63
	 :
	0;

}
function generateBoundary(prefix, len) {
	　　len = len || 32;
	　　var chars = '-_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	　　var maxPos = chars.length;
	　　var boundary = prefix;
	　　for(i = 0; i < len; i++) {
		　　　　boundary += chars.charAt(Math.floor(Math.random() * maxPos));
		　　
	}
	　　return boundary;
}

function openChildWin(url) {
    var screenX = typeof window.screenX != 'undefined' ? window.screenX: window.screenLeft,
    screenY = typeof window.screenY != 'undefined' ? window.screenY: window.screenTop,
    outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth: document.body.clientWidth,
    outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight: (document.body.clientHeight - 22),
    width = 375,
    height = 667,
    left = parseInt(screenX + ((outerWidth - width) / 2), 10),
    top = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
    features = ('width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);
       win = window.open(url, '拼多多', features);
    if (window.focus) {
        win.focus();
    }
}

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
    details.requestHeaders.push({
        name:"Referer",
        value:"https://www.pinduoduo.com"
    });
    details.requestHeaders.push({
        name:"Origin",
        value:"https://www.pinduoduo.com"
    });
    details.requestHeaders.push({
        name:"User-Agent",
        value:"Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.2(0x18000237) NetType/WIFI Language/en"
    });
    return {
        requestHeaders: details.requestHeaders
    };
},
    {
        urls: ["https://file.pinduoduo.com/*","https://api.pinduoduo.com/*","https://minicdn.yangkeduo.com/*","https://wxapp.pinduoduo.net/*","https://xcxapp.pinduoduo.com/*"]
    },
    ["blocking", "requestHeaders", "extraHeaders"]
);
