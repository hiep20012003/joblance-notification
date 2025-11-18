const shell = require('shelljs');

// Copy templates
shell.cp('-R', 'src/emails/templates', 'build/emails/templates');
