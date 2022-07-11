import React from "react";
export const OverlayContentOnHover: React.FunctionComponent<{ show?: boolean; blur?: boolean; content: React.ReactNode }> = props => {
    const [show, setShow] = React.useState<boolean>(props.show ?? false);

    function OverlayBehaviour(): React.CSSProperties | undefined {
        if (show) return { opacity: "1" };
        else return { opacity: "0" };
    }

    return (
        <div className="overlay-container">
            {props.children}

            {props.show === undefined ? (
                <div className={`overlayFilter overlay ${props.blur ? "blur" : ""}`} style={OverlayBehaviour()} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
                    {props.content}
                </div>
            ) : (
                <div className={`overlayFilter overlay ${props.blur ? "blur" : ""}`} style={OverlayBehaviour()}>
                    {props.content}
                </div>
            )}
        </div>
    );
};

export const OverlayContent: React.FunctionComponent<{ show?: boolean; blur?: boolean; content: React.ReactNode }> = props => {
    function OverlayBehaviour(): React.CSSProperties | undefined {
        if (props.show) return { opacity: "1" };
        else return { opacity: "0" };
    }

    return (
        <div className="overlay-container">
            {props.children}

            {props.show === undefined ? (
                <div className={`overlayFilter overlay ${props.blur ? "blur" : ""}`} style={OverlayBehaviour()}>
                    {props.content}
                </div>
            ) : (
                <div className={`overlayFilter overlay ${props.blur ? "blur" : ""}`} style={OverlayBehaviour()}>
                    {props.content}
                </div>
            )}
        </div>
    );
};
