/**
 * Author: Belousov Alexandr
 */
var newTabs={
	tabId:[],
	css:[],
	winId:[],
	add:function(tabId,selector,winId){
		this.tabId.push(tabId);
		this.css.push(selector);
		this.winId.push(winId);
	},
	get:function(tabId){
		var index=this.find(tabId);
		if(index>-1){
			return {
				tabId:this.tabId[index],
				selector:this.css[index],
				winId:this.winId[index]
			}
		}
	},
	replace:function(tabId,prop){
		var index=this.find(tabId);
		this[prop.name][index]=prop.value;
	},
	find:function(tabId){
		return this.tabId.indexOf(tabId);
	},
	remove:function(index){
		if(index==-1) return;
		this.tabId.splice(index,1);
		this.css.splice(index,1);
		this.winId.splice(index,1);
	}
};

var Panel={
	isDuplicate:false,
	createPop:function(tabId){
		if(this.isDuplicate) chrome.tabs.duplicate(tabId);
		chrome.tabs.get(tabId,function(tab){
			chrome.tabs.query({windowId:tab.windowId},function(arrTab){
				if(arrTab.length==1){
					chrome.tabs.create({windowId:tab.windowId});
				}
				chrome.windows.create({
					tabId:tabId,
					width:300,
					height:200,
					focused:true,
					type:'popup'},
					function(){
						chrome.tabs.sendMessage(tabId,{cmd:'resize',arg:''});
				});
			});
		});
		
	},
	_moveTab:function(tabId,winId){
		chrome.tabs.move(tabId,{windowId:winId,index:-1},function(tab){
				if(!chrome.runtime.lastError) chrome.tabs.update(tab.id,{active:true});
		});
	},
	restoreTab:function(tabId){
		var index=newTabs.find(tabId);
		if(index>-1){
			var prop=newTabs.get(tabId);
			newTabs.remove(index);
			chrome.windows.get(prop.winId,function(window){
				if(!chrome.runtime.lastError && window){
					Panel._moveTab(prop.tabId,window.id);	
				}else{
					chrome.windows.getAll({windowTypes:['normal']},function(allWin){
						if(allWin.length>0){
							Panel._moveTab(prop.tabId,allWin[0].id);
						}else{
							chrome.windows.create({
								tabId:prop.tabId,
								focused:true,
								type:'normal',
								state:'maximized'
							});
						}
					});
				}
			});
		}
	},
	setDuplicate:function(checked){
		this.isDuplicate=checked;
		Storage.saveSetting({isDuplicate:this.isDuplicate});
	},
	setSettings:function(items){
		for(var item in items){
			if(this.hasOwnProperty(item)) this[item]=items[item];
		}
	}
};

var File={
	getName:function(hostname){
		return hostname.replace(/\./ig,"-");
	},
	save:function(data, hostname){
		var elem=document.createElement('a');
		elem.setAttribute('href',data);
		elem.setAttribute('download',this.getName(hostname));
		elem.style.display='none';
		document.body.appendChild(elem);
		elem.click();
		document.body.removeChild(elem);
	}
};

var Bookmarks={
	bookmark:{
		title:'',
		url:'',
		parentId:''
	},
	folderId:0,
	anchor:'#sepwin=',
	addBookmark:function(tab,selector){
		this.bookmark.title=tab.title;
		this.bookmark.url=tab.url+this.anchor+selector;
		var folderName=chrome.i18n.getMessage('folderBookMarks');
		chrome.bookmarks.search({title:folderName}, function (result){
			if(result==0){
				chrome.bookmarks.create(
					{
						parentId: '1',
                        title: folderName
                    },
                    function(newFolder) {
                    	Bookmarks.bookmark.parentId=String(newFolder.id);
                    	Bookmarks.add();
                    }
                );
			}else{
				Bookmarks.bookmark.parentId=String(result[0].id);
				Bookmarks.add();
			}

		});
		SendMessage(tab.id,{cmd:'isBookmark',arg:true},function(answer){});		
	},
	add:function(){
		chrome.bookmarks.search({title:this.bookmark.title,url:this.bookmark.url},function(result){
			if(result.length==0){
				chrome.bookmarks.create(Bookmarks.bookmark);
			}
		});
	},
	checkBookmark:function(tab,selector,callback){
		chrome.bookmarks.search({title:tab.title,url:tab.url+this.anchor+selector},function(result){
			if(result.length>0){
				callback(true);
			}else{
				callback(false);
			}
		});
	},
	delBookmark:function(tab,selector){
		chrome.bookmarks.search({title:tab.title,url:tab.url+this.anchor+selector},function(result){
			if(result.length>0){
				chrome.bookmarks.remove(result[0].id,function(res){});
				SendMessage(tab.id,{cmd:'isBookmark',arg:false},function(answer){});
			}
		});
	}
};

var cmdFromTab={
	apply:function(arg,tab){
		newTabs.add(tab.id,arg.selector,tab.windowId);
		Panel.createPop(tab.id);
		Storage.addItem(tab.url,arg.selector,'');
	},
	saveProp:function(arg,tab){
		Storage.saveProp(tab.url,arg.index,arg.prop);
	},
	saveSelector:function(arg,tab){
		var oldSelector=newTabs.get(tab.id).selector;
		Storage.getAllSelectors(tab.url,function(selectors){
			var index=selectors.indexOf(oldSelector);
			Storage.saveProp(tab.url,index,arg.prop);
			newTabs.replace(tab.id,arg.prop);
		});
	},
	printScr:function(arg,tab){
		chrome.tabs.captureVisibleTab(tab.windowId,{format:"png"},function(src){
			File.save(src,arg.name);
		});
	},
	fromHistory:function(index,tab){
		Storage.getItem(tab.url,index,function(item){
			newTabs.add(tab.id,item.selector,tab.windowId);
			SendMessage(tab.id,{cmd:'apply',arg:item.selector},function(answer){});
			Panel.createPop(tab.id);
		});
	},
	getItems:function(arg,tab){
		Storage.getShowItems(tab.url,function(icons){
			SendMessage(tab.id,{cmd:'setItems',arg:icons},function(answer){});
		});
	},
	cancel:function(arg,tab){
		Panel.restoreTab(tab.id);
		this.getItems('',tab);
	},
	addBookmark:function(arg,tab){
		Bookmarks.addBookmark(tab,arg.selector);
	},
	delBookmark:function(arg,tab){
		Bookmarks.delBookmark(tab,arg.selector);
	},
	checkBookmark:function(arg,tab){
		Bookmarks.checkBookmark(tab,arg.selector,function(result){
			SendMessage(tab.id,{cmd:'isBookmark',arg:result},function(answer){});
		})
	}
};
chrome.runtime.onMessage.addListener(function(request,sender,callback){
	if(request && sender){
		if (request.cmd && sender.tab){
			if(cmdFromTab.hasOwnProperty(request.cmd)){
				cmdFromTab[request.cmd](request.arg,sender.tab);
				callback({answer:true});
			}else{
				console.log(request.cmd);
			}
		}
	}
});
function SendMessage(tabId,command,callback){
	chrome.tabs.sendMessage(tabId,command,function(response){
		if(response===undefined){
			callback("err");
		}else{
			callback(response);
		}
	});
}
function CheckURL(){
	chrome.tabs.query({active:true,currentWindow:true},function(tab){
		if(tab && tab[0] && tab[0].url){
			if(tab[0].url.indexOf('https://chrome.')==-1 && (tab[0].url.indexOf('http://') == 0 || tab[0].url.indexOf('https://') == 0 )){
				chrome.browserAction.enable(tab[0].id);
			}else{
				chrome.browserAction.disable(tab[0].id);
			}	
		}
	});
}
chrome.tabs.onRemoved.addListener(function(tabId,info){newTabs.remove(newTabs.find(tabId));});
chrome.tabs.onUpdated.addListener(function(id,info,tab){CheckURL();});
chrome.tabs.onActivated.addListener(function(info){CheckURL()});

chrome.runtime.onStartup.addListener(function(){
	Storage.getSetting(function(itemsObj){
		if(itemsObj && itemsObj.hasOwnProperty('settings')){
			Panel.setSettings(itemsObj.settings);	
		}
	})
});