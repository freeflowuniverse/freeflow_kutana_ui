const webpack = require('webpack');
const fs = require('fs');

module.exports = {
    transpileDependencies: ['vuetify'],

    configureWebpack: {
        plugins: [
            // janus.js does not use 'import' to access to the functionality of webrtc-adapter,
            // instead it expects a global object called 'adapter' for that.
            // Let's make that object available.
            new webpack.ProvidePlugin({ adapter: 'webrtc-adapter' }),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        ],
        optimization: {
            splitChunks: {
                chunks: 'initial',
                minSize: 1000,
                maxSize: 0,
                cacheGroups: {
                    vuetify: {
                        test: /[\\/]node_modules[\\/]vuetify[\\/]/,
                        name: 'vendor.vuetify',
                        enforce: true,
                        priority: 20,
                    },
                    moment: {
                        test: /[\\/]node_modules[\\/]moment[\\/]/,
                        name: 'vendor.moment',
                        enforce: true,
                        priority: 20,
                    },
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: 10,
                        enforce: true, // create chunk regardless of the size of the chunk
                        //maxSize: 10000
                    },
                },
            },
        },
        devtool: 'source-map',
        module: {
            rules: [
                // janus.js does not use 'export' to provide its functionality to others, instead
                // it creates a global variable called 'Janus' and expects consumers to use it.
                // Let's use 'exports-loader' to simulate it uses 'export'.
                {
                    test: require.resolve('janus-gateway'),
                    use: 'exports-loader?Janus=Janus',
                },
            ],
        },
        devServer: {
            disableHostCheck: true,
        },
    },

    css: {
        sourceMap: true,
    },

    // pwa: {
    //   workboxPluginMode: 'InjectManifest'
    // }
};
