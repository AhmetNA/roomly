const { withGradleProperties } = require('expo/config-plugins');

// The default Expo template caps the Gradle and Kotlin daemons at 512m/256m of
// Metaspace. Adding expo-updates pushes :expo-updates:kspReleaseKotlin (KSP
// annotation processing) over that limit and the release build dies with
// "java.lang.OutOfMemoryError: Metaspace". CNG regenerates android/ on every
// build, so the bump has to live in a config plugin rather than a hand-edit.
module.exports = function withAndroidBuildMemory(config) {
  return withGradleProperties(config, (cfg) => {
    const upsert = (key, value) => {
      const found = cfg.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      );
      if (found) found.value = value;
      else cfg.modResults.push({ type: 'property', key, value });
    };

    upsert('org.gradle.jvmargs', '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8');
    upsert('kotlin.daemon.jvmargs', '-Xmx2560m -XX:MaxMetaspaceSize=1024m');

    return cfg;
  });
};
