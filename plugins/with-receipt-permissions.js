const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withReceiptPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const permissions = cfg.modResults.manifest['uses-permission'] ?? [];
    // expo-image-picker requires this permission for camera capture below Android 10.
    // System photo selection needs no broad storage access on supported versions.
    const name = 'android.permission.WRITE_EXTERNAL_STORAGE';
    const permission = permissions.find((entry) => entry.$['android:name'] === name);
    const attributes = {
      'android:name': name,
      'android:maxSdkVersion': '28',
      'tools:replace': 'android:maxSdkVersion',
    };
    if (permission) permission.$ = attributes;
    else permissions.push({ $: attributes });
    cfg.modResults.manifest['uses-permission'] = permissions;
    return cfg;
  });
};
