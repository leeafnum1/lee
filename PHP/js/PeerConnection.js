// Muaz Khan     - https://github.com/muaz-khan
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/websocket

(function () {
	var isMobile = {
	        Android: function() {
	            return navigator.userAgent.match(/Android/i);
	        },
	        BlackBerry: function() {
	            return navigator.userAgent.match(/BlackBerry|BB10/i);
	        },
	        iOS: function() {
	            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	        },
	        Opera: function() {
	            return navigator.userAgent.match(/Opera Mini/i);
	        },
	        Windows: function() {
	            return navigator.userAgent.match(/IEMobile/i);
	        },
	        any: function() {
	            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	        },
	        getOsName: function() {
	            var osName = 'Unknown OS';
	            if (isMobile.Android()) {
	                osName = 'Android';
	            }

	            if (isMobile.BlackBerry()) {
	                osName = 'BlackBerry';
	            }

	            if (isMobile.iOS()) {
	                osName = 'iOS';
	            }

	            if (isMobile.Opera()) {
	                osName = 'Opera Mini';
	            }

	            if (isMobile.Windows()) {
	                osName = 'Windows';
	            }

	            return osName;
	        }
	   };
    window.PeerConnection = function (socketURL, userid) {
    	console.log(userid);
        this.userid = userid || getToken();
        this.peers = {};

        if (!socketURL) throw 'Socket-URL is mandatory.';

        new Signaler(this, socketURL);
		
		this.addStream = function(stream) {	
			this.MediaStream = stream;
		};
    };

    function Signaler(root, socketURL) {
        var self = this;
       
        root.startBroadcasting = function () {
			if(!root.MediaStream) throw 'Offerer must have media stream.';
			
            (function transmit() {
                con.send({
                    userid: root.userid,
                    broadcasting: true
                });
//                !self.participantFound &&
//                    !self.stopBroadcasting &&
//                        setTimeout(transmit, 3000);
            })();
        };

        root.sendParticipationRequest = function (userid) {
            con.send({
                participationRequest: true,
                userid: root.userid,
                to: userid
            });
        };

        // if someone shared SDP
        this.onsdp = function (message) {
        	
            var sdp = message.sdp;
           
            if (sdp.type == 'offer') {
                root.peers[message.userid] = Answer.createAnswer(merge(options, {
                    MediaStream: root.MediaStream,
                    sdp: sdp
                }));
            }

            if (sdp.type == 'answer') {
                root.peers[message.userid].setRemoteDescription(sdp);
            }
        };

        root.acceptRequest = function (userid) {
            root.peers[userid] = Offer.createOffer(merge(options, {
                MediaStream: root.MediaStream
            }));
        };

        var candidates = [];
        // if someone shared ICE
        this.onice = function (message) {
            var peer = root.peers[message.userid];
            if (peer) {
                peer.addIceCandidate(message.candidate);
                for (var i = 0; i < candidates.length; i++) {
                    peer.addIceCandidate(candidates[i]);
                }
                candidates = [];
            } else candidates.push(candidates);
        };

        // it is passed over Offer/Answer objects for reusability
        var options = {
            onsdp: function (sdp) {
            	 
                con.send({
                    userid: root.userid,
                    sdp: sdp,
                    to: root.participant
                });
            },
            onicecandidate: function (candidate) {
                con.send({
                    userid: root.userid,
                    candidate: candidate,
                    to: root.participant
                });
            },
            onStreamAdded: function (stream) {
                console.debug('onStreamAdded', '>>>>>>', stream);

                stream.onended = function () {
                    if (root.onStreamEnded) root.onStreamEnded(streamObject);
                };

                var mediaElement = document.createElement('video');
                mediaElement.id = root.participant;
                try{
                	mediaElement[isFirefox ? 'mozSrcObject' : 'src'] = isFirefox ? stream : window.webkitURL.createObjectURL(stream);
                }catch(e){
                	mediaElement.srcObject = stream;
                }
                mediaElement.autoplay = true;
                mediaElement.controls = false;
                mediaElement.play();

                var streamObject = {
                    mediaElement: mediaElement,
                    stream: stream,
                    userid: root.participant,
                    type: 'remote'
                };

                function afterRemoteStreamStartedFlowing() {
                    if (!root.onStreamAdded) return;
                    root.onStreamAdded(streamObject);
                }

                afterRemoteStreamStartedFlowing();
            }
        };

        function closePeerConnections() {
            self.stopBroadcasting = true;
             if (root.MediaStream){
            	 var tempMS =root.MediaStream;
            	 for(var i = 0 ; i< MediaStream.length ; i++){
            		 root.MediaStream.removeTrack(root.MediaStream.getTracks()[0]);
            	 }
            	 root.MediaStream =null;
             }

            for (var userid in root.peers) {
                root.peers[userid].peer.close();
            }
            root.peers = {};
        }

        root.close = function () {
            con.send({
                userLeft: true,
                userid: root.userid,
                to: root.participant
            });
            closePeerConnections();
        };

        window.onbeforeunload = function () {
            root.close();
        };

        window.onkeyup = function (e) {
            if (e.keyCode == 116)
                root.close();
        };
		
		function onmessage(e) {
			var message ;
			try{
				
				 message = JSON.parse(e.data);
//				 console.log(e);
//				 console.log(Object.values(e));
//				console.log(JSON.stringify(message));
			}catch(e){
//				console.log(e);
				message=e;
				
			}
            if (message.userid == root.userid) return;
            root.participant = message.userid;

            // for pretty logging
            console.debug(JSON.stringify(message, function (key, value) {
                if (value && value.sdp) {
                    console.log(value.sdp.type, '---', value.sdp.sdp);
                    return '';
                } else return value;
            }, '---'));

            // if someone shared SDP
            if (message.sdp && message.to == root.userid) {
                self.onsdp(message);
            }

            // if someone shared ICE
            if (message.candidate && message.to == root.userid) {
                self.onice(message);
            }

            // if someone sent participation request
            if (message.participationRequest && message.to == root.userid) {
//                self.participantFound = true;

                if (root.onParticipationRequest) {
                    root.onParticipationRequest(message.userid);
                } else root.acceptRequest(message.userid);
            }

            // if someone is broadcasting himself!
            if (message.broadcasting && root.onUserFound) {
                root.onUserFound(message.userid);
            }

            if (message.userLeft && message.to == root.userid) {
                closePeerConnections();
                console.log("userLeft");
            }
            appendDIV(e);
		}

		var socket = socketURL;
		if(typeof socketURL == 'string') {
			socket = new WebSocket(socketURL);
			socket.push = con.send;
			con.send = function (data) {
				console.log(typeof data)
				if(typeof data === 'object'){
					socket.push(JSON.stringify(data));
				}else{
					socket.push(data);
				}
			};

		}
		socket.onmessage = onmessage;
    }
//    alert(isMobile.getOsName());
    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    window.URL = window.webkitURL || window.URL;

    var isFirefox = !!navigator.mozGetUserMedia;
    var isChrome = !!navigator.webkitGetUserMedia;




    var iceServers = {
        
    };
    var TURN = {
            url: 'turn:webrtcweb.com:443',
            credential: 'muazkh',
            username: 'muazkh'
        };

    iceServers.iceServers = [{urls: "stun:61.111.3.14:2222", username: "brainst", credential: "worzm%%%"},{urls: "turn:61.111.3.14:2222", username: "brainst", credential: "worzm%%%"}];
    console.log("Ss");
    if (isChrome) {
//    	console.log("Ss");
//        if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) >= 28)
//            TURN = {
//                url: 'turn:webrtcweb.com:443',
//                credential: 'muazkh',
//                username: 'muazkh'
//            };
//
//        iceServers.iceServers = [STUN, TURN];
    }

    var optionalArgument = {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }, {
                googImprovedWifiBwe: true
            }, {
                googScreencastMinBitrate: 300
            }, {
                googIPv6: true
            }, {
                googDscp: true
            }, {
                googCpuUnderuseThreshold: 55
            }, {
                googCpuOveruseThreshold: 85
            }, {
                googSuspendBelowMinBitrate: true
            }, {
                googCpuOveruseDetection: true
            }],
            mandatory: {}
    };

    var offerAnswerConstraints = {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };

    function getToken() {
        return Math.round(Math.random() * 9999999999) + 9999999999;
    }
	
	function onSdpError() {}

    // var offer = Offer.createOffer(config);
    // offer.setRemoteDescription(sdp);
    // offer.addIceCandidate(candidate);
    var Offer = {
        createOffer: function (config) {
            var peer = new RTCPeerConnection(iceServers, optionalArgument);

            if (config.MediaStream) peer.addStream(config.MediaStream);
            peer.onaddstream = function (event) {
                config.onStreamAdded(event.stream);
            };

            peer.onicecandidate = function (event) {
                if (event.candidate)
                    config.onicecandidate(event.candidate);
            };

            peer.createOffer(function (sdp) {
            	try{
//            		alert(isMobile.getOsName());
            	}catch(e){
            		alert(e);
            	}
            	sdp.sdp = spdToAddBandwidth(sdp.sdp);
//                if(isMobile.getOsName() ==='iOS'){
//            		sdp.sdp = sdpToReplacePreferCodec(sdp.sdp, /m=video(:?.*)?/, "H264");
//            	}
                peer.setLocalDescription(sdp);
                config.onsdp(sdp);
//                console.log(sdp);
            }, onSdpError, offerAnswerConstraints);
            
            this.peer = peer;

            return this;
        },
        setRemoteDescription: function (sdp) {
            this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
        },
        addIceCandidate: function (candidate) {
            this.peer.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));
        }
    };

    // var answer = Answer.createAnswer(config);
    // answer.setRemoteDescription(sdp);
    // answer.addIceCandidate(candidate);
    var Answer = {
        createAnswer: function (config) {
            var peer = new RTCPeerConnection(iceServers, optionalArgument);

            if (config.MediaStream) peer.addStream(config.MediaStream);
            peer.onaddstream = function (event) {
                config.onStreamAdded(event.stream);
            };

            peer.onicecandidate = function (event) {
                if (event.candidate)
                    config.onicecandidate(event.candidate);
            };

            peer.setRemoteDescription(new RTCSessionDescription(config.sdp));
            peer.createAnswer(function (sdp) {
            	try{
//            		alert(isMobile.getOsName());
            	}catch(e){
            		alert(e);
            	}
            	sdp.sdp = spdToAddBandwidth(sdp.sdp);
//                if(isMobile.getOsName() ==='iOS'){
//                	sdp.sdp = sdpToReplacePreferCodec(sdp.sdp, /m=video(:?.*)?/, "H264");
//            	}
                peer.setLocalDescription(sdp);
                config.onsdp(sdp);
            }, onSdpError, offerAnswerConstraints);

            this.peer = peer;

            return this;
        },
        addIceCandidate: function (candidate) {
            this.peer.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));
        }
    };

    function merge(mergein, mergeto) {
        for (var t in mergeto) {
            mergein[t] = mergeto[t];
        }
        return mergein;
    }
	
	window.URL = window.webkitURL || window.URL;
	navigator.getMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||navigator.getUserMedia;
	 
	function sdpToReplacePreferCodec(sdp, mLineReg, preferCodec){
	  var mLine,
	    newMLine = [],
	    sdpCodec,
	    mLineSplit,
	    reg = new RegExp("a=rtpmap:(\\d+) " + preferCodec + "/\\d+");

	  mLine = sdp.match(mLineReg);
	  if(!mLine){
	    return sdp;
	  }

	  sdpCodec = sdp.match(reg);
	  if(!sdpCodec){
	    return sdp;
	  }

	  mLine = mLine[0];
	  sdpCodec = sdpCodec[1];

	  mLineSplit = mLine.split(" ");
	  newMLine.push(mLineSplit[0]);
	  newMLine.push(mLineSplit[1]);
	  newMLine.push(mLineSplit[2]);
	  newMLine.push(sdpCodec);

	  for(var i=3; i<mLineSplit.length; i++){
	    if(mLineSplit[i] !== sdpCodec){
	      newMLine.push(mLineSplit[i]);
	    }
	  }

	  return sdp.replace(mLine, newMLine.join(" "));
	}
	
	
	
})();

function spdToAddBandwidth(sdp){
	  //bundle 검색
	  var bundles = sdp.match(/a=group:BUNDLE (.*)?\r\n/);
	  if(bundles){
	    if(bundles[1]){
	      bundles = bundles[1].split(" ");
	    }
	    else{
	      return sdp;
	    }
	  }
	  else{
	    return sdp;
	  }

	  //각 미디어의 밴드위드스 설정값
	  var maxab = 32,
	    maxvb = 128,
	    maxdb = 1638400;

	  sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "");

	  for(var i=0; i<bundles.length; i++){
	    if(bundles[i] === "audio" || bundles[i] === "sdparta_0"){
	      sdp = sdp.replace("a=mid:"+bundles[i]+"\r\n", "a=mid:"+bundles[i]+"\r\nb=AS:" + maxab + "\r\n");
	    }else if(bundles[i] === "video" || bundles[i] === "sdparta_1"){
	      sdp = sdp.replace("a=mid:"+bundles[i]+"\r\n", "a=mid:"+bundles[i]+"\r\nb=AS:" + maxvb + "\r\n");
	    }else if(bundles[i] === "data" || bundles[i] === "sdparta_2"){
	      sdp = sdp.replace("a=mid:"+bundles[i]+"\r\n", "a=mid:"+bundles[i]+"\r\nb=AS:" + maxdb + "\r\n");
	    }
	  }

	  return sdp;
	}
