/**
 * @license
 *
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Webpack configuration file.
 * @author samelh@google.com (Sam El-Husseini)
 */

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    target: 'web',
    mode: 'development',
    entry: {
        index: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: '[name].js'
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                // test: /(blockly\/.*\.js)$/,
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
                // use: [require.resolve('source-map-loader')],
            },
        ],
    },
    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    ignoreWarnings: [/Failed to parse source map/],
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'public'),
                        to: path.resolve(__dirname, 'docs')
                    },
                    // Copy over media resources from the Blockly package
                    {
                        from: path.resolve(__dirname, './node_modules/blockly/media'),
                        to: path.resolve(__dirname, 'docs/media')
                    },
                ]
            }
        ),
   ],
    devServer: {
        port: 3000
    }
};
