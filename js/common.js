var _CFG={
	common_url:"http://www.szrfweb.wang/restApi",
	webServer:"http://www.szrfweb.wang/advertising",
	// common_url:"http://joeyjava.iask.in/restApi",
	// webServer:"http://joeyjava.ticp.io/advertising",
	tokenKey:"tokenKey",
	wxLoadFlagKsy:"wxLoadFlagKsy",
	appid:"wxfb3355958b897680",
	redirectUri:"/wx/business/wxAuthResp/success",
	getWxLoginAuthPath:function(login_url,){
		var path='https://open.weixin.qq.com/connect/oauth2/authorize?appid=[appid]&redirect_uri=[redirect_uri]&response_type=code&scope=snsapi_userinfo&state=[state]#wechat_redirect';
		return path.replace('[appid]',_CFG.appid).replace('[redirect_uri]',_CFG.common_url+_CFG.redirectUri); 
	}
}

//获取登录成功token
var token = getUrlParamByName("token");
if(token)localStorage.setItem(_CFG.tokenKey,token);

//监听需要跳转页面、返回页面的元素
initDoPage();
initBackBtn();
function initDoPage(){
	mui("body").on("tap",".do_page",function(){
		do_page($(this).attr("page-url"),$(this ).attr("open-anim"),$(this ).attr("is-load"));
	}) 
}

function initBackBtn(){
	mui("body").on("tap",".do_back",function(){
		do_back(this);
	})
}
function do_back(_this,callback){
	if(!mui.os.plus){
		window.history.go(-1);
	}else{
		var hide_admin= $(_this).attr("hide-admin");
		if( isNaN(hide_admin))
			hide_admin="pop-out"; 
		plus.webview.currentWebview().hide(hide_admin,300);
	}
	if(callback)
		callback();
}


 
var _openw=null;
var open_as='pop-in';// 默认窗口动画
var open_opt={
		scrollIndicator: 'none',
		popGesture: 'hide',
		bounce:"none", 
		backButtonAutoControl: 'hide', 
	};
/**
 * 打开新窗口
 * @param {String} id	加载的页面地址，也用作窗口标识
 * @param {String} _as  窗口动画
 * @param {String} isLoad  是否显示加载框
 */
function do_page(id,_as,isLoad){
	if(!_as)_as=open_as;
	if(!mui.os.plus){//非原生环境下
		window.location.href=id;
		return;
	}
	var asTIme = 300;
	if(id=="home1.html"||id=="home2.html"||id=="home3.html"||id=="home4.html"||id=="home5.html")
		asTIme=0;
	
	if(_openw){return;}  // 防止快速点击
	 _openw=plus.webview.getWebviewById(id); 
	 if(_openw){  
		 _openw.show(_as,asTIme,function(){
			 _openw=null;//避免快速点击打开多个页面
		 });//如果当前页面存在，则显示
		 return;
	 }
	 if(isLoad)plus.nativeUI.showWaiting();
	
	localStorage.setItem("loadedFlag",id);//当前正在加载的页面
	_openw=plus.webview.create(id, id, open_opt,{open_time:new Date().getTime()}); 
	_openw.addEventListener('loaded', function(){//页面加载完成后才显示
		_openw&&_openw.show(_as, asTIme, function(){
			localStorage.removeItem("loadedFlag");
			_openw=null;//避免快速点击打开多个页面
			if(isLoad)plus.nativeUI.closeWaiting();
		});
	}, false); 
	
	//两百毫秒后检测窗口是否打开，还没加载完也打开窗口
	setTimeout(function(){
		_openw&&_openw.show(_as, asTIme, function(){
			console.log("加载已经超过两秒，自动显示窗口")
			localStorage.removeItem("loadedFlag");
			_openw=null;//避免快速点击打开多个页面
			if(isLoad)plus.nativeUI.closeWaiting();
		});
	},2000);
	
	
	_openw.addEventListener('open', function(){
		_openw=null;
	}, false);
	_openw.addEventListener('hide', function(){
		_openw=null;
	}, false);
	_openw.addEventListener('close', function(){//页面关闭后可再次打开
		_openw=null;
	}, false);
}


//封装ajax
function _ajx(opt){  
	$.ajax({
		url:_CFG.common_url+opt.url,
		type:opt.type? opt.type:"POST", 
		dataType:"JSON", 
		cache:opt.cache,
		data:opt.data,
		headers:opt.isAuth? { Authorization:localStorage.getItem(_CFG.tokenKey)} :{},
		success:function(data){ 
			if(data.code&&data.code!=200){
				opt.err(data);
			}else{
				opt.suc(data); 
			}
		}, 
		error:function(data){
			if(!data.responseJSON){
				mui.toast("网络异常")
				return;
			}
			if(opt.err){
				opt.err(data.responseJSON);
			}else{
				mui.toast(data.responseJSON.message)
			}
			//登录认证失败
			if(data.responseJSON.code==700){
				mui.toast("登录认证失效，请重新登录！");
				do_page("/login.html");
			}
		}
	})
}
 
function _auth(login_url){
	var token = localStorage.getItem(_CFG.tokenKey);
	var authFun=function(){
		if(mui.os.plus){
			window.location.href=login_url;
		}else{
			window.location.href=_CFG.getWxLoginAuthPath(login_url);
		}
	}
	if(token){
		_ajx({
			url:"/auth/isLogin",isAuth:true,
			suc:function(){},
			err:function(data){
				mui.toast("登录认证失败，请重新登录！");
				authFun();
			}
		})
	}else{
		mui.toast("当前未登录，请登录后操作！");
		authFun();
	}
	
}

/**
 * app环境下 获取粘贴板内容
 */
function getClipboardText(){
	var value='';
	if(mui.os.ios){
	   var UIPasteboard = plus.ios.importClass("UIPasteboard");
	   var generalPasteboard = UIPasteboard.generalPasteboard();
	   // 设置/获取文本内容:
	   //generalPasteboard.setValueforPasteboardType("testValue", "public.utf8-plain-text");
	   value = generalPasteboard.valueForPasteboardType("public.utf8-plain-text");
	}else{
		var Context = plus.android.importClass("android.content.Context");
		var main = plus.android.runtimeMainActivity();
		var clip = main.getSystemService(Context.CLIPBOARD_SERVICE);
		value = plus.android.invoke(clip, "getText");
	}
	return value;
}
/**
 * app环境下 设置粘贴板内容
 * @param {Object} txt
 */
function setClipboardText(txt) {
	if(!window.plus) return;//判断当前环境是否为手机
	if(mui.os.android) {//当前手机系统为android
		var Context = plus.android.importClass("android.content.Context");//导入Java类对象
		var main = plus.android.runtimeMainActivity();//获取应用主Activity(界面载体，原生应用是由很多个Activity所构成，而混合APP则是只有一个Activity 通过webview来实现app内容)实例对象
		var clip = main.getSystemService(Context.CLIPBOARD_SERVICE);
	    plus.android.invoke(clip,"setText",txt);
	} else {//ios系统
		var UIPasteboard  = plus.ios.importClass("UIPasteboard");//导入Objective-C类对象
		var generalPasteboard = UIPasteboard.generalPasteboard();//获得ios粘贴板
		generalPasteboard.setValueforPasteboardType(txt,"public.utf8-plain-text");//往粘贴板中写入数据
	}
} 

/**
 * 从字符串中提取url
 * @param {Object} str 包含url的字符串
 */
function getUrlByStr(str){
	if(!isNaN(str))
		return null;
	str=str.toString();
	console.log(str);
	// 从字符串中筛选链接
	var reg =  /(http[s]?:\/\/([\w-]+.)+([:\d+])?(\/[\w-\.\/\?%&=]*)?)/gi;
	str= str.match(reg);
	return str;
}
 
	 
/**
 * 计算几天前,几分钟前，几小时前
 * @param pTime （yyyy-mm-dd hh:mm:ss）
 * @returns
 */
function jsDateDiff(pTime) {
    var d_minutes, d_hours, d_days, d_s, d;
    var timeNow = parseInt(new Date().getTime() / 1000);
    var pTime_new = new Date(pTime).getTime() / 1000;

    if (timeNow == pTime_new) {
        return '刚刚';
    }

    d = timeNow - pTime_new;
    d_days = parseInt(d / 86400); //天     
    d_hours = parseInt(d / 3600); //分     
    d_minutes = parseInt(d / 60); //秒
    d_s = parseInt(d / 1);
    if (d_days > 0 && d_days < 6) {
        return d_days + "天前";
    } else if (d_days <= 0 && d_hours > 0) {
        return d_hours + "小时前";
    } else if (d_hours <= 0 && d_minutes > 0) {
        return d_minutes + "分钟前";
    } else if (d_minutes <= 0 && d_s > 0) {
        return d_s + "秒前";
    } else {
        return pTime;
    }
}	


/**
 获取上一个页面传过来的参数
**/
function getUrlParamByName(name) { 
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var href = window.location.href;
	href=href.substring(href.indexOf("?")+1,href.length);
	var paras=href.match(reg); 
    if (paras != null) { 
        return unescape(decodeURI(paras[2]));
    }
}



Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "H+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


// 加载弹出层
function showLoading(){
	var len = $("#fakeLoader").length;
	if(len==0){
		$("body").append('<div id="fakeLoader" style="display:none"></div>');
	}
	$("#fakeLoader").fakeLoader({
	    timeToHide:2000000, //加载效果的持续时间
	    zIndex:"999999",// 
	    spinner:"spinner2",//可选值 'spinner1', 'spinner2', 'spinner3', 'spinner4', 'spinner5', 'spinner6', 'spinner7' 对应有7种效果
	    bgColor:"rgba(0,0,0,0.5)", //加载时的背景颜色
	}); 
	$("#fakeLoader").fadeIn(100);
	return {hide:function(){
		$("#fakeLoader").fadeOut(200);
	}}
}

function numberFormatter(num,i,f){
	if(num>=i){
		return (num/i).toFixed(2)+f;
	}else{
		return num;
	}
}

function formatterImgUrl(imgurl){
	if(imgurl.indexOf('http')==-1&&imgurl.substring(0,2)!="//")
		imgurl=_CFG.webServer+"/web-imgs/"+imgurl;
		
	return imgurl;
}

// 判断安卓
function isAndroid() {
    var u = navigator.userAgent;
    if (u.indexOf("Android") > -1 || u.indexOf("Linux") > -1) {
       return true;
    }
    return false;
}
// 判断设备为 ios
function isIos() {
    var u = navigator.userAgent;
    if (u.indexOf("iPhone") > -1 || u.indexOf("iOS") > -1) {
        return true;
    }
    return false;
}

function isWxPlatform(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.indexOf("micromessenger")!=-1){
        return true;
    }else{
        return false;
    }
}