import React from 'react';
import BarcodePrinter from './components/barcodePrinter/BarcodePrinter'; 

const BarcodeManager = () => {
    return (
        <div className="container-fluid mt-4">
            <BarcodePrinter />
        </div>
    );
};

export default BarcodeManager;
