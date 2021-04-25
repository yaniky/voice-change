const path = require("path");
const webpack = require("webpack");
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const env = require("../config");
const tools = require("../config/tools");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const appEnv = tools.filterAppEnv(env);
const HappyPack = require("happypack");

module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                // use: {
                //     loader: "babel-loader?cacheDirectory=true"
                // },
                use: "happypack/loader?id=happyBabel"
            }
        ]
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "../src")
        },
        extensions: [".js"]
    },
    plugins: [
        new webpack.HashedModuleIdsPlugin(),
        // new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            appGlobal: appEnv
        }),
        new CopyWebpackPlugin([
            {
                from: "static/*"
            }
        ]),
        new HappyPack({
            id: "happyBabel",
            loaders: [{
                loader: "babel-loader?cacheDirectory=true"
            }]
        })
    ]
};