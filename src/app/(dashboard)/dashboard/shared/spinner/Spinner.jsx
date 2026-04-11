import React from 'react'
import './Spinner.css'

const Spinner = ({ color, styles }) => {

  const spinnerStyle = color ? { '--spinner-color': color } : {};
  const combinedStyles = { ...spinnerStyle, ...styles };

  return (
    <div className="sk-chase" style={combinedStyles}>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
    </div>
  )
}

export default Spinner