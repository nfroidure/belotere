//import { GlobalStyles } from "../components/_globalStyles";
import { addDecorator } from "@storybook/react";
import React from "react";
// import { withResponsiveViews } from "storybook-addon-responsive-views";

import "!style-loader!css-loader!../styles/globals.css";

//<GlobalStyles />
addDecorator((storyFn) => (
  <div>
    {storyFn()}
  </div>
));

// addDecorator(
//   withResponsiveViews({
//     mobile: 425,
//     tablet: 750,
//     desktop: 1000,
//     large: 1200,
//   })
// );
