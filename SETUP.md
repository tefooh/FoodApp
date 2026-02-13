# Template App Setup Instructions

## Firebase Configuration

The Firebase configuration has been updated in the JavaScript files to project `tempelate-d11ad`.

## Native App Configuration

For Android and iOS apps to work correctly with the new Firebase project, you must download the following files from your Firebase Console (Project Settings > General > Your apps) and replace the existing ones in the project:

1. **Android**: Download `google-services.json` and place it in `App/Frontend/`.
2. **iOS**: Download `GoogleService-Info.plist` and place it in `App/Frontend/`.

## Branding

The project branding has been updated from "RakanFood" to "Tempelate".
- App Name: Tempelate
- Bundle ID: com.tempelateapp.app

## Cleanup

The file `rakanapp-f7857-90c921e5df3b.json` in the root directory contains credentials for the old project. You may delete it if it is no longer needed.
