//图片上传
function upload(fileDom,updCallback) {
	var image = new Image()
	if (!fileDom.files.length) return;
	var files = fileDom.files[0];
	console.log(files)
	if (!/\/(?:jpeg|png|gif)/i.test(files.type)) { 
		updCallback.err("格式有误，仅支持 jpg、png、gif 格式");
		return;
	}
	var reader = new FileReader();
	console.log(reader);
	reader.onload = function() {
		var result = this.result;
		var img = new Image();
		img.src = result;

		//图片加载完毕之后进行压缩，然后上传
		if (img.complete) {
			callback();
		} else {
			img.onload = callback;
		}

		function callback() {
			var data = compress(img);
			$(fileDom).next().attr("src", data); //显示图片 
			var text = window.atob(data.split(",")[1]);
			var buffer = new Uint8Array(text.length);
			for (var i = 0; i < text.length; i++) {
				buffer[i] = text.charCodeAt(i);
			}
			var blob = getBlob([buffer], files.type);
			var formdata = getFormData();
			formdata.append('file', blob); 
			//upload(data, file.type, $(li));
			$.ajax({
				type: "POST",
				url: _CFG.common_url + '/auth/uploadImg',
				data: formdata,
				headers: { Authorization: localStorage.getItem(_CFG.tokenKey)},
				cache: false,
				contentType: false, //不可缺
				processData: false, //不可缺
				success: function(resul) {
					updCallback.suc(resul);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					updCallback.err(); 
				}
			});

			img = null;
		}

	};
	reader.readAsDataURL(files);
}


//使用canvas对大图片进行压缩
function compress(that,obj) {
   var orient=0;
   EXIF.getData(that, function () {
      EXIF.getAllTags(that);
	  orient = EXIF.getTag(that,'Orientation');
   });

	// 默认按比例压缩
	var w = that.width,
		h = that.height,
		scale = w / h;
	if(obj&&obj.width&&obj.height){
		w = obj.width;
		h = obj.height;
	}
	
	//生成canvas
	var canvas = document.createElement('canvas'),ctx = canvas.getContext('2d');

	//如果图片方向等于6 ，则旋转矫正，反之则不做处理
   if (orient == 6) {
	   //反向矫正 要调整高宽，否则会图片会挤压变形
	  canvas.width = h;
      canvas.height = w;
      ctx.save();
      ctx.translate(h / 2, w / 2);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(that, 0 - w / 2, 0 - h / 2, w, h);
      ctx.restore(); 
   } else {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(that, 0, 0, w, h);
   }
	// 默认图片质量为0.7
	var quality = 0.7;
	if (obj&&obj.quality && obj.quality <= 1 && obj.quality > 0) {
		quality = obj.quality;
	}
	// 回调函数返回base64的值
	var base64 = canvas.toDataURL('image/jpeg', quality);
	return base64;
}




/**
 * 获取blob对象的兼容性写法
 * @param buffer
 * @param format
 * @returns {*}
 */
function getBlob(buffer, format) {
	try {
		return new Blob(buffer, {
			type: format
		});
	} catch(e) {
		var bb = new(window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder);
		buffer.forEach(function(buf) {
			bb.append(buf);
		});
		return bb.getBlob(format);
	}
}





/**
 * 获取formdata
 */
function getFormData() {
	var isNeedShim = ~navigator.userAgent.indexOf('Android') &&
		~navigator.vendor.indexOf('Google') &&
		!~navigator.userAgent.indexOf('Chrome') &&
		navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 534;
	return isNeedShim ? new FormDataShim() : new FormData()
}