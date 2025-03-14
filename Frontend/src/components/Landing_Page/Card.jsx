import React from 'react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const Card = ({ title, content }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div>
            <motion.div transition={{ layout: { duration: 0.5, type: 'spring' } }} layout className='card leading-7 border rounded-xl p-0.5' onClick={(e) => { setIsOpen(!isOpen) }}>
                <div className="texttitle">
                    <motion.h2 layout="position" className='text-3xl font-bold tracking-wider'>{title}</motion.h2>
                </div>
                {
                    isOpen && (
                        <motion.div className='expand overflow-hidden py-8 '>
                            <p className='w-full content'>{content}</p>
                        </motion.div>
                    )
                }
            </motion.div>
        </div>
    )
}

export default Card;