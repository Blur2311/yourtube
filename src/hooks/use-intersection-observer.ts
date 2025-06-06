import { useState, useRef, useEffect } from "react";


export const useIntersectionObserver = (options: IntersectionObserverInit) => {
  const [isInterecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }
    return () => observer.disconnect();
  }, [options]);

  return {
    targetRef,
    isInterecting,
  };
}