import React from 'react'
import Lottie from 'lottie-react'
import animation1 from '../../assets/animation1.json'
import animation2 from '../../assets/animation2.json'
import animation3 from '../../assets/animation3.json'
import Card from './Card.jsx'
import cardContent from './features.js';
const Features = () => {
  return (
    <div className='my-20 flex flex-col items-center'>
      <h1 className='text-5xl text-center '>Powerful Features for Seamless <br />Communication</h1>
      {/* <Lottie animationData={animation1} style={{height:'10rem'}}/>
        <Lottie animationData={animation2}/>
        <Lottie animationData={animation3} style={{height:'10rem'}}/> */}
      <div className="gap-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 my-20">
        {
            cardContent.Cards.map((feature,index) => (
              <Card key={index} title={feature.title} content={feature.desc}/>
            ))
        }
      </div>
    </div>
  )
}
export default Features;