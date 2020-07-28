/**
 * Author: Belousov Alexandr
 */
var CssControl={
	class:{
		com:'__sepWin'
	},
	css:{},
	name:{
		preview:'css/preview.css',
		window:'css/window.css',
		video:'css/video.css'
	},
	setComClass:function(target){
		target.classList.add(this.class.com);
	},
	isComClass:function(target){
		return target.classList.contains(this.class.com);
	},
	insert:function(name){
		if(!this.name.hasOwnProperty(name) || this.css.hasOwnProperty(name)) return 0;
		this.css[name]=document.createElement('link');
		this.css[name].rel='stylesheet';
		this.css[name].type='text/css';
		this.css[name].href=chrome.extension.getURL(this.name[name]);
		document.head.appendChild(this.css[name]);
	},
	remove:function(name){
		if(this.css.hasOwnProperty(name)){
			document.head.removeChild(this.css[name]);
			this.css[name]=undefined;
			delete this.css[name];	
		}
	}
};

var Observer={
	serverDOM:undefined,
	type:[],
	elems:[],
	servers:[],
	timer:undefined,
	config:{
		attributes:true,
		attributesFilter:['class'],
		attributesOldValue:true
	},
	configDOM:{
		attributes:false,
		characterData:false,
		childList:true,
		subtree:true
	},
	domChange:function(){
		if(!this.serverDOM){
			this.serverDOM=new MutationObserver(this.onChangeDOM.bind(Observer));
			this.serverDOM.observe(document.body,this.configDOM);	
		}
	},
	init:function(elem,type){
		if(this.elems.indexOf(elem)!==-1) return;
		this.elems.push(elem);
		this.type.push(type);
		var server=new MutationObserver(this.onChanges.bind(Observer));
		var index=this.servers.push(server)-1;
		this.servers[index].observe(elem,this.config);
	},
	onChanges:function(listItems){
		var elem,index,type;
		for(var i=0,len=listItems.length;i<len;++i){
			elem=listItems[i].target;
			index=this.elems.indexOf(elem);
			type=this.type[index];
			
			if(!elem.classList.contains(type)){
				elem.classList.add(type);
			}
			if(type=='__target' && VideoControls.isPresent){
				VideoControls.observerUpdate();
			}
		}
	},
	onChangeDOM:function(){
		if(__Element.isPreview) return;
		if(this.timer){clearTimeout(this.timer);}
		this.timer=setTimeout(
			function(){
				__Icons.findElement();
				Bookmarks.domChange();
			}.bind(this),
		350);
	},
	disconnectDomChange:function(){
		if(this.serverDOM){
			clearTimeout(this.timer);
			this.serverDOM.disconnect();
			this.serverDOM=undefined;	
		}
	},
	disconnect:function(elem){
		var index=this.elems.indexOf(elem);
		if(index>-1){
			this.servers[index].disconnect();
			this.servers.splice(index,1);
			this.elems.splice(index,1);
			this.type.splice(index,1);
		}
	},
	clearServers:function(){
		for(var i=this.servers.length-1;i>=0;--i){this.servers[i].disconnect();}
		this.servers=[];
		this.elems=[];
		this.type=[];
	}
};

var Selector={
	css:{ tag:'',
		  class:'',
		  attr:''
	},
	isVideo:false,
	_getTag:function(elem){
		this.css.tag=elem.tagName;
		this.css.tag=='VIDEO'?this.isVideo=true:this.isVideo=false;
	},
	_getClass:function(elem){
		var list=elem.classList;
		var ignoreClass=['__target','__parent','__onScroll','__zoomTarget','__targetVideo'];
		this.css.class='';
		for(var i=0,len=list.length;i<len;++i){
			if(i>3) break;
			if(ignoreClass.indexOf(list[i])==-1){
				this.css.class+='.'+list[i];
			}
		}
	},
	_isOneElement:function(){
		return document.querySelectorAll(this._formSelector(this.css)).length==1;
	},
	_getAttr:function(elem){
		var type=['name','role','type','id','width','height','align'];
		var attr=elem.attributes;
		var matches=0, val='';
		this.css.attr='';
		for(var i=0;i<type.length;++i){
			if(matches>1) break;
			if(attr.hasOwnProperty(type[i])){
				matches++;
				switch(type[i]){
					case 'id':
						val='[id]';
						break;
					default:
						val='['+type[i]+'="'+attr[type[i]].value+'"]';
				}
				this.css.attr+=val;
			}
		}
	},
	_formSelector:function(css){
		var selector='';
		var order=['tag','class','attr'];
		for(var i=0,len=order.length;i<len;++i){ selector+=css[order[i]];}
		return selector;
	},
	getSelector:function(elem){
		var selector='';
		var target=elem;
		if(target.nodeType==1){
			this._getTag(target);
			this._getClass(target);
			if(!this.isVideo || !this._isOneElement()){this._getAttr(target);}
			if(!this._isOneElement()){
				var css=this._formSelector(this.css);
				selector=this.getSelector(target.parentNode)+'>'+css;
			}else{
				selector=this._formSelector(this.css);	
			}
		}
		return selector;
	},
	getFirstVisibleElem:function(selector){
		var elems=document.querySelectorAll(selector);
		var elem=undefined;
		var size={};

		for(var i=0,len=elems.length;i<len;i++){
			size=elems[i].getBoundingClientRect();
			if (size.top>=0 && size.left>=0) {
				elem=elems[i];
				break;
			}
		}
		return elem;
	}
};

var Bookmarks={
	isBookmark:false,
	isPresent:false,
	anchor:'sepwin=',
	selector:'',
	start:'',
	getHash:function(){
		var hash=window.location.href;
		this.start=hash.indexOf(this.anchor);
		if(this.start!==-1){
			this.selector=decodeURI(hash.substring(this.start+this.anchor.length));
			this.delHash();
			if(this.selector){
				this.isPresent=true;
			}
		}
	},
	delHash:function(){
		var tmp=window.location.href;
		tmp=tmp.replace(tmp.substring(this.start-1),'');
		history.pushState("", document.title, tmp);
	},
	domChange:function(){
		if(this.isPresent){
			setTimeout(function(){
				Bookmarks.isPresent=false;
				Bookmarks.selector='';
			},5000);
			try{
				var elems=document.querySelectorAll(this.selector);	
			}catch(SYNTAX_ERR){
				console.log("Invalid selector:",this.selector);
				this.isPresent=false;
				this.selector='';
				elems=[];
			}
			if(elems.length>0){
				this.isPresent=false;
				__Element.getSize(elems[0]);
				__Element.switchOff();
				__AppPanel.apply(elems[0]);
			}
		}
	},
	checkBookmark:function(){
		__BgCmd.sendCmd('checkBookmark',{selector:encodeURI(Selector.getSelector(Modification.elem))});
	},
	addBookmark:function(){
		var selector=encodeURI(Selector.getSelector(Modification.elem));
		if(this.isBookmark){
			__BgCmd.sendCmd('delBookmark',{selector:selector});	
		}else{
			__BgCmd.sendCmd('addBookmark',{selector:selector});	
		}
	}
};