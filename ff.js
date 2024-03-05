(function () {
    'use strict';

	if (!Lampa.Lang) {
				var lang_data = {};
				Lampa.Lang = {
					add: function (data) {
						lang_data = data;
					},
					translate: function (key) {
						return lang_data[key] ? lang_data[key].ru : key;
					}
				};
			}
			Lampa.Lang.add({
				not_supported_track: {
					ru: 'не поддерживается',
					uk: 'не підтримується',
					en: 'not supported',
					be: 'не падтрымліваецца'
				}
			});

    function subscribe(data) {
      var inited = false;
      var inited_parse = false;
      var webos_replace = {};

      function log() {
        console.log.apply(console.log, arguments);
      }

      function getTracks() {
        var video = Lampa.PlayerVideo.video();
        return video.audioTracks || [];
      }

      function getSubs() {
        var video = Lampa.PlayerVideo.video();
        return video.textTracks || [];
      }

      log('Tracks', 'start');

      function setTracks() {
        if (inited_parse) {
          var new_tracks = [];
          var video_tracks = getTracks();
          var parse_tracks = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
          var minus = 1;
          log('Tracks', 'set tracks:', video_tracks.length);
          if (parse_tracks.length !== video_tracks.length) parse_tracks = parse_tracks.filter(function (a) {
            return a.codec_name !== 'dts';
          });
          parse_tracks = parse_tracks.filter(function (a) {
            return a.tags;
          });
          parse_tracks.forEach(function (track) {
            var elem = {
              index: track.index - minus,
              language: track.tags.language,
              label: track.tags.title || track.tags.handler_name,
              ghost: video_tracks[track.index - minus] ? false : true
            };
            Object.defineProperty(elem, "enabled", {
              set: function set(v) {
                if (v) {
                  var aud = getTracks();
                  var trk = aud[elem.index];

                  for (var i = 0; i < aud.length; i++) {
                    aud[i].enabled = false;
                  }

                  if (trk) trk.enabled = true;
                }
              },
              get: function get() {}
            });
            new_tracks.push(elem);
          });
          if (parse_tracks.length) Lampa.PlayerPanel.setTracks(new_tracks);
        }
      }

      function setSubs() {
        if (inited_parse) {
          var new_subs = [];
          var video_subs = getSubs();
          var parse_subs = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
          var minus = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          }).length + 1;
          log('Tracks', 'set subs:', video_subs.length);
          parse_subs = parse_subs.filter(function (a) {
            return a.tags;
          });
          parse_subs.forEach(function (track) {
            var elem = {
              index: track.index - minus,
              language: track.tags.language,
              label: track.tags.title || track.tags.handler_name,
              ghost: video_subs[track.index - minus] ? false : true
            };
            Object.defineProperty(elem, "enabled", {
              set: function set(v) {
                if (v) {
                  var txt = getSubs();
                  var sub = txt[elem.index];

                  for (var i = 0; i < txt.length; i++) {
                    txt[i].mode = 'disabled';
                  }

                  if (sub) sub.mode = 'showing';
                }
              },
              get: function get() {}
            });
            new_subs.push(elem);
          });
          if (parse_subs.length) Lampa.PlayerPanel.setSubs(new_subs);
        }
      }

      function listenTracks() {
        log('Tracks', 'tracks video event');
        setTracks();
        Lampa.PlayerVideo.listener.remove('tracks', listenTracks);
      }

      function listenSubs() {
        log('Tracks', 'subs video event');
        setSubs();
        Lampa.PlayerVideo.listener.remove('subs', listenSubs);
      }

      function canPlay() {
        log('Tracks', 'canplay video event');
        if (webos_replace.tracks) setWebosTracks(webos_replace.tracks);else setTracks();
        if (webos_replace.subs) setWebosSubs(webos_replace.subs);else setSubs();
        Lampa.PlayerVideo.listener.remove('canplay', canPlay);
      }

      function setWebosTracks(video_tracks) {
        if (inited_parse) {
          var parse_tracks = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
		  var non_supported = [];
          log('Tracks', 'webos set tracks:', video_tracks.length);
			
         if (parse_tracks.length !== video_tracks.length) {
            if (webOS.sdk_version < 5) {
				parse_tracks = parse_tracks.filter(function (a) {
					return a.codec_name !== 'truehd';
				});
				non_supported = inited_parse.streams.filter(function (a) {
					return a.codec_name == 'truehd';
				});				
			} else {
				parse_tracks = parse_tracks.filter(function (a) {
					return a.codec_name !== 'dts' && a.codec_name !== 'truehd';
				});
				non_supported = inited_parse.streams.filter(function (a) {
					return a.codec_name == 'dts' || a.codec_name == 'truehd';
				});
			}
          }
		  
		 if (webOS.sdk_version > 4) {
    		 for(var r=0; r < parse_tracks.length; r++) { 
    		     if(parse_tracks[r].disposition) {
    		        if (parse_tracks[r].disposition.default === 1) parse_tracks.splice(0, 0, parse_tracks.splice(r, 1)[0]);
    		     }
    		 }
		 }

          parse_tracks = parse_tracks.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'webos tracks', video_tracks);
          parse_tracks.forEach(function (track, i) {
            if (video_tracks[i]) {
              video_tracks[i].language = track.tags.language;
			  video_tracks[i].label = (track.tags.title || track.tags.handler_name || Lampa.Lang.translate('player_unknown')) + ' / ' + Math.round((track.bit_rate || track.tags.BPS || track.tags["BPS-eng"])/1000) + ' kbps';
            }
          });
		  
		  non_supported.forEach(function (track) {
  			if(!track.tags) track.tags = [];
            var elem = {
              language: track.tags.language,
			  label: (track.tags.title || track.tags.handler_name || Lampa.Lang.translate('player_unknown')) + ' / ' + Math.round((track.bit_rate || track.tags.BPS || track.tags["BPS-eng"])/1000) + ' kbps',
			  extra: {
				  channels: track.channels,
				  fourCC: (track.codec_name + ' - ' + Lampa.Lang.translate('not_supported_track'))
			  },
              ghost: true
            };
            //video_tracks.push(elem);
          });
 
        }
      }

      function setWebosSubs(video_subs) {
        if (inited_parse) {
          var parse_subs = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
		  var non_supported = [];
          log('Tracks', 'webos set subs:', video_subs.length);
          if (parse_subs.length !== video_subs.length - 1) {
				parse_subs = parse_subs.filter(function (a) {
				  return a.codec_name !== 'hdmv_pgs_subtitle';
				  });
				non_supported = inited_parse.streams.filter(function (a) {
					return a.codec_name == 'hdmv_pgs_subtitle';
				});				  
		  }
          parse_subs = parse_subs.filter(function (a) {
            return a.tags;
          });
          
		  non_supported.forEach(function (track) {
			if(!track.tags) track.tags = [];
            var elem = {
              language: track.tags.language,
              label: (track.tags.title ? (track.tags.title + ' - ') : '') + Lampa.Lang.translate('not_supported_track'),
              ghost: true
            };
            //video_subs.push(elem);
		     });
		  
         parse_subs.forEach(function (track, a) {
            var i = a + 1;

            if (video_subs[i]) {
              video_subs[i].language = track.tags.language;
              video_subs[i].label = track.tags.title || track.tags.handler_name;
            }
          });
		 

        }
      }

      function listenWebosSubs(_data) {
        log('Tracks', 'webos subs event');
        webos_replace.subs = _data.subs;
        if (inited_parse) setWebosSubs(_data.subs);
      }

      function listenWebosTracks(_data) {
        log('Tracks', 'webos tracks event');
        webos_replace.tracks = _data.tracks;
        if (inited_parse) setWebosTracks(_data.tracks);
      }

      function listenStart() {
        inited = true;
		webOS.service.request('luna://com.lampa.tv.service', {
			method: 'ffprobe',
			parameters: { 
				uri: data.url
			},
			onSuccess: function (event) {
			    try {
					inited_parse = JSON.parse(event.data);
                          } catch (e) {}
                
				log('Tracks', 'parsed', inited_parse);
                if (inited) {
                    if (webos_replace.subs) setWebosSubs(webos_replace.subs);else setSubs();
                    if (webos_replace.tracks) setWebosTracks(webos_replace.tracks);else setTracks();
                }
				console.log('ffprobe', 'webOS service called:', event.result, event.data, event.stderrText);

			},
			onFailure: function (event) {
				console.log('ffprobe',  'webOS service call [failed][', event.errorCode + ' ]', event.errorText);
			},
		});
      }

      function listenDestroy() {
        inited = false;
        Lampa.Player.listener.remove('destroy', listenDestroy);
        Lampa.PlayerVideo.listener.remove('tracks', listenTracks);
        Lampa.PlayerVideo.listener.remove('subs', listenSubs);
        Lampa.PlayerVideo.listener.remove('webos_subs', listenWebosSubs);
        Lampa.PlayerVideo.listener.remove('webos_tracks', listenWebosTracks);
        Lampa.PlayerVideo.listener.remove('canplay', canPlay);
        log('Tracks', 'end');
      }

      Lampa.Player.listener.follow('destroy', listenDestroy);
      Lampa.PlayerVideo.listener.follow('tracks', listenTracks);
      Lampa.PlayerVideo.listener.follow('subs', listenSubs);
      Lampa.PlayerVideo.listener.follow('webos_subs', listenWebosSubs);
      Lampa.PlayerVideo.listener.follow('webos_tracks', listenWebosTracks);
      Lampa.PlayerVideo.listener.follow('canplay', canPlay);
      listenStart();
    }

    Lampa.Player.listener.follow('start', function (data) {
      if (data.torrent_hash) subscribe(data);
    });

})();