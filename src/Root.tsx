// Chooses which build to render based on the current path: "/v1" the original app, "/v2" the
// collage rebuild, anything else the version picker.
import App from './App';
import { AppV2 } from './v2/AppV2';
import { VersionPicker } from './VersionPicker';
import { useRoute } from './router';

export function Root() {
  const route = useRoute();

  if (route === 'v1') {
    return <App />;
  }
  if (route === 'v2') {
    return <AppV2 />;
  }
  return <VersionPicker />;
}
