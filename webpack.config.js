const path = require("path");
const FlowWebpackPlugin = require("flow-webpack-plugin");

module.exports = {
  entry : {
    main : "./src/grapher.js",
  },
  output : {
    path : path.resolve(__dirname, "dist"),
    filename : "graphy.js",
    libraryTarget : "var",
    library : "Graphy",
  },
  plugins : [ new FlowWebpackPlugin() ],
  module : {
    rules : [
      {
        test : /\.jsx?$/,
        exclude : /node_modules/,
        use : [
          {
            loader : "babel-loader",
          },
        ],
      },
    ],
  },
};
