import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import isAuth from '../utils/isAuth'
import Lottie from 'lottie-react'
import axios from 'axios';
import animation2 from '../assets/animation2.json'
import { toast } from 'react-toastify';
function Room() {
  const navigate = useNavigate();
  const [roomID, setRoomId] = useState();
  const [userName, setUserName] = useState("Guest");

  const handleClick = () => {
    if (roomID != null) {
      axios.post('https://video-conference-application-2-backend.onrender.com/history/addUserHistory', { meeting_code: roomID }, { withCredentials: true })
        .then((res) => {
          console.log(res);
          setAddHistory(false);
        })
        .catch((e) => { console.log(e) })
      navigate(`/Room/${roomID}`);
    } else {
      toast.warning('Enter Room Id');
    }
  }

  // Fetch user details from session
  useEffect(() => {
    axios.get("https://video-conference-application-2-backend.onrender.com/api/user", { withCredentials: true }) // Send cookies with request
      .then((res) => setUserName(res.data.name))
      .catch(() => setUserName("Guest")); // If unauthorized, set default
  }, []);

  return (
    <div>
      <div className="roomContent">
        <div>
          <h1 className='text-3xl'>Hello {userName}!</h1>
          <h1 className='text-2xl'>Type Your Room Id</h1>
          <input type="text" name="" id="" placeholder='Enter Room Id' onChange={e => setRoomId(e.target.value)} className='roomId' required />
          <button type='submit' className='getStarted m-5 px-4 py-2 text-white font-bold transition-transform active:scale-90' onClick={handleClick}>
            Join
          </button>
        </div>
        <div>
          <Lottie animationData={animation2} className='animation' />
        </div>
      </div>
    </div>
  )
}

export default isAuth(Room);
