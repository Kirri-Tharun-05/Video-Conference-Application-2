const { Server } = require('socket.io');

let connections = {};
let messages = {};
let timeOnline = {};

const connectionToSocket = (server) => {
    const io = new Server(server,{
        cors:{
            origin:'*',
            methods:['GET','POST'],
            allowedHeaders:['*'], // change during production level
            credentials:true
        }
    });

    io.on('connection', (socket) => {
        console.log('Someone Connected');
        socket.on('join-call', (path) => {
            console.log('someone trying to join call : ',socket.id);
            // console.log(connections);
            if (connections[path] === undefined) {
                // console.log('inside Socket.js : path : ',path);
                connections[path] = [];
            }
            // here path (key) is a room number where socket.id is a user who are joining the room  
            connections[path].push(socket.id);

            // here timeOnline is storing the date info of every individual user using socket.id 
            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; a++) {
                // console.log(connections[path])
                io.to(connections[path][a]).emit('user-joined', socket.id,connections[path]);
                // console.log('inside loop')
            }

            if (messages[path] != undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    // sending the details of user to the new user => Data , name of sender, socket-id of the sender
                    io.to(socket.id).emit('chat-message', messages[path][a]['data'], messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }
        })

        socket.on('signal', (toId, message) => {   // Here A socket sent a message to Server
            io.to(toId).emit('signal', socket.id, message); // server is sending the message to the requested socket
        })

        socket.on('chat-message', (data, sender) => {
            console.log('inside socket.js for message')
            // Basically a user will send a message 
            // now we will find the room id of the user who sent the message
            // here includes() method will check the socket.id whether its present in the roomKey or not
            let matchingRoom = '';
            for (const roomKey in connections) {
                if (connections[roomKey].includes(socket.id)) {
                    matchingRoom = roomKey;
                    break;
                }
            }

            if (matchingRoom) {
                messages[matchingRoom] = messages[matchingRoom] || [];
                messages[matchingRoom].push({ 'data': data, 'sender': sender, 'socket-id-sender': socket.id }) // here we are storing the message data in messages[]
                console.log('message', matchingRoom, ':', sender, data); // can occur error due to key

                connections[matchingRoom].forEach(user => {
                    io.to(user).emit('chat-message', data, sender, socket.id); // Now we are sending incomming messages to all users that we have stored in messages[]               
                });
            }

        })

        socket.on('disconnect', () => {
            var time=Math.abs(timeOnline[socket.id] - new Date())
            var key;
           
            for(const[room,users] of Object.entries(connections)){ // Object.entries will convert the connection  object to array format
                if(users.includes(socket.id)){
                     // Notify other users that this user has left
                    users.forEach(userSocketid=>{
                        io.to(userSocketid).emit('user-left',socket.id);
                    });

                    // Remove the user from the room
                    connections[room] =users.filter(id=>id!==socket.id);

                    // if the room is now empty, delete it
                    if(connections[room].length===0)
                    {
                        delete connections[room];
                        delete messages[room];
                        console.log(`Room ${room} is now empty. Deleted the room and its messages.`);
                    }
                    break; // Exit once the room is found
                }
            }

        })
    })
    return io;
}

module.exports={connectionToSocket}