import { SymbolView, type AndroidSymbol, type SymbolViewProps } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

export type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol };

// expo-symbols looks for a dedicated `web` key in the name object and renders
// nothing at all when it's missing — which silently made every icon in the app
// invisible on web. Web draws the same Material symbol font as Android, so the
// key is filled in here once instead of at every call site.
export function AppSymbol({
  name,
  ...props
}: Omit<SymbolViewProps, 'name'> & { name: AppSymbolName }) {
  return <SymbolView name={{ ...name, web: name.android }} {...props} />;
}
