/**
 * Author: Belousov Alexandr
 */ 
var ButtonPanel={
	panel:{},
	id:{
		panel:'__btn_panel',
		btn_back:'__btn_back',
		btn_up:'__btn_up',
		btn_dwn:'__btn_dwn',
		btn_prsc:'__btn_prsc',
		btn_bkm:'__btn_bkm',
		btn_link:'__btn_link',
		area_link:'__area_link',
		win_link:'__win_link',
		win_link_over:'__win_link_overlay'
	},
	btn_dwn:{},
	btn_up:{},
	btn_prsc:{},
	btn_bkm:{},
	btn_link:{},
	win_link:{},
	isShowLink:false,
	_insertPanel:function(){
		CssControl.insert('window');
		this.panel=document.createElement('div');
		this.panel.innerHTML='<button id="'+this.id.btn_back+'" title="'+chrome.i18n.getMessage('PanelBack')+'"></button>\
							  <button id="'+this.id.btn_up+'" title="'+chrome.i18n.getMessage('PanelScrollUp')+'"></button>\
							  <button id="'+this.id.btn_dwn+'" title="'+chrome.i18n.getMessage('PanelScrollDown')+'"></button>\
							  <button id="'+this.id.btn_prsc+'" title="'+chrome.i18n.getMessage('PanelPrintScreen')+'"></button>\
							  <button id="'+this.id.btn_bkm+'" title="'+chrome.i18n.getMessage('PanelBookMarks')+'" class="bkm_off"></button>\
							  <button id="'+this.id.btn_link+'" title="'+chrome.i18n.getMessage('PanelGetLink')+'"></button>';
		this.panel.id=this.id.panel;
		CssControl.setComClass(this.panel);
		document.body.appendChild(this.panel);
		document.getElementById(this.id.btn_back).addEventListener('click',this.clickBack);
		this.btn_up=document.getElementById(this.id.btn_up);
		this.btn_up.addEventListener('click',this.clickUp);
		this.btn_dwn=document.getElementById(this.id.btn_dwn);
		this.btn_dwn.addEventListener('click',this.clickDown);
		this.btn_prsc=document.getElementById(this.id.btn_prsc);
		this.btn_prsc.addEventListener('click',this.clickPrtScr.bind(this));
		this.btn_bkm=document.getElementById(this.id.btn_bkm);
		this.btn_bkm.addEventListener('click',this.clickBkm);
		this.btn_link=document.getElementById(this.id.btn_link);
		this.btn_link.addEventListener('click',this.clickShowLink.bind(this));
		this.scrollDownEnabled(false);
		Bookmarks.checkBookmark();
	},
	add:function(){
		this._insertPanel();
	},
	remove:function(){
		CssControl.remove('window');
		document.body.removeChild(this.panel);
		if(this.isShowLink) {this.delWinLink();}
		this.btn_up={};
		this.btn_dwn={};
		this.panel={};
		this.btn_prsc={};
		this.btn_bkm={};
		this.btn_link={};
		this.win_link={};
	},
	clickBack:function(){
		__AppPanel.cancel();
	},
	clickUp:function(){
		Modification.scrollUp();
		Bookmarks.checkBookmark();
	},
	clickDown:function(){
		Modification.scrollDown();
		Bookmarks.checkBookmark();
	},
	clickPrtScr:function(){
		this.panel.style.display='none';
		VideoControls.hide();
		setTimeout(function(){
			__BgCmd.sendCmd('printScr',{name:window.location.hostname});
		}.bind(this),50);
		setTimeout(function(){
			this.panel.style.display='';
			VideoControls.show();
		}.bind(this),150);
	},
	clickBkm:function(){
		Bookmarks.addBookmark();
	},
	clickShowLink:function(){
		if(this.isShowLink){
			this.delWinLink();
		}else{
			this.showWinLink();
		}
	},
	delWinLink:function(){
		document.body.removeChild(this.win_link);
		this.isShowLink=false;
	},
	showWinLink:function(){
		var link=encodeURI(window.location.href+'#sepwin='+Selector.getSelector(Modification.elem));
		this.win_link=document.createElement('div');
		this.win_link.innerHTML='<div id="'+this.id.win_link+'"><div><textarea>'+link+'</textarea></div><button id="__btn_win_link">OK</button></div>';
		this.win_link.id=this.id.win_link_over;
		CssControl.setComClass(this.win_link);
		document.body.appendChild(this.win_link);
		document.getElementById('__btn_win_link').addEventListener('click',this.delWinLink.bind(this));
		this.isShowLink=true;
	},
	scrollUpEnabled:function(enabled){
		enabled?
			this.btn_up.classList.remove('disable'):
			this.btn_up.classList.add('disable');
	},
	scrollDownEnabled:function(enabled){
		enabled?
			this.btn_dwn.classList.remove('disable'):
			this.btn_dwn.classList.add('disable');
	},
	setBookmark:function(isBkm){
		if(isBkm){
			this.btn_bkm.className="btn_bkm_on";
		}else{
			this.btn_bkm.className="btn_bkm_off";
		}
	}
};

var Modification={
	elem:undefined,
	isSeparate:false,
	scrollBefore:{},
	scroll:0,
	selector:'',
	target:undefined,
	flags:{
		scrollUp:true,
		scrollDwn:false
	},
	_modifyFunc:function(){
		var func='Element.prototype["swRemCh"]=Element.prototype.removeChild;\
				  Element.prototype.removeChild=function(elem){\
					if(elem.classList && (elem.classList.contains("__parent") || elem.classList.contains("__target"))){\
						if(document.hasOwnProperty("swRemoval")){\
							if(document.swRemoval.indexOf(elem)==-1) document.swRemoval.push(elem);\
						}else{document["swRemoval"]=[];document.swRemoval.push(elem);}\
					}else{Element.prototype.swRemCh.apply(this,[elem]);}}';
		var fix=document.createElement('script');
		fix.appendChild(document.createTextNode(func));
		document.body.appendChild(fix);
		function remove(elem){
			document.body.removeChild(elem);
		}
		setTimeout(remove(fix),500);
	},
	_removeFunc:function(){
		var func='Element.prototype.removeChild=Element.prototype.swRemCh;\
				  if(document.hasOwnProperty("swRemoval")){\
				  	for(var i=0,len=document.swRemoval.length;i<len;i++){document.swRemoval[i].parentNode.removeChild(document.swRemoval[i]);};\
				  	delete document["swRemoval"];delete document["swRemCh"];}';
		var fix=document.createElement('script');
		fix.appendChild(document.createTextNode(func));
		document.body.appendChild(fix);
		function remove(elem){
			document.body.removeChild(elem);
		}
		setTimeout(remove(fix),500);
	},
	_modifyStyle:function(elem,style,isSet){
		if(CssControl.isComClass(elem)) return 0;
		if(isSet){
			if(!elem.classList.contains(style)){
				elem.classList.add(style);
				Observer.init(elem,style);		
			}
		}else{
			Observer.disconnect(elem);
			elem.classList.remove(style);
		}
	},
	_hideTextNode:function(elem,hide){
		if(hide){
			elem['oldValue']=elem.nodeValue;
			elem.nodeValue='';
		}else{
			elem.nodeValue=elem['oldValue'];
			delete elem['oldValue'];
		}
	},
	_modifyOne:function(elem,isSet){
		var parent=elem.parentNode;
		var childs=parent.childNodes;
		var child;
		for(var i=0,len=childs.length;i<len;++i){
			child=childs[i];
			if(child!==elem && child.tagName!=='SCRIPT' && child.tagName!=='LINK'){
				switch(child.nodeType){
					case 1:
						this._modifyStyle(child,'__hidden',isSet);
						break;
					case 3:
						this._hideTextNode(child,isSet);
						break;
				}
			}
		}
		this._modifyStyle(parent,'__parent',isSet);
	},
	_modifyTarget:function(target,isSet){
		isSet?
			VideoControls.init(target):
			VideoControls.remove();
		this._modifyStyle(target,'__target',isSet);
	},
	_modifyParents:function(elem,isSet){
		if(elem && elem.tagName!=='BODY'){
			this._modifyOne(elem,isSet);
			this._modifyParents(elem.parentNode,isSet);
		}
	},
	resizeWin:function(){
		var width=__Element.size.width,
			height=__Element.size.height;
		if(width==0) width=150;
		if(height==0) height=150;
		window.resizeTo(width,height);
	},
	_scroll:function(isSet){
		if(((this.elem.scrollHeight-document.documentElement.clientHeight)>50) && isSet){
			this.elem.classList.add('__onScroll');
		}else{
			this.elem.classList.remove('__onScroll');
		}
	},
	_unloadPage:function(e){ 
		__BgCmd.sendCmd('cancel',{});
	},
	do:function(target){
		this._modifyFunc();
		this.isSeparate=true;
		this.scrollBefore={
			top:document.body.scrollTop,
			left:document.body.scrollLeft
		};
		this.target=this.elem=target;
		window.addEventListener('unload',Modification._unloadPage);
		if(this.elem){
			try{
				this._modifyTarget(this.elem,true);
				this._modifyParents(this.elem,true);
			}catch(e){
				this.errorRestore();
				console.log(e);
			}
			this._scroll(true);
		}
	},
	cancel:function(){
		if(this.elem){
			try{
				this._modifyParents(this.elem,false);
				this._modifyTarget(this.elem,false);
			}catch(e){
				this.errorRestore();
				console.log(e);
			}
		}
		this._scroll(false);
		this._removeFunc();
		Observer.clearServers();
		document.body.scrollTop=this.scrollBefore.top;
		document.body.scrollLeft=this.scrollBefore.left;
		this.elem=undefined;
		this.isSeparate=false;
		this.scroll=0;
		window.removeEventListener('unload',Modification._unloadPage);
	},
	errorRestore:function(){
		var all=document.querySelectorAll('.__hidden,.__parent');
		this._modifyTarget(this.elem,false);
		for(var i=all.length-1;i>=0;--i){
			all[i].classList.remove('__hidden','__parent');
		}
	},
	scrollCheck:function(){
		if(this.elem.tagName=='BODY'){
			ButtonPanel.scrollUpEnabled(false);
		}else{
			ButtonPanel.scrollUpEnabled(true);
		}
		if(this.elem==this.target){
			ButtonPanel.scrollDownEnabled(false);
		}else{
			ButtonPanel.scrollDownEnabled(true);
		}
	},
	scrollUp:function(){
		if(this.elem.tagName=='BODY') return false;
		var i=0;
		var elem=this.target;
		this.scroll++;
		while(i<this.scroll){
			this._modifyOne(elem,false);
			elem=elem.parentNode;
			i++;
		}
		this._modifyTarget(this.elem,false);
		this._modifyTarget(elem,true);
		this.elem=elem;
		this.scrollCheck();
		__AppPanel.saveSelector(Selector.getSelector(this.elem));
		return true;
	},
	scrollDown:function(){
		if(this.scroll==0) return false;
		var i=0;
		var elem=this.target;
		this.scroll--;
		while(i<this.scroll){
			elem=elem.parentNode;
			i++;
		}
		this._modifyOne(elem,true);
		this._modifyTarget(this.elem,false);
		this._modifyTarget(elem,true);
		this.elem=elem;
		this.scrollCheck();
		__AppPanel.saveSelector(Selector.getSelector(this.elem));
		return true;
	}
};