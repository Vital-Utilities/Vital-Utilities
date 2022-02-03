import React from "react";

export const ShowOnHover: React.FunctionComponent = props => {
    const [show, setShow] = React.useState<boolean>();

    function OverlayBehaviour(): React.CSSProperties | undefined {
        if (show) return { opacity: "1" };
        else return { opacity: "0" };
    }

    return (
        <div className="overlayFilter overlay" style={OverlayBehaviour()} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {props.children}
        </div>
    );
};
