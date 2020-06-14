$(function() {
	if (!mui.os.plus) {
		wxConfigInit();
	}
})

function wxConfigInit() {
	// 微信公众号jsapi初始化
	_ajx({
		url: "/wx/portal/"+_CFG.appid+"/jsApiConfInfo",
		type: "post",
		data: {url: window.location.href},
		suc: function(data) {
			//配置微信 js api config
			wx.config({
				debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
				appId: _CFG.appid, // 必填，公众号的唯一标识
				timestamp: data.message.timestamp, // 必填，生成签名的时间戳
				nonceStr: data.message.nonceStr, // 必填，生成签名的随机串
				signature: data.message.signature, // 必填，签名
				jsApiList: ["updateAppMessageShareData", "updateTimelineShareData", "onMenuShareAppMessage", "chooseWXPay"] // 必填，需要使用的JS接口列表
			});
		},
		err: function() {

		}
	})
	wx.ready(function(e) {
		// config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
		wx.checkJsApi({
			jsApiList: ["updateAppMessageShareData", "updateTimelineShareData", "onMenuShareAppMessage", "chooseWXPay"], // 需要检测的JS接口列表，所有JS接口列表见附录2,
			success: function(res) {
				console.log("加载成功");
			}
		});
	});

	wx.error(function(res) {
		//config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
		//debugger
		console.log("加载失败",res); 
	});
}

function isLoadWx(callback){
	var flag = localStorage.getItem(_CFG.wxLoadFlagKsy);
	if (flag == "true") {
		callback();
	}else{
		mui.toast("配置未加载完成");
	}
}
