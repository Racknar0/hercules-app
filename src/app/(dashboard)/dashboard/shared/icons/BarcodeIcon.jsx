export const BarcodeIcon = ({ width = 24, height = 24, fill = "currentColor" }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="2" y="6" width="1" height="12" fill={fill}/>
        <rect x="4" y="6" width="2" height="12" fill={fill}/>
        <rect x="7" y="6" width="1" height="12" fill={fill}/>
        <rect x="9" y="6" width="1" height="12" fill={fill}/>
        <rect x="11" y="6" width="2" height="12" fill={fill}/>
        <rect x="14" y="6" width="1" height="12" fill={fill}/>
        <rect x="16" y="6" width="1" height="12" fill={fill}/>
        <rect x="18" y="6" width="2" height="12" fill={fill}/>
        <rect x="21" y="6" width="1" height="12" fill={fill}/>
        
        {/* Scanner line effect */}
        <line x1="1" y1="12" x2="23" y2="12" stroke={fill} strokeWidth="0.5" opacity="0.5"/>
        
        {/* Corner brackets */}
        <path d="M2 4V2H4M22 2V4H20M2 22V20H4M22 20V22H20" stroke={fill} strokeWidth="1.5" fill="none"/>
    </svg>
);
