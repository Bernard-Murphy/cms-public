import React from "react";

const getSize = (size) => {
  switch (size) {
    case "sm":
      return "1rem";
    case "md":
      return "2rem";
    case "lg":
      return "3rem";
    case "xl":
      return "4rem";
    default:
      return "2rem";
  }
};

/**
 *
 *
 * Can pass the following optional props:
 * size - "sm" | "md" | "lg" | "xl" - default "md"
 * color - String, any mdb css global color variable - default "#fff"
 * multiColor - Boolean. If true, the spinner will change colors every spin.
 *
 * @returns A loading spinner
 */
const Spinner = (props) => (
  <>
    {typeof document !== "undefined" ? (
      <svg
        className={props.className}
        width={props.width || getSize(props.size)}
        height={props.height || getSize(props.size)}
        viewBox="0 0 66 66"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 33 33;270 33 33"
            begin="0s"
            dur="1.4s"
            fill="freeze"
            repeatCount="indefinite"
          />
          <circle
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            cx="33"
            cy="33"
            r="30"
            strokeDasharray="187"
            strokeDashoffset="610"
          >
            <animate
              attributeName="stroke"
              values={
                props.hashColor
                  ? props.hashColor
                  : props.color
                  ? getComputedStyle(document.body).getPropertyValue(
                      `--mdb-${props.color}`
                    )
                  : "#fff"
              }
              begin="0s"
              dur="5.6s"
              fill="freeze"
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 33 33;135 33 33;450 33 33"
              begin="0s"
              dur="1.4s"
              fill="freeze"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              values="187;46.75;187"
              begin="0s"
              dur="1.4s"
              fill="freeze"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    ) : (
      <></>
    )}
  </>
);

export default Spinner;
