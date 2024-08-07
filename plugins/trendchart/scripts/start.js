const compatibilityExecute = require('./compat');

const START_COMMAND = 'nodemon -w ./src/ --exec \"webpack --mode development --progress --open\"';
compatibilityExecute(START_COMMAND);
