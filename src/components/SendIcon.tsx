function SendIcon({ cx, ...rest }: { cx?: string; onClick?: () => void }) {
  return (
    <svg viewBox="0 0 24 24" className={cx} {...rest}>
      <path
        d="M5.521,19.9h5.322l3.519,3.515a2.035,2.035,0,0,0,1.443.6,2.1,2.1,0,0,0,.523-.067,2.026,2.026,0,0,0,1.454-1.414L23.989,1.425Z"
        fill="currentColor"
      />
      <path
        d="M4.087,18.5,22.572.012,1.478,6.233a2.048,2.048,0,0,0-.886,3.42l3.495,3.492Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default SendIcon;
