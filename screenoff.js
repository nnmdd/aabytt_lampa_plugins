function screenoff() {
		webOS.service.request('luna://org.webosbrew.hbchannel.service', {
			method: 'exec',
			parameters: { 
				command: 'luna-send -n 1 luna://com.webos.service.tvpower/power/turnOffScreen {}'
			},
			onSuccess: function (event) {
			    console.log('Screensaver', 'webOS screenoff [Success]', JSON.stringify(event));

			},
			onFailure: function (event) {
				console.log('Screensaver', 'webOS screenoff [Failed][', event.errorCode + ' ]', event.errorText);
			},
		});
      }




Lampa.Screensaver.listener.follow('start',function(){ 
console.log('Screensaver', 'started');
setTimeout(screenoff, 30 * 1000);

 })

Lampa.Screensaver.listener.follow('stop',function(){ console.log('Screensaver', 'stopped') })