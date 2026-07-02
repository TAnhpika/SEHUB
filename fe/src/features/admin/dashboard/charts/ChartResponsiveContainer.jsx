import { useEffect, useRef, useState } from "react";

function ChartResponsiveContainer({ className, style, children }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      const nextWidth = Math.max(0, Math.floor(width));
      const nextHeight = Math.max(0, Math.floor(height));

      setSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {size.width > 0 && size.height > 0 && typeof children === "function"
        ? children(size)
        : null}
    </div>
  );
}

export default ChartResponsiveContainer;
