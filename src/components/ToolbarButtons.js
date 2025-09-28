import React from "react";
import styles from "../styles/AnimatedToolbarButtons.module.css";

// Animated, theme-colored floating toolbar for the whole app
export default function AnimatedToolbarButtons({ onLeft, onMiddle, onRight }) {
  return (
    <div className={styles.buttonBox}>
      {/* Touch zones for animation triggers */}
      <div className={styles.touch + " left"} tabIndex={0} aria-label="Add Column" onClick={onLeft} />
      <div className={styles.touch + " middle"} tabIndex={0} aria-label="Add Row" onClick={onMiddle} />
      <div className={styles.touch + " right"} tabIndex={0} aria-label="Fullscreen" onClick={onRight} />

      {/* Animated buttons */}
      <button
        type="button"
        className={styles.button + " " + styles.leftBtn}
        onClick={onLeft}
        aria-label="Add Column"
        title="Add Column"
      >
        {/* Table/Column icon */}
        <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#311703" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M9 3v18M15 3v18"/></svg>
      </button>
      <button
        type="button"
        className={styles.button + " " + styles.middleBtn}
        onClick={onMiddle}
        aria-label="Add Row"
        title="Add Row"
      >
        {/* Plus icon */}
        <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#311703" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
      </button>
      <button
        type="button"
        className={styles.button + " " + styles.rightBtn}
        onClick={onRight}
        aria-label="Fullscreen"
        title="Fullscreen"
      >
        {/* Maximize icon */}
        <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8v8H8z"/></svg>
      </button>
    </div>
  );
}
