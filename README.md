
# FitVide - Fitness Tracking App

FitVide is a comprehensive, cross-platform fitness and wellness tracking application built with React Native and Expo. It allows users to monitor their workouts, nutrition, hydration, sleep, and overall progress, all powered by a Firebase backend.

## ✨ Features

  * **Authentication**: Secure user authentication with Firebase, including email/password and Google sign-in.
  * **Workout Logging**: Users can log their exercises, including details like workout type, region, level, sets, reps, and weight. All data is saved to Firestore.
  * **Nutrition Tracking**: Detailed meal logging for breakfast, lunch, and dinner. Users can search a food database and track calories, protein, carbs, and fats.
  * **Hydration Tracker**: A simple way to log daily water intake, with a circular progress bar to visualize progress toward a daily goal.
  * **Sleep Tracking**: Users can log their sleep and wake times, and the app will calculate the duration. It also includes a feature to rate sleep quality and add notes.
  * **Progress Summary**: A dedicated screen that combines all logs (exercise, hydration, nutrition, and sleep) to give users a comprehensive view of their daily and weekly progress.
  * **Weekly Check-in**: A feature that allows users to record their body measurements and mood on a weekly basis, with charts to visualize their progress over time.
  * **User Profile**: Users can set their personal details (age, gender, height, weight), activity level, and fitness goals (cut, maintain, bulk). The app then calculates and displays their recommended daily macro targets.

## 🛠️ Technology Stack

  * **Framework**: React Native with Expo
  * **Backend**: Firebase (Authentication, Firestore, Storage)
  * **Navigation**: React Navigation (with Expo Router)
  * **UI Components**:
      * `react-native-circular-progress-indicator` for progress rings
      * `react-native-chart-kit` for charts and graphs
  * **Context Management**: React Context API for theme and nutrition data management
  * **Language**: TypeScript

## 🚀 Getting Started

To get this project up and running on your local machine, follow these steps:

### Prerequisites

  * Node.js and npm installed
  * Expo CLI installed (`npm install -g expo-cli`)
  * An Android or iOS emulator/simulator, or a physical device with the Expo Go app

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SAIKRISHNA239/-FitVide-Fitness-Tracking-App.git
    cd -FitVide-Fitness-Tracking-App
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Firebase:**
      * Create a new project on the [Firebase Console](https://console.firebase.google.com/).
      * Enable **Authentication** (with Email/Password and Google providers), **Firestore**, and **Storage**.
      * Copy your Firebase project's configuration and add it to `app/firebase.ts`.
4.  **Run the app:**
    ```bash
    npx expo start
    ```

This will start the Metro bundler and provide you with a QR code to run the app on your device or in an emulator.

## 🤝 Contributing

Contributions are welcome\! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.