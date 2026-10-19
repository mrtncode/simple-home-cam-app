# simple-home-cam-app
Simple Cam viewer, specialized on reolink cams

## Android release APK

Publishing a GitHub release triggers `.github/workflows/release-android.yml`. The workflow runs an EAS local Android production build, attaches the signed APK to the GitHub release, and stores it as a workflow artifact.

Before the first release:

1. Link `SimpleHomeCam` to an EAS project with `npx eas-cli@latest init` and commit the generated `expo.extra.eas.projectId` in `SimpleHomeCam/app.json`.
2. Configure Android app signing credentials for that EAS project (`npx eas-cli@latest credentials --platform android`).
3. Create an Expo access token and add it to the GitHub repository secrets as `EXPO_TOKEN`.

EAS local builds run on Linux in GitHub Actions and need Android SDK tools installed on the runner. The workflow installs the SDK components used by this app.
