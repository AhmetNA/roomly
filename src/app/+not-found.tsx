import { Redirect } from 'expo-router';

// Google sign-in comes back as the deep link roomly://auth-callback, and the OS
// hands that to the router before expo-web-browser resolves the session. No
// screen lives at that path — the tabs only declare index/list/people — so the
// router fell through to its built-in "Unmatched Route" page and stranded the
// user there. Sending anything unrecognised home puts them back in the app
// while the session finishes settling, and does the same for stale web URLs.
export default function NotFoundScreen() {
  return <Redirect href="/" />;
}
