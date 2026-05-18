const target = process.argv[2] || 'app';

process.env.REACT_APP_BUILD_TARGET = target;

if (target === 'main') {
  process.env.BUILD_PATH = 'build-main';
} else {
  process.env.BUILD_PATH = 'build';
}

require('react-scripts/scripts/build');