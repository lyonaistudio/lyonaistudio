import React from "react";
import { KineticHeadline } from "../KineticHeadline";

export const BridgeLineScene: React.FC = () => {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
      <KineticHeadline
        startFrame={0}
        fontSize={56}
        lines={[
          [{ text: "+" }, { text: "Un" }, { text: "site" }, { text: "qui" }],
          [{ text: "vous" }, { text: "représente.", accent: true }],
        ]}
      />
    </div>
  );
};
