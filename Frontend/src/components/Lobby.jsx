import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import io from "socket.io-client";
const server_URL = 'https://video-conference-application-2-backend.onrender.com'
import redCall from '../logos/Call-red.png'
import greenCall from '../logos/Call-green.png'
import micOn from '../logos/micOn.png'
import micOff from '../logos/micOff.png'
import screenShare from '../logos/share.png'
import videoOn from '../logos/video.png'
import videoOff from '../logos/no-video.png'
import screenShareStop from '../logos/screen.png'
import chat from '../logos/chat.png'
import isAuth from '../utils/isAuth';
var connections = {};
const peerConfigConnections = {
    'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' }  // this is a Stun server used to extract the public ip address of the individual 
        // STUN server are lightweight servers running on the public internet which eturns the IP address of the requester's device. 
    ]
}
function Lobby() {
    console.log('connections : ', connections);
    console.log('connections : ', Object.keys(connections).length);


    var socketRef = useRef();
    let socketIdRef = useRef(); // Refers to current user socket id

    let localVideoRef = useRef(); // current user video
    let routeTo = useNavigate();
    let [videoAvailable, setVideoAvailable] = useState(true); // To store the permission for camara (video).
    let [audioAvailable, setAudioAvailable] = useState(true); // to store the perrmission for Mic (audio)

    let [video, setVideo] = useState([]); // to handle video off/on

    let [audio, setAudio] = useState();// we will set the source for the audio

    let [screen, setScreen] = useState();// we will set the source for sharing the screen

    let [showModal, setShowModal] = useState();// 

    let [screenAvailable, setScreenAvailable] = useState(); // to set the screen share 

    let [messages, setMessages] = useState([]); // to set all messages

    let [message, setMessage] = useState();// to set the current user message

    let [newMessages, setNewMessages] = useState(0); // Fot the notification of new messages

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState(); // to set the username

    let [chatBar, setChatBar] = useState(false);

    let [videos, setVideos] = useState([]); // will store the videos
    // Whenever a new user joins or updates their video stream, setVideos updates the state.
    // This state will trigger a re-render, ensuring the video elements are updated on the screen.

    const videoRef = useRef([]) //A React ref (useRef) that stores the same list of video streams but does NOT trigger re-renders.
    //Manually updated whenever videos is updated.

    console.log(messages);
    const getPermissions = async () => {  // This function is to get the permissions for the video and audio
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true }); // getting user permission for video
            if (videoPermission) {
                setVideoAvailable(true);
            }
            else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true }); // getting user permission for audio
            if (audioPermission) {
                setAudioAvailable(true);
            }
            else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }
            else {
                setScreenAvailable(false);
            }
            if (videoAvailable || audioAvailable) { // from here we will get the stream that we will send to different users through WEB RTC
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable })

                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        } catch (e) {
            console.log(e);
        }
    }

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })

        }
        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e);
            }

            // todo BlackSilence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        }).cathch(e => { console.log(e) })
                })
            }
        })
    }

    let silence = () => {
        let context = new AudioContext(); // Creates an audio context
        let Oscillator = context.createOscillator(); // Generates a continuous tone
        let destination = Oscillator.connect(context.createMediaStreamDestination()); // Connects to a media stream
        Oscillator.start(); // Starts generating the sound
        context.resume(); // Ensures the audio context is running
        return Object.assign(destination.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement('canvas'), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    };

    let getUserMedia = () => {  // this function is to handle the video and audio controlles
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess) // getUserMediaSuccess
                .then((stream) => { })
                .catch((e) => { console.log(e) })
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }
    useEffect(() => {
        getPermissions();
    }, [])

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia()
        }
    }, [audio, video]);

    // todo addMessage
    let addMessage = (data, sender, socketIdSender) => {
        console.log(data, ':', sender, ':', socketIdSender);
        setMessages((prevMessages) => [
            ...prevMessages, { sender: sender, data: data }
        ]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevMessages) => prevMessages + 1);
        }
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {  // Ensure that the message is NOT from the current user (prevents handling own signals)
            // Local Description → The SDP message they create.
            // Remote Description → The SDP message they receive from the other peer.
            // it is like   second user ---> server ----> current user (he recieved a offer)   then      current user(create's a answer) ---> server ---->second user   
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)) //If Peer A sends an offer, then for Peer B, that offer is considered remote.
                    .then(() => {
                        if (signal.sdp.type === 'offer') { // If the received SDP is an "offer", the other peer (receiver) must create an "answer"
                            connections[fromId].createAnswer().then((description) => {
                                console.log("printing the description : ", description);
                                connections[fromId].setLocalDescription(description).then(() => {
                                    // Send the answer back to the original peer through the signaling server
                                    socketRef.current.emit('signal', fromId, JSON.stringify({ "sdp": connections[fromId].localDescription })) //sending the answer to the second user who sent the offer
                                }).catch(e => console.log(e))
                            }).catch(e => { console.log(e) })
                        }
                    }).catch(e => { console.log(e) })
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => { console.log(e) });
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_URL, { secure: false });

        console.log('inside connectToSocketServer : ', socketRef);

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            console.log('Connect is triggered in front end');

            socketRef.current.emit('join-call', window.location.href); // sending path to socket.js server

            socketIdRef.current = socketRef.current.id; //after Connection the socket will get a id

            socketRef.current.on('chat-message', addMessage); // getting the message from server

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))// We will get all the videos except the user id who left the room
            })

            socketRef.current.on('user-joined', (id, clients) => { // it receives id (the new user's ID) and clients (a list of existing users in the call).
                console.log('user Joined : ', id);
                clients.forEach((socketListId) => {


                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections); //RTCPeerConnection is a WebRTC API that helps in establishing a direct connection between two users for video/audio.

                    connections[socketListId].onicecandidate = (event) => {  // Here ice is a protocal ICE(Intractive Connectivity Establishment)
                        if (event.candidate !== null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate })) // sending the details towards the Signaling Server
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        // this is how the info will be stored in videoRef
                        // videoRef.current = [
                        //     {
                        //         socketId: "user123",
                        //         stream: MediaStream {},

                        // here MediaStream ==> MediaStream {
                        //     id: "random-id",
                        //     active: true,
                        //     onaddtrack: null,
                        //     onremovetrack: null
                        // }

                        //         autoPlay: true,
                        //         playsinLine: true
                        //     },
                        //     {
                        //         socketId: "user456",
                        //         stream: MediaStream {},
                        //         autoPlay: true,
                        //         playsinLine: true
                        //     }
                        // ];

                        // connections[] stores WebRTC connections for each user.
                        // connections = {
                        //     "user123": RTCPeerConnection {}, // WebRTC connection for user123
                        //     "user456": RTCPeerConnection {}, // WebRTC connection for user456
                        //     "user789": RTCPeerConnection {}  // WebRTC connection for user789
                        // };

                        // ✔ videoRef.current keeps an updated list of video streams without causing re-renders.


                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsInLine: true
                            }
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                console.log("Updated Videos:", updatedVideos);
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                    }

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    }
                    else {
                        // todo blacksilence

                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream)
                        }
                        catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        console.log('inside getMedia function : ', video); // it will give undefined because setVideo and setAudio are asyncronous
        console.log('inside getMedia function : ', videoAvailable);
        console.log('inside getMedia function : ', audio);
        console.log('inside getMedia function : ', audioAvailable);
        connectToSocketServer();
    }

    let connect = () => { // when the user will click on the join button he will arive here. 
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }
    let handleAudio = () => {
        setAudio(!audio);
    }
    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(tracks => tracks.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => [
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', JSON.stringify({ 'sdp': connections[id].localDescription }))
                })
                    .catch(e => console.log(e))
            ])
        }
        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e);
            }

            // todo BlackSilence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => { console.log(e) })
            }
        }
    }
    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }

    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }
    let handleChatBar = () => {
        setChatBar(!chatBar);
    }
    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage('');
    }
    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { console.log(e) }

        // Clean up socket connection
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        // Clean up connections
        for (let id in connections) {
            if (connections[id]) {
                connections[id].close();
                delete connections[id];
            }
        }
        if ((Object.keys(connections).length) === 0) {
            setMessages([]);
        }

        routeTo('/home');
    }
    return (
        <div>
            {askForUsername === true ? <div className='grid grid-cols-1 sm:grid-cols-2 px-10 items-center '>

                <div className="">
                    <label htmlFor="username">Username</label>
                    <input type="text" id='username' style={{ margin: '1rem', backgroundColor: 'white', color: 'black' }} onChange={e => { setUsername(e.target.value) }} />
                    <button type='submit' className='getStarted m-5 px-4 py-2 text-white font-bold transition-transform active:scale-90 join' onClick={connect}>
                        Join
                    </button>
                </div>
                <div>
                    <video ref={localVideoRef} autoPlay muted className='rounded-2xl drop-shadow-2xl'></video>
                </div>
            </div> :
                <div className='meetVideoContainer flex justify-center overflow-hidden'>
                    <div className={`Chat-Bar w-2xs ${chatBar ? 'show' : 'hide'} flex flex-col`}>
                        <div className='chatTitle'>
                            <p className='text-3xl text-black underline'>Chat-Box</p>
                        </div>
                        <div className='chatMessages'>
                            <p style={{ color: 'black' }}>{ }</p>
                            {messages.map((item, index) => {
                                console.log("inside the messages.map : ", item)
                                console.log("inside the messages.map : ", username)
                                const isCurrentUser = item.sender === username; // Compare sender with the current user

                                return (
                                    <div key={index} className='border-black border-3 rounded-2xl overflow-hidden text-start flex mb-1'>
                                        <p className={`font-bold ${isCurrentUser ? 'bg-blue-500' : 'bg-amber-600'} text-white px-5 py-1`}>
                                            {item.sender}
                                        </p>
                                        <p className={`font-bold ${isCurrentUser ? 'bg-blue-300' : 'bg-amber-300'} text-black px-5 py-1 w-full`}>
                                            {item.data}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className='messageBox chatInputBox'>
                            <input type="text" placeholder='Type your message' value={message} onChange={e => setMessage(e.target.value)} />
                            <button type='submit' onClick={sendMessage} >Send</button>
                        </div>
                    </div>

                    {/* <p className='text-white text-4xl'>{socketIdRef.current}</p> */}
                    <video ref={localVideoRef} autoPlay muted className={`meetUserContainer ${chatBar ? 'shift-left' : ''} ${videos.length >= 2 ? 'min-video' : 'max-video'}`}></video>
                    <div className='conference pb-15 flex flex-wrap justify-center '>
                        {videos.map((video) => (
                            <div key={video.socketId} className='conferenceContainer w-full sm:w-1/2 lg:w-1/2 '>
                                <h2 style={{ color: 'white' }}>{video.socketId}</h2>
                                <video ref={ref => {
                                    if (ref && video.stream) {
                                        ref.srcObject = video.stream;
                                    }
                                }} autoPlay className='p-5 rounded-4xl'></video>
                            </div>
                        ))}
                    </div>

                    <div className="buttons" >
                        {video === true ? <img src={videoOn} alt="" className='mic call' onClick={handleVideo} style={{ cursor: 'pointer' }} /> : <img src={videoOff} alt="" className='mic call' style={{ cursor: 'pointer' }} onClick={handleVideo} />}
                        {audio === true ? <img src={micOn} alt="" className='mic call' onClick={handleAudio} style={{ cursor: 'pointer' }} /> : <img src={micOff} alt="" className='mic call mic-off' style={{ cursor: 'pointer' }} onClick={handleAudio} />}
                        <img src={redCall} alt="" className='call' style={{ cursor: 'pointer' }} onClick={handleEndCall} />
                        {/* <img src={greenCall} alt="" className='call' />  */}
                        {screenAvailable === true ? (screen == true ? <img src={screenShare} alt="" className='call mic' style={{ cursor: 'pointer' }} onClick={handleScreen} /> : <img src={screenShareStop} alt="" className='call mic' style={{ cursor: 'pointer' }} onClick={handleScreen} />) : <></>}
                        <div className='chat'>
                            <img src={chat} alt="" className='call mic chat-img' style={{ cursor: 'pointer' }} onClick={handleChatBar} />
                            <div className='new-message'>
                                <p className='newMessages'>{newMessages}</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

export default isAuth(Lobby);