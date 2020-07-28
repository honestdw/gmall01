/**
 * Author: Belousov Alexandr
 */ 
var VideoControls={
	isPresent:false,
	lastMove:0,
	lastProgress:0,
	lastUpdate:0,
	video:{},
	panel:{},
	filters:{
		show:false,
		page2:false,
		win:{},
		rotate:{},
		zoom:{},
		saturate:{},
		brightness:{},
		contrast:{},
		blur:{},
		reset:{},
		filter2:{},
		wrap:{},
		display:{},
		screen:{}
	},
	timer:undefined,
	setting:{
		muted:false,
		volume:0,
		rotate:0,
		zoom:1,
		saturate:1,
		brightness:1,
		contrast:1,
		blur:0,
		translate:{x:0,y:0},
		display:{left:0,top:0,width:0,height:0,scale:1,aspect:0},
		screen:{dx:0,dy:0,width:0,height:0},
		moveScreen:false
	},
	controls:{
		play:{},
		progress:{
			wrap:{},
			buffered:[],
			current:{},
			scroll:{},
			time:{}
		},
		volume:{
			button:{},
			range:{}
		},
		speed:{
			value:{}
		},
		time:{
			curTime:{},
			durTime:{},
			wrap:{}
		},
		loading:{},
		fullscr:{},
		filters:{}
	},
	id:{
		panel:'controls',
		play:'play',
		progress_wrap:'wrap',
		progress_cur:'prog_cur',
		progress_scroll:'prog_scroll',
		progress_time:'prog_time',
		volume_ico:'volume_ico',
		volume_range:'volume_rng',
		time:{
			curTime:'curTime',
			durTime:'durTime',
			wrap:'time_wrap'
		},
		loading:'loading',
		speed:{
			less:'speed_less',
			more:'speed_more',
			value:'speed_value',
			ico:'speed_ico'
		},
		fullscr:'fullscr',
		filters:{
			ico:'filters_ico',
			win:'filters',
			scr:'screen',
			rst:'reset',
			shPg2:'showPage2'
		}
	},
	class:{
		panel:'_sepwin_panel',
		play:'_sepwin_play',
		pause:'_sepwin_pause',
		wrap:'_sepwin_wrap',
		progress_time:'_sepwin_prog_time',
		progress_scroll:'_sepwin_prog_scroll',
		progress_cur:'_sepwin_prog_cur',
		progress_buf:'_sepwin_prog_buf',
		volume_ico_on:'_sepwin_volume_ico_on',
		volume_ico_off:'_sepwin_volume_ico_off',
		volume_range:'_sepwin_volume_rng',
		time:'_sepwin_time',
		loading:'_sepwin_loading',
		fullscr_on:'_sepwin_fullscr_on',
		fullscr_off:'_sepwin_fullscr_off',
		filters:{
			ico:'_sepwin_filters_ico',
			win:'_sepwin_filters'
		}
	},
	init:function(target){
		if(target.tagName=='VIDEO' && !target.hasAttribute('controls')){
			CssControl.insert('video');
			this.video=target;
			this.video.classList.add('__targetVideo');
			this.createPanel();
			this.isPresent=true;
		}
	},
	blockEvent:function(e){
		if(e) {
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	},
	clickfilters:function(e){
		this.blockEvent(e);
		this.filters.show=!this.filters.show;
		if(this.filters.show){
			this.filters.win.style.display='block';
			this.controls.filters.style.opacity=1;
			this.previewUpdate();
		}else{
			this.filters.win.style.display='none';
			this.controls.filters.style.opacity=0.5;
		}
	},
	createPanel:function(){
		this.panel=document.createElement('div');
		this.panel.id=this.id.panel;
		CssControl.setComClass(this.panel);
		this.panel.classList.add(this.class.panel);

		this.panel.innerHTML='\
		<div id="rel_wrap" class="_sepwin_rel">\
		<div id="wrap" class="_sepwin_wrap">\
			<div class="_sepwin_prog_buf"></div>\
			<div id="prog_cur" class="_sepwin_prog_cur"></div>\
			<div id="prog_scroll" class="_sepwin_prog_scroll"></div>\
			<span id="prog_time" class="_sepwin_prog_time"></span>\
		</div>\
		</div>\
		<div id="wrap_but" class="_sepwin_wrap_button">\
			<div id="play"></div>\
			<div id="loading" class="_sepwin_loading"></div>\
			<div id="time_wrap" class="_sepwin_time">\
				<div id="curTime" class="_sepwin_time"></div>\
				<div id="durTime" class="_sepwin_time"></div>\
			</div>\
			<div id="volume_ico" class="_sepwin_volume_ico_on"></div>\
			<input id="volume_rng" class="_sepwin_volume_rng" type="range" max="1" min="0" step="0.05">\
			<div id="speed_ico" class="_sepwin_speed_ico"></div>\
			<div id="speed_wrap" class="_sepwin_speed_wrap">\
				<div id="speed_less" class="_sepwin_speed_less"></div>\
				<div id="speed_value" class="_sepwin_speed_value">1</div>\
				<div id="speed_more" class="_sepwin_speed_more"></div>\
			</div>\
			<div id="fullscr" class="_sepwin_fullscr_off"></div>\
			<div id="filters_ico" class="_sepwin_filters_ico"></div>\
		</div>';

		document.body.appendChild(this.panel);

		this.controls.play=this.panel.querySelector('#'+this.id.play);
		this.controls.progress.wrap=this.panel.querySelector('#'+this.id.progress_wrap);
		this.controls.progress.current=this.panel.querySelector('#'+this.id.progress_cur);
		this.controls.progress.scroll=this.panel.querySelector('#'+this.id.progress_scroll);
		this.controls.progress.time=this.panel.querySelector('#'+this.id.progress_time);
		this.controls.time.wrap=this.panel.querySelector('#'+this.id.time.wrap);
		this.controls.time.curTime=this.panel.querySelector('#'+this.id.time.curTime);
		this.controls.time.durTime=this.panel.querySelector('#'+this.id.time.durTime);
		this.controls.volume.button=this.panel.querySelector('#'+this.id.volume_ico);
		this.controls.volume.range=this.panel.querySelector('#'+this.id.volume_range);
		this.controls.speed.value=this.panel.querySelector('#'+this.id.speed.value);
		this.controls.loading=this.panel.querySelector('#'+this.id.loading);
		this.controls.filters=this.panel.querySelector('#'+this.id.filters.ico);
		this.controls.fullscr=this.panel.querySelector('#'+this.id.fullscr);

		this.setting.muted=this.video.muted;
		this.setting.volume=this.video.volume;
		this.toogleMuted();
		this.timeUpdate();
		this.toogleButtonPlay();
		this.subEvents();

		this.createFilters();
	},
	getTime:function(percent){
		var duration=this.video.duration/100;
		return duration*percent;
	},
	muted:function(e){
		this.blockEvent(e);
		this.video.muted=this.setting.muted=!this.video.muted;
	},
	keyPress:function(e){
		this.blockEvent(e);
		switch(e.keyCode){
			case 27: //esc
				this.toogleFullScr(e);
				break;
			case 32: //space
				this.toogleVideo(e);
				break;
			case 37: //left
				this.video.currentTime-=5;
				this.setTime();
				break;
			case 38: //up
				this.setPlayBackRate('more');
				break;
			case 39: //right
				this.video.currentTime+=5;
				this.setTime();
				break;
			case 40: //down
				this.setPlayBackRate('less');
				break;
			case 107: // +
				this.controls.volume.range.value=parseFloat(this.controls.volume.range.value)+parseFloat(this.controls.volume.range.step);
				this.volumeChange();
				break;
			case 109: // -
				this.controls.volume.range.value=parseFloat(this.controls.volume.range.value)-parseFloat(this.controls.volume.range.step);
				this.volumeChange();
				break;
		}
	},
	mouseClick:function(e){
		if(e.target==this.video){
			this.toogleVideo(e);
		}else{
			switch(e.target.id){
				case this.id.progress_scroll:
					this.rewindVideo(e);
					break;
				case this.id.volume_ico:
					this.muted(e);
					break;
				case this.id.filters.ico:
					this.clickfilters(e);
					break;
				case this.id.fullscr:
					this.toogleFullScr(e);
					break;
				case this.id.panel:
					this.blockEvent(e);
					break;
				case this.id.filters.rst:
					this.resetFilters(e);
					break;
				case this.id.filters.shPg2:
					this.showPage2(e);
					break;
				case this.id.play:
					this.toogleVideo(e);
					break;
				case this.id.speed.ico:
					this.setPlayBackRate('reset');
					break;
				case this.id.speed.less:
					this.setPlayBackRate('less');
					break;
				case this.id.speed.more:
					this.setPlayBackRate('more');
					break;
			}
		}
	},
	mouseDown:function(e){
		this.blockEvent(e);
		switch(e.target.id){
			case this.id.filters.scr:
				this.blockEvent(e);
				this.setting.moveScreen=true;
				this.filters.wrap.addEventListener('mouseleave',VideoControls.mouseLeave);
				break;
		}
	},
	mouseUp:function(e){
		this.blockEvent(e);
		if(this.setting.moveScreen){
			this.setting.moveScreen=false;
			this.filters.wrap.removeEventListener('mouseleave',VideoControls.mouseLeave);
		}
	},
	mouseMove:function(e){
		switch(e.target.id){
			case this.id.progress_scroll:
				this.scrollVideo(e);
				break;
			case this.id.filters.scr:
				this.moveScreen(e);
				break;
			default:
				if((e.timeStamp-this.lastMove)<200) return 0;
				this.lastMove=e.timeStamp;
				this.panel.style.bottom='0';
				if(this.timer){clearTimeout(this.timer);}
				this.timer=setTimeout(function(){this.panel.style.bottom='-42px';}.bind(this),5000);
				break;
		}
	},
	mouseWheel:function(e){
		this.blockEvent(e);
		if(e.target==this.video || e.target==this.controls.volume.range){ 
			this.volumeChange(e);
		}
		if(e.target.className=="filter"){
			this.changeSetting(e);
		}
	},
	pause:function(){
		this.controls.play.className=this.class.pause;
	},
	play:function(){
		this.controls.play.className=this.class.play;
	},
	previewUpdate:function(){
		if(this.filters.page2 && this.filters.show){
			var context=this.filters.display.getContext('2d');
			context.imageSmoothingEnabled=true;
			context.drawImage(this.video,0,0,this.setting.display.width,this.setting.display.height);
			setTimeout(this.previewUpdate.bind(this),1000/25);
		}
	},
	progressUpdate:function(e){
		if((e.timeStamp-this.lastProgress)<2000) return 0;
		this.lastProgress=e.timeStamp;
		var len=this.video.buffered.length;
		var buf=this.controls.progress.buffered;
		var buf_len=buf.length;
		var video=this.video.buffered;
		var last=0;
		for(var i=0;i<len;i++){
			var left=video.start(i)/this.video.duration*100,
				end=video.end(i)/this.video.duration*100-left;
			if(buf[i]){
				buf[i].style.left=left.toFixed(2)+'%';
				buf[i].style.width=end.toFixed(2)+'%';
			}else{
				var block=document.createElement('div');
				block.className=this.class.progress_buf;
				block.style.left=left.toFixed(2)+'%';
				block.style.width=end.toFixed(2)+'%';
				this.controls.progress.wrap.insertBefore(block,this.controls.progress.wrap.firstChild);
				this.controls.progress.buffered.push(block);
			}
			last=i;
		}
		if(last<buf_len-1){
			for(i=last+1;i<buf_len;i++){
				this.controls.progress.wrap.removeChild(buf[i]);
			}
			this.controls.progress.buffered.splice(last+1,len-last+1);
		}
		
	},
	remove:function(){
		if(this.isPresent){
			clearTimeout(this.timer);
			this.video.classList.remove('__targetVideo');
			this.unsubEvents();
			this.removeFilters();
			this.setPlayBackRate('reset');
			document.body.removeChild(this.panel);
			document.body.removeChild(this.filters.win);
			this.panel=undefined;
			this.filters={
					show:false,
					page2:false,
					win:{},
					rotate:{},
					zoom:{},
					saturate:{},
					brightness:{},
					contrast:{},
					blur:{},
					reset:{},
					filter2:{},
					wrap:{},
					display:{}
			};
			this.isPresent=false;
			this.controls={
				play:{},
				progress:{
					wrap:{},
					buffered:[],
					current:{},
					scroll:{},
					time:{}
				},
				volume:{
					button:{},
					range:{}
				},
				speed:{
					value:{}
				},
				time:{
					wrap:{},
					curTime:{},
					durTime:{}
				},
				loading:{},
				fullscr:{},
				filters:{}
			};
			CssControl.remove('video');
		}
	},
	rewindVideo:function(e){
		this.blockEvent(e);
		var duration=e.target.clientWidth;
		this.video.currentTime=this.getTime((e.pageX-((window.innerWidth-e.target.clientWidth)/2))/duration*100);
	},
	scrollVideo:function(e){
		this.blockEvent(e);
		var time=this.controls.progress.time;
		var duration=e.target.clientWidth;
		var width=time.clientWidth;
		var margin=(window.innerWidth-e.target.clientWidth)/2;
		var left=Math.floor(e.pageX-margin);
		time.style.left=(left-(width/2))+'px';
		this.controls.progress.time.textContent=this.timeFormat(this.getTime(left/duration*100));
	},
	setTime:function(){
		this.controls.time.curTime.textContent=this.timeFormat(this.video.currentTime);
		this.controls.time.durTime.textContent='/'+this.timeFormat(this.video.duration);
	},
	subEvents:function(){
		document.addEventListener('keyup',VideoControls.blockEvent,true);
		document.addEventListener('keydown',VideoControls.keyPress,true);
		document.addEventListener('keypress',VideoControls.blockEvent,true);
		document.addEventListener('click',VideoControls.mouseClick,true);
		document.addEventListener('mousewheel',VideoControls.mouseWheel,true);
		document.addEventListener('mousemove',VideoControls.mouseMove,true);
		document.addEventListener('mousedown',VideoControls.mouseDown,true);
		document.addEventListener('mouseup',VideoControls.mouseUp,true);
		document.addEventListener('pointerdown',VideoControls.blockEvent,true);
		document.addEventListener('pointerup',VideoControls.blockEvent,true);
		document.addEventListener('webkitfullscreenchange',VideoControls.toogleFullScr);
		
		this.controls.volume.range.addEventListener('input',VideoControls.volumeChange);

		this.video.addEventListener('dblclick',VideoControls.toogleFullScr);
		this.video.addEventListener('play',VideoControls.play);
		this.video.addEventListener('pause',VideoControls.pause);
		this.video.addEventListener('timeupdate',VideoControls.timeUpdate);
		this.video.addEventListener('progress',VideoControls.progressUpdate);
		this.video.addEventListener('volumechange',VideoControls.onVolumeChange);
		this.video.addEventListener('abort',VideoControls.onAbort);
		this.video.addEventListener('canplay',VideoControls.onCanPlay);
		this.video.addEventListener('seeking',VideoControls.onSeeking);
		this.video.addEventListener('waiting',VideoControls.onWaiting);
		this.video.addEventListener('loadstart',VideoControls.onWaiting);

	},
	show:function(){
		if(this.isPresent) this.panel.style.display='block';
	},
	showLoading:function(){
		this.controls.time.wrap.style.display='none';
		this.controls.loading.style.display='block';
	},
	showPage2:function(e){
		this.blockEvent(e);
		this.filters.page2=!this.filters.page2;
		if(this.filters.page2){
			document.querySelector('#filters._sepwin_filters #filter1').style.display='none';
			document.querySelector('#filters._sepwin_filters #filter2').style.display='block';
			this.filters.filter2.style.backgroundImage='url("chrome-extension://'+chrome.runtime.id+'/img/brightness.png")';
			this.previewUpdate();
		}else{
			document.querySelector('#filters._sepwin_filters #filter1').style.display='block';
			document.querySelector('#filters._sepwin_filters #filter2').style.display='none';
			this.filters.filter2.style.backgroundImage='url("chrome-extension://'+chrome.runtime.id+'/img/position.png")';
		}
	},
	hide:function(){
		if(this.isPresent) this.panel.style.display='none'
	},
	hideLoading:function(){
		this.controls.time.wrap.style.display='block';
		this.controls.loading.style.display='none';
	},
	unsubEvents:function(){
		document.removeEventListener('keyup',VideoControls.blockEvent,true);
		document.removeEventListener('keydown',VideoControls.keyPress,true);
		document.removeEventListener('keypress',VideoControls.blockEvent,true);
		document.removeEventListener('click',VideoControls.mouseClick,true);
		document.removeEventListener('mousewheel',VideoControls.mouseWheel,true);
		document.removeEventListener('mousemove',VideoControls.mouseMove,true);
		document.removeEventListener('mousedown',VideoControls.mouseDown,true);
		document.removeEventListener('mouseup',VideoControls.mouseUp,true);
		document.removeEventListener('pointerdown',VideoControls.blockEvent,true);
		document.removeEventListener('pointerup',VideoControls.blockEvent,true);
		document.removeEventListener('webkitfullscreenchange',VideoControls.toogleFullScr);

		this.controls.volume.range.removeEventListener('input',VideoControls.volumeChange);

		this.video.removeEventListener('dblclick',VideoControls.toogleFullScr);
		this.video.removeEventListener('play',VideoControls.play);
		this.video.removeEventListener('pause',VideoControls.pause);
		this.video.removeEventListener('timeupdate',VideoControls.timeUpdate);
		this.video.removeEventListener('progress',VideoControls.progressUpdate);
		this.video.removeEventListener('volumechange',VideoControls.onVolumeChange);
		this.video.removeEventListener('abort',VideoControls.onAbort);
		this.video.removeEventListener('canplay',VideoControls.onCanPlay);
		this.video.removeEventListener('seeking',VideoControls.onSeeking);
		this.video.removeEventListener('waiting',VideoControls.onWaiting);
		this.video.removeEventListener('loadstart',VideoControls.onWaiting);
	},
	onAbort:function(){
		this.showLoading();
	},
	onCanPlay:function(){
		this.hideLoading();
	},
	onSeeking:function(){
		this.showLoading();
	},
	onVolumeChange:function(){
		this.video.muted=this.setting.muted;
		this.toogleMuted();
		this.controls.volume.range.value=this.video.volume=this.setting.volume;
	},
	onWaiting:function(){
		this.showLoading();
	},
	timeFormat:function(sec){
		function frmt(val){
			val=Math.floor(val);
			if(isNaN(val)) val=0;
			return val<10?'0'+val:val;
		}
		var time=[frmt(sec/3600%24),frmt(sec/60%60),frmt(sec%60)];
		var str='';
		if(time[0]!=='00') {str+=time[0]+':';}
		str+=time[1]+':'+time[2];
		return str;
	},
	toogleButtonPlay:function(){
		this.video.paused?
			this.controls.play.className=this.class.pause:
			this.controls.play.className=this.class.play;
	},
	toogleFullScr:function(e){
		this.blockEvent(e);
		if(document.webkitIsFullScreen){
			this.controls.fullscr.className=this.class.fullscr_on;
			if(e.type=='click' || e.type=='dblclick') document.webkitCancelFullScreen();
		}else{
			this.controls.fullscr.className=this.class.fullscr_off;
			if(e.type=='click' || e.type=='dblclick') document.body.webkitRequestFullScreen();
		}
	},
	toogleVideo:function(e){
		this.blockEvent(e);
		this.video.paused?
			this.video.play():
			this.video.pause();
	},
	timeUpdate:function(e){
		if(e instanceof Event){
			if((e.timeStamp-this.lastUpdate)<1000) return 0;
			this.lastUpdate=e.timeStamp;	
		}
		var progress=this.video.currentTime/this.video.duration;
		this.controls.progress.current.style.width=(progress*100).toFixed(2)+'%';
		this.setTime();
	},
	toogleMuted:function(){
		this.video.muted
			?
			this.controls.volume.button.className=this.class.volume_ico_off:
			this.controls.volume.button.className=this.class.volume_ico_on;
	},
	setPlayBackRate:function(act){
		switch (act){
			case 'reset':
				this.video.playbackRate=1;
				break;
			case 'less':
				this.video.playbackRate>0.1?this.video.playbackRate-=0.1:this.video.playbackRate=0;
				break;
			case 'more':
				this.video.playbackRate<9.9?this.video.playbackRate+=0.1:this.video.playbackRate=9.9;
				break;
		}
		this.controls.speed.value.innerText=this.video.playbackRate.toFixed(1);
	},
	volumeChange:function(e){
		if(!e) {
			this.video.volume=this.controls.volume.range.value;
		}else{
			switch(e.type){
				case 'input':
					this.video.volume=this.controls.volume.range.value;
					break;
				case 'mousewheel':
					if(e.wheelDelta>0){
						this.video.volume<0.95?this.video.volume+=0.05:this.video.volume=1;
					}else{
						this.video.volume>0.05?this.video.volume-=0.05:this.video.volume=0;
					}
					break;
			}
		}
		this.setting.volume=this.video.volume;
	},
	//Filters
	changeSetting:function(e){
		if(e.wheelDelta>0){
			e.target.value=parseFloat(e.target.value)+parseFloat(e.target.step);
		}else{
			e.target.value=parseFloat(e.target.value)-parseFloat(e.target.step);
		}
		this.positionPreview(e);
	},
	createFilters:function(){
		this.filters.win=document.createElement('div'); 
		this.filters.win.id=this.id.filters.win;
		CssControl.setComClass(this.filters.win);
		this.filters.win.classList.add(this.class.filters.win);
		this.filters.win.style.display='none';
		this.filters.win.innerHTML='<div id="filter1">\
										<div id="wrap_filter"><input id="saturate" class="filter" type="range" min="0" max="2" step="0.1" value="1"></div>\
										<div id="wrap_filter"><input id="brightness" class="filter" type="range" min="0.3" max="2.5" step="0.1" value="1"></div>\
										<div id="wrap_filter"><input id="contrast" class="filter" type="range" min="0.3" max="2" step="0.05" value="1"></div>\
										<div id="wrap_filter"><input id="blur" class="filter" type="range" min="0" max="2" step="0.05" value="0"></div>\
									</div>\
									<div id="filter2">\
										<div id="wrap_filter"><input id="rotate" class="filter" type="range" min="0" max="360" step="1" value="0"></div>\
										<div id="wrap_filter"><input id="zoom" class="filter" type="range" min="1" max="10" step="0.1" value="1"></div>\
										<div id="wrap_filter"><div id="wrap_canvas"><canvas id="display" class="filter"></canvas><div id="screen" class="filter"></div></div></div>\
									</div>\
									<div id="wrap_filter"><button id="reset"></button><button id="showPage2"></button></div>';
		document.body.appendChild(this.filters.win);
		
		this.filters.rotate=this.filters.win.querySelector('#rotate');
		this.filters.zoom=this.filters.win.querySelector('#zoom');
		this.filters.saturate=this.filters.win.querySelector('#saturate');
		this.filters.brightness=this.filters.win.querySelector('#brightness');
		this.filters.contrast=this.filters.win.querySelector('#contrast');
		this.filters.blur=this.filters.win.querySelector('#blur');
		this.filters.reset=this.filters.win.querySelector('#'+this.id.filters.rst);
		this.filters.filter2=this.filters.win.querySelector('#'+this.id.filters.shPg2);
		this.filters.wrap = this.filters.win.querySelector('#wrap_canvas');
		this.filters.display=this.filters.win.querySelector('#display');
		this.filters.screen=this.filters.win.querySelector('#'+this.id.filters.scr);

		this.filters.rotate.addEventListener('input',VideoControls.setFilters);
		this.filters.zoom.addEventListener('input',VideoControls.positionPreview);
		this.filters.saturate.addEventListener('input',VideoControls.setFilters);
		this.filters.brightness.addEventListener('input',VideoControls.setFilters);
		this.filters.contrast.addEventListener('input',VideoControls.setFilters);
		this.filters.blur.addEventListener('input',VideoControls.setFilters);
		this.resetFilters();
	},
	mouseLeave:function(e){
		e.stopPropagation();
		VideoControls.mouseUp.bind(VideoControls);
	},
	moveScreen:function(e){
		if(this.setting.moveScreen){
			var dx=e.movementX,
				dy=e.movementY;
			var x=parseInt(this.filters.screen.style.left.replace('px',''))+dx,
				y=parseInt(this.filters.screen.style.top.replace('px',''))+dy;
			if(x>=0 && y>=0 
				&& ((this.setting.screen.width+x)<=this.setting.display.width+(this.setting.display.left*2)) 
				&& ((this.setting.screen.height+y)<=this.setting.display.height+(this.setting.display.top*2))){
					this.setting.screen.dx=dx;
					this.setting.screen.dy=dy;
					this.positionPreview();
			}
		}
		
	},
	observerUpdate:function(){
		if(!this.setting.moveScreen){
			this.zoomPreview();
			this.positionPreview();
		}
	},
	positionPreview:function(e){
		if(e){
			this.zoomPreview();
		}
		var left=0,top=0;
		if(this.setting.zoom>1){
			if(!this.setting.moveScreen){
				left=(((this.setting.translate.x*this.setting.display.scale))+(this.setting.display.width/2))-this.setting.screen.width/2+this.setting.display.left;
				top=(((this.setting.translate.y*this.setting.display.scale))+(this.setting.display.height/2))-this.setting.screen.height/2+this.setting.display.top;
				if(top<0){
					this.setting.translate.y-=top/this.setting.display.scale;
					top=0;
				}
				if(left<0){
					this.setting.translate.x-=left/this.setting.display.scale;	
					left=0;
				}
				if((this.setting.screen.height+top)>(this.setting.display.height+(this.setting.display.top*2))){
					this.setting.translate.y-=((top+this.setting.screen.height)-(this.setting.display.height+(this.setting.display.top*2)))/this.setting.display.scale;
					top=(this.setting.display.height+this.setting.display.top*2)-this.setting.screen.height;
				}
				if((this.setting.screen.width+left)>this.setting.display.width+(this.setting.display.left*2)){
					this.setting.translate.x-=((left+this.setting.screen.width)-(this.setting.display.width+(this.setting.display.left*2)))/this.setting.display.scale;
					left=(this.setting.display.width+this.setting.display.left*2)-this.setting.screen.width;	
				}
			}else{
				left=parseFloat(this.filters.screen.style.left.replace('px',''))+this.setting.screen.dx;
				top=parseFloat(this.filters.screen.style.top.replace('px',''))+this.setting.screen.dy;
				this.setting.translate.x+=(this.setting.screen.dx)/this.setting.display.scale;
				this.setting.translate.y+=(this.setting.screen.dy)/this.setting.display.scale;
			}
		}else{
			this.setting.translate.x=0;
			this.setting.translate.y=0;
			top=0;
			left=0;
		}
		this.setting.screen.top=top;
		this.setting.screen.left=left;
		this.updateScreen();
	},
	setFilters:function(){
		this.setting.rotate	 	= this.filters.rotate.value;
		this.setting.saturate 	= this.filters.saturate.value;
		this.setting.brightness = this.filters.brightness.value;
		this.setting.contrast 	= this.filters.contrast.value;
		this.setting.blur 		= this.filters.blur.value;

		this.video.style.setProperty('transform',
			'rotate('+this.setting.rotate+'deg) '+
			'scale('+this.setting.zoom+') '+
			'translate('+(-this.setting.translate.x)+'px, '+(-this.setting.translate.y)+'px)',
			'important');

		this.video.style.setProperty('filter',
			'saturate('+this.setting.saturate+') '+
			'brightness('+this.setting.brightness+') '+
			'contrast('+this.setting.contrast+') '+
			'blur('+this.setting.blur+'px)',
			'important');
	},
	removeFilters:function(){
		this.video.style.removeProperty('transform');
		this.video.style.removeProperty('filter');
	},
	resetFilters:function(e){
		this.blockEvent(e);
		this.filters.rotate.value=0;
		this.filters.zoom.value=1;
		this.filters.saturate.value=1;
		this.filters.brightness.value=1;
		this.filters.contrast.value=1;
		this.filters.blur.value=0;
		this.setting.translate.x=0;
		this.setting.translate.y=0;
		this.setting={
			muted:false,
			volume:0,
			rotate:0,
			zoom:1,
			saturate:1,
			brightness:1,
			contrast:1,
			blur:0,
			translate:{x:0,y:0},
			display:{left:0,top:0,width:0,height:0,scale:1,aspect:0},
			screen:{dx:0,dy:0,width:0,height:0},
			moveScreen:false
		};
		this.zoomPreview();
		this.positionPreview();
	},
	updateScreen:function(){
		this.filters.screen.style.top = this.setting.screen.top+'px';
		this.filters.screen.style.left = this.setting.screen.left+'px';
		this.filters.screen.style.width = this.setting.screen.width+'px';
		this.filters.screen.style.height = this.setting.screen.height+'px';
		this.setFilters();
	},
	zoomPreview:function(){
		var dWidth=window.innerWidth,
			dHeight=window.innerHeight,
			dTop=0, dLeft=0,
			dScale=160/dWidth,
			aspect=this.video.videoWidth/this.video.videoHeight,
			aspect2=window.innerWidth/window.innerHeight;
		
		dWidth=160;
		dHeight=Math.ceil(dHeight*dScale);
		this.setting.zoom = this.filters.zoom.value;
		this.setting.screen.width =dWidth/this.setting.zoom;
		this.setting.screen.height=dHeight/this.setting.zoom;
		
		this.filters.wrap.style.width=dWidth+'px';
		this.filters.wrap.style.height=dHeight+'px';

		if(aspect>aspect2){
			dLeft=0;
			dTop=Math.round(Math.abs((dHeight-(dWidth/aspect))/2));
			dHeight=Math.round(dWidth/aspect);
		}else{
			dTop=0;
			dLeft=Math.round(Math.abs((dWidth-(dHeight*aspect))/2));
			dWidth=Math.round(dHeight*aspect);
		}
		
		this.setting.display.scale = dScale;
		if(dTop!=this.setting.display.top){
			this.setting.display.top = dTop;
			this.filters.display.style.top =dTop+'px';
		}
		if(dLeft!=this.setting.display.left){
			this.setting.display.left = dLeft;
			this.filters.display.style.left = dLeft+'px';
		}
		if(dWidth!=this.setting.display.width){
			this.setting.display.width = dWidth;
			this.filters.display.width = dWidth;
			this.filters.display.style.width = dWidth+'px';
		}
		if(dHeight!=this.setting.display.height){
			this.setting.display.height = dHeight;
			this.filters.display.height = dHeight;
			this.filters.display.style.height = dHeight+'px';
		}
	}
};
VideoControls.blockEvent=VideoControls.blockEvent.bind(VideoControls);

VideoControls.keyPress=VideoControls.keyPress.bind(VideoControls);
VideoControls.mouseClick=VideoControls.mouseClick.bind(VideoControls);
VideoControls.mouseMove=VideoControls.mouseMove.bind(VideoControls);
VideoControls.mouseWheel=VideoControls.mouseWheel.bind(VideoControls);
VideoControls.mouseDown=VideoControls.mouseDown.bind(VideoControls);
VideoControls.mouseUp=VideoControls.mouseUp.bind(VideoControls);

VideoControls.play=VideoControls.play.bind(VideoControls);
VideoControls.pause=VideoControls.pause.bind(VideoControls);
VideoControls.timeUpdate=VideoControls.timeUpdate.bind(VideoControls);
VideoControls.volumeChange=VideoControls.volumeChange.bind(VideoControls);
VideoControls.progressUpdate=VideoControls.progressUpdate.bind(VideoControls);
VideoControls.toogleFullScr=VideoControls.toogleFullScr.bind(VideoControls);

VideoControls.onVolumeChange=VideoControls.onVolumeChange.bind(VideoControls);
VideoControls.onAbort=VideoControls.onAbort.bind(VideoControls);
VideoControls.onCanPlay=VideoControls.onCanPlay.bind(VideoControls);
VideoControls.onSeeking=VideoControls.onSeeking.bind(VideoControls);
VideoControls.onWaiting=VideoControls.onWaiting.bind(VideoControls);

VideoControls.setFilters=VideoControls.setFilters.bind(VideoControls);
VideoControls.positionPreview=VideoControls.positionPreview.bind(VideoControls);
VideoControls.resetFilters=VideoControls.resetFilters.bind(VideoControls);
VideoControls.showPage2=VideoControls.showPage2.bind(VideoControls);