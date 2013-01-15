/**
 * 弹出层
 * 
 * @version    0.1
 * @since      2012-7-6, 08:53
 * @last       2012-7-6, 08:53
 * @author     ZhangChao <zczsnm@126.com>
 */
/**
 * Usage:  codyy.dialog({id:"box",cls:"welcome",width:500,title:"欢迎",content:"<div>欢迎使用codyydialog！</div>"}).open().time(3000).lock();
 isStick : true,
 position : [left, top],
 buttons : ["confirm", "cancel"],
 btnObj : {
	confirm : {
		text : "确定",
		href : "javascript:void(0);",
		cls : "btn-submit",
		method : function() {
			mCancelListen(self, qxst);
		}
	},
	cancel : {
		text : "取消",
		href : "javascript:void(0);",
		cls : "btn-close",
		method : function(qxsc) {
			qxst.close();
		}
	}
 }
 * @param elm 你想要使用的最外层
 * @param options 一些附加参数
 *
 * Valid options:
 * ---------------------------------------
 * url:"",				//ajax请求地址，同时dataType指定数据处理方式，callback回调函数
 * id:"",				//自定义id，最外层div的id
 * cls:"",				//自定义class，同样是最外层
 * content:"",			//自定义内容
 * title:titleVal,		//标题，默认'提示'
 * zindex:1988,			//对话框叠加高度值(重要：此值不能超过浏览器最大限制)
 * width:0,				//对话框宽度
 * height:0,			//对话框高度
 * visible:false,		//是否可见
 * time:null,			//自动关闭时间，单位毫秒
 * lock:false,			//是否锁屏
 * iframe:false,		//添加Iframe元素，解决flash遮盖问题
 * maxWidth:960,		//对话框的最大宽度
 * autoupdate:false,	//是否自动调整，位置和大小
 * cache:true,			//是否开启缓存
 * buttons:[],			//按钮对象
 * btnObj:{},			//按钮函数
 * closed:null,			//对话框关闭前执行的函数
 * dataType:"text",		//ajax返回数据类型，text或json
 * callback:null,		//ajax回调函数
 * isStick:false,		//定位方式
 * position:[x,y],		//定位值
 * isHideClose:false,	//是否隐藏关闭按钮
 * isHideTitle:false,	//是否隐藏标题
 * onlyone:false,		//一个页面只能同时弹出一个对话框
 * drag:false			//是否拖动
 */
(function(){
	var x=window.zc||{},
	objId="zc-dialog",
	dialogList=[],
	urlList={},
	bnFuncs={},
	isIE6=!-[1,] && !('minWidth' in document.documentElement.style),
	dialogClass="zc-dialog",
	closeClass="zc-dialog-close",
	shadowClass="zc-dialog-shd",
	contentClass="zc-dialog-content",
	frameClass="zc-dialog-iframe",
	focusClass="zc-state-focus",
	titleVal="提示",
	loadingVal="下载中，请稍候...",
	bw=8,
	templates='<div id="{ID}" class="' + dialogClass + ' {CLS}" style="{CSS_ISHIDE}"> <span class="' + shadowClass + '"></span> <div class="' + contentClass + '"> {TITLE} <div class="bd">{BODY}</div> {BN_CLOSE} </div> </div>',
	closeElem='<a href="javascript:;" class="' + closeClass + '">X</a>',
	titleElem='<div class="hd">{TITLE}</div>',
	frameElem='<iframe class="' + frameClass + '" frameborder="no" border="0"></iframe>',
	defaults={
		url:"",				//异步请求地址
		id:"",				//自定义id
		cls:"",				//自定义class
		content:"",			//自定义内容
		title:titleVal,		//标题，默认'提示'
		zindex:1988,		//对话框叠加高度值(重要：此值不能超过浏览器最大限制)
		width:0,			//对话框宽度
		height:0,			//对话框高度
		visible:false,		//是否可见
		time:null,			//自动关闭时间，单位毫秒
		lock:false,			//是否锁屏
		iframe:false,		//添加Iframe元素，解决flash遮盖问题
		borderWidth:bw,		//边框宽度
		maxWidth:960,		//对话框的最大宽度
		autoupdate:false,	//是否自动调整，位置和大小
		cache:true,			//是否开启缓存
		buttons:[],			//按钮名称数组
		btnObj:{},			//按钮对象
		closed:null,		//对话框关闭前执行的函数
		dataType:"text",	//ajax返回数据类型，text或json
		callback:null,		//ajax回调函数
		isStick:false,		//定位方式
		isHideClose:false,	//是否隐藏关闭按钮
    	isHideTitle:false,	//是否隐藏标题
    	onlyone:false,		//一个页面只能同时弹出一个对话框
    	drag:false			//是否拖动
	},
	//异步请求参数
	parameter=function(o){
		var elems=o.elements,
			i=0,
			elem,params=[],
		types={
			"select-one":function(el){
				return encodeURIComponent(el.name)+"="+encodeURIComponent(el.options[el.selectedIndex].value);
			},
			"select-multiple":function(el){
				var j=0,
				option,oparams=[];
				for(;option=el.options[j++];){
					if(option.selected){
                        oparams.push(encodeURIComponent(el.name)+"="+encodeURIComponent(option.value));
                    }
				}
				return oparams.join("&");
			},
			radio:function(el){
				if(el.checked){
					return encodeURIComponent(el.name)+"="+encodeURIComponent(el.value);
				}
			},
			checkbox:function(el){
				if(el.checked){
					return encodeURIComponent(el.name)+"="+encodeURIComponent(el.value);
				}
			}
		};
		for(;elem=elems[i++];){
			if(types[elem.type]){
				params.push(types[elem.type](elem));
			}else{
				params.push(encodeURIComponent(elem.name)+"="+encodeURIComponent(elem.value));
			}
		}
		return params.join("&").replace(/\&{2,}/g,"&");
	},
	
	_noop = function () {},
	_dragEvent, _use,
	_$window = $(window),
	_$document = $(document),
	
	Dialog=function(config){
		this.config=config||{};
		if (typeof config === "string" || config.nodeType === 1) {
	        this.config = {content: config};
	    }
		for(var i in defaults){
			if(this.config[i]===undefined){
				this.config[i] = defaults[i];
			}
		}
		this.init();
	};
	
	Dialog.prototype={
		init:function(){
			this.render();
			this.bind();
			return this;
		},
		render:function(){
			var c=this.config;
				expando=c.id||objId+dialogList.length,
				hideStyle=c.visible?"":"visibility:hidden;";
			dialogList.push(expando);
			$("body").append(templates.replace("{ID}",expando).replace("{CSS_ISHIDE}",hideStyle).replace("{CLS}",c.cls).replace("{TITLE}",titleElem.replace("{TITLE}",c.title)).replace("{BN_CLOSE}",closeElem).replace("{BODY}",c.content));
			this.nodeId=expando;
			this.node=$("#"+expando);
			this.title=$(".hd",this.node);
			this.body=$(".bd",this.node);
			this.btnClose=$("."+closeClass,this.node);
			this.shadow=$("."+shadowClass,this.node);
			this.iframe=$("."+frameClass,this.node);
			this.isLock=false;
			this.set(c);
			return this;
		},
		//浏览器窗口变动时调整对话框的位置
		bind:function(){
			var that=this;
			$(window).bind({
			    resize:function(){
			        if(isIE6 || that.config.drag){
			            return
			        }
			        that.updatePosition();
			    },
			    scroll:function(){
			        if(!isIE6){
			            return
			        }
			        that.updatePosition();
			    }
			});
			this.title.bind("mousedown",function(){
			    that.zIndex();
			});
			this.btnClose.click(function(e){
				 that.close();
				 e.preventDefault();
			});
			$("body").keypress(function(e){
			    if(e.keyCode===27){
			        that.close();
			    }
			});
			return this;
		},
		//调整对话框大小
		updateSize:function(){
			var dgWidth=this.node.width(),
			    dgHeight,
			    winHeight=$(window).height(),
			    c=this.config,
			    borderWidth=c.borderWidth*2;
			$(".bd",this.node).css({
			    "height":"auto",
			    "overflow-x":"auto",
			    "overflow-y":"auto"
			});
			dgHeight=this.node.height();
			if(dgWidth>c.maxWidth){
			    dgWidth=c.maxWidth;
			    this.node.css("width",dgWidth+"px");
			}
			if(dgHeight>winHeight){
			    $(".bd",this.node).css({
                    "height":(winHeight-150)+"px",
                    "overflow-x":"hidden",
                    "overflow-y":"auto"
                });
			}
			dgHeight=this.node.height();
			this.shadow.width(dgWidth).height(dgHeight);
			this.iframe.width(dgWidth+borderWidth).height(dgHeight+borderWidth);
			return this;
		},
		//调整对话框位置
		updatePosition:function(){
			if(this.config.position){
                return
            }
            var dgWidth=this.node.width(),
                dgHeight=this.node.height(),
                win=$(window),
                sHeight=isIE6?win.scrollTop():0;
            this.node.css({
                left:Math.floor(win.width()/2-dgWidth/2)+"px",
                top:Math.floor(win.height()/2-dgHeight/2)+sHeight+"px"
            });
            return this;
		},
		//根据参数进行设置
		set:function(c){
			var bnList,
			    bnWrap,
			    nodeId=this.nodeId||id,
				bl=[],
				that=this,
				getId=function(id){
			        bl.push(0);
			        return nodeId+"-"+id+"-"+bl.length;
				};
			if(!c){
				return this;
			}
			if(c.width){
				this.node.css("width",c.width+"px");
				this.config.width=c.width;
			}
			if(c.height){
                this.node.css("height",c.height+"px");
                this.config.height=c.height;
            }
            if(c.lock){
                this.lock();
            }
			if(c.time){
            	if(typeof(c.time)=="number"){
            		this.time(c.time);
            	}else{
            		alert("时间格式错误");
            		return;
            	}
            }
            if(c.drag){
            	this.title.show().css("cursor","move");
            }
            if($.isArray(c.buttons)&&c.buttons[0]){
                bnWrap=$(".ft",this.node);
                bnList=[];
                $(c.buttons).each(function(){
                    var args=arguments[1],
                        bnId=getId("bn");
                    if(typeof args==="string"){
                        args=c.btnObj[args];
                    }
                    if(!args.text){
                        return
                    }
                    if(args.href){
                        bnList.push('<a class="'+(args.cls||"")+'" id="'+bnId+'" href="'+args.href+'">'+args.text+'</a>');
                    }else{
                    	bnList.push('<span class="bn-flat '+(args.cls||"")+'"><input type="button" id="'+bnId+'" class="'+nodeId+'-bn" value="'+args.text+'" /></span>');
                    }
                    bnFuncs[bnId]=args.method;
                });
                if(!bnWrap[0]){
                	bnWrap=this.body.parent().append('<div class="ft">'+bnList.join("")+'</div>');
                }else{
                	bnWrap.html(bnList.join(""));
                }
                this.footer=$(".ft",this.node);
                $(".ft a,.ft input",this.node).click(function(e){
                	var func=this.id&&bnFuncs[this.id];
                	if(func){
                		var exec=func.call(this,that);
                	}
                	if(exec){
                		e.preventDefault();
                		if(typeof exec=="string"){
                			alert(exec);
                		}
                	}
                });
            }else{
            	this.footer=$(".ft",this.node);
            	this.footer.html("");
            }
            if(typeof c.iframe!=="undefined"){
                if(!c.iframe){
                    this.iframe.hide();
                }else{
                    if(!this.iframe[0]){
                        this.node.prepend(frameElem);
                        this.iframe=$("."+frameClass,this.node);
                    }else{
                        this.iframe.show();
                    }
                }
                this.config.iframe=c.iframe;
            }
            if(c.url){
            	if(c.cache&&urlList[c.url]){
            		if(c.dataType==="text"||!c.dataType){
            			this.setContent(urlList[c.url]);
            		}
            		if(c.callback){
            			c.callback(urlList[c.url],this);
            		}
            	}else{
            		if(c.dataType==="json"){
            			this.setContent(loadingVal);
            			if(this.footer){
            				this.footer.hide();
            			}
            			$.getJSON(c.url,function(json){
            				that.footer.show();
            				urlList[c.url]=json;
            				if(c.callback){
            					c.callback(json,that);
            				}
            			});
            		}else{
            			this.setContent(loadingVal);
            			if(this.footer){
            				this.footer.hide();
            			}
            			$.ajax({
            				url:c.url,
            				dataType:c.dataType,
            				success:function(msg){
            					urlList[E.url]=msg;
            					if(that.footer){
            						that.footer.show();
            					}
            					that.setContent(msg);
            					if(c.callback){
            						c.callback(msg,that);
            					}
            				}
            			});
            		}
            	}
            }
            if(c.isHideClose!=="undefined"){
                if(c.isHideClose){
                    this.btnClose.hide();
                }else{
                    this.btnClose.show();
                }
                this.config.isHideClose=c.isHideClose;
            }
            if(c.isHideTitle!=="undefined"){
                if(c.isHideTitle){
                    this.title.hide();
                }else{
                    this.title.show();
                }
                this.config.isHideTitle=c.isHideTitle;
            }
            var pos=c.position;
            if(pos){
                this.node.css({
                    left:pos[0]+c.borderWidth+"px",
                    top:pos[1]+c.borderWidth+"px"
                });
            }
            if(typeof c.autoupdate==="boolean"){
                this.config.autoupdate=c.autoupdate;
            }
            if(typeof c.isStick==="boolean"){
                if(c.isStick){
                    this.node[0].style.position="absolute";
                }else{
                    this.node[0].style.position="fixed";
                }
                this.config.isStick=c.isStick;
            }
            return this.update();
		},
		update:function(){
            this.updateSize();
            this.updatePosition();
            return this;
		},
		setContent:function(cont){
			this.body.html(cont);
			return this.update();
		},
		setTitle: function(cont) {
            $("h3",this.title).html(cont);
            return this;
        },
        //提交表单
		submit:function(callback){
			var that=this,
				form=$("form",this.node);
			form.submit(function(e){
				e.preventDefault();
				var url=this.getAttribute("action",2),
					type=this.getAttribute("method")||"get",
					args=parameter(this);
				$[type.toLowerCase()](url,args,
					function(data){
						if(callback){
							callback(data);
						}
					},
				"json");
			});
			form.submit();
		},
		open:function(){
			if(this.config.onlyone){
				if(dialogList.length==2){
					dialogList[dialogList[0]].close();	
				}
			}
			this.node.css("visibility","visible");
			this.zIndex();
			var that=this,
			    body=that.body[0];
			that.contentHeight=body.offsetHeight;
			this.watch=!this.config.autoupdate?0:setInterval(function(){
			    if(body.offsetHeight===that.contentHeight){
			        return
			    }
			    that.update();
			    that.contentHeight=body.offsetHeight;
			},100);
			return this;
		},
		close:function(){
			if(this.config.onlyone){
				dialogList[this.config.id]=null;
				dialogList.shift();
			}
            this.unlock();
            this.node.remove();
            clearInterval(this.watcher);
            if (Dialog.focus === this) Dialog.focus = null;
            delete dialogList[this.config.id];
            if(this.config.closed){
            	this.config.closed.apply(this);
            }
            return this;
        },
        time:function(time){
            var that=this,
                timer=this._timer;
            timer&&clearTimeout(timer);
            if(time){
                this._timer=setTimeout(function(){
                    that.close();
                },time);
            }
            return this;
        },
        zIndex:function(){
            var index=defaults.zindex++,
            	top=Dialog.focus;
            this.node.css("zIndex",index);
            this.lockMask&&this.lockMask.css('zIndex',index-1);
            
            top && top.node.removeClass(focusClass);
			Dialog.focus = this;
			this.node.addClass(focusClass);
            return this;
        },
        lock:function(){
            if(this.isLock){
                return this;
            }
            var div=document.createElement("div"),
                $div = $(div),
                index=defaults.zindex-1;
            this.zIndex();
            $div.css({
                zIndex:index,
                position:"fixed",
                left:0,
                top:0,
                width:"100%",
                height:"100%",
                overflow:"hidden"
            }).addClass('overlay');
            if(isIE6){
            	$div.css({
            		position:"absolute",
            		background:"#000"
            	});
            }
            document.body.appendChild(div);
            this.lockMask=$div;
            this.isLock=true;
            return this;
        },
        unlock:function(){
            if(!this.isLock){
                return this;
            }
            this.lockMask.hide();
            this.lockMask.remove();
            this.isLock=false;
            return this;
        }
	};
	
	
	Dialog.focus = null;
	Dialog.dragEvent=function(){
    	var that = this,
		proxy = function (name) {
			var fn = that[name];
			that[name] = function () {
				return fn.apply(that, arguments);
			};
		};
		proxy('start');
		proxy('move');
		proxy('end');
   };
   Dialog.dragEvent.prototype = {
		// 开始拖拽
		onstart: _noop,
		start: function (event) {
			_$document
			.bind('mousemove', this.move)
			.bind('mouseup', this.end);
				
			this._sClientX = event.clientX;
			this._sClientY = event.clientY;
			this.onstart(event.clientX, event.clientY);
	
			return false;
		},
		
		// 正在拖拽
		onmove: _noop,
		move: function (event) {		
			this._mClientX = event.clientX;
			this._mClientY = event.clientY;
			this.onmove(
				event.clientX - this._sClientX,
				event.clientY - this._sClientY
			);
			
			return false;
		},
		
		// 结束拖拽
		onend: _noop,
		end: function (event) {
			_$document
			.unbind('mousemove', this.move)
			.unbind('mouseup', this.end);
			
			this.onend(event.clientX, event.clientY);
			return false;
		}
		
	};
	
	_use = function (event) {
		var limit, startLeft, startTop,
			DOM = Dialog.focus,
			wrap = DOM.node,
			title = DOM.title,
			main = DOM.body;
	
		// 清除文本选择
		var clsSelect = 'getSelection' in window ? function () {
			window.getSelection().removeAllRanges();
		} : function () {
			try {
				document.selection.empty();
			} catch (e) {};
		};
		
		// 对话框准备拖动
		_dragEvent.onstart = function (x, y) {
			startLeft = wrap[0].offsetLeft;
			startTop = wrap[0].offsetTop;
			
			_$document.bind('dblclick', _dragEvent.end);
			wrap.addClass('aui_state_drag');
		};
		
		// 对话框拖动进行中
		_dragEvent.onmove = function (x, y) {
			var style = wrap[0].style,
				left = Math.max(limit.minX, Math.min(limit.maxX, x + startLeft)),
				top = Math.max(limit.minY, Math.min(limit.maxY, y + startTop));

			style.left = left  + 'px';
			style.top = top + 'px';
				
			clsSelect();
		};
		
		// 对话框拖动结束
		_dragEvent.onend = function (x, y) {
			_$document.unbind('dblclick', _dragEvent.end);
			wrap.removeClass('aui_state_drag');
		};
		
		limit = (function () {
			var maxX, maxY,
				wrap = DOM.node[0],
				fixed = wrap.style.position === 'fixed',
				ow = wrap.offsetWidth,
				oh = wrap.offsetHeight,
				ww = _$window.width(),
				wh = _$window.height(),
				dl = fixed ? 0 : _$document.scrollLeft(),
				dt = fixed ? 0 : _$document.scrollTop(),
				
			// 坐标最大值限制
			maxX = ww - ow + dl;
			maxY = wh - oh + dt;
			
			return {
				minX: dl+bw,
				minY: dt+bw,
				maxX: maxX-bw,
				maxY: maxY-bw
			};
		})();
		
		_dragEvent.start(event);
	};
	
	// 代理 mousedown 事件触发对话框拖动
	_$document.bind('mousedown', function (event) {
		var DOM = Dialog.focus;
		if (!DOM) return;
	
		var target = event.target,
			config = DOM.config,
			title = DOM.title[0];
		
		if (config.drag !== false && target === title) {
			_dragEvent = _dragEvent || new Dialog.dragEvent();
			_use(event);
			return false;// 防止firefox与chrome滚屏
		};
	});
	
	x.dialog=function(config){
		return dialogList[config.id]=dialogList[config.id]?dialogList[config.id]:new Dialog(config);
	}
	window.zc=x;
})();