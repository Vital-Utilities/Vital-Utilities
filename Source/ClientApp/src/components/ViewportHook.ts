import React from "react";

export default function useOnScreen(ref: React.RefObject<Element>) {
    const [isIntersecting, setIntersecting] = React.useState(false);

    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));

    React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        observer.observe(ref.current!);
        // Remove the observer as soon as the component is unmounted
        return () => {
            observer.disconnect();
        };
    }, []);

    return isIntersecting;
}

// react hook that takes a ref to an element and returns whether or not it is on screen
