/*!
 * Canvas JavaScript Library
 * Encre Nomade
 *
 * Author: LING Huabin - lphuabin@gmail.com
           Florent Baldino
           Arthur Brongniart
 * Copyright, Encre Nomade
 *
 * Date de creation: 21/03/2011
 */

var __currContextOwner__;

(function( window, $ ) {

var mse = window.mse;

mse.configs = {
	font 	: 'DejaVu Sans',
	defaultFont : '18px DejaVu Sans',
	srcPath	: '',
	zids: {
	    text: 12,
	    wiki: 15
	},
	getSrcPath : function(path) {
	    // Path complete
	    if(path[0] == '.' || path.indexOf("http", 0) == 0) return path;
	    else return mse.configs.srcPath + path;
	}
};
// Shortcut
var cfs = mse.configs;

mse.root = null;
mse.currTimeline = null;
mse.Callback = Callback;


// Gestion de ressources
mse.src = function() {
    return {
	    list 		: {},
	    loading		: [],
	    preload		: new Array(),
	    loadInfo	: 'Chargement ressources: ',
	    waitinglist : {},
	    audExtCheck : /(.ogg|.mp3)/,
	    volume      : 0.5,
	    init		: function() {
	    	var ctx, angle;
	    	for(var i = 0; i < 12; i++) {
	    		this.loading[i] = document.createElement('canvas');
	    		this.loading[i].width = 300; this.loading[i].height = 300;
	    		ctx = this.loading[i].getContext('2d');
	    		ctx.translate(150,150);
	    		//ctx.fillStyle = 'rgba(0,0,0,0.4)';
	    		//ctx.fillRoundRect(-50,-50, 100,100, 10);
	    		angle = 2*Math.PI / 12;
	    		ctx.fillStyle = '#AAAAAA';
	    		for(var j = 0; j < 12; j++) {
	    			if(j == i) {
	    				ctx.fillStyle = '#EEEEEE';
	    				ctx.fillRect(60, -9, 60, 18);
	    				ctx.fillStyle = '#AAAAAA';
	    			}
	    			else ctx.fillRect(60, -9, 60, 18);
	    			ctx.rotate(angle);
	    		}
	    	}
	    },
	    addSource	: function(name, file, type, pre) {
	    	switch(type) {
	    	case 'img' : case 'image':
	    		this.list[name] = new Image();
	    		this.list[name].src = cfs.getSrcPath(file);
	    		this.list[name].lid = 0; // Loading current index
	    		break;
	    	case 'aud' : case 'audio':
	    		this.list[name] = document.createElement('audio');
	    		if(file.search(this.audExtCheck) == -1) {
	    		    switch(MseConfig.browser) {
	    		    case 'Chrome': case 'Firefox': case 'Opera':
	    			    this.list[name].setAttribute('src', cfs.getSrcPath(file)+'.ogg');
	    			    this.list[name].setAttribute('type', 'audio/ogg');
	    			    break;
	    		    case 'Safari': case 'Explorer':
	    			    this.list[name].setAttribute('src', cfs.getSrcPath(file)+'.mp3');
	    			    this.list[name].setAttribute('type', 'audio/mpeg');
	    			    break;
	    		    }
	    		}
	    		else this.list[name].src = cfs.getSrcPath(file);
	    		this.list[name].setAttribute('preload', 'auto');
	    		//this.list[name].load();
	    		break;
	    	case 'script':
	    	    this.list[name] = {};
	    	    this.list[name].complete = false;
	    	    $.ajax({
	    	        url: cfs.getSrcPath(file),
	    	        dataType: "script",
	    	        async: false,
                    success: function(script){
                        mse.src.list[name].complete = true;
                    }
	    	    });
	    	default: return;
	    	}
	    	this.list[name].type = type;
	    	if(pre && type != 'aud' && type != 'audio') this.preload.push(this.list[name]);
	    },
	    getSrc		: function(name) {
	    	var res = this.list[name];
	    	if(!res) return null;
	    	switch(res.type) {
	    	case 'img': case 'image':
	    		if(!res || res.complete) return res;
	    		else {
	    			if(res.lid == 12) res.lid = 0;
	    			return this.loading[(res.lid++)];
	    		}
	    	case 'aud': case 'audio':
	    	    res.volume = this.volume;
	    		return res;
	    	}
	    },
	    waitSrc     : function(name, callback) {
	        if(!this.list[name]) return;
	        if(this.list[name].complete) {
	            callback.invoke();
	            return;
	        }
	        if(!this.waitinglist[name]) this.waitinglist[name] = new Array();
	        var wlist = this.waitinglist[name];
	        wlist.push(callback);
	        this.list[name].onload = function() {
	            for(var cb in wlist) wlist[cb].invoke();
	        };
	    },
	    preloadProc	: function() {
	    	var count = 0;
	    	for(var i = 0; i < this.preload.length; i++)
	    		if(this.preload[i].complete) count++;
	    	return [count, this.preload.length];
	    },
	    preloadPage	: function(ctx, fini, total) {
	    	ctx.clearRect(0, 0, mse.root.width, mse.root.height);
	    	ctx.save();
	    	ctx.strokeStyle = '#DDD';
	    	ctx.lineWidth = 2;
	    	ctx.strokeRoundRect((mse.root.width-280)/2, mse.root.height-100, 281, 11, 5);
	    	ctx.fillStyle = '#BBB';
	    	ctx.fillRoundRect((mse.root.width-280)/2, mse.root.height-100, (fini/total)*280, 10, 5);
	    	var txt = this.loadInfo + fini + '/' + total;
	    	ctx.font = '20px '+cfs.font;
	    	ctx.fillStyle = '#FFF';
	    	ctx.textAlign = 'center';
	    	ctx.fillText(txt, mse.root.width/2, mse.root.height-60);
	    	ctx.restore();
	    },
	    
	    setVolume   : function(value) {
	        this.volume = value/100;
	        for (var i in this.list) {
	            if( this.list[i].type == "aud" || this.list[i].type == "audio" )
	                this.list[i].volume = this.volume;
	        }
	    }
	};
}();

var initCoordinateSys = function(){
    mse.coords = {};
    mse.coorRatio = 1;
    mse.joinCoor = function(coor) {
        if(isNaN(coor)) return "";
        var cid = 0;
        for (var i in mse.coords) {
            if (coor == mse.coords[i]) return i;
            
            var reg = i.match(/cid(\d+)/);
            if(reg[1]) var id = parseInt(reg[1]);
            if(!isNaN(id) && id >= cid) cid = id + 1;
        }
        var key = "cid"+cid;
        mse.coords[key] = mse.coorRatio == 1 ? coor : parseFloat(new Number(mse.coorRatio * coor).toFixed(2));
        return key;
    };
    mse.coor = function(key) {
        if(isNaN(mse.coords[key])) return 0;
        else return mse.coords[key];
    };
    mse.realCoor = function(coor) {
        if(isNaN(coor)) return 0;
        else return mse.coorRatio == 1 ? coor : parseFloat(new Number(mse.coorRatio * coor).toFixed(2));
    };
}();

function changeCoords() {
    mse.coorRatio = MseConfig.pageHeight / mse.coords['cid1'];
    for(var i in mse.coords) {
        mse.coords[i] = parseFloat(new Number(mse.coorRatio * mse.coords[i]).toFixed(0));
    }
    if(window.autoFitCallback) window.autoFitCallback();
    window.autoFitCallback = null;
}

mse.autoFitToWindow = function(f) {
    if(f) window.autoFitCallback = f;
    if(mse.coords['cid1']) {
        if(MseConfig.pageHeight > 250) changeCoords();
        else setTimeout(mse.autoFitToWindow, 1000);
    }
}

mse.init = function(configs, id, width, height, orientation) {
	$.extend(cfs, configs);

    mse.src.init();
    
	mse.src.addSource('closeBn', './img/close.png', 'img', true);
	mse.src.addSource('aud_wiki_open', './audios/wiki_open', 'aud');
	mse.src.addSource('aud_wiki_close', './audios/wiki_close', 'aud');
    
	(function(config) {
	    var lastTime = 0;
	    var vendors = ['ms', 'moz', 'webkit', 'o'];
	    if(config.mobile) {
	        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	            window.cancelAnimationFrame = 
	              window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	        }
	    }
	    //if (!window.requestAnimationFrame)
	    else {
	        window.requestAnimationFrame = function(callback, element) {
	            var currTime = new Date().getTime();
	            // 33 means 33ms, which will do the loop in 30fps
	            var timeToCall = Math.max(0, 33 - (currTime - lastTime));
	            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
	              timeToCall);
	            lastTime = currTime + timeToCall;
	            return id;
	        };
	    }
	    if (!window.cancelAnimationFrame)
	        window.cancelAnimationFrame = function(id) {
	            clearTimeout(id);
	        };
	}(window.MseConfig));

	
	id = id || 'defaultId';
	width = width || MseConfig.pageWidth;
	height = height || MseConfig.pageHeight;
	orientation = orientation || 'portrait';
	
	if(!mse.root)
		window.root = new mse.Root(id, width, height, orientation);
    
    var imgShower = new mse.ImageShower();
};


var DIST_PARAG = 15;
var __count__ = 0;

var linkColor = {
                    fb		: 'rgb(74,108,164)',
				     wiki	: 'rgb(230,82,82)',
				     audio	: '#FFF'//'#FFB11B'
				 };
				 
var __bgLayers = {};

// Animations
mse.fade = function(obj, t, begin, end, callback) {
	if(!obj) return;
	var fade = new mse.KeyFrameAnimation(obj, {
			frame	: [0, t],
			opacity	: [begin, end]
		}, 1);
	if(callback) fade.evtDeleg.addListener('end', callback);
	fade.start();
};
mse.fadein = function(obj, t, callback) {
	mse.fade(obj, t, 0, 1, callback);
};
mse.fadeout = function(obj, t, callback) {
	mse.fade(obj, t, 1, 0, callback);
};
mse.slidein = function(obj, t, movement, callback, destalpha) {
	if(!obj instanceof mse.UIObject) return;
	if(isNaN(destalpha)) destalpha = 1;
	var slide = new mse.KeyFrameAnimation(obj, {
			frame	: [0, t],
			pos		: movement,
			opacity	: [0, destalpha]
		}, 1);
	if(callback) slide.evtDeleg.addListener('end', callback);
	slide.start();
};
mse.slideout = function(obj, t, movement, callback) {
	if(!obj instanceof mse.UIObject) return;
	var slide = new mse.KeyFrameAnimation(obj, {
			frame	: [0, t],
			pos		: movement,
			opacity	: [obj.globalAlpha, 0]
		}, 1);
	if(callback) slide.evtDeleg.addListener('end', callback, false);
	slide.start();
};
mse.transition = function(obj1, obj2, t, callback) {
    var layer = obj1.parent;
    if(layer instanceof mse.Layer) {
        layer.insertBefore(obj2, obj1);
    }
	mse.fadein(obj2, t, callback);
	mse.fadeout(obj1, t, new mse.Callback(layer.delObject, layer, obj1));
};
mse.setCursor = function(cursor) {
    if(cursor.indexOf(".") != -1) 
        mse.root.jqObj.css('cursor', 'url("'+cursor+'"), auto');
	else mse.root.jqObj.get(0).style.cursor = cursor;
};

mse.changePage = function(tar, quitonclick) {
	if(quitonclick)
	    tar.evtDeleg.addListener(
			'click', 
			new mse.Callback(mse.root.transition, mse.root, mse.root.container), 
			true);
	mse.root.transition(tar);
};

mse.createBackLayer = function(img) {
	if(__bgLayers[img]) return __bgLayers[img];
	var bg = new mse.Layer(null, 0, {size:[mse.root.width,mse.root.height]});
	bg.addObject(new mse.Image(bg, {size:[mse.root.width,mse.root.height]}, img));
	__bgLayers[img] = bg;
	return bg;
};


// Link system
mse.Link = function(src, index, type, link, width, height) {
	this.src = src;
	this.index = index;
	this.type = type;
	this.link = link;
	switch(this.type) {
	case 'fb':
		this.image='fbBar'; break;
	case 'wiki':
		this.image='wikiBar'; break;
	case 'illu':
		this.width = (width ? width : 300);
		this.height = (height ? height : 400);
		break;
	}
};
function sortLink(a, b) {
	return (a.index > b.index ? -1 : (a.index == b.index ? 0 : 1));
};



// Librarie canvas goes here
// Root object for all the UI object
mse.UIObject = function(parent, param) {
    if(parent) {
    	this.parent = parent;
    	this.fixed = false;
    }
    else this.parent = null;
    
    // Event handling
    this.evtDeleg = new mse.EventDelegateSystem(this);
    // Parameters
    if(param) {
    	if(param.pos)
    		this.setPos(param.pos[0], param.pos[1]);
    	if(param.size)
    		this.setSize(param.size[0], param.size[1]);
    	if(param.font)
    		this.font = param.font;
    	if(param.fillStyle)
    		this.fillStyle = param.fillStyle;
    	if(param.strokeStyle)
    		this.strokeStyle = param.strokeStyle;
    	if(!isNaN(param.globalAlpha))
    		this.globalAlpha = param.globalAlpha;
    	else this.globalAlpha = 1;
    	if(param.lineWidth)
    		this.lineWidth = param.lineWidth;
    	if(param.shadow)
    		this.shadow = param.shadow;
    	if(param.textAlign)
    		this.textAlign = param.textAlign;
    	if(param.textBaseline)
    		this.textBaseline = param.textBaseline;
    	if(param.insideRec)
    		this.insideRec = param.insideRec;
    }
    
    // Other attributes
    this.insideRec = null;
    this.analyser = null;
    this.comments = null;
};
mse.UIObject.prototype = {
    offx: 0,
    offy: 0,
    width: 0,
    height:0,
    // Position fixed or not to the parent
    fixed: true,
	// Setter of position, the position can be fixed or related to another object
	setPos: function(x, y, relat) {
		if(relat) {
			this.offx = x + (this.fixed ? relat.getX() : relat.offx);
			this.offy = y + (this.fixed ? relat.getY() : relat.offy);
		}
		else {
			this.offx = x;
			this.offy = y;
		}
	},
	setX: function(x, relat) {
		if(relat) this.offx = x + (this.fixed ? relat.getX() : relat.offx);
		else this.offx = x;
	},
	setY: function(y, relat) {
		if(relat) this.offy = y + (this.fixed ? relat.getY() : relat.offy);
		else this.offy = y;
	},
	// Getter of position in Root Canvas object, chaining to the parent if not fixed
	getX: function() {
		if(this.parent) return (this.parent.getX() + this.offx);
		else return this.offx;
	},
	getY: function() {
		if(this.parent) return (this.parent.getY() + this.offy);
		else return this.offy;
	},
	//
	getCanvasX: function(){
	    if(this.parent) return (this.parent.getCanvasX() + this.offx);
	    else {
	        var vx = 0;
	        if(mse.root.viewport) vx = -mse.root.viewport.x;
	        return vx+this.offx;
	    }
	},
	getCanvasY: function(){
	    if(this.parent) return (this.parent.getCanvasY() + this.offy);
	    else {
	        var vy = 0;
	        if(mse.root.viewport) vy = -mse.root.viewport.y;
	        return vy+this.offy;
	    }
	},
	
	// Setter for size
	setSize: function(width, height) {
		this.width = width;
		this.height = height;
	},
	// Getter for size
	getWidth: function() {
		return this.width;
	},
	getHeight: function() {
		return this.height;
	},
	
	// Check if a point located in the bounding box
	inObj: function(x,y) {
		if(this.getAlpha() < 1) return false;
		if(this.insideRec) {
			var ox = this.getX()+this.insideRec[0], oy = this.getY()+this.insideRec[1], w = this.insideRec[2], h = this.insideRec[3];
		}
		else var ox = this.getX(), oy = this.getY(), w = this.width, h = this.height;
		
		// Margin of reaction zone for simplize the mouse or touch event
		var marginx = 0;
		if(w < 110) marginx = w * 0.5 * (1 - (w-10) / 100);
		var marginy = 0;
		if(h < 110) marginy = h * 0.5 * (1 - (h-10) / 100);
		ox -= marginx;
		w += 2*marginx;
		oy -= marginy;
		h += 2*marginy;
		
		if(x>ox && x<ox+w && y>oy && y<oy+h) return true;
		else return false;
	},
	
	// Z-index
	getZindex: function() {
		return this.zid ? this.zid : (this.parent ? this.parent.getZindex() : 0);
	},
	
	// Container
	getContainer: function() {
		if(this instanceof mse.BaseContainer) return this;
		else if(this.parent) return this.parent.getContainer();
		else return mse.root.container;
	},
	
	setAlpha: function(a) {this.globalAlpha = a;},
	// Alpha composition
	getAlpha: function() {
		if(this.parent) {
		    var pa = this.parent.getAlpha();
		    return ((isNaN(pa)?1:pa) * this.globalAlpha);
		}
		else return this.globalAlpha;
	},
	// Scale composition
	getScale: function() {
		if(isNaN(this.scale)) {
			if(this.parent) return this.parent.getScale();
			else return 1;
		}
		else {
			if(this.parent) return (this.parent.getScale() * this.scale);
			else return this.scale;
		}
	},
	
	// Mouvement
	move: function(dx, dy) {
		this.offx += dx;
		this.offy += dy;
	},
	// Event management
	eventCheck: function(type, e) {
	    // In object, notify the event and get the return value that give the prevent bubbling value
	    if(this.inObj(e.offsetX, e.offsetY))
	        return this.evtDeleg.eventNotif(type, e);
	    // Not in object, don't prevent bubbling
	    else return {prevent:false,success:false};
	},
	addListener: function() {
		this.evtDeleg.addListener.apply(this.evtDeleg, Array.prototype.slice.call(arguments));
	},
	removeListener: function() {
		this.evtDeleg.removeListener.apply(this.evtDeleg, Array.prototype.slice.call(arguments));
	},
	supportMultiTouch: function() {
	    if(!this.analyser) {
	        this.analyser = new GestureAnalyser(this.evtDeleg);
	        this.addListener('multiGestAdd', new Callback(this.analyser.addBlob, this.analyser));
	        this.addListener('multiGestUpdate', new Callback(this.analyser.updateBlob, this.analyser));
	        this.addListener('multiGestRemove', new Callback(this.analyser.removeBlob, this.analyser));
	    }
	},
	// Config drawing context
	configCtxFlex: function(ctx) {
		if(this.font)
			ctx.font = this.font;
		if(this.fillStyle)
			ctx.fillStyle = this.fillStyle;
		if(this.strokeStyle)
			ctx.strokeStyle = this.strokeStyle;
		if(this.lineWidth)
			ctx.lineWidth = this.lineWidth;
		if(this.shadow) {
			ctx.shadowOffsetX = this.shadow.shadowOffsetX;
			ctx.shadowOffsetY = this.shadow.shadowOffsetY;
			ctx.shadowBlur = this.shadow.shadowBlur;
			ctx.shadowColor = this.shadow.shadowColor;
		}
		else ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = 0;
		if(this.textAlign)
			ctx.textAlign = this.textAlign;
		if(this.textBaseline)
			ctx.textBaseline = this.textBaseline;
		ctx.globalAlpha = this.getAlpha();
	},
	configCtx: function(ctx) {
	    ctx.restore();
	    ctx.save();
		this.configCtxFlex(ctx);
		var s = this.getScale();
		if(s != 1) ctx.scale(s, s);
	},
	// Add Comment to UIObject
	addComment: function(comment) {
	    if(!this.comments) this.comments = new mse.Comment(this);
	    return this.comments.addComment(comment);
	},
	
	// Abstract methods
	draw: function(ctx) {},
    logic: function(delta) {},
    toString: function() {
    	return "[object MseUIObject]";
    }
};



// Root object, a canvas Dom element
mse.Root = function(id, width, height, orientation) {
	mse.root = this;
	// Canvas obj parameters
	this.jqObj = $('.bookroot');
	if (this.jqObj.length == 0)
		this.jqObj = $('<canvas class="bookroot"></canvas>').appendTo('body');
	this.jqObj.show();

	var x = (MseConfig.pageWidth - width)/2;
	this.setPos(x);
	//this.jqObj.attr({'id':id});
	this.scale = 1;
	this.setSize(width, height);
	this.interval = 40;
	this.ctx = this.jqObj.get(0).getContext("2d");
	
	this.evtDistributor = new mse.EventDistributor(this, this.jqObj);
	
	if(MseConfig.mobile) {
	    this.setCenteredViewport();
	    this.evtDistributor.addListener('translate2', new mse.Callback(this.translate, this));
	}
	this.container = null;
	this.end = false;
	this.init = false;
	this.inPause = false;
	this.animations = new Array();
	// Animation complete
	this.animes = [];
	// Video element
	var video = $('div.video');
	//this.video = video.flareVideo($('#root')).hide();
	// Game element
	this.gamewindow = new mse.GameShower();
	
	// Capture screen callbacks
	this.capturecb = new mse.Callback(this.captureHandler, this);
	
	// Launch Timeline
	mse.currTimeline = new mse.Timeline(this, this.interval);
};
mse.Root.prototype = {
    constructor: mse.Root,
    getX: function() {
        return this.jqObj.offset().left;
    },
    getY: function() {
        return this.jqObj.offset().top;
    },
    setPos: function(x, y) {
        this.jqObj.css({'left':'0px', 'top':'0px'});
    	$('#root').css({'left':x});
    },
    setSize: function(width, height) {
    	this.width = width;
    	this.height = height;
    	this.jqObj.attr({'width':width, 'height':height});
    	$('#root').css({'width':width, 'height':height, 'left':(MseConfig.pageWidth - width)/2});
    },
    setCenteredViewport: function(){
        var pw = MseConfig.pageWidth;
        var ph = MseConfig.pageHeight;
        this.viewport = {};
        this.viewport.x = (this.width - pw)/2;
        this.viewport.y = (this.height - ph)/2;
        this.setPos(0, 0);
        this.jqObj.attr({'width':pw, 'height':ph});
        $('#root').css({'width':pw, 'height':ph});
        this.ctx.translate(-this.viewport.x, -this.viewport.y);
    },
    translate: function(e) {
        if(isNaN(e.deltaDx)) return;
        this.ctx.translate(this.viewport.x, this.viewport.y);
        this.viewport.x -= e.deltaDx;
        // Correction
        if(this.viewport.x > this.width - MseConfig.pageWidth) 
            this.viewport.x = this.width - MseConfig.pageWidth;
        else if(this.viewport.x < 0) this.viewport.x = 0;
        this.ctx.translate(-this.viewport.x, 0);
        this.ctx.save();
    },
    setContainer: function(container) {
    	// Reset first show state to prepare for calling the show event
    	if(this.container) this.container.firstShow = false;
    	container.root = this;
    	this.container = container;
    	this.evtDistributor.setDispatcher(container.dispatcher);
    	this.dest = null;
    	this.container.scale = this.scale;
    },
    transition: function(container) {
    	if(this.dest) return;
    	if(this.container) {
    		mse.fadeout( this.container, 20, new mse.Callback(this.setContainer, this, container) );
    		this.dest = container;
    	}
    	else this.setContainer(container);
    	mse.fadein(container, 20);
    },
    inObj: function(x,y) {return true;},
    	
    logic: function(delta) {
    	for(var i in this.animations)
    		if(this.animations[i].logic(delta))
    			// Delete finish animation
    			this.animations.splice(i,1);
    	
    	var block = false;
    	for(var i in this.animes) {
    	    if(this.animes[i].block) block = true;
    		if(this.animes[i].logic(delta))
    		    // Delete finish animation
    		    this.animes.splice(i,1);
    	}
    	if(block) return;
    	
    	if(this.gamewindow.logic(delta)) return;
    	
    	if(this.container) this.container.logic(delta);
    },
    
    draw: function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    	
        if(!this.gamewindow.isFullScreen()){
    	    if(this.container) this.container.draw(this.ctx);
    	    if(this.dest) this.dest.draw(this.ctx);
    	}
    	if(this.gamewindow.currGame) this.gamewindow.draw(this.ctx);
    	
    	for(var i in this.animes) this.animes[i].draw(this.ctx);
    	
    	this.evtDistributor.rootEvt.eventNotif("drawover",this.ctx);
    },
    
    // Timeline delegate
    initTimeline: function(timeline) {},
    
    runTimeline: function(delta) {
    	if(!this.init) {
    		var proc = mse.src.preloadProc();
    		if(proc[0] < proc[1]) {
    			mse.src.preloadPage(this.ctx, proc[0], proc[1]);
    		}
    		else {
    		    this.init = true;
    		    this.evtDistributor.rootEvt.eventNotif("loadover");
    		}
    	}
    	else if(!this.end) {
    		this.logic(delta);
    		this.draw();
    	}
    	else mse.currTimeline.end = true;
    },
    
    // Screen caption
    startCapture: function(callback) {
        // Stop main timeline
        mse.currTimeline.pause();
        
        // Append capture body after jqObj for capture events
        this.capBody = $('<div class="capbody"></div>');
        this.capBox = $('<div class="capbox"></div>');
        this.jqObj.after(this.capBox).after(this.capBody);
        
        // Init gesture events for capturing
        this.capBody.mseInteraction();
        this.capBody.mseInteraction('addListener', 'gestureSingle', this.capturecb);
        
        // Register callback
        if(callback instanceof mse.Callback) this.captureCallback = callback;
    },
    finishCapture: function(zone) {
        var capImageData = this.ctx.getImageData(zone.x, zone.y, zone.w, zone.h);
        
        // Change mouse cursor to default
        mse.setCursor('default');
        
        // Remove capture body and capture box
        this.capBody.remove();
        this.capBox.remove();
        this.capBody = this.capBox = null;
        
        // Restart main timeline
        mse.currTimeline.play();
        
        // Invoke callback with the capture of screen
        this.captureCallback.invoke(capImageData, zone.w, zone.h);
        // Remove callback
        this.captureCallback = null;
    },
    // Event handlers
    captureHandler: function(e) {
        if(e.type == "gestureStart") this.initCapZone(e);
        else if(e.type == "gestureUpdate") this.updateCapZone(e);
        else if(e.type == "gestureEnd") this.fixCapZone(e);
    },
    initCapZone: function(e) {
        if(this.capBody) {
            this.capOx = Math.round(e.offsetX);
            this.capOy = Math.round(e.offsetY);
            
            this.capBox.css({'left':this.capOx, 'top':this.capOy});
        }
    },
    updateCapZone: function(e) {
        if(this.capBody) {
            this.capDx = Math.round(e.offsetX);
            this.capDy = Math.round(e.offsetY);
            
            // Update capture box
            if(this.capDx < this.capOx) this.capBox.css('left', this.capDx);
            if(this.capDy < this.capOy) this.capBox.css('top', this.capDy);
            this.capBox.css({'width': Math.abs(this.capDx-this.capOx), 
                             'height': Math.abs(this.capDy-this.capOy)});
        }
    },
    fixCapZone: function(e) {
        if(this.capBody) {
            this.capOx = null;
            this.capOy = null;
            this.capDx = null;
            this.capDy = null;
            
            var x = this.capBox.position().left;
            var y = this.capBox.position().top;
            var w = this.capBox.width();
            var h = this.capBox.height();
            
            // Cancel because it's too small
            if(w < 80 || h < 80) {
                msgCenter.send('Zone de capture trop petit, réessayes');
                return;
            }
            
            this.finishCapture({'x': x, 'y': y, 'w': w, 'h': h});
        }
    },
    getProgress: function() {
        var target = this.container;
        return target.getProgress();
    },
    pause: function() {
        if(this.container) {
            var paused = false;
            
            for(var i in this.container._layers) {
                if(this.container._layers[i].pause !== undefined) {
            	    this.container._layers[i].pause = true;
            	    paused = true;
            	}
            }
            
            if (paused) {
                this.inPause = true;
                return;
            }
        }
        
        mse.currTimeline.pause();
        this.inPause = true;
        return;
    },
    play: function() {
        mse.currTimeline.play();
        
        if(this.container) {
            for(var i in this.container._layers) {
                if(this.container._layers[i].pause !== undefined) {
            	    this.container._layers[i].pause = false;
            	}
            }
        }
        
        this.inPause = false;
    },
    bookFinished: function() {
        this.evtDistributor.rootEvt.eventNotif("finished");
    }
};


// Container object
mse.BaseContainer = function(root, name, param, orientation) {
	// Super constructor
	mse.UIObject.call(this, null, param);
	
    this.name = name;
	this._layers = new Array();
	this._changed = new Array();
	this.deleg = null;
	this.dispatcher = new mse.EventDispatcher(this);
	this.progressDeleg = null;
	
	// Parametres
	this.scale = 1.0;
	this.count = 0;
	this.firstShow = false;
	
	if(MseConfig.iPhone||MseConfig.android) {
		// Initialization for orientation
		this.orientation = MseConfig.orientation;
		this.normal = true;
		
		this.setOrientation(orientation ? orientation : 'portrait');
	}
	else this.normal = true;
	
	if(root)
		root.setContainer(this);
};
extend(mse.BaseContainer, mse.UIObject);
$.extend(mse.BaseContainer.prototype, {
    // Orientation management
    setOrientation: function(orien) {
    	if(!(MseConfig.iPhone||MseConfig.android) || (orien != 'landscape' && orien != 'portrait')) return;
    	
    	this.orientation = orien;
    },
    orientChange: function(orien) {
    	__currContextOwner__ = mse.root;
    	// Normal state
    	if(orien == this.orientation) this.normal = true;
    	else this.normal = false;
    },
    // Layer managerment
    addLayer: function(name, layer){
    	if(name != null && layer instanceof mse.UIObject) {
    		layer.name = name;
    		this._layers.push(layer);
    		this.sortLayer();
    	}
    },
    delLayer: function(name) {
    	if(name == null) return;
    	for(var i = this._layers.length-1; i >= 0; --i) {
    		if(this._layers[i].name == name) this._layers.splice(i,1);
    	}
    },
    getLayer: function(name) {
    	if(name == null) return;
    	for(var i in this._layers) {
    		if(this._layers[i].name == name) return this._layers[i];
    	}
    },
    sortLayer: function() {
    	this._layers.sort(function(a, b) {
    		if(a.zid < b.zid)
    			return -1;
    		else if(a.zid > b.zid)
    			return 1;
    		else return 0;
    	});
    },
    setLayerActivate: function(name, active) {
    	if(name != null && this._layers[name] != null) {
    		this._layers[name].setActivate(active);
    	}
    },
    desactiveOthers: function(name) {
    	for(var i in this._layers) {
    		if(this._layers[i].active && this._layers[i].name != name) {
    			this._layers[i].setActivate(false);
    			this._changed.push(i);
    		}
    	}
    },
    reactiveOthers: function() {
    	var l = this._changed.length;
    	for(var i = 0; i < l; i++)
    		this._layers[this._changed.pop()].setActivate(true);
    },
    // Comment attachment in runtime, 'addComment' is the function for attaching comment in initialization
    getProgress: function() {
        if(this.progressDeleg) {
            var progress = this.progressDeleg.getProgress();
            if(progress) return progress;
        }
        
        return {type: 'page', name: this.name};
    },
    delegProgress: function(target) {
        if(target.getProgress) this.progressDeleg = target;
    },
    logic: function(delta) {
    	if(!this.firstShow) {
    		this.firstShow = true;
    		this.evtDeleg.eventNotif('show');
    		for(var i in this._layers) 
    			this._layers[i].evtDeleg.eventNotif('show');
    	}
    	
    	if(MseConfig.iPhone||MseConfig.android) {
    		if(this.normal && MseConfig.orientation!=this.orientation)
    			this.orientChange(MseConfig.orientation);
    		else if(!this.normal && MseConfig.orientation==this.orientation)
    			this.orientChange(MseConfig.orientation);
    	}
    	if(this.normal) {
    		if(this.deleg) this.deleg.logic(delta);
    		else {
    			for(var i in this._layers) {
    				this._layers[i].logic(delta);
    			}
    		}
    	}
    	this.count++;
    },
    // Draw
    draw: function(ctx) {
    	if(this.normal){
    		if(this.deleg) this.deleg.draw(ctx);
    		else {
    			this.configCtx(ctx);
    			for(var i in this._layers) {
    				this._layers[i].draw(ctx);
    			}
    		}
    		
    		this.evtDeleg.eventNotif("drawover", {'ctx': ctx});
    	}
    	else{
    		// Draw orientation change notification page
    		ctx.drawImage(mse.src.getSrc('imgNotif'), (mse.root.width-50)/2, (mse.root.height-80)/2, 50, 80);
    	}
    },
    toString: function() {
	    return "[object MseBaseContainer]";
    }
});



// Layer object
mse.Layer = function(container, z, param) {
	// Super constructor
	mse.UIObject.call(this, container, param);
	// Parametres
	this.zid = z;
	
	this.active = true;
	this.objList = new Array();
}
extend(mse.Layer, mse.UIObject);
$.extend(mse.Layer.prototype, {
	// Objects managerment
	getObjectIndex: function(o){
	    // Sauf IE
	    if(this.objList.indexOf)
	    	var id = this.objList.indexOf(o);
	    // IE
	    else {
	    	for(var i in this.objList)
	    		if(this.objList[i] === o) {
	    			var id = i;
	    			break;
	    		}
	    }
	    // Found
	    if(id != null && id != -1) return id;
	    // Not found
	    else return -1;
	},
	addObject: function(obj) {
		if(obj instanceof mse.UIObject) {
			this.objList.push(obj);
			return true;
		}
		else return false;
	},
	insertObject: function(obj, index) {
		if(obj instanceof mse.UIObject && index>=0 && index<this.objList.length) {
			this.objList.splice(index, 0, obj);
			return true;
		}
		else return false;
	},
	insertBefore: function(obj, tar) {
	    var index = this.getObjectIndex(tar);
	    if(index != -1) this.insertObject(obj, index);
	},
	insertAfter: function(obj, tar) {
	    var index = this.getObjectIndex(tar);
	    if(index != -1) {
	        if(index+1 == this.objList.length) this.addObject(obj);
	        else this.insertObject(obj, index+1);
	    }
	},
	delObject: function(o) {
		// Index of object
		if( !isNaN(o) ) {
			this.objList.splice(o, 1);
			return o;
		}
		// Object itself
		else if(o instanceof mse.UIObject) {
			// Sauf IE
			if(this.objList.indexOf) {
				var id = this.objList.indexOf(o);
			}
			// IE
			else {
				for(var i in this.objList)
					if(this.objList[i] === o) {
						var id = i;
						break;
					}
			}
			// Found
			if(id != null && id != -1) {
				this.objList.splice(id, 1);
				return id;
			}
			// Not found
			else return false;
		}
	},
	delAll: function() {
		for(var i in this.objList)
			delete this.objList[i];
		this.objList.length = 0;
	},
	getObject: function(i) {
		if(i >= 0 && i < this.objList.length)
			return this.objList[i];
		return null;
	},
	delSelf: function() {
		if(this.parent instanceof mse.BaseContainer) this.parent.delLayer(this.name);
	},
	
	// Activate or desactivate the layer
	setActivate: function(active) {
		this.active = active;
	},
	
	// Logic
	logic: function(delta) {
		if(this.active) {
			for(var i = 0; i < this.objList.length; i++) {
				this.objList[i].logic(delta);
			}
		}
	},
	// Draw
	draw: function(ctx) {
		this.configCtx(ctx);
		for(var i = 0; i < this.objList.length; i++) {
			this.objList[i].draw(ctx);
		}
	}
});


// Text dialog
mse.Speaker = function( parent, param, who, imgSrc , dim , color ) {
	// speaker draw some additional content under the text element
	// it draws one squared bubble dans a picture of the speaker
	// as the superposition of object in the same articleLayer is restricted,  some cheats have been deployed
	// - first, the element deleguate the add of a element to the articleLayer ( addObject is called on this item, it runs additionnals actions and then call addobject on ArticleLayer ) we dont have to manipulate the apparition or disparition of the object contains by the speak
	// - second, the element is added to articleLayer with a height worth marge, so the next object add will be display after the marge, ( that s not very smart , the speak is after delete from the list of object ) the same tricks is set for the bottom marge, the last added object has a height larger 
	// - due to the superposition, the element cannot be displayed like a regular UIObject ( the reposition swap to the middle of the first line position from the middle of the speaker element , and the hide and show cause trouble too ). it is displayed as a unhiddableObject, that decide by his own when be drawn or notification
	//     - in order to doing that, the element listen the hidding and showing of his composants, when no element is displayed, the container is not neither ( he remove or add itself to the list of object on which the articleLayer call draw without asking question )
	// Super constructor
	mse.UIObject.call( this , parent , param );
    
	this.parent = parent; // its an ArticleLayer
    this.who = who;
	this.dim = dim;
	this.sens = true; // true left align , false right align
	
	// graphic related
	this.bordureImg = { top : -5 , left : -10 , right : 15 , bottom : 10 }; // inner bordure
	this.color = color;
	this.borderRadius = 4;
	
	
	if( imgSrc ){
		this.face = new mse.Image( this , null , imgSrc );
		this.face.width = this.dim - this.bordureImg.left - this.bordureImg.right;
		this.face.height = this.dim - this.bordureImg.top - this.bordureImg.bottom;
	}
	
	// marge top and bottom,   top is set because the object is x pixel height when the next obj is added ( and 0 after ) the bottom because the last line is x pixel longer
	this.marge = 10;
	
	
	// knows when the bubble enlarge just by counting the number of lines displayed
	this.lineD = 0;
	this.currline = 0;
	
	this.lastObj = {};
	this.primalWidth;
	this.callbackList = [];
	this.init = false;
	
	this.bubbleheight = 0;
	this.height = this.marge;
	this.displayedLines = 0;    // the number of line visible, ( a line which is not in the screen window is not visible , is not counted in displayedLines )
};
extend(mse.Speaker, mse.UIObject);
$.extend(mse.Speaker.prototype, {
    logic: function(delta){
    
    },
    draw: function(ctx ) {
		if( this.bubbleheight < 1 )
			return;
		// draw the face ( its an mseImage )
		var x = this.sens ? this.getX() + this.bordureImg.left : this.getX() + this.width - this.dim - this.bordureImg.left;
		var y = this.getY();
		if( this.face )
			this.face.draw( ctx , x , y );
		else {
			// if there is no image associate, draw a blue rect
			ctx.save();
			ctx.beginPath();
			ctx.rect( x , y , this.dim - this.bordureImg.left - this.bordureImg.right , this.dim - this.bordureImg.top - this.bordureImg.bottom );
			ctx.fillStyle = "#278391";
			ctx.fill();
			ctx.restore();
		}
		
		// draw the buble
		ctx.save();
		var x = this.getX() - 5;
		var y = this.getY() + 5;
		var w = this.width+10;
		var h = this.bubbleheight+4;
		if( this.lineD < this.currline   )
			drawBittenRect( x ,
							y,
							w,
							h,
							this.dim ,
							this.dim ,
							this.borderRadius ,
							this.sens
			 );
		else
			drawBittenRect( x + ( this.sens ? this.dim : 0 ) ,
							y,
							w - this.dim ,
							h,
							0 ,
							0 ,
							this.borderRadius ,
							this.sens
			 );
		ctx.fillStyle = this.color;
		ctx.fill();
		
		ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        //ctx.stroke();
    	ctx.restore();
    	
		function drawBittenRect( x , y , w , h , wb , hb , border , sens ){
			
			if(!wb||w<wb || !hb||h<hb){
				wb=0;
				hb=0;
			}
			
			if( wb == 0  )
				hb = h ;
			
			
			if( border * 2 > h || border * 2 > hb || border * 2 > w )
				border = Math.min( h/2 , hb/2 , w/2 );
			
				
			var pich = Math.min( 20 , Math.max( 5 , hb /2 ) );
			var criticBorder = Math.min( border , ( hb - pich ) / 2 );
			
			
			var picl = 8;
			
	    	ctx.beginPath();
			if( sens ){
				ctx.moveTo( x + wb 	, y  + criticBorder );
				ctx.quadraticCurveTo( x + wb , y ,  x + wb + border , y  );
				ctx.lineTo( x + w - border , y  );
				ctx.quadraticCurveTo( x+w , y ,  x+w , y + border );
				ctx.lineTo( x+w  , y + h - border );
				ctx.quadraticCurveTo( x+w , y + h ,  x+w - border, y + h  );
				ctx.lineTo( x + border  , y + h  );
				if( wb != 0  ){
					var sborder = Math.min( border , ( h - hb ) /2 );
					ctx.quadraticCurveTo( x , y+h ,  x , y + h - sborder );
					ctx.lineTo( x  , y + hb + sborder );
					ctx.quadraticCurveTo(  x  , y + hb , x +  border , y + hb );
					ctx.lineTo( x + wb - border, y + hb  );
					ctx.quadraticCurveTo(  x + wb  , y + hb , x +wb , y + hb -  criticBorder );
				} else
					ctx.quadraticCurveTo( x + wb , y+h ,  x , y + h - criticBorder );
				//  the pic
				
				ctx.lineTo( x + wb , y + ( hb - pich )/2 + pich  );
				ctx.lineTo( x + wb - picl , y + ( hb )/2  );
				ctx.lineTo( x + wb , y + ( hb - pich )/2  );
				ctx.lineTo( x + wb 	, y  + criticBorder  );
				ctx.lineTo( x + wb 	, y  + criticBorder  );
				
			} else{
				ctx.moveTo( x + w - wb 	, y  + criticBorder );
				ctx.quadraticCurveTo( x + w - wb , y ,  x + w - wb - border , y  );
				ctx.lineTo( x + border , y  );
				ctx.quadraticCurveTo( x  , y ,  x , y + border );
				ctx.lineTo( x  , y + h - border );
				ctx.quadraticCurveTo( x , y + h ,  x + border, y + h  );
				ctx.lineTo( x + w - border  , y + h  );
				if( wb != 0  ){
					var sborder = Math.min( border , ( h - hb ) /2 );
					ctx.quadraticCurveTo( x+w , y+h ,  x+w , y + h - sborder );
					ctx.lineTo( x+w  , y + hb + sborder );
					ctx.quadraticCurveTo(  x+w  , y + hb , x +w -  border , y + hb );
					ctx.lineTo( x +w- wb + border, y + hb  );
					ctx.quadraticCurveTo(   x +w- wb  , y + hb ,  x +w- wb , y + hb -  criticBorder );
				} else
					ctx.quadraticCurveTo( x + w- wb , y+h ,  x + w , y + h - criticBorder );
				//  the pic
				
				ctx.lineTo( x + w- wb , y + ( hb - pich )/2 + pich  );
				ctx.lineTo( x + w- wb + picl , y + ( hb )/2  );
				ctx.lineTo( x + w- wb , y + ( hb - pich )/2  );
				ctx.lineTo( x + w- wb 	, y  + criticBorder  );
				ctx.lineTo( x + w- wb 	, y  + criticBorder  );
			}
		}
    },
	addObject : function( obj ){
		
		this.callbackList.push( new mse.Callback( this.lineShowed , this , obj ) );
		
		obj.evtDeleg.addListener('show', new mse.Callback( this.oneLineMore , this , obj ) );
		obj.evtDeleg.addListener('disapear', new mse.Callback( this.oneLineLess , this , obj ) );
		
		obj.evtDeleg.addListener('show', this.callbackList[ this.callbackList.length-1 ] );
		
		//if( this.sens && this.alt_height < this.img.height+1  );
		
		// set the widthdrawal of the line object
		if( !this.primalWidth )
			this.primalWidth = obj.width;
		if( this.primalWidth == obj.width ){
			obj.setX( this.dim );
			this.lineD ++;
		}
			
		// a bottom marge is needed,  so the last obj have to be x pixel longer than it should be
		if( this.lastObj.o )
			this.lastObj.o.height = this.lastObj.h;
		this.lastObj.o = obj;
		this.lastObj.h = obj.height;
		obj.height += ( this.height + obj.height < this.dim ? this.dim + - obj.height - this.height : 0 ) + this.marge;
		
		// delegate the addObject to the article layer
		this.parent.addObject( obj );
		
		
		// if its the first object to be added
		// we set the height 
		// we remove the element from the articleLayer  objList ( because the speak element can not let the article layer trigger his draw and logic function ),
		if( !this.init ){
			this.init = true;
			this.parent.delObject( this );
			this.height = this.marge * 2 ;
		}
		this.height += obj.height;
		
		
	},
	oneLineMore : function(){
		if( this.displayedLines == 0 ){
			this.parent.addUnhiddableObject( this );
			this.evtDeleg.eventNotif('show');
		}
		this.displayedLines ++;
	},
	oneLineLess : function(){
		this.displayedLines --;
		if( this.displayedLines == 0 ){
			this.parent.delUnhiddableObject( this );
			this.evtDeleg.eventNotif('disapear');
		}
	},
	lineShowed : function( obj ){
		
		if( this.lastObj.o ){
			// the last textLine object is reset to is primal value, because it is needed here down
			this.lastObj.o.height = this.lastObj.h;
			this.lastObj = {};
		}
		this.bubbleheight += obj.height;
		
		this.currline ++;
		
		obj.evtDeleg.removeListener( 'show' , this.callbackList.shift() );
	}
});

// Text obj
mse.Text = function(parent, param, text, styled) {
	// Super constructor
	mse.UIObject.call(this, parent, param);
	this.styled = styled ? true : false;
	this.links = [];
	this.zid = cfs.zids.text;
	
	this.text = text;
	// Check if text real width is longer than object width, if true, wrap the text
	var ctx = mse.root.ctx;
	ctx.save();
	if(this.styled) ctx.font = this.font;
	else if(this.parent && this.parent.font) ctx.font = this.parent.font;
	else ctx.font = mse.configs.defaultFont;
	// Define lineHeight
	if(param.lineHeight) this.lineHeight = param.lineHeight;
	else this.lineHeight = checkFontSize(ctx.font)*1.2;
	// Wrap text
	if(ctx.measureText(this.text).width > this.width) {
	    this.lines = wrapTextWithWrapIndice(this.text, ctx, this.width);
	    // Redefine height of text object
	    this.height = this.lineHeight * this.lines.length;
	}
	else this.lines = [this.text];
	ctx.restore();
	
	// Centralize the text
	if(this.textAlign == "center" && this.width > 0)
	    this.offx += Math.round(this.width/2);
	
	//Integraion d'effets
	this.currentEffect = null;
	this.firstShow = false;
	
	this.visible = false;
};
extend(mse.Text, mse.UIObject);
$.extend(mse.Text.prototype, {
    toString: function() {
	    return "[object mse.Text]";
    },
    setText: function(text) {
        this.text = text;
        this.links.splice(0, this.links.length);
        // Check if text real width is longer than object width, if true, wrap the text
        var ctx = mse.root.ctx;
        ctx.save();
        if(this.styled) ctx.font = this.font;
        else if(this.parent && this.parent.font) ctx.font = this.parent.font;
        else ctx.font = mse.configs.defaultFont;
        // Wrap text
        if(ctx.measureText(this.text).width > this.width) {
            this.lines = wrapText(this.text, ctx, this.width);
            // Redefine height of text object
            this.height = this.lineHeight * this.lines.length;
        }
        else this.lines = [this.text];
        ctx.restore();
    },
    addLink: function(linkObj){
        var linkInit = false;
        
        // Find link
        for(var i in this.lines) {
            var index = this.lines[i].indexOf(linkObj.src);
            // Link found
            if(index >= 0) {
                linkInit = true;
                break;
            }
        }
        if(!linkInit) return;
        
        if(this.links.length == 0) {
            this.addListener('gestureEnd', new mse.Callback(this.clicked, this), false);
        }
        
        // Audio auto play
        if(linkObj.type == 'audio')
        	this.addListener('firstShow', new mse.Callback(this.autoplay, this, linkObj.link));
        
        linkObj.owner = this;
        // Lazy init
        linkObj.inited = false;
        this.links.push(linkObj);
    },
    startEffect: function (dictEffectAndConfig) {
    	this.styled = true;
    	if(mse.initTextEffect) this.currentEffect = mse.initTextEffect(dictEffectAndConfig,this);
    },
    endEffect: function (){
    	this.currentEffect = null;
    },
    inObj: function(x, y) {
        if(!this.visible) return false;
        var ox = this.getX(), oy = this.getY(), w = this.getWidth(), h = this.getHeight();
        if(x>ox-0.1*w && x<ox+1.1*w && y>oy-0.1*h && y<oy+1.1*h) return true;
        else return false;
    },
    autoplay: function(audio) {
        /*
        if(MseConfig.iOS) {
            var div = $("<div id='audiodiv'/>");
            div.attr('src', audio.src);
            div.attr('width', '1px');
            div.attr('height', '1px');
            div.attr('scrolling', 'no');
            div.css({'border': "0px", 'left': '-1px', 'top': '0px'});
            if($('#audiodiv').length > 0)
                $('#audiodiv').replaceWith(div);
            else $('body').append(div);
            div.click(function(){
                audio.play();
            }).click();
        }
        else */
        audio.play();
    },
    clicked: function(e) {
        var x = e.offsetX - this.getX();
        var y = e.offsetY - this.getY();
    	for(var i in this.links) {
    	    var link = this.links[i];
    		if(x >= link.offx-15 && x <= link.offx+link.width+15 && y >= link.offy && y <= link.offy+this.lineHeight+24) {
    		    switch(link.type) {
    		    case 'audio': link.link.play();break;
    		    case 'wiki': link.link.init(link.src, this.getContainer());break;
    		    case 'fb': window.open(linkObj.link);break;
    		    }
    		    break;
    		}
    	}
    },
    logic: function(delta){
    	if(this.currentEffect != null) this.currentEffect.logic(delta);
    },
    draw: function(ctx, x, y) {
        if(!this.firstShow) {
        	this.firstShow = true;
        	this.visible = true;
        	this.evtDeleg.eventNotif('firstShow');
        }
        
    	if(x!=null && y!=null) this.setPos(x, y);
    	var loc = [ this.getX(), this.getY() ];
    	
    	if(this.styled) {ctx.save();this.configCtxFlex(ctx);}
    	    
    	if(this.currentEffect != null) this.currentEffect.draw(ctx);
    	else {
    	    for(var i in this.lines) {
    	        ctx.fillText(this.lines[i], loc[0], loc[1]+this.lineHeight*i);
    	    }
    	    // Link inside
    	    for(var i in this.links) {
    	        var linkObj = this.links[i];
    	        
    	        // Link lazy init
    	        if(!linkObj.inited) {
    	            // Init link relative position
    	            for(var i in this.lines) {
    	                var index = this.lines[i].indexOf(linkObj.src);
    	                // Link found
    	                if(index >= 0) {
    	                    var begin = this.lines[i].substring(0, index);
    	                    linkObj.offx = ctx.measureText(begin).width;
    	                    linkObj.offy = i * this.lineHeight;
    	                    linkObj.width = ctx.measureText(linkObj.src).width;
    	                    linkObj.inited = true;
    	                    break;
    	                }
    	            }
    	        }
    	    
    	    	ctx.save();
    	    	ctx.fillStyle = linkColor[this.links[i].type];
    	    	ctx.fillText(this.links[i].src, loc[0]+this.links[i].offx, loc[1]+this.links[i].offy);
    	    	ctx.restore();
    	    }
    	}
    	
    	if(this.styled) ctx.restore();
    	
    	this.evtDeleg.eventNotif("drawover", {'ctx': ctx});
    }
});



// Article Layer for showing the article content
mse.ArticleLayer = function(container, z, param, article) {
	mse.Layer.call(this, container, z, param);
	
//!!! Strange fontSize access
	// Init the size and lines information
	this.length = 0;
	this.oy = this.offy;
	this.prevOffy = this.oy;
	this.lineHeight = param.lineHeight ? param.lineHeight : Math.round( 1.4*(this.font ? checkFontSize(this.font) : 16) );
	this.phraseIndexs = new Array();

	if(article) {
		var ctx = mse.root.ctx;
		this.configCtx(ctx);
		var maxM = Math.floor( this.width/ctx.measureText('A').width );	
		
		var arr = article.split('\n');
		var sep = 0;
		for(var i = 0; i < arr.length; i++) {
			if(arr[i].length == 0) { // Separator paragraph
				this.addObject( new mse.UIObject(this, {size:[this.width, DIST_PARAG]}) );
				sep++;
				continue;
			}
			
			this.phraseIndexs[i-sep] = this.objList.length;
			for(var j = 0; j < arr[i].length;) {
				// Find the index of next line
				var next = checkNextLine(ctx, arr[i].substr(j), maxM, this.width);
				this.addObject( new mse.Text( this, {size:[this.width, this.lineHeight], 'lineHeight':this.lineHeight}, arr[i].substr(j, next) ) );
				j += next;
			}
			// Separator phrase
			//this.addObject( new mse.UIObject(this, {size:[this.width, DIST_PARAG]}) );
		}
	}
	this.startId = 0;
	this.endId = this.objList.length-1;
	this.complete = true;
	this.pause = false;
	this.pauseByRolling = false;
	this.scrollEvt = {}; this.scrollEvt.rolled = 0;
	this.vide = new mse.UIObject();
	// Dominate obj, if exist, logic and draw dominated by this obj
	this.dominate = null;
	this.unhiddableObjectList = [];
	// Delegate container comment attachment
	if(container) container.delegProgress(this);
};
extend(mse.ArticleLayer, mse.Layer);
$.extend( mse.ArticleLayer.prototype , {
    minInv : 600,
    maxInv : 3609,
    speedLevel : 5,
    setspeedLevel : function(level) {
        var proto = mse.ArticleLayer.prototype;
        level = Math.floor(level);
        if(level < 1 || proto.minInv + level*334 > proto.maxInv) return;
        
        proto.speedLevel = level;
        
        if(typeof proto.notify == 'function')
            proto.notify('speedLevel', proto.speedLevel);
    },
    getInterval : function(level) {
        return mse.ArticleLayer.prototype.maxInv - mse.ArticleLayer.prototype.speedLevel * 334;
    },
	setDefile : function(interval) {
		this.currTime = 0;
		this.currIndex = 0;
		this.complete = false;
		this.endId = 0;
		this.setSlider();
		
		if(config.publishMode == 'debug') {
    		// Key event for control of speed
    		this.speedCtr = function(e) {
    			switch(e.keyCode) {
    			case __KEY_LEFT:
                    mse.ArticleLayer.prototype.setspeedLevel(this.speedLevel-1);
    				break;
    			case __KEY_RIGHT:
    				mse.ArticleLayer.prototype.setspeedLevel(this.speedLevel+1);
    				break;
    			}
    		};
    		cb = new mse.Callback(this.speedCtr, this);
    		this.addListener('keydown', cb);
		}
	},
	setSlider : function() {
		// Slider
		this.slider = new mse.Slider(this, {}, 'vertical');
		this.updateListScreen();
		
		// Scroll event
		this.slider.addListener('rolling', new mse.Callback(function(){
		    //if(this.active && this.dominate instanceof mse.UIObject) return;
		    if(!this.pause) {
		        this.pause = true;
		        this.pauseByRolling = true;
		    }
		}, this) );
		this.slider.addListener('hide', new mse.Callback(function(){
		    var nb = this.complete ? this.objList.length : this.currIndex;
		    if( this.pauseByRolling && (nb==0 || this.objList[nb-1].getY() < mse.root.height*0.55) ) {
		        this.pause = false;
		    }
		}, this) );
	},
	updateIndexs : function(start, offset) {
		for(var i in this.phraseIndexs) {
			if(this.phraseIndexs[i] >= start) this.phraseIndexs[i] += offset;
		}
	},
	setLinklist : function(list) {
		for(var l in list) {
			// Change the initial paragraph index to line index for identifing the link more precisely
			var parag = list[l].index;
			for(var i = this.phraseIndexs[parag]; i < this.phraseIndexs[parag+1]; i++) {
				if( !this.objList[i].text ) continue;
				var offset = this.objList[i].text.indexOf(list[l].src);
				if( offset >= 0 ) {
					list[l].index = i;
					this.objList[i].addLink(list[l]);
					break;
				}
			}
		}
		this.links = list;
	},
	setLinkDelegate : function(deleg, type) {
		if(!this.links) return;
		
		for(var l in this.links) {
			if(this.links[l].type == type) {
				this.objList[this.links[l].index].addListener('show', new mse.Callback(deleg.linkShowHandler, deleg, this.links[l]));
				this.objList[this.links[l].index].addListener('disapear', new mse.Callback(deleg.linkDisapearHandler, deleg, this.links[l]));
			}
		}
	},
	addObject : function(obj) {
		var last = this.objList.length-1;
		if(last >= 0)
			obj.setY(this.objList[last].height, this.objList[last]);
		else obj.setY(0);
		this.length += obj.height;
		this.endId = this.objList.length-1;
        
		return mse.Layer.prototype.addObject.call(this, obj);
	},
	addGame : function(game) {
	    if(!game.config.directShow) {
	        var expose = new mse.GameExpose(this, {size:[this.width*0.8, this.width*0.65]}, game);
	        expose.setX(this.width*0.1);
	        this.addObject(expose);
	    }
	    else {
	        game.parent = this;
	        game.addListener('firstShow', new mse.Callback(game.start, game));
	        this.addObject(game);
	    }
	},
	addAnimation : function(anime) {
        anime.parent = this;
        anime.addListener('firstShow', anime.startCb);
        anime.addListener('click', anime.startCb);
        anime.block = false;
        this.addObject(anime);
	},
	insertObject : function(obj, index) {
		var res = this.constructor.prototype.insertObject.call(this, obj, index);
		if(!res) return res;
		
		this.updateIndexs(index, 1);
		
		if(index == 0) {
			obj.setY(0);
			index = 1;
		}
		for(var i = index; i < this.objList.length; i++)
			this.objList[i].setY(this.objList[i-1].height, this.objList[i-1]);
		this.length += obj.height;
		return res;
	},
	insertGame : function(game, index) {
	    if(!game.config.directShow) {
	        var expose = new mse.GameExpose(this, {size:[this.width*0.8, this.width*0.65]}, game);
	        expose.setX(this.width*0.1);
	        this.insertObject(expose, index);
	    }
	    else {
	        game.parent = this;
	        game.addListener('firstShow', new mse.Callback(game.start, game));
	        this.insertObject(game, index);
	    }
	},
	insertAnimation : function(anime, index) {
	    anime.parent = this;
	    anime.addListener('firstShow', anime.startCb);
	    anime.addListener('click', anime.startCb);
	    anime.block = false;
	    this.insertObject(anime, index);
	},
	delObject : function(obj) {
		var res = mse.Layer.prototype.delObject.call(this, obj);
		if(!isNaN(res)) {
			this.length -= obj.height;
			this.updateIndexs(res, -1);
			this.endId = this.objList.length-1;
		}
		return res;
	},
	getHeight : function() {
		var nb = this.complete ? this.objList.length : this.currIndex;
		if(nb == 0) return 0;
		return this.objList[nb-1].offy+this.objList[nb-1].height;
	},
	addUnhiddableObject : function(obj){
		this.unhiddableObjectList.push ( obj );
	},
	delUnhiddableObject : function(obj){
		for( var i = 0 ; i < this.unhiddableObjectList.length ; i ++ )
			if( this.unhiddableObjectList[ i ] == obj ){
				this.unhiddableObjectList.splice( i , 1 );
				return;
			}
		return -1;
	},
	// Get obj list on screen
	updateListScreen : function() {
		// Screen offset
		var topOffy = this.oy-this.offy;
		topOffy = (topOffy < 0 ? 0 : topOffy);
		var botOffy = topOffy + this.height*0.8;
		var last = this.complete ? this.objList.length-1 : this.currIndex-1;
		last = last < 0 ? 0 : last;
		var start = -1, end = -1;
		// Layer up : position of start obj in previous objs on screen less than current screen position
		if(this.prevOffy <= topOffy) {
			for(var i = this.startId; i <= last; i++) {
				if(start==-1 && this.objList[i].offy+this.objList[i].height > topOffy) start = i;
				if(end==-1 && this.objList[i].offy > botOffy) {end = i;break;}
			}
			start = start==-1 ? last : start;
			end = end==-1 ? last : end;
		}
		// Layer down
		else {
			for(var i = this.endId; i >= 0; i--) {
				if(end==-1 && this.objList[i].offy <= botOffy) end = i;
				if(start==-1 && this.objList[i].offy+this.objList[i].height <= topOffy) {start = i;break;}
			}
			start = start==-1 ? 0 : start;
			end = end==-1 ? 0 : end;
		}
		
		// Link show or disapear event notification
		if(start > this.startId) {
			for(var i = this.startId; i < start; i++) {
				this.objList[i].evtDeleg.eventNotif('disapear');
				if(this.objList[i].visible === true) this.objList[i].visible = false;
			}
		}
		else if(start < this.startId) {
			for(var i = start; i < this.startId; i++) {
				this.objList[i].evtDeleg.eventNotif('show');
				if(this.objList[i].visible === false) this.objList[i].visible = true;
			}
		}
		if(end > this.endId) {
			for(var i = this.endId+1; i <= end; i++) {
				this.objList[i].evtDeleg.eventNotif('show');
				if(this.objList[i].visible === false) this.objList[i].visible = true;
			}
		}
		else if(end < this.endId) {
			for(var i = end+1; i <= this.endId; i++) {
				this.objList[i].evtDeleg.eventNotif('disapear');
				if(this.objList[i].visible === true) this.objList[i].visible = false;
			}
		}
		
		this.startId = start;
		this.endId = end;
	},
    // get progress delegate, choose the object in the middle of screen
	getProgress: function(comment) {
	    var target = this.objList[this.endId];
    	// Article layer in pause, find the middle object by check visible objects positions
    	if(this.pause) {
    	    var middle = this.parent.getY() + this.parent.height/2;
    	    for(var i = this.startId; i <= this.endId; i++) {
    	        if(this.objList[i].getY() >= middle) {
    	            target = this.objList[i];
    	            break;
    	        }
    	    }
    	}
	    
	    // Return progress in article layer
	    for(var key in objs) {
	        if(target == objs[key]) return {type: "obj", id: key};
	    }
	    
	    return false;
	},
	logic : function(delta) {
		if(this.active && this.dominate instanceof mse.UIObject) {
			this.dominate.logic(delta);
			return;
		}
		
		if(this.scrollEvt.rolled) this.slider.scroll(this.scrollEvt);
		
		if(this.slider) this.updateListScreen();
		for(var i = this.startId; i <= this.endId; i++)
			this.objList[i].logic(delta);
		for( var i = 0 ; i < this.unhiddableObjectList.length ; i ++ )
			this.unhiddableObjectList[ i ].logic(delta);
		if(this.complete || !this.active) {
			this.prevOffy = (this.oy-this.offy<0 ? 0 : this.oy-this.offy);
			return;
		}
	
		if(!this.pause) {
			this.currTime += delta;
		    
		    var lastobj = this.objList[this.currIndex-1];
		    var dt = this.getInterval();
			if(this.currIndex!=0) {
			    if(lastobj instanceof mse.Image) dt = 4000;
			    else if(lastobj instanceof mse.Animation) 
			        dt = (lastobj.duration+2)*mse.currTimeline.interval;
			}
			
			if(this.currTime >= dt) {
				this.currTime = 0;
				// Move layer to right place
				if(this.currIndex < this.objList.length) {
				    var obj = this.objList[this.currIndex];
					var focusy = obj.offy + obj.height/2;
					var nbfr = (obj instanceof mse.Animation) ? 40 : obj.height/3;
					if(nbfr < 15) nbfr = 15;
					else if(nbfr > 70) nbfr = 70;
					if(focusy > mse.root.height/2) {
						var move = new mse.KeyFrameAnimation(this, {
								frame	: [0, nbfr],
								pos		: [[this.offx,this.offy], [this.offx, this.height/2-focusy]]
							}, 1);
						move.start();
					}
					this.currIndex++;
				}
				else {
				    this.complete = true;
				    mse.root.bookFinished();
				}
			}
		}
		
		this.prevOffy = (this.oy-this.offy<0 ? 0 : this.oy-this.offy);
	},
	draw : function(ctx) {
	    this.configCtx(ctx);
		for( var i = 0 ; i < this.unhiddableObjectList.length ; i ++ )
			this.unhiddableObjectList[ i ].draw(ctx);
		for(var i = this.startId; i <= this.endId; i++) {
			this.objList[i].draw(ctx);
		}
		if(this.ctrUI) this.ctrUI.draw(ctx);
	},
	inObj : function(x, y) {
		return this.parent.inObj(x,y);
	},	
	interrupt : function() {
		this.dominate = this.vide;
	},
	play : function() {
		this.dominate = null;
	}
} );

if(typeof mmvc != "undefined") mmvc.makeModel(mse.ArticleLayer.prototype, ['speedLevel']);






// Image object
// Src accept image src name(in srcMgr) or a canvas object
mse.Image = function(parent, param, src) {
	// Super constructor
	mse.UIObject.call(this, parent, param);
	if(typeof src == 'string') {
	    this.img = src;
	    mse.src.waitSrc(this.img, new mse.Callback(this.init, this));
	}
	else this.cache = src;
    
    this.zoomable = false;
	
    //Integraion d'effets
	this.currentEffect = null;
	this.firstShow = false;
};
extend(mse.Image, mse.UIObject);
$.extend(mse.Image.prototype, {
    init: function() {
        var img = mse.src.getSrc(this.img);
        if(!this.width){
        	this.width = img.width;
        	this.height = img.height;
        }
        this.cache = document.createElement("canvas");
        var ctx = this.cache.getContext("2d");
        this.cache.width = this.width;
        this.cache.style.width = this.width;
        this.cache.height = this.height;
        this.cache.style.height = this.height;
        ctx.drawImage(img, 0, 0, this.width, this.height);
        
        if(this.zoomable) 
            this.activateZoom();
    },
    activateZoom: function() {
        this.zoomable = true;
        if(!this.width) return;
        this.zoomIcon = new mse.Image(this, {pos:[this.width-20, 0]}, 'zoomIcon');
        var cb = new mse.Callback(function(){
            if(!(this.imgShower instanceof mse.ImageShower))
                this.imgShower = mse.ImageShower.getInstance();
            this.imgShower.show(this);
        }, this);
        this.zoomIcon.addListener('click', cb, true);
    },
    startEffect: function (effet) {
    	if(!this.currentEffect && effet instanceof mse.EffectImage && effet.subject == this) { 
    	    this.currentEffect = effet;
    	    this.currentEffect.init();
    	}
    },
    endEffect: function (){
    	this.currentEffect = null;
    },
    logic: function(delta){
		if(!this.firstShow) {
			this.firstShow = true;
			this.evtDeleg.eventNotif('firstShow');
		}

		if(this.currentEffect != null) this.currentEffect.logic(delta);		
	},
    draw: function(ctx, x, y) {
    	var img = (this.cache ? this.cache : mse.src.getSrc(this.img));
    	this.configCtxFlex(ctx);
    	if(isNaN(x) || isNaN(y)) {x = this.getX(); y = this.getY();}
    	if(this.currentEffect != null && this.currentEffect.draw) 
    	    this.currentEffect.draw(ctx, img, x, y, this.width, this.height);
    	else 
            ctx.drawImage(img, x, y, this.width, this.height);
        
        if (this.zoomable) 
            this.zoomIcon.draw(ctx);
            
        this.evtDeleg.eventNotif("drawover", {'ctx': ctx, 'x':x, 'y':y});
    },
    toString: function() {
    	return "[object mse.Image]";
    }
});


// Mask object
mse.Mask = function(parent, param, z) {
	// Super constructor
	mse.UIObject.call(this, parent, param);
	if(z != null) this.zid = z;
	if(param.cornerRatio) this.cr = param.cornerRatio;
	
	this.draw = function(ctx) {
		this.configCtxFlex(ctx);
		if(!this.cr) ctx.fillRect(this.getX(), this.getY(), this.width, this.height);
		else ctx.fillRoundRect(this.getX(),this.getY(),this.width,this.height,this.cr);
	};
};
mse.Mask.prototype = new mse.UIObject();
mse.Mask.prototype.constructor = mse.Mask;



// Sprite
mse.Sprite = function(parent, param, src, fw0frames, fh, sx, sy, sw, sh) {
	if(arguments.length == 4) this.frames = fw0frames;
	else {
		// Frame width and height
		this.fw = fw0frames; this.fh = fh;
		// Source region
		if(arguments.length == 9) {
			this.sx = sx; this.sy = sy; this.sw = sw; this.sh = sh;
		}
		else {
			this.sx = 0; this.sy = 0; 
			this.sw = this.width; this.sh = this.height;
		}
		// Number of column and row in the sprite
		if(fw0frames < this.sw) this.col = Math.floor(this.sw/fw0frames);
		else {
			this.fw = this.sw; this.col = 1;
		}
		if(fh < this.sh) this.row = Math.floor(this.sh/fh);
		else {
			this.fh = this.sh; this.row = 1;
		}
		// Number of frame
		this.nb = this.col * this.row;
		// Destination region
		if(!this.width) this.width = this.fw;
		if(!this.height) this.height = this.fh;
	}
	this.curr = 0;
	
	mse.Image.call(this, parent, param, src);
};
extend(mse.Sprite, mse.Image);
$.extend(mse.Sprite.prototype, {
    init: function() {
        this.cache = document.createElement("canvas");
        this.setFrame(this.curr);
    },
    configSprite: function(fw, fh, sx, sy, sw, sh, width, height) {
        if(!fw || !fh || isNaN(sx) || isNaN(sy) || !sw || !sh) return;
        // Frame width and height
        this.fw = fw; this.fh = fh;
        // Source region
        this.sx = sx; this.sy = sy; this.sw = sw; this.sh = sh;
        // Number of column and row in the sprite
        if(fw < this.sw) this.col = Math.floor(this.sw/fw);
        else {
        	this.fw = this.sw; this.col = 1;
        }
        if(fh < this.sh) this.row = Math.floor(this.sh/fh);
        else {
        	this.fh = this.sh; this.row = 1;
        }
        // Number of frame
        this.nb = this.col * this.row;
        // Destination region
        if(!width) this.width = this.fw;
        if(!height) this.height = this.fh;
        // Reset properties
        this.endEffect();
        // Reset frame
        this.curr = 0;
        this.setFrame(this.curr);
    },
    setFrame: function(fr) {
        if(!this.cache) return;
        this.curr = fr;
        var img = mse.src.getSrc(this.img);
        var ctx = this.cache.getContext("2d");
        if(this.frames){
            this.cache.width = this.frames[fr][2];
            this.cache.style.width = this.frames[fr][2];
            this.cache.height = this.frames[fr][3];
            this.cache.style.height = this.frames[fr][3];
            
            ctx.drawImage(img, this.frames[fr][0], this.frames[fr][1], this.frames[fr][2], this.frames[fr][3], 0, 0, this.frames[fr][2], this.frames[fr][3]);
        }
        else {
            this.cache.width = this.fw;
            this.cache.style.width = this.fw;
            this.cache.height = this.fh;
            this.cache.style.height = this.fh;
            var x = this.sx + (fr % this.col) * this.fw;
            var y = this.sy + (Math.floor(fr / this.col)) * this.fh;
            
            ctx.drawImage(img, x, y, this.fw, this.fh, 0, 0, this.fw, this.fh);
        }
        
        if(this.currentEffect && this.currentEffect.update) this.currentEffect.update();
    },
    appendFrames: function(frames){
        if(this.frames) this.frames = this.frames.concat(frames);
    },
    appendFrame: function(frame){
        if(this.frames) this.frames.push(frame);
    },
    drawFrame: function(frame, ctx, ox, oy){
        this.configCtxFlex(ctx);
        if(isNaN(ox)) var ox = this.getX();
        if(isNaN(oy)) var oy = this.getY();
        
        var img = mse.src.getSrc(this.img);
        if(!this.frames) {
        	var x = this.sx + (frame % this.col) * this.fw;
        	var y = this.sy + (Math.floor(frame / this.col)) * this.fh;
        	ctx.drawImage(img, x, y, this.fw,this.fh, ox,oy, this.width, this.height);
        }
        else {
        	var x = this.frames[frame][0]; var y = this.frames[frame][1];
        	var fw = this.frames[frame][2]; var fh = this.frames[frame][3];
        	ctx.drawImage(img, x, y, fw,fh, ox,oy, this.width, this.height);
        }
    },
    draw: function(ctx, ox, oy) {
    	this.configCtxFlex(ctx);
    	if(isNaN(ox)) var ox = this.getX();
    	if(isNaN(oy)) var oy = this.getY();
    	if(this.cache) {
    	    if(this.currentEffect != null && this.currentEffect.draw)
    	        this.currentEffect.draw(ctx, this.cache, ox,oy, this.width,this.height);
    	    else ctx.drawImage(this.cache, ox,oy, this.width, this.height);
    	}
    	
    	this.evtDeleg.eventNotif("drawover", {'ctx': ctx, 'x':ox, 'y':oy});
    }
});



// Game object
mse.Game = function(params) {
    if(MseConfig.iPhone){
        this.setPos(0, 0);
        this.setSize(480, 270);
    }
    else if(MseConfig.android) {
        this.setPos(0, 0);
        this.setSize(480, 270);
    }
    else {
        this.offx = 0;
        this.offy = 0;
        this.height = Math.round(0.6 * mse.root.height);
        this.width = Math.round(this.height*4/3);
    }
    
    mse.UIObject.call(this, null, params);
    
    this.config = {
        "indep": false,
        "directShow": false,
        "fillback": false,
        "title": "Jeu"
    };
    this.result = {
        "win": false,
        "score": 0,
        "highScore": 0,
    };
    
    if(params) {
        this.config.fillback = params.fillback ? true : false;
    }
    this.setEvtProxy(mse.root.evtDistributor);
};
extend(mse.Game, mse.UIObject);
$.extend(mse.Game.prototype, {
    state: "DEFAULT",
    msg: {
        "DEFAULT": "C'est un jeu, sans message......"
    },
    getMsg: function() {
        return this.msg[this.state];
    },
    setScore: function(score) {
        this.result.score = Math.floor(score);
    },
    setHighScore: function(score) {
    	this.result.highScore = score;
    },
    setEvtProxy: function(proxy) {
        if(proxy instanceof mse.EventDistributor || 
           proxy instanceof mse.EventDispatcher || 
           proxy instanceof mse.EventDelegateSystem) {
            this.proxy = proxy;
        }
    },
    getEvtProxy: function() {
        return this.proxy;
    },
    setExpose: function(expo) {
        this.expo = expo;
        this.config.indep = true;
    },
    setDirectShow: function(direct) {
        this.config.directShow = direct;
    },
    addTo: function(layer) {
        this.parent = layer;
        this.setPos(0,0);
        this.setSize(layer.getWidth(), layer.getHeight());
        layer.addObject(this);
    },
    start: function() {
    	mse.root.evtDistributor.setDominate(this);
        if(!this.config.directShow) mse.root.gamewindow.loadandstart(this);
        else this.init();
        this.evtDeleg.eventNotif("start");
        //mse.src.getSrc('aud_inter_open').play();
    },
    getContainer: function() {
        if(!this.config.directShow) return mse.root.gamewindow;
        else return this.parent.getContainer();
    },
    draw: function(ctx) {},
    end: function() {
        this.destroy();
        this.evtDeleg.eventNotif("end");
        mse.root.evtDistributor.setDominate(null);
        if(!this.config.directShow) mse.root.gamewindow.end();
        if(this.expo) this.expo.endGame();
    },
    win: function() {
        this.result.win = true;
        if(!this.config.directShow) mse.root.gamewindow.showResult();
    },
    lose: function() {
        this.result.win = false;
        if(!this.config.directShow) mse.root.gamewindow.showResult();
    },
    init: function(){},
    mobileLazyInit: function() {},
    destroy: function() {}
});


// GameShower object, window of the games, one object for all the games
mse.GameShower = function() {
	this.jqObj = $("canvas.game");
	this.ctx = this.jqObj.get(0).getContext('2d');
	this.container = $('#game_container');
	this.result = this.container.find('.game_result');
	this.container.find("#game_restart").bind('click', {'shower':this}, function(e) {
	    e.data.shower.start();
	});
	this.result.children("img").bind('click', {'shower':this}, function(e) {
	    if(config.publishMode == "release") fbapi.postGame(e.data.shower.currGame);
	});
	this.container.find(".game_restart").bind('click', {'shower':this}, function(e) {
	    e.data.shower.start();
	});
	this.container.find(".game_quit").bind('click', {'shower':this}, function(e) {
	    var shower = e.data.shower;
	    shower.currGame.end();
	    shower.end();
	});
	this.container.children(".close").bind('click', {'shower':this}, function(e) {
	    var shower = e.data.shower;
	    shower.currGame.clean();
	    shower.currGame.lose();
	    shower.currGame.end();
	    shower.end();
	});
	
	this.dispatcher = new mse.EventDispatcher(this);
	this.distributor = new mse.EventDistributor(this, this.jqObj, this.dispatcher);
	
	this.currGame = null;
	this.state = "DESACTIVE";
	this.firstShow = false;
};
mse.GameShower.prototype = {
	contructor : mse.GameShower,
	borderw : 10,
	borderh : 60,
	addListener: function() {
	    this.distributor.rootEvt.addListener.apply(this.distributor.rootEvt, Array.prototype.slice.call(arguments));
	},
	removeListener: function() {
	    this.distributor.rootEvt.removeListener.apply(this.distributor.rootEvt, Array.prototype.slice.call(arguments));
	},
	eventNotif: function() {
	    this.distributor.rootEvt.eventNotif.apply(this.distributor.rootEvt, Array.prototype.slice.call(arguments));
	},
	isFullScreen : function() {
	     if((MseConfig.iPhone||MseConfig.android) && this.state == "START" && this.currGame && this.currGame.config.indep)
	         return true;
	     else return false;
	},
	setWindow : function(isWindowOn) {
	    if(!(MseConfig.iPhone||MseConfig.android) && isWindowOn) {
	        this.container.removeClass('nowindow');
	        this.container.children('h1').text(this.currGame.config.title);
	    }
	    else this.container.addClass('nowindow');
	},
	relocate : function() {
	    if(this.state == "DESACTIVE") return;
	    
	    var offx = this.currGame.config.indep ? this.borderw : 0;
	    var offy = this.currGame.config.indep ? this.borderh : 0;
	    
	    if(isNaN(this.currGame.canvasox))
	        this.left = (MseConfig.iPhone||MseConfig.android) ? 0 : Math.round(MseConfig.pageWidth-this.width)/2 - offx;
	    else this.left = mse.root.getX() + this.currGame.canvasox - (mse.root.viewport?mse.root.viewport.x:0) - offx;
	    if(isNaN(this.currGame.canvasoy))
	        this.top = (MseConfig.iPhone||MseConfig.android) ? 0 : Math.round(MseConfig.pageHeight-this.height)/2 - offy;
	    else this.top = mse.root.getY() + this.currGame.canvasoy - (mse.root.viewport?mse.root.viewport.y:0) - offy;
	    this.container.css({
	        'left': this.left,
	        'top': this.top,
	        'width': this.width,
	        'height': this.height
	    });
	},
	load : function(game) {
	    if(!game || !(game instanceof mse.Game)) return;
	    this.currGame = game;
	    this.currGame.setEvtProxy(this.distributor);
	    this.firstShow = false;
	    this.state = "LOAD";
	    
	    // Init game window
	    if(game.config.indep)
	        this.setWindow(true);
	    else this.setWindow(false);
	    // Init game shower size and pos
	    this.jqObj.get(0).width = this.currGame.width;
	    this.jqObj.get(0).height = this.currGame.height;
	    this.width = this.currGame.width;
	    this.height = this.currGame.height;
	    this.relocate();
	    this.container.addClass('active');
	},
	start : function() {
	    if(!this.currGame) return;
	    this.result.removeClass('active');
	    // Init game
	    this.currGame.setScore(0);
	    this.currGame.init();
	    this.state = "START";
	},
	loadandstart : function(game) {
	    this.load(game);
	    this.start();
	},
	showResult: function() {
	    var win = this.currGame.result.win;
	    //mse.src.getSrc('aud_gameover').play();
	    if(!win) {
	        this.state = "LOSE";
	    }
	    else {
	        this.state = "WIN";
	    }
	    // Add gameurl
	    if(this.currGame.className) 
	        this.result.children('h5').children('a').prop('href', config.base_url + "games/" + this.currGame.className);
	    // Show result window
	    this.result.addClass('active');
	    if( this.currGame.result.score <= 0 )
	        this.result.children('h2').html('<span>'+this.currGame.result.score+'</span> pts    ');
	    else this.result.children('h2').html('Bravo! <span>'+this.currGame.result.score+'</span> pts    ');
	},
	end : function() {
	    this.result.removeClass('active');
	    this.container.removeClass('active');
	    this.state = "DESACTIVE";
	    //mse.src.getSrc('aud_inter_close').play();
	},
	logic : function(delta) {
	    if(this.state != "START" && this.state != "LOAD") return false;
	    // Mobile orientation fault
	    else if((MseConfig.iPhone||MseConfig.android) && MseConfig.orientation != "landscape") return true;
	    else this.currGame.logic(delta);
	    return true;
	},
	draw : function() {
	    this.ctx.clearRect(0,0,this.width,this.height);
	    if(this.currGame.config.fillback) {
	        this.ctx.fillStyle = "#000";
	        this.ctx.fillRect(0, 0, this.width, this.height);
	    }
	    
	    if(this.currGame.config.indep && (MseConfig.android||MseConfig.iPhone) && MseConfig.orientation != "landscape") {
	        // Draw orientation change notification page
	        this.ctx.drawImage(mse.src.getSrc('imgNotif'), (this.width-50)/2, (this.height-80)/2, 50, 80);
	    }
	    else if(this.state == "START" || this.state == "LOSE" || this.state == "WIN") {
	        if(!this.firstShow){
	            this.firstShow = true;
	            if(this.currGame.config.indep) {
	                this.eventNotif("firstShow");
	                if(MseConfig.iPhone || MseConfig.android){
	                    this.currGame.mobileLazyInit();
	                }
	            }
	        }
    	    this.currGame.draw(this.ctx);
    	}
	}
};

// GameExpose is the small object integrate in the articles, it can be clicked for load the game in GameShower and start it
mse.GameExpose = function(parent, param, game) {
    // Super constructor
    mse.UIObject.call(this, parent, param);
    
    this.firstShow = false;
    this.game = game;
    this.game.setExpose(this);
    this.msg = "";
    this.msginlines = new Array();
    if(!this.font) this.font = "18px DejaVu Sans";
    this.lineHeight = Math.round( 1.2*checkFontSize(this.font) );
    this.addListener('firstShow', new mse.Callback(parent.interrupt, parent));

    this.launchcb = new mse.Callback(this.launchGame, this);
    this.drawResult = false;
    
    // Drawing variable
    this.score = "undefined";
    this.scoreleft = 0;
    this.scorew1 = 0;
    this.scorew2 = 0;
    this.resultw = 180;
    this.resulth = 120;
    this.resultx = 0;
    this.resulty = 0;
    this.scale = 1;
};
extend( mse.GameExpose , mse.UIObject );
$.extend( mse.GameExpose.prototype , {
	launchGame : function(e) {
	    var x = e.offsetX - this.getX(), y = e.offsetY - this.getY() - 15;
	    if(this.drawResult) {
            if(x > this.resultx && 
               x < this.resultx+this.resultw*this.scale &&
	           y > this.resulty+90*this.scale && 
	           y < this.resulty+this.resulth*this.scale)
                // Launch the game
                this.game.start();
            else if (x > this.resultx+145*this.scale && 
                     x < this.resultx+this.resultw*this.scale && 
                     y > this.resulty && 
                     y < this.resulty+40*this.scale) {
                // FB Post
                if(config.publishMode == "release") fbapi.postGame(this.game);
            }
	    }
	    else {
	        // Set new draw function
	        this.drawResult = true;
	        // Calcul variable for draw
	        this.resultx = (this.width - this.resultw)/2;
	        this.resulty = (this.height-30 - this.resulth)/2;
	        if(this.resultx < 0) {
	            this.resultx = 0.1 * this.width;
	            var realh = 8 * this.resultx * 120 / 180;
	            this.resulty = (this.height-30 - realh)/2;
	            this.scale = 8*this.resultx / this.resultw;
	        }
	        // Launch the game
	        this.game.start();
	    }
    },
    endGame : function() {
        if(this.parent.play) this.parent.play();
    },
	logic : function() {
        if(!this.firstShow) {
            this.firstShow = true;
            this.evtDeleg.eventNotif('firstShow');
            this.addListener('click', this.launchcb, true);
        }
        // Message changed
        if(this.msg != this.game.getMsg()) {
            this.msg = this.game.getMsg();
            this.msginlines.splice(0,this.msginlines.length);
            
            if(mse.root.ctx.measureText(this.msg).width > this.width) {
                this.msginlines = wrapTextWithWrapIndice(this.msg, mse.root.ctx, this.width);
            }
            else this.msginlines.push(this.msg);
        }
    },
    draw : function(ctx) {
        ctx.save();
        ctx.translate(this.getX(), this.getY()+15);
        
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.width, this.height-30);
        // Border
        ctx.strokeStyle = 'rgb(188,188,188)';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, -2.5, this.width, this.height-30);
        ctx.lineWidth = 1;
        
        if(this.drawResult) {
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.font = "32px BebasNeueRegular";
            // Window offset
            ctx.translate(this.resultx, this.resulty);
            ctx.scale(this.scale, this.scale);
            // Window border
            ctx.fillStyle = "#FFF";
            ctx.strokeStyle = "#000";
            ctx.fillRect(0, 0, this.resultw, this.resulth);
            ctx.strokeRect(0, 0, this.resultw, this.resulth);
            // Window title
            ctx.fillStyle = "#000";
            ctx.drawImage(mse.src.getSrc('fbBn'), 145, 5, 30, 30);
            ctx.beginPath();
            ctx.moveTo(0, 40);
            ctx.lineTo(180, 40);
            ctx.stroke();
            // Score
            var score = this.game.result.score;
            if(this.score != score) {
                this.score = score;
                ctx.font = "15px DroidSansRegular";
                this.scorew1 = this.score <= 0 ? 0 : ctx.measureText("Bravo! ").width;
                var w3 = ctx.measureText(" pts    ").width;
                ctx.font = "25px BebasNeueRegular";
                this.scorew2 = ctx.measureText(this.score).width;
                this.scoreleft = (this.resultw - this.scorew1 - this.scorew2 - w3)/2;
            }
            ctx.textAlign = "left";
            ctx.font = "15px DroidSansRegular";
            if(this.score > 0)
                ctx.fillText("Bravo! ", this.scoreleft, 35);
            ctx.fillText(" pts    ", this.scoreleft+this.scorew1+this.scorew2, 35);
            ctx.font = "25px BebasNeueRegular";
            ctx.fillStyle = "rgb(246, 168, 0)";
            ctx.fillText(this.score, this.scoreleft+this.scorew1, 40);
            // Message 
            ctx.textAlign = "center";
            ctx.font = "15px DroidSansRegular";
            ctx.fillStyle = "#000";
            ctx.fillText("Améliore ton score !", this.resultw/2, 80);
            // Button restart
            ctx.fillStyle = "#666";
            ctx.fillRect(0, 90, 180, 30);
            ctx.beginPath();
            ctx.moveTo(0, 90);
            ctx.lineTo(180, 90);
            ctx.stroke();
            ctx.font = "20px BebasNeueRegular";
            ctx.fillStyle = "rgb(246, 168, 0)";
            ctx.fillText("REJOUER", this.resultw/2, 118);
        }
        else {
            // Msg
            ctx.font = this.font;
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillStyle = "#FFF";
            var top = (this.height-30 - this.msginlines.length * this.lineHeight)/2;
            for(var i = 0; i < this.msginlines.length; i++) {
                ctx.fillText(this.msginlines[i], this.width/2, top+i*this.lineHeight);
            }
            
            ctx.restore();
            ctx.save();
            if(this.passBn) this.passBn.draw(ctx);
        }
        
        ctx.restore();
        this.evtDeleg.eventNotif("drawover", {'ctx': ctx});
    }
} );



// Slider
mse.Slider = function(target, param, orientation, offset, parent) {
    if(!parent) parent = target.parent ? target.parent : mse.root.container;
	// Super constructor
	mse.UIObject.call(this, parent, param);
	if(parent.addLayer) parent.addLayer('slider', this);
	else if(parent.addObject) parent.addObject(this);
	
	this.fillStyle = 'rgba(145,152,159, 0.7)';
	this.tar = target;
	if(!offset) offset = 0;
	this.enScroll = false;
	this.scrollT = 0;
	this.globalAlpha = 0;
	
	if(orientation=='horizontal') {
		this.orientation = 'horizontal';
		this.setPos(this.tar.getX(), this.tar.getY()+this.tar.getHeight()+offset);
		this.setSize(this.tar.getWidth(), 10);
		// Location of cursor
		this.loc = 0;
		this.length = this.width;
	}
	else {
		this.orientation = 'vertical';
		this.setPos(this.tar.getX()+this.tar.getWidth()+offset, this.tar.getY());
		this.setSize(10, this.tar.getHeight());
		this.loc = 0;
		this.length = this.height;
	}
	
	this.cbScroll = new mse.Callback(this.scroll, this);
	this.cbGest = new mse.Callback(this.gestUpdate, this);
	this.tar.addListener('gestureUpdate', this.cbGest, false);
	if(!MseConfig.mobile)
		this.tar.addListener('mousewheel', this.cbScroll, false);
};
extend(mse.Slider, mse.UIObject);
$.extend(mse.Slider.prototype, {
    show: function() {
        mse.fadein(this, 4);
        this.enScroll = true;
        this.evtDeleg.eventNotif("show");
    },
    hide: function() {
        if(this.globalAlpha == 1) mse.fadeout(this, 4);
        this.enScroll = false;
        this.evtDeleg.eventNotif("hide");
    },
    scroll: function(e) {
        if(this.globalAlpha == 0) this.show();
        this.scrollT = 0;
        if(this.orientation == 'vertical') {
            this.tar.offy += e.rolled;
            // Adjustement
            if(this.tar.offy > 100 || this.tar.offy+this.tar.getHeight() < this.tar.parent.getHeight()/2)
                this.tar.offy -= e.rolled;
        }
        else {
            this.tar.offx += e.rolled;
            // Adjustement
            if(this.tar.offx > 100 || this.tar.offx+this.tar.getWidth() < this.tar.parent.getWidth()/2)
                this.tar.offx -= e.rolled;
        }
        this.evtDeleg.eventNotif("rolling", e.rolled);
    },
    gestUpdate: function(e) {
    	if(e.listX.length > 4) {
    		e.rolled = e.listY[e.listY.length-1] - e.listY[e.listY.length-2];
    		this.scroll(e);
    	}
    },
    logic: function(delta) {
        // Scroll timeout
        if(this.enScroll) {
        	this.scrollT += delta;
        	if(this.scrollT > 600) {
        	    this.hide();
        	    return;
        	}
        	
        	if(this.orientation == 'vertical') {
        	    var ph = this.tar.parent.getHeight();
        	    var height = this.tar.getHeight();
        	    var offset = -this.tar.offy;
        	}
        	else {
        	    var ph = this.tar.parent.getWidth();
        	    var height = this.tar.getWidth();
        	    var offset = -this.tar.offx;
        	}
        	this.length = ph*ph/height;
        	this.loc = ph*offset/height;
        	if(this.loc + this.length > ph-30) this.length = ph-this.loc-30;
        	else if(this.loc < 0) {
        	    this.length = this.length+this.loc;
        	    this.loc = 0;
        	}
        }
    },
    draw: function(ctx) {
        if(this.globalAlpha == 0) return;
        ctx.save();
        this.configCtxFlex(ctx);
        ctx.translate(this.getX(), this.getY());
        ctx.beginPath();
        if(this.orientation == 'vertical') {
        	var r = this.width/2;
        	// Top semi elipse
        	ctx.arc(r,this.loc+r,r,0,Math.PI,true);
        	// Body left
        	ctx.lineTo(0, this.loc+this.length-r);
        	// Bottom semi elipse
        	ctx.arc(r,this.loc+this.length-r,r,Math.PI,2*Math.PI,true);
        	// Body right
        	ctx.lineTo(this.width, this.loc+r);
        }
        else {
        	var r = this.height/2;
        	// Left semi elipse
        	ctx.arc(this.loc+r,r,r,1.5*Math.PI,0.5*Math.PI,false);
        	// Body top
        	ctx.lineTo(this.loc+l-r, 0);
        	// Right semi elipse
        	ctx.arc(this.loc+l-r,r,r,0.5*Math.PI,1.5*Math.PI,false);
        	// Body bottom
        	ctx.lineTo(this.loc+r, this.height);
        }
        ctx.fill();
        ctx.restore();
    }
});



// Button
mse.Button = function(parent, param, txt, image, link, type) {
	// Super constructor
	mse.UIObject.call(this, parent, param);
	
	this.txt = txt;
	this.img = image;
	this.setLink(link, type);
};
extend(mse.Button, mse.UIObject);
$.extend(mse.Button.prototype, {
    urlClicked: function() {
        window.open(this.link);
    },
    setLink: function(link, type) {
        if(link) this.link = link;
        if(type == 'url') {
            this.addListener('click', new mse.Callback(this.urlClicked, this), true);
        }
    },
    draw: function(ctx, x, y) {
    	this.configCtxFlex(ctx);
    	ctx.fillStyle = "rgb(255,255,255)";
    	ctx.textAlign = "center";
    	ctx.textBaseline = "middle";
    	
    	if(x == null) var ox = this.getX(), oy = this.getY();
    	else var ox = x, oy = y;
    	var img = mse.src.getSrc(this.img);
    	if(img) ctx.drawImage(img, ox, oy, this.width, this.height);
    	
    	if(this.txt)
    		ctx.fillText(this.txt, ox+this.width/2, oy+this.height/2);
    }
});



mse.Card = function(parent, param, ui) {
    mse.UIObject.call(this, parent, param);
    this._layers = new Array();
    this.dispatcher = new mse.EventDispatcher(this);
    
    this.ui = ui;
    if(ui) this.addLayer('ui', ui);
    this.margin = [15, 15, 15, 15];
    // Angle between -10 and 10
    this.angle = randomInt(20) - 10;
    this.lw = this.width - this.margin[1] - this.margin[3];
    this.lh = this.height - this.margin[0] - this.margin[2];
};
extend(mse.Card, mse.BaseContainer);
delete mse.Card.prototype.setOrientation;
delete mse.Card.prototype.orientChange;
delete mse.Card.prototype.logic;
delete mse.Card.prototype.setLayerActivate;
delete mse.Card.prototype.desactiveOthers;
delete mse.Card.prototype.reactiveOthers;
$.extend(mse.Card.prototype, {
    draw: function(ctx){
        if(!this.ui)
            this.drawDefaultUI(ctx, this.getX(), this.getY());
    },
    drawDefaultUI: function(ctx, x, y) {
        ctx.fillStyle = "rgb(252,250,242)";
        ctx.shadowColor ="black";
        ctx.shadowBlur = 10;
        //ctx.strokeStyle = "#4d4d4d";
        //ctx.lineWidth = 1;
        ctx.fillRoundRect(x, y, this.width, this.height, 20);
        //ctx.strokeRoundRect(x, y, this.width, this.height, 16);
        ctx.shadowBlur = 0;
    },
    ptRotate: function(x, y) {
        var ox = this.getX()+this.width/2, oy = this.getY()+this.height/2;
        var dx = x-ox, dy = y-oy;
        var a = this.angle*Math.PI/180;
        var sina = Math.sin(a), cosa = Math.cos(a);
        var xp = dx*cosa + dy*sina;
        var yp = -dx*sina + dy*cosa;
        return [ox+xp, oy+yp];
    }
});

mse.ImageCard = function(parent, param, ui, img, legend) {
    mse.Card.call(this, parent, param, ui);
    
    if(img && mse.src.getSrc(img)) {
        this.img = img;
        this.legend = legend;
    }
    mse.src.waitSrc(this.img, new mse.Callback(this.init, this));
    
};
extend(mse.ImageCard, mse.Card);
$.extend(mse.ImageCard.prototype, {
    legendheight: 35,
    setImage: function(img, legend) {
        if(img && mse.src.getSrc(img)) {
            this.img = img;
            this.legend = legend;
        }
    },
    init: function() {
        var iw = this.lw;
        var ih = this.height - this.margin[0] - this.margin[2] - this.legendheight;
        var src = mse.src.getSrc(this.img);
        var rx = iw/src.width, ry = ih/src.height;
        var r = (rx < ry) ? rx : ry;
        this.iw = src.width * r;
        this.ih = src.height * r;
        this.ix = this.margin[3] + (iw-this.iw)/2;
        this.iy = this.margin[0] + (ih-this.ih)/2;
        
        this.zoomIcon = new mse.Image(this,{pos:[this.ix+this.iw-24-5, this.iy+5],size:[20,20]}, 'zoomIcon');
        var cb = new mse.Callback(function(){
            if(!(this.imgShower instanceof mse.ImageShower))
                this.imgShower = mse.ImageShower.getInstance();
            this.imgShower.show(this);
        }, this);
        this.zoomIcon.addListener('click', cb, true);
    },
    draw: function(ctx){
        ctx.save();
        // Rotation
        ctx.translate(this.getX()+this.width/2, this.getY()+this.height/2);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.translate(-this.width/2, -this.height/2);
        
        for(var i in this._layers) {
        	this._layers[i].draw(ctx);
        }
        // Default UI
        if(!this.ui) this.drawDefaultUI(ctx, 0, 0);
        if(!this.img) return;
        
        ctx.shadowColor ="black";
        ctx.shadowBlur = 7;
        ctx.drawImage(mse.src.getSrc(this.img), this.ix, this.iy, this.iw, this.ih);
		this.zoomIcon.draw(ctx,this.ix+this.iw-24-5, this.iy+5);
        ctx.shadowBlur = 0;
        ctx.font = "italic 12px DejaVu Sans";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.fillStyle = "#000";
        ctx.fillTextWrapped(this.legend, this.ix+this.iw/2, this.iy+this.ih+5, this.lw, 15);
        ctx.restore();
    }
});

mse.TextContent = function(parent, param) {
    mse.UIObject.call(this, parent, param);
    if(!this.font) this.font = "14px DejaVu Sans";
    if(!this.textAlign) this.textAlign = "left";
    if(!this.fillStyle) this.fillStyle = "#000";
    this.textBaseline = "top";
    
    this.sections = new Array();
    this.length = 0;
};
extend(mse.TextContent, mse.UIObject);
$.extend(mse.TextContent.prototype, {
    seplineoff: -3.5,
    titletextoff: 5,
    sectionsep: 12,
    lineHeight: 18,
    addSection: function(type, title, text){
        if(typeof title != 'string' || typeof text != 'string') return;
        switch(type) {
        case "text": var content = text;break;
        case "link": 
            var content = new mse.Button(this, {pos:[15,this.length+this.titletextoff+this.lineHeight],size:[80,this.lineHeight],font:this.font,fillStyle:'#FFF'}, 'Lien', 'wikiBar', text, 'url');
        break;
        }
        this.sections.push([type, title, content]);
        this.configCtx(mse.root.ctx);
        var l = wrapText(title, mse.root.ctx, this.width).length;
        l += wrapTextWithWrapIndice(text, mse.root.ctx, this.width-15).length;
        l = l*this.lineHeight + this.titletextoff + this.sectionsep;
        this.length += l;
    },
    getHeight: function() {
        return this.length;
    },
    draw: function(ctx) {
        ctx.save();
        ctx.translate(this.offx, this.offy);
        this.configCtxFlex(ctx);
        ctx.lineCap = "round";
        var y = 0;
        for(var i = 0; i < this.sections.length; i++) {
            ctx.font = "bold "+this.font;
            y += ctx.fillTextWrapped(this.sections[i][1], 0, y, this.width, this.lineHeight) + this.titletextoff;
            ctx.beginPath();
            ctx.moveTo(0, y+this.seplineoff);
            ctx.lineTo(this.width, y+this.seplineoff);
            ctx.stroke();
            ctx.font = this.font;
            switch(this.sections[i][0]) {
            case "text":
                y += ctx.fillTextWrapped(this.sections[i][2], 15, y, this.width-15, this.lineHeight) + this.sectionsep;break;
            case "link":
                this.sections[i][2].draw(ctx, 15, y);
                y += this.lineHeight + this.sectionsep;break;
            }
        }
        ctx.restore();
    }
});
mse.TextCard = function(parent, param, ui) {
    mse.Card.call(this, parent, param, ui);
    this.content = new mse.TextContent(this, {pos:[this.margin[3], this.margin[0]], size:[this.lw, this.lh]});
    this.addLayer('content', this.content);
    
    this.slider = new mse.Slider(this.content, {}, 'vertical');
    this.slider.setPos(this.width-this.margin[1], 0);
};
extend(mse.TextCard, mse.Card);
$.extend(mse.TextCard.prototype, {
    addSection: function(title, text) {
        this.content.addSection('text', title, text);
    },
    addLink: function(title, url) {
        this.content.addSection('link', title, url);
    },
    draw: function(ctx) {
        ctx.save();
        // Rotation
        ctx.translate(this.getX()+this.width/2, this.getY()+this.height/2);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.translate(-this.width/2, -this.height/2);
        
        // Default UI
        if(!this.ui) this.drawDefaultUI(ctx, 0, 0);
        for(var i in this._layers) {
        	this._layers[i].draw(ctx);
        }
        
        ctx.restore();
    }
});

mse.WikiLayer = function() {
    //mse.Layer.call(this, null, cfs.zids.wiki, {});
    
    this.pages = [];
    this.playAfterClose = true;
    
    //this.currCard = null;
    //this.cbDragStart = new mse.Callback(this.dragStart, this);
    //this.cbDragMove = new mse.Callback(this.dragMove, this);
    //this.cbDragEnd = new mse.Callback(this.dragEnd, this);
};
//extend(mse.WikiLayer, mse.Layer);
$.extend(mse.WikiLayer.prototype, {
    cardw: 250,
    cardh: 320,
    hide: function() {
        mse.src.getSrc('aud_wiki_close').play();
        /*var container = this.parent;
        if(container) {
            this.removeListener('gestureStart', this.cbDragStart);
            this.removeListener('gestureUpdate', this.cbDragMove);
            this.removeListener('gestureEnd', this.cbDragEnd);
        }
        
        this.parent.reactiveOthers();
        this.globalAlpha = 0;
        this.parent.delLayer('wiki');*/
        
        if(this.gallery) {
            this.gallery.hide();
            
            var hasShownChild = false;
            $('#center').children().each(function() {
                if($(this).hasClass('show'))
                    hasShownChild = true;
            });
            if(!hasShownChild)
                $('#center').removeClass('show').addClass('hidden');
        }
    },
    init: function(title, container) {
        //if(!container instanceof mse.UIObject) return;
        mse.src.getSrc('aud_wiki_open').play();
        /*this.parent = container;
        this.setSize(container.getWidth(), container.getHeight());
        this.setPos(0,0);
        this.cardx = (this.width - this.cardw)/2;
        this.cardy = (this.height - this.cardh)/2;
        for(var card in this.objList)
            this.objList[card].setPos(this.cardx, this.cardy);
        
        this.addListener('gestureStart', this.cbDragStart, true);
        this.addListener('gestureUpdate', this.cbDragMove, true);
        this.addListener('gestureEnd', this.cbDragEnd, true);
        
        container.addLayer('wiki', this);
        this.globalAlpha = 1;
        container.desactiveOthers('wiki');*/
        
        this.gallery = new gui.Gallery($('#wiki'), title, null, this.pages);
        if(!$('#center').hasClass('show')) $('#center').removeClass('hidden').addClass('show');
        this.gallery.show();
        this.gallery.jqObj.siblings().removeClass('show');
        // Close event
        var close = this.gallery.jqObj.find('.close');
        close.unbind('click').bind('click', {'wiki': this}, function(e) {
            e.data.wiki.hide();
        });
        
        if( !window.controller.pause ) {
            $('#ctrl_curr').click();
        }
    },
    addImage: function(img, legend) {
        var page = $('<div class="imagecard"></div>');
        this.pages.splice(0, 0, page);
        mse.src.waitSrc(img, new Callback(function() {
            page.append('<img src="'+mse.src.getSrc(img).src+'"><h5>'+legend+'</h5>');
        }, this));
        
        //var param = {size: [this.cardw, this.cardh]};
        //this.addObject(new mse.ImageCard(this, param, null, img, legend));
    },
    addTextCard: function() {
        var page = $('<div class="textcard"></div>');
        this.pages.splice(0, 0, page);
        this.textCard = page;
        page.addSection = function(title, text) {
            page.append('<h1>'+title+'</h1><h5>'+text+'</h5>');
        };
        page.addLink = function(title, link) {
            page.append('<h4><a href="'+link+'" target="_blank">'+title+'</a></h4>');
        };
        //var param = {size: [this.cardw, this.cardh]};
        //this.textCard = new mse.TextCard(this, param, null);
        //this.addObject(this.textCard);
    },
    addExplication: function(title, text) {
        this.textCard.append('<h1>'+title+'</h1><h5>'+text+'</h5>');
        //this.addTextCard();
        //this.textCard.addSection(title, text);
    },
    addLink: function(title, link) {
        this.textCard.append('<h1>'+title+'</h1><a href="'+link+'" target="_blank">'+link+'</a>');
        //if(!this.textCard) this.addTextCard();
        //this.textCard.addLink(title, link);
    },
    dragStart: function(e){
        for(var i = this.objList.length-1; i >= 0; i--) {
            var card = this.objList[i];
            var pt = card.ptRotate(e.offsetX, e.offsetY);
            if(card.inObj(pt[0], pt[1])) {
                e.offsetX = pt[0];
                e.offsetY = pt[1];
                if( !card.dispatcher.dispatch('click', e) )
                    this.currCard = card;
                return;
            }
        }
        this.hide();
    },
    dragMove: function(e){
        if(!this.currCard) return;
        var dx = e.listX[e.listX.length-1] - e.listX[e.listX.length-2];
        var dy = e.listY[e.listY.length-1] - e.listY[e.listY.length-2];
        this.currCard.move(dx, dy);
    },
    dragEnd: function(e){
        this.currCard = null;
    }
});




// Video element
mse.Video = function(parent, param, srcs) {
	// Super constructor
	mse.UIObject.call(this, parent, param);
	this.srcs = srcs;
	
	this.addListener('click', new mse.Callback(this.launch, this), true);
};
extend( mse.Video , mse.UIObject );
$.extend( mse.Video.prototype , { 
	launch : function() {
	    mse.root.video.load(srcs);
	    mse.root.video.addClass('video_active');
	},
	
	draw : function(ctx) {
	    ctx.save();
	    ctx.fillStyle = "#000";
	    ctx.strokeStyle = "#FFF";
	    ctx.lineWidth = 4;
	    ctx.translate(this.getX(), this.getY());
	    ctx.strokeRoundRect(0, 0, this.width, this.height, 5);
	    ctx.fillRoundRect(0, 0, this.width, this.height, 5);
	    ctx.beginPath();
	    ctx.moveTo(this.width/2-25, this.height/2-20);
	    ctx.lineTo(this.width/2+25, this.height/2);
	    ctx.lineTo(this.width/2-25, this.height/2+20);
	    ctx.lineTo(this.width/2-25, this.height/2-20);
	    ctx.fillStyle = "#FFF";
	    ctx.fill();
	    ctx.restore();
	    
	    this.evtDeleg.eventNotif("drawover", {'ctx': ctx});
	}
});



// Comment object
mse.Comment = function(target, comment) {
    if(!(target instanceof mse.UIObject)) {
        console.error('Comment creation error: target is not a UIObject');
        return;
    }
    
    mse.UIObject.call(this);
    
    this.target = null;
    this.comments = new Array();
    this.offx = 0;
    this.offy = 0;
    this.width = 0;
    this.height = 0;
    //this.drawCB = new mse.Callback(this.draw, this);
    this.clickCB = new mse.Callback(this.click, this);
    
    if(comment) this.addComment(comment);
    
    this.attachTo(target);
    
    if(!this.inited) {
        this.singletonInit();
    }
};
extend(mse.Comment, mse.UIObject);
$.extend(mse.Comment.prototype, {
    inited: false,
    singletonInit: function() {
        var path = "./UI/";
        if(config.publishMode == "release") path = "assets/img/season13/story/";
        // Add tag image source
        mse.src.addSource('tag_single', path+'tag_single.png', 'img', true);
        mse.src.addSource('tag_multi', path+'tag_multi.png', 'img', true);
    
        mse.Comment.prototype.inited = true;
    },
    addComment: function(comment) {
        if(comment.content != null && comment.image != null && comment.date != null) this.comments.push(comment);
        return {x: this.target.getX()+this.offx, y:this.target.getY()+this.offy};
    },
    getTagBox: function(target) {
        var offx, offy, w, h;
        if(target instanceof mse.Text) {
            offx = target.width;
            offy = 0;
            h = target.height;
            w = h * 30/43;
        }
        else if(target instanceof mse.Image) {
            offx = target.width - 45;
            offy = target.height - 30;
            h = 43;
            w = 30;
        }
        else if(target instanceof mse.GameExpose) {
            offx = target.width;
            offy = 0;
            h = 43;
            w = 30;
        }
        else {
            offx = target.width - 45;
            offy = 10;
            h = 43;
            w = 30;
        }
        return [offx, offy, w, h];
    },
    attachTo: function(target) {
        if(!(target instanceof mse.UIObject)) return;
        
        // Set target
        this.target = target;
        if(target instanceof mse.BaseContainer){
            var layer, maxZid, i, layerI;
            layer = target.getLayer('inner_comment');
            if(layer){
                layer.addObject(this);
            }
            else {
                maxZid = 0;
                for(i = 0; i < target._layers.length; i++){
                    layerI = target._layers[i];
                    if (layerI.zid > maxZid) maxZid = layerI.zid;
                }
                layer = new mse.Layer(target, maxZid+1, {size:[mse.root.width,mse.root.height]});
                layer.addObject(this);
                target.addLayer('inner_comment', layer);
            }
            this.parent = layer;
        }
        else if(target.parent instanceof mse.ArticleLayer){
            var articleLayer = target.parent;
            articleLayer.addUnhiddableObject(this);
            this.parent = articleLayer;
        }
        
        // Remove old draw listener
        if(this.target) {
            //this.target.evtDeleg.removeListener('drawover', this.drawCB);
            this.evtDeleg.removeListener('click', this.clickCB);
        }
        // Add new draw listener to new target
        //target.evtDeleg.addListener('drawover', this.drawCB);
        this.evtDeleg.addListener('click', this.clickCB, true);
        // Set target
        this.target = target;
        
        // Additional setup for different target
        var box = this.getTagBox(target);
        this.dx = box[0];
        this.dy = box[1];
        this.width = box[2];
        this.height = box[3];
        this.offx = target.offx + this.dx;
        this.offy = target.offy + this.dy;
    },
    draw: function(ctx) {
        if(this.comments.length == 1) 
            ctx.drawImage(mse.src.getSrc('tag_single'), this.getX(), this.getY(), this.w, this.h);
        else if(this.comments.length > 1) 
            ctx.drawImage(mse.src.getSrc('tag_multi'), this.getX(), this.getY(), this.w, this.h);
    },
    click: function(e) {/* show or close comment  on click*/ },
    showComments: function(){   },
    closeComments: function(){   }    
});



/*           ImageShower
*  display the target img in fullscreen
*  Usage : call the show method to an event
*  See mse.Image.prototype.init() 
*  & mse.ImageCard.init() (association with an icon)
*/ 
mse.ImageShower = function(){
    if(mse.ImageShower.getInstance()) return mse.ImageShower.getInstance(); // its a singleton classe
    this.target = false;
    this.container = $('#imgShower');
    this.img = $('#imgShower #theImage');
    this.imgContainer = $('#imgShower div');
    this.closeButton = $('#imgShower #closeBn');
    
    this.img.click(function(e){e.preventDefault();e.stopPropagation();});
    
    
    
    if(MseConfig.mobile && this.container.length > 0){
        // remove close button
        this.closeButton.remove();
        this.imgContainer.css('overflow','hidden');
        // add touch event listener
        this.imgContainer.mseInteraction();
        this.imgContainer.mseInteraction('addListener', 'scale', new Callback(this.scale, this));
        this.img.mseInteraction();
        this.img.mseInteraction('addListener', 'translate', new Callback(this.move, this));
    }
    
    var instance = this;
    mse.ImageShower.getInstance = function(){return instance;};
};
mse.ImageShower.getInstance = function(){return false;};
mse.ImageShower.prototype = {
    maxScale: 3,
    minScale: 1,
    setTarget: function(target){
        if(!(target instanceof mse.Image) && !(target instanceof mse.ImageCard)) {
            console.error('The target obj is not an instance of mse.Image or mse.ImageCard');
            return;
        }
        this.target = target;
        this.imgUrl = mse.src.getSrc(this.target.img).getAttribute('src');
        this.img.prop('src', this.imgUrl);
        return this;
    }, 
    getOriginalPos: function(){
        if(!this.target) return;
        var pos = {};
        if(this.target instanceof mse.Image){ // Illu
            pos.x = mse.root.jqObj.position().left + this.target.getX();
            pos.y = mse.root.jqObj.position().top + this.target.getY();
            pos.w = this.target.getWidth();
            pos.h = this.target.getHeight();
            pos.angle = 'rotate(0deg)';
        }
        else { // Wiki
            pos.x = mse.root.jqObj.position().left + this.target.getX() + this.target.ix;
            pos.y = mse.root.jqObj.position().top + this.target.getY() + this.target.iy;
            pos.w = this.target.iw;
            pos.h = this.target.ih;
            pos.angle = 'rotate('+this.target.angle+'deg)';            
        }
        return pos;
    },
    show: function(target){
        this.setTarget(target);
        if(!this.target) return;
        this.container.unbind('click');
        this.closeButton.unbind('click');
        this.container.click({showerObj: this}, this.close);
        this.closeButton.click({showerObj: this}, this.close);
        var pos = this.getOriginalPos();
        this.img.css({
            'left': '0px',
            'top': '0px',
            'height' : '100%',
            'width'  : '100%'
        });
        this.imgContainer.css({
            'width'  : pos.w+'px',
            'height' : pos.h+'px',
            'top'    : pos.y+'px',
            'left'   : pos.x+'px'
        });
        
        if (MseConfig.pageHeight < MseConfig.pageWidth) { // normal screen
            var ratio =  pos.w/pos.h;
            var finalH = 0.8 * MseConfig.pageHeight;
            var finalW = finalH * ratio;
            var imgX = mse.root.width/2 - finalW/2;
        }
        else { // smartphone screen
            var ratio =  pos.h/pos.w;
            var finalW = 0.8 *  MseConfig.pageWidth;
            var finalH = finalW * ratio;
            var imgX = MseConfig.pageWidth/2 - finalW/2;
        }
        
        this.imgContainer.data('originPos',{h: finalH, 
                                            w: finalW,
                                            x:this.imgContainer.position().left,
                                            y:this.imgContainer.position().top,
                                            scale:1});
             
        this.imgContainer.animate({ // animate image size to 80% of window size
            'height'    : finalH+'px',
            'width'     : finalW+'px',
            'top'       : '0px',
            'left'      : imgX + 'px'
        });
        this.container.fadeIn(500);
        
        var parent = this.target.parent;
        if (parent.interrupt)
            parent.interrupt();
    },
    close: function(e){
        // close the image on click in div
        // no close on click in image
        e.preventDefault();
        var obj = mse.ImageShower.getInstance();
        var pos = obj.getOriginalPos();
        obj.container.children('div').animate({
            'height' : pos.h+'px',
            'width'  : pos.w+'px',
            'top'    : pos.y+'px',
            'left'   : pos.x+'px'
        });
        obj.container.fadeOut(500, function(){
            var parent = obj.target.parent;
            if(parent.play)
                parent.play();
        });
    },
    scale: function(e){
        var max = this.imgContainer.width() * this.maxScale,
            min = this.imgContainer.width() * this.minScale,
            pos = this.imgContainer.data('originPos'),
            s = e.scale;
        
        if (s * pos.w >= max ||
            s * pos.w <= min)
                return;
        
        if(e.type == 'scaleEnd'){
            pos.w = this.img.width();
            pos.h = this.img.height();
            return;
        }        
        
        var currPos = this.img.position(),    
            cw = this.imgContainer.width(),
            ch = this.imgContainer.height(),
            iw = pos.w * s,
            ih = pos.h * s,
            x = currPos.left - (iw-this.img.width())/2,
            y = currPos.top - (ih-this.img.height())/2;
        
        if (x > 0) x = 0;
        else if (x < cw - iw) x = cw - iw;
        if (y > 0) y = 0;
        else if (y < ch - ih) y = ch - ih;
        
        this.img.css({ width: iw+'px',
                       height: ih+'px',
                       top: y+'px',
                       left: x+'px' });
                       
        
    },
    move: function(e){
        var iw = this.img.width(),
            ih = this.img.height(),
            cw = this.imgContainer.width(),
            ch = this.imgContainer.height(),
            posImg = this.img.position(),
            x = posImg.left + e.dx,
            y = posImg.top + e.dy;
            
        if(x > 0) x = 0;
        if(x < cw - iw) x = cw - iw;
        if(y > 0) y = 0;
        if(y < ch - ih) y = ch - ih;
        this.img.css({top: y+'px', left: x+'px'});
    }
};


// Time line
// It can be either interval fixed "interval" or interval no fixed define by a list of timestamp progressive "timeprog"
mse.Timeline = function(src, interval, timeprog, length) {
	if(!src.initTimeline || !src.runTimeline)
		return null;
	// Parameters
	this.src = src;
	if(interval > 0) {
		this.tsFixed = true;
		this.interval = 33;
		this.length = length != null ? length : 0;
	}
	else {
		if(!timeprog instanceof Array) return null;
		this.tsFixed = false;
		this.timeprog = timeprog;
		this.length = timeprog.length;
	}
	this.src.initTimeline(this);
	// For reduce the fps to 30
	this.switching = false;
	this.currTimestamp = 0;
	this.currIndex = 0;
	this.end = false;
	this.inPause = true;
	this.timer = null;
};
mse.Timeline.prototype = {
	constructor : mse.Timeline ,
	frameFn : function() {
	    mse.currTimeline.run();
	},
	start : function() {
		if(this.end || this.inPause) {
			// Parameters
			this.currTimestamp = 0;
			this.currIndex = 0;
			this.end = false;
			this.inPause = false;
		
			// First run
			this.src.runTimeline();
		
			// Start timer
			mse.currTimeline = this;
			if(this.tsFixed)
				this.timer = requestAnimationFrame(this.frameFn);
			else this.timer = setTimeout(this.frameFn, this.timeprog[this.currIndex]);
		}
	},
	run : function() {
		if(this.end) {
			if(this.tsFixed)
				clearInterval(this.timer);
			else cancelAnimationFrame(this.timer);
			return;
		}
		if(this.inPause)
			return;
			
		this.currTimestamp += this.tsFixed ? this.interval : this.timeprog[this.currIndex];
		this.currIndex++;
		// Not End
		if(this.length == 0 || this.currIndex < length) {	
			// Interval no fixed
			if(!this.tsFixed) {
				this.timer = setTimeout(this.frameFn, this.timeprog[this.currIndex]);
				this.src.runTimeline(this.timeprog[this.currIndex-1]);
			}
			else {
			    this.timer = requestAnimationFrame(this.frameFn);
			    if(MseConfig.iOS) {
			        if(this.switching) {
			            this.src.runTimeline(this.interval);
			        }
			        this.switching = !this.switching;
			    }
			    else this.src.runTimeline(this.interval);
			}
		}
		// END
		else {
			this.end = true;
		}
	},
	playpause : function() {
		if(this.end) return;
		this.inPause = !this.inPause;
		if(!this.inPause) {
			if(mse.currTimeline != this) mse.currTimeline = this;
			if(this.tsFixed) this.timer = requestAnimationFrame(this.frameFn);
			else this.timer = setTimeout(this.frameFn, 1200);
		}
	},
	play : function() {
		if(this.end) return;
		this.inPause = false;
		if(mse.currTimeline != this) mse.currTimeline = this;
		if(this.tsFixed) this.timer = requestAnimationFrame(this.frameFn);
		else this.timer = setTimeout(this.frameFn, 1200);
	},
	pause : function() {
		if(this.end) return;
		this.inPause = true;
	}
};


// Frame Animation
mse.FrameAnimation = function(sprite, seq, rep, delay){
	if(!seq instanceof Array || !sprite instanceof mse.Sprite) return null;
	
	this.sprite = sprite;
	this.seq = seq;
	this.rep = isNaN(rep) ? 1 : rep;
	this.delay = isNaN(delay) ? 0 : delay;
	this.active = false;
	this.evtDeleg = new mse.EventDelegateSystem();
};
mse.FrameAnimation.prototype = {
    constructor: mse.FrameAnimation,
    start: function() {
    	this.currFr = 0;
    	this.currRep = 1;
    	this.delayCount = this.delay;
    	this.active = true;
    	this.evtDeleg.eventNotif('start');
    	for(var i in mse.root.animations)
    		if(mse.root.animations[i] == this) return;
        mse.root.animations.push(this);
        this.sprite.setFrame(this.seq[this.currFr]);
    },
    stop: function() {
    	this.currFr = 0;
    	this.currRep = 0;
    	this.active = false;
    	this.evtDeleg.eventNotif('end');
    },
    logic: function(delta) {
    	if (!this.active) return false;
    	
    	if (this.currFr < this.seq.length) {
    		if (this.delay != 0) {
    			if (this.delayCount == 0) {
    				this.currFr++;
    				this.delayCount = this.delay;
    			}
    			this.delayCount--;
    		}
    		else this.currFr++;
    	}
    	if(this.currFr >= this.seq.length) {
    		if (this.currRep < this.rep || this.rep == 0) {
    			this.currRep++;
    			this.currFr = 0;
    		}
    		else {
    			this.active = false;
    			this.evtDeleg.eventNotif('end');
    			return true;
    		}
    	}
    	this.sprite.setFrame(this.seq[this.currFr]);
    	return false;
    }
};




// Key Frame Animation
mse.KeyFrameAnimation = function(elem, keyFrameMap, repeat) {
	if(!elem instanceof mse.UIObject) {mseLog('Type Error', 'Element isn\'t a Mse UI Element');return null;}
	// No time stamp defined
	if( !keyFrameMap || !keyFrameMap['frame'] ) {mseLog('Parameter Error','No frame stamp defined');return null;}
	// Length error
	for(var key in keyFrameMap) {
		if(keyFrameMap[key].length != keyFrameMap['frame'].length)
		{mseLog('Parameter Error','KeyFrame length not compatible with the frame stamp');return null;}
	}
	this.length = keyFrameMap['frame'].length;
	if(this.length < 2) {mseLog('Length Error','KeyFrame Length must be larger than 2');return null;}
	// First frame stamp isn't 0
	if(keyFrameMap['frame'][0] != 0) {mseLog('Error','Frame start point is not 0');return null;}
	
	this.duration = keyFrameMap['frame'][this.length-1];
	
	this.element = elem;
	this.repeat = (repeat == null) ? 1 : repeat;
	this.map = keyFrameMap;
	
	this.resetAnimation();
	this.evtDeleg = new mse.EventDelegateSystem();
	
	if(this.map['opacity']) // Avoid the bug of opacity in javacript
		this.element.globalAlpha = this.map['opacity'][0]==0 ? 0.01 : this.map['opacity'][0];
};
mse.KeyFrameAnimation.prototype = {
    construction: mse.KeyFrameAnimation,
    setNoTransition: function() {
    	this.notransition = true;
    },
    resetAnimation: function() {
    	this.currId = -1;
    	this.currFr = 0;
    	this.nextKf = this.map['frame'][0];
    	this.currRp = 1;
    },
    start: function() {
    	for(var i in mse.root.animations)
    		if(mse.root.animations[i] == this) return;
    	mse.root.animations.push(this);
    },
    isEnd: function() {
        if(this.currFr > this.duration && this.currRp == this.repeat) return true;
        else return false;
    },
    
    logic: function(delta) {
    	if(this.currFr <= this.duration) {
    		// Passed a timestamp, move to next
    		if(this.currFr == this.nextKf) {
    			// Update states
    			this.currId++;
    			this.nextKf = this.map['frame'][this.currId+1];
    			
    			for( var key in this.map ) {
    			    var curr = this.map[key][this.currId];
    				switch(key) {
    				case 'frame': continue; // Ignore timestamps
    				case 'pos':
    					this.element.setPos(curr[0], curr[1]);break;
    				case 'size':
    					this.element.setSize(curr[0], curr[1]);break;
    				case 'opacity':
    					this.element.globalAlpha = curr;break;
    				case 'fontSize':
    					var size = curr;
    					var s = checkFontSize(this.element.font);
    					this.element.font=this.element.font.replace(s,size.toString());
    					break;
    				case 'scale':
    					this.element.scale = curr;break;
    				case 'spriteSeq':
    				    this.element.setFrame(curr);break;
    				}
    			}
    		}
    		// No transition calculated between the frames
    		else if(!this.notransition){
    			// Play the transition between currFr and nextKf
    			var ratio = (this.currFr - this.map['frame'][this.currId]) / (this.nextKf - this.map['frame'][this.currId]);
    			// Iterate in attributes for animation
    			for( var key in this.map ) {
    			    var curr = this.map[key][this.currId];
    			    var next = this.map[key][this.currId+1];
    				switch(key) {
    				case 'frame': case 'spriteSeq': continue; // Ignore timestamps and sprite sequences
    				case 'pos':
    				    var trans = curr[2] ? (this.calTrans[curr[2]] ? curr[2] : 2) : 2;
    					var x = Math.floor(this.calTrans[trans](ratio, curr[0], next[0])*2)/2;
    					var y = Math.floor(this.calTrans[trans](ratio, curr[1], next[1])*2)/2;
    					this.element.setPos(x, y);break;
    				case 'size':
    				    var trans = curr[2] ? (this.calTrans[curr[2]] ? curr[2] : 2) : 2;
    					var w = this.calTrans[trans](ratio, curr[0], next[0]);
    					var h = this.calTrans[trans](ratio, curr[1], next[1]);
    					this.element.setSize(w, h);break;
    				case 'opacity':
    				    var trans = curr[1] ? (this.calTrans[curr[1]] ? curr[1] : 2) : 2;
    					this.element.globalAlpha = this.calTrans[trans](ratio, (curr[0]?curr[0]:curr), (next[0]?next[0]:next));
    					break;
    				case 'fontSize': 
    				    var trans = curr[1] ? (this.calTrans[curr[1]] ? curr[1] : 2) : 2;
    					var size = Math.floor(this.calTrans[trans](ratio, (curr[0]?curr[0]:curr), (next[0]?next[0]:next)));
    					var s = checkFontSize(this.element.font);
    					this.element.font=this.element.font.replace(s,size.toString());
    					break;
    				case 'scale':
    				    var trans = curr[1] ? (this.calTrans[curr[1]] ? curr[1] : 2) : 2;
    					this.element.scale = this.calTrans[trans](ratio, (curr[0]?curr[0]:curr), (next[0]?next[0]:next));
    					break;
    				}
    			}
    		}
    		// Time increase
    		this.currFr++;
    	}
    	// Repeat or not
    	else if( this.repeat === 0 || this.currRp < this.repeat ) {
    		this.currRp++;
    		// Reset all states
    		this.currId = 0;
    		this.currFr = 0;
    		this.nextKf = this.map['frame'][1];
    	}
    	// Stop
    	else {
    		this.evtDeleg.eventNotif('end');
    		return true;
    	}
    	return false;
    },
    
    calTrans: {
        // No transition
        1:function(ratio, prevState, nextState) {
            return prevState;
        },
        // Float interpolation
    	2:function(ratio, prevState, nextState) {
    		return prevState + ratio * (nextState-prevState);
    	}
    }
};


mse.Animation = function(duration, repeat, statiq, container, param){
    this.statiq = statiq ? true : false;
    // Super constructor
    if(this.statiq) mse.UIObject.call(this, null, param?param:{});
	else mse.UIObject.call(this, container, param?param:{});
	this.objs = {};
	this.animes = [];
	this.duration = duration;
	this.repeat = repeat;
	this.state = 0;
	this.startCb = new mse.Callback(this.start, this);
	this.block = false;
	this.firstShow = false;
};
extend(mse.Animation, mse.UIObject);
$.extend(mse.Animation.prototype, {
    addObj: function(name, obj){
        if(obj instanceof mse.UIObject){
            this.objs[name] = obj;
            if(this.statiq) obj.parent = this;
        }
    },
    getObj: function(name){
        return this.objs[name];
    },
    addAnimation: function(objname, keyFrameMap, notransition){
        if(!this.objs[objname]) return;
        var anime = new mse.KeyFrameAnimation(this.objs[objname], keyFrameMap, this.repeat);
        if(anime) {
            if(notransition) anime.setNoTransition();
            this.animes.push(anime);
        }
    },
    start: function(){
        this.state = 1;
        if(this.statiq && $.inArray(this, mse.root.animes) == -1) {
            for(var i in this.animes)
                this.animes[i].resetAnimation();
            mse.root.animes.push(this);
        }
        else if(!this.statiq && $.inArray(this, mse.root.animations) == -1) {
            for(var i in this.animes)
                this.animes[i].resetAnimation();
            mse.root.animations.push(this);
        }
        this.evtDeleg.eventNotif('start');
    },
    pause: function(){
        this.state = 0;
    },
    logic: function(delta){
        if(!this.firstShow) {
            this.firstShow = true;
            this.evtDeleg.eventNotif('firstShow');
        }
    
        if(this.state == 1){
            for(var i in this.animes)
        	    this.animes[i].logic(delta);
        	    
        	for(var i in this.animes){
        	    if(!this.animes[i].isEnd())
        	        return false;
        	}
        	this.state = 2;
        	return false;
        }
        else if(this.state == 2) {
            this.evtDeleg.eventNotif('end');
            return true;
        }
    },
    draw: function(ctx){
        for(var key in this.objs)
            this.objs[key].draw(ctx);
    }
});



})(window, $);

// System of script
(function (mse, $) {

	var defaultEvents = ['click', 'doubleClick', 'longPress', 'move', 'swipe', 'gestureStart', 'gestureUpdate', 'gestureEnd', 'gestureSingle', 'keydown', 'keypress', 'keyup', 'scroll', 'swipeleft', 'swiperight'];
	
	mse.Script = function(cds) {
		if(!cds) return;
		this.scripts = [];
		this.states = {};
		this.expects = {};
		this.success = {};
		
		// Initialize script
		for(var i in cds) {
			var id = "c"+i;
			this.states[id] = cds[i].initial ? cds[i].expect : "";
			this.expects[id] = cds[i].expect ? cds[i].expect : "everytime";
			this.success[id] = false;
			var src = cds[i].src;
			src.addListener(cds[i].type, new mse.Callback(this.conditionChanged, this, [id]), false);
		}
	};
	mse.Script.prototype = {
	    constructor: mse.Script,
	    invoke: function() {
	        for(var i in this.scripts) {
//			    if(this.scripts[i].delay) setTimeout(this.scripts[i].delay, );
				if(typeof(this.scripts[i].script) == 'function') this.scripts[i].script.call(this);
				else this.scripts[i].script.invoke();
	        }
		},
		checkConditions: function() {
			for(var i in this.success)
				if(!this.success[i]) return;
				
			this.invoke();
		},
		conditionChanged: function(id, state) {
			if(this.expects[id] == "everytime" || (this.expects[id]== "once" && this.states[id] != "triggered")) {
				this.success[id] = true;
				this.checkConditions();
			}
			this.states[id] = (typeof(state)=="string" ? state : "triggered");
		},
		register: function(script, delay) {
		    if((script.invoke instanceof mse.Callback) || typeof(script) == 'function') {
		        this.scripts.push({'script':script, 'delay':delay?delay:0});
		    }
		}
	};


})(mse, $);




// System of 2D coordinates
(function (window, mse) {


    mse.Point2 = function(x, y) {
        this.x = x;
        this.y = y;
    }
    
    window.crePoint2 = function(x,y) {
        return new mse.Point2(x,y);
    }


})(window, mse);


// Language System for game
(function (window, mse) {

    mse.LanguageRessource = function( defaultLang ){
        if(!defaultLang) defaultLang = 'anglais';
        this.defaultLang = defaultLang;
        this.currentLang = defaultLang;
        
        this.content = {};
    };
    mse.LanguageRessource.prototype = {
        addElem: function(id, ressources){
            // ressources = {langue1: contentLn1, langue2:contentLn2}
            // type of content are choosed by the user
            this.content[id] = ressources;
            if(!ressources[this.defaultLang]) {
                for(var i in ressources) break; // just get an existing langue in ressources
                this.content[id][this.defaultLang] = ressources[i];
                
                console.error('translation missing in "'+this.defaultLang+ '" for "'+id+'" replaced by translation in "'+i+'"');
            }
        },
        getElem: function(id){
            if(this.content[id][this.currentLang])
                return this.content[id][this.currentLang];
                
            else if(this.content[id][this.defaultLang])
                return this.content[id][this.defaultLang];
                
            else // just a protection, normally never call
                console.error( 'no translation for "'+id+'" in languages : '+this.currentLang+' or '+this.defaultLang );
        },
        setCurrentLang: function(lang){
            if(typeof lang == 'string')
                this.currentLang = lang;
        },
        getAllLangFor: function(id){
            return this.content[id] || null;
        }
    };

})(window, mse);