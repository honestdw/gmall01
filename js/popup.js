/**
 * Author: Belousov Alexandr
 */
var i18=chrome.i18n.getMessage;
var Bg=chrome.extension.getBackgroundPage();
var Tabs=chrome.tabs;

var PopUp={
    button:{},
    history:{},
    last:{},
    highlight:false,
    _localization:function(){
       var tgl=document.getElementById("txtSwitch");
       tgl.setAttribute("data-on",i18('popSwitchOn'));
       tgl.setAttribute("data-off",i18('popSwitchOff'));
       document.getElementById('historyTxt').innerHTML=i18('historyTxt');
    },
    _buttonSelectText:function(){
        if(this.button.checked){
            document.getElementById("txtButtonChoose").innerHTML=i18('txtButtonChooseCancel');
        }else{
            document.getElementById("txtButtonChoose").innerHTML=i18('txtButtonChooseStart');
        }
    },
    init:function(){
        this.button=document.getElementById('choose');
        this.button.onclick=this.onChoose.bind(this);
        this.history=document.getElementById('history');
        this.last=document.getElementById('last');
        this.isRun();
        this._localization();
        this.formHistory();
        document.getElementById('duplicate').checked=Bg.Panel.isDuplicate;
        document.body.addEventListener('click',this.onClick.bind(PopUp),true);
    },
    addEvent:function(){
        var buttons=document.querySelectorAll('.buttons');
        for (var i=0;i<buttons.length;++i){
            buttons[i].addEventListener('mouseenter',this.switchOn.bind(PopUp));
            buttons[i].addEventListener('mouseleave',this.switchOff.bind(PopUp))
        }
    },
    onClick:function(e){
        switch(e.target.className){
            case 'name':
                this.onButtons(e.target);
                break;
            case 'switch-checkbox':
                Bg.Panel.setDuplicate(e.target.checked);
                break;
            case 'showIcon':
                this.onCheckIcons(e.target);
                break;
            case 'delete':
                this.onDelete(e.target);
                break;
        }
    },
    onCheckIcons:function(target){
        var index=target.getAttribute('data-index');
        var prop={name:'icon',value:target.checked};
        this.getTab(function(tab){
            Bg.Storage.saveProp(tab.url,index,prop);
            Tabs.sendMessage(tab.id,{cmd:'refreshIcon',arg:{}},function(response){});    
        });
    },
    onButtons:function(target){
        var index=target.getAttribute('data-index');
        this.switchOff();
        this.getTab(function(tab){
            Bg.cmdFromTab.fromHistory(index,tab);
        });
    },
    onDelete:function(target){
        var index=target.getAttribute('data-index');
        this.getTab(function(tab){
            Bg.Storage.delItem(tab.url,index,function(){
               PopUp.formHistory();
               Tabs.sendMessage(tab.id,{cmd:'refreshIcon',arg:{}},function(response){});  
            });
        });
    },
    switchOn:function(e){
        this.verfySelector(e.target.getAttribute('data-index'));
        this.highlight=true;
    },
    switchOff:function(e){
        this.sendCommand({cmd:'switchOff',arg:{}},function(response){});
        this.highlight=false;
    },
    verfySelector:function(index){
        this.getTab(function(tab){
            Bg.Storage.getItem(tab.url,index,function(item){
                Tabs.sendMessage(tab.id,{cmd:'switchOn',arg:{css:item.selector}},function(response){});
            });
        });
    },
    formHistory:function(){
        this.getTab(function(tab){
            Bg.Storage.getItems(tab.url,function(itemObj){
                if(itemObj){
                    var items=itemObj;
                    PopUp.history.style.display='block';
                    PopUp.last.innerHTML='';
                    for(var i=0,len=items.css.length;i<len;++i){
                        var name=items.name[i];
                        var checked='';
                        if(items.icon[i]==true) checked='checked';
                        if(name=='') name='Area #'+(i+1);
                        PopUp.last.innerHTML+='<div id="'+i+'" class="buttons" data-index="'+i+'">\
                                                    <div class="name" data-index="'+i+'">'+name+'</div>\
                                                    <div class="edit">\
                                                        <div class="wrap_icons"><input id="icon_'+i+'" class="showIcon" data-index="'+i+'" type="checkbox" '+checked+'><label for="icon_'+i+'" class="icons" title="'+i18('showIcon')+'"></label></div>\
                                                        <div class="wrap_del"><button id="edit_'+i+'" class="delete" data-index="'+i+'" title="'+i18('delete')+'"></button></div>\
                                                    </div>\
                                                </div>';
                        
                    }
                }else{
                    PopUp.history.style.display='none';
                    PopUp.last.innerHTML='';
                }
                PopUp.addEvent();
            });    
        });
    },
    isRun:function(){
        this.sendCommand({cmd:'isRun'},function(response){
            if(response=='err'){
                var error=document.getElementById('error');
                error.style.display='block';
                error.innerHTML=i18('error');
                document.getElementById('main').style.display='none';
            }else{
                this.button.checked=response;    
            }
            this._buttonSelectText();
        }.bind(this));
    },
    getTab:function(callback){
        Tabs.query({active:true,currentWindow:true},function(tab){callback(tab[0]);});
    },
    onChoose:function(e){
        if (e.target.checked){
            this.sendCommand({cmd:'start'},
            function(answer){
                if(answer) window.close();
            });
        }else{
           this.sendCommand({cmd:'stop'},function(answer){});
        }
        this._buttonSelectText();
    },
    sendCommand:function(command,callback){
        this.getTab(function(tab){
            Tabs.sendMessage(tab.id,command,function(response){
                if(response===undefined){
                    callback("err");
                }else{
                    callback(response);
                }
            });
        });
    }
};
window.onload=function(){
    PopUp.init();
};