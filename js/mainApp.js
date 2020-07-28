/**
 * Author: Belousov Alexandr
 */
var __AppPanel={
	lastEv:0,
	run:false,
	scroll:0,
	target:{},
	_getFromPoint:function(x,y){
		__Element.hideWrapper();
		var target=document.elementFromPoint(x,y);
		__Element.showWrapper();
		return target;
	},
	apply:function(target){

		this.stop();
		this.dellIcon();
		Modification.do(target);
		ButtonPanel.add();
		__BgCmd.sendCmd('apply',{selector: Selector.getSelector(target)});
	},
	blockEvent:function(e){
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
	},
	cancel:function(){
		__BgCmd.sendCmd('cancel',{});
		Modification.cancel();
		ButtonPanel.remove();
	},
	dellIcon:function(){
		Observer.disconnectDomChange();
		__Icons.delAllIcon();
	},
	responseSelectors:function(){
		__BgCmd.sendCmd('getItems','',function(response){});
	},
	saveSelector:function(newSelector){
		__BgCmd.sendCmd('saveSelector',{prop:{name:'css',value:newSelector}});
	},
	start:function(){
		if(!this.run){
			this.run=!this.run;
			this.dellIcon();
			__Element.addWrapper();
			document.addEventListener("mousedown",__AppPanel.blockEvent,true);
			document.addEventListener("mouseup",__AppPanel.blockEvent,true);
			document.addEventListener("mousemove",__AppPanel.mouseMove,true);
			document.addEventListener("mouseover",__AppPanel.mouseOver,true);
			document.addEventListener("mousewheel",__AppPanel.mouseScroll,true);
			document.addEventListener("click",__AppPanel.mouseClick,true);
			document.addEventListener("keydown",__AppPanel.keyPress,true);
		}
	},
	stop:function(){
		if(this.run){
			this.run=!this.run;
			this.responseSelectors();
			__Element.delWrapper();
			__Element.reset();
			document.removeEventListener("mousedown",__AppPanel.blockEvent,true);
			document.removeEventListener("mouseup",__AppPanel.blockEvent,true);
			document.removeEventListener("mousemove",__AppPanel.mouseMove,true);
			document.removeEventListener("mouseover",__AppPanel.mouseOver,true);
			document.removeEventListener("mousewheel",__AppPanel.mouseScroll,true);
			document.removeEventListener("click",__AppPanel.mouseClick,true);
			document.removeEventListener("keydown",__AppPanel.keyPress,true);
		}
	},
	mouseOver:function(e){
		this.blockEvent(e);
		if(e.target && e.target!==document){
			var tagName=e.target.tagName.toUpperCase() || undefined;
			switch(tagName){
				case 'VIDEO':
				case 'EMBED':
				case 'OBJECT':
				case 'IFRAME':
				case 'SVG':
					__Element.set(e.target);
           			this.scroll=0;
           			break;
           		case 'G':
           		case 'PATH':
           		case 'RECT':
           			__Element.set(e.target.parentNode);
           			this.scroll=0;
           			break;
			}
		}
	},
	mouseClick:function(e){
		this.blockEvent(e);
		if(__Element.prototype){ __AppPanel.apply(__Element.prototype);}
		this.stop();	
	},
	mouseScroll:function(e){
		this.blockEvent(e);
		e.wheelDelta>0?this.scroll++:this.scroll--;
		var i=0, target=this.target;
		while (this.scroll!=i){
			if(this.scroll>0 && target.parentNode.tagName!=='BODY'){
					target=target.parentNode;
					i++;
			}else{
				target=this._getFromPoint(e.clientX,e.clientY);
				i=this.scroll=0;
			}
		}
		__Element.set(target);
	},
	mouseMove:function(e){
		this.blockEvent(e);
		if((e.timeStamp-this.lastEv)<30) {return true;}

		this.lastEv=e.timeStamp;
		var target=e.target;
		if(target.id=="__panelWrapper"){
			__Element.hideWrapper();
			target=document.elementFromPoint(e.clientX,e.clientY);
			if('elementsFromPoint' in document){
				//Chrome 43
				document.elementsFromPoint(e.clientX,e.clientY).forEach(function(element) {
					switch(element.tagName.toUpperCase()){
						case 'VIDEO':
						case 'EMBED':
						case 'OBJECT':
					//	case 'IFRAME':
						case 'SVG':
							target=element;
							break;
					}
				}, this);	
			}
			__Element.showWrapper();
		}

		if(target===this.target || target == document) {return true;}
		
		this.target=target;

		if (this.target && 
			this.target.tagName !=="BODY"){
           		__Element.set(this.target);
           		this.scroll=0;
    	}
	},
	keyPress:function(e){
		switch(e.keyCode){
			case 27:
				__AppPanel.stop();
				break;
		}
	}
};
__AppPanel.blockEvent=__AppPanel.blockEvent.bind(__AppPanel);
__AppPanel.mouseOver=__AppPanel.mouseOver.bind(__AppPanel);
__AppPanel.mouseMove=__AppPanel.mouseMove.bind(__AppPanel);
__AppPanel.mouseClick=__AppPanel.mouseClick.bind(__AppPanel);
__AppPanel.mouseScroll=__AppPanel.mouseScroll.bind(__AppPanel);
var __onLoad=function(){
	__AppPanel.responseSelectors();
	Bookmarks.domChange();
};

Bookmarks.getHash();
window.addEventListener("DOMContentLoaded",__onLoad);