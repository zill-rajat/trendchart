const compatibilityExecute = require('./compat');

const BUILD_COMMAND = 'webpack --mode production --progress';
compatibilityExecute(BUILD_COMMAND);
