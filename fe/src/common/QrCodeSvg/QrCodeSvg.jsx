import qrcode from "qrcode-generator";

function cellsToPath(cells, dark) {
  return cells
    .map((row, rowIndex) =>
      row
        .map((cell, colIndex) =>
          cell === dark ? `M ${colIndex} ${rowIndex} l 1 0 0 1 -1 0 Z` : ""
        )
        .join(" ")
    )
    .join(" ");
}

export default function QrCodeSvg({
  value,
  size = 256,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "L",
  className,
  style,
}) {
  qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

  const qr = qrcode(0, level);
  qr.addData(value);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cells = Array.from({ length: moduleCount }, (_, rowIndex) =>
    Array.from({ length: moduleCount }, (_, colIndex) => qr.isDark(rowIndex, colIndex))
  );

  return (
    <svg
      height={size}
      width={size}
      viewBox={`0 0 ${moduleCount} ${moduleCount}`}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={cellsToPath(cells, false)} fill={bgColor} />
      <path d={cellsToPath(cells, true)} fill={fgColor} />
    </svg>
  );
}
