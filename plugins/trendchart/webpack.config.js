const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => {
	const chunks = [
		'visualization',
		'configuration-panel'
	];
	const config = {
		entry: chunks.reduce((entries, chunk) => ({
			...entries,
			[chunk]: `./src/${chunk}.jsx`
		}), {}),
		output: {
			filename: '[name].js',
			path: path.join(__dirname, 'public/js')
		},
		resolve: {
			extensions: ['.js', '.jsx'],
			alias: {
				'@common': '../../../src'
			}
		},
		externals: {
			'@qualtrics/pluginclient': 'PluginClient'
		},
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								["@babel/preset-env", {
									targets: [
										'Last 4 Chrome versions',
										'Last 4 Firefox versions',
										'Last 4 Edge versions',
										'Safari >= 9',
										'Explorer 11'
									],
									useBuiltIns: 'usage',
									corejs: 3
								}],
								"@babel/preset-react"
						]
						}
					}
				},
				{
					use: ['style-loader', 'css-loader'],
					test: /\.css$/
				},
				{
					test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
					use: [{
						loader: require.resolve('file-loader'),
						options: {
							name: '[name].[ext]',
							outputPath: 'fonts/',
							publicPath: 'fonts/'
						}
					}]
				}
			]
		},
		plugins: [
			new webpack.ProvidePlugin({
				React: 'react'
			}),
			...chunks.map((chunk) => 
				new HtmlWebpackPlugin({
					filename: path.join(__dirname, `public/${chunk}.html`),
					template: path.join(__dirname, 'src', 'index.html'),
					chunks: ['commons', chunk]
				})
			)
		],
		optimization: {
			splitChunks: {
				cacheGroups: {
					commons: {
						name: 'commons',
						chunks: 'initial',
						minChunks: 2
					}
				}
			}
		}
	}

	if (argv.mode === 'development') {
		config.devtool = 'eval-source-map';
	} else {
		config.mode = 'production';
	}
	return config;
}
