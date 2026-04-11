import React from 'react';

export default function IconBillBlue(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={48}
            height={48}
            viewBox="0 0 48 48"
            {...props}
        >
            <g
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
            >
                <path
                    fill="#2f88ff"
                    stroke="#000"
                    d="M10 6C10 4.89543 10.8954 4 12 4H36C37.1046 4 38 4.89543 38 6V44L31 39L24 44L17 39L10 44V6Z"
                ></path>
                <path stroke="#fff" d="M18 22L30 22"></path>
                <path stroke="#fff" d="M18 30L30 30"></path>
                <path stroke="#fff" d="M18 14L30 14"></path>
            </g>
        </svg>
    );
}
