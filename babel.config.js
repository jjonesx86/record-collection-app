module.exports = function (api) {
  api.cache(true);

  // Replace import.meta with a safe object at build time.
  // Zustand's devtools middleware uses import.meta.env.MODE which is invalid
  // syntax in non-module scripts bundled by Metro.
  const importMetaPlugin = {
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta.name === 'import' && property.name === 'meta') {
          path.replaceWithSourceString(
            '({ env: { MODE: "production" } })'
          );
        }
      },
    },
  };

  return {
    presets: ['babel-preset-expo'],
    plugins: [importMetaPlugin],
  };
};
