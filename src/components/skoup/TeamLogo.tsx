import { useState } from "react";

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function TeamLogo({
  src,
  name,
  size = 28,
  rounded = 4,
}: {
  src: string;
  name: string;
  size?: number;
  rounded?: number;
}) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    const hue = hashHue(name);
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: rounded,
          backgroundColor: `hsl(${hue} 55% 40%)`,
          fontSize: Math.round(size * 0.45),
        }}
        className="flex shrink-0 items-center justify-center font-display font-bold text-white"
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      style={{ width: size, height: size, borderRadius: rounded, objectFit: "contain" }}
      className="shrink-0"
    />
  );
}
