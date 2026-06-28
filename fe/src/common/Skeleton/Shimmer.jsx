import shimmerStyles from "./shimmer.module.css";

function Shimmer({ className = "" }) {
  return (
    <span
      className={`${shimmerStyles.shimmer} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export default Shimmer;
