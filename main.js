/*
	Author: Zile42O
	Version: 1.1
	Public
*/


var video = document.getElementById("video");
video.addEventListener("dblclick", function() {
	if (video.requestFullscreen) {
		video.requestFullscreen();
	} else if (video.mozRequestFullScreen) {
		video.mozRequestFullScreen(); // Firefox
	} else if (video.webkitRequestFullscreen) {
		video.webkitRequestFullscreen(); // Chrome, Safari, Opera
	} else if (video.msRequestFullscreen) {
		video.msRequestFullscreen(); // IE/Edge
	}
});

function createRoom() {
	var roomID = Math.floor(Math.random() * 999999) + 10000;
	console.log(roomID);
	window.location.href = "room.html?id=" + roomID + "&share";
}

function getShareLink() {
	const urlParams = new URLSearchParams(window.location.search);
	const roomID = urlParams.get('id');
	var copyURL = window.location.origin + window.location.pathname + "?id=" + roomID + "&view";
	navigator.clipboard.writeText(copyURL);
	alert("Successfully copied share link of this room\nOpen it in new tab or share it with someone to watch screenshare.");
}

const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get('id');

var isViewer = urlParams.get('view');
var startButton = document.getElementById('startShare');
var peer;
var peerId = isViewer !== null ? 'viewer_' + roomID : 'nonviewer_' + roomID;
var localStream;


if (isViewer == null) {
	let element = document.getElementById('startShare');
	element.style.display = "";
	element = document.getElementById('getShare');
	element.style.display = "";
	element = document.getElementById('viewerMsg');
	element.style.display = "none";
	element = document.getElementById('viewerMsgStream');
	element.style.display = "none";
}

let roomLoading = document.getElementById('roomLoading');
roomLoading.innerText = "Room #" + roomID;

function initializePeer() {
	peer = new Peer(peerId);

	peer.on('open', (id) => {
		console.log('Peer ID: ', id);
		if (isViewer !== null) {
				peer.on('connection', (incomingConn) => {
				console.log('Sharer connected:', incomingConn);
				alert("You are now connected with sharer.");
				let element = document.getElementById('viewerMsgStream');
				element.style.display = "none";
				element = document.getElementById('connectionInitialized');
				element.style.display = "";

			});
			peer.on('call', (call) => {
				call.answer(localStream);
				handleIncomingCall(call);
			});
		} else {
			startButton.disabled = false;
			startButton.addEventListener('click', startScreenShare);
		}
	});
	peer.on('error', (error) => {
		console.error('Peer Error:', error);
		if (error.message.includes('Could not connect to')) {
			alert('Could not connect to peer, sharing will be terminated.\nYour viewer which one you sent share link must first enter to the link and load page to can initialize connection with you (P2P)');
			location.reload(); //reload page.
		}
		if (error.message.includes('Lost connection to server.')) {
			alert('Connection lost, try again.');
			location.reload(); //reload page.
		}
		if (error.message.includes('is taken')) {
			alert('Someone watching this, try again or request new share link.');
		}
	});
}

function startScreenShare() {
	alert("Note: Share first your room with someone to connect, then you can start screenshare!");

	const options = { video: true, audio: true };
	navigator.mediaDevices.getDisplayMedia(options)
		.then(handleSuccess)
		.catch(handleError);
}

function handleSuccess(stream) {
	localStream = stream;
	startButton.disabled = true;

	// Connect to the viewer
	var connection = peer.connect('viewer_' + roomID);

	connection.on('open', () => {
		console.log('Sharer connected to Viewer.');
		alert("You are now connected with viewer.\nAnd they can see your screen");
		const screenVideo = document.getElementById('video');
		screenVideo.style.display = "";
		screenVideo.autoplay = true;
		screenVideo.playsinline = true;
		screenVideo.srcObject = stream;
		
		let element = document.getElementById('connectionInitialized');
		element.style.display = "";

		var call = peer.call('viewer_' + roomID, localStream);
		handleIncomingCall(call);

		stream.getVideoTracks()[0].addEventListener('ended', () => {
			screenVideo.style.display = "none";
			startButton.disabled = false;
			alert("Stream ended");
			location.reload(); // (sync)
		});
	});
}

function handleIncomingCall(call) {
	call.on('stream', (stream) => {
		const screenVideo = document.getElementById('video');
		screenVideo.style.display = "";
		screenVideo.autoplay = true;
		screenVideo.playsinline = true;
		screenVideo.srcObject = stream;
		// Handle stream end
		stream.getVideoTracks()[0].addEventListener('ended', () => {
			alert("Stream ended by sharer.");
			screenVideo.style.display = "none";
			location.reload(); // (sync)
		});
	});
	
}

function handleError(error) {
	console.error('Error:', error);
}

initializePeer();