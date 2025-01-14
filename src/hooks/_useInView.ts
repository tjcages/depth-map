"use client";

import { useEffect, useState } from "react";

export const useInView = (ref: React.RefObject<HTMLDivElement>) => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      setInView(entries[0].isIntersecting);
    });

    if (!ref.current) return;
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return inView;
};
