/**
 * Author: Belousov Alexandr
 */
chrome.runtime.onMessage.addListener(
	function(request,sender,callback){
		if(request){ callback(__BgCmd.cmd(request.cmd,request.arg));		}
	}
);

var __BgCmd={
	cmd:function(cmd,arg){
		var resp=false;
		if(this.hasOwnProperty(cmd)){ resp=this[cmd](arg);}
		return resp;
	},
	setItems:function(arg){
		Observer.disconnectDomChange();
		__Icons.setSelectors(arg);
		Observer.domChange();
	},
	refreshIcon:function(){
		__Element.switchOff();
		__AppPanel.responseSelectors();
	},
	switchOn:function(arg){
		__Element.switchOn(Selector.getFirstVisibleElem(arg.css));
	},
	switchOff:function(){
		__Element.switchOff();
	},
	start:function(){
		__AppPanel.start();
		return true;
	},
	stop:function(){
		__AppPanel.stop();
		return true;
	},
	isRun:function(){
		return __AppPanel.run;
	},
	sendCmd:function(cmd,arg,callback){
		chrome.runtime.sendMessage({cmd:cmd,arg:arg}, 
			function (response){
				if(!response){callback();}
			}
		);	
	},
	isBookmark:function(arg){
		Bookmarks.isBookmark=arg;
		ButtonPanel.setBookmark(arg);
	},
	apply:function(arg){
		__AppPanel.apply(document.querySelector(arg));
	},
	resize:function(arg){
		Modification.resizeWin();
	}
};