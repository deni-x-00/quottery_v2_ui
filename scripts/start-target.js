const target = process.argv[2] || 'app';

process.env.REACT_APP_BUILD_TARGET = target;

require('react-scripts/scripts/start');
