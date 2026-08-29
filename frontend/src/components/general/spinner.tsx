import { type CSSProperties } from "react";
import styles from './spinner.module.css'


export default function Orbit({
  size = 100,
  color = "#426892",
  style,
  className = "",
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const orbit_style = { borderColor: color };
  return (
    <div
      style={{
        ...style,
        width: size,
        height: size,
      }}
      className={`${styles['orbit-spinner']} ${className}`}
    >
      <div style={orbit_style} className={styles.orbit}></div>
      <div style={orbit_style} className={styles.orbit}></div>
      <div style={orbit_style} className={styles.orbit}></div>
    </div>
  );
}
