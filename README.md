# FitVide - Fitness Tracking App

<div align="center">

![FitVide Logo](./assets/images/icon.png)

**A comprehensive, cross-platform fitness and wellness tracking application**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.4-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.12-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.90.1-3ECF8E?logo=supabase)](https://supabase.com/)

[Features](#-features) • [Tech Stack](#️-technology-stack) • [Getting Started](#-getting-started) • [Architecture](./ARCHITECTURE.md) • [API Documentation](./API.md) • [Deployment](./DEPLOYMENT.md)

</div>

---

## 📱 Overview

FitVide is a modern, full-featured fitness tracking application that helps users monitor their workouts, nutrition, hydration, sleep, and overall wellness progress. Built with React Native and Expo, it provides a seamless experience across iOS, Android, and Web platforms.

### Key Highlights

- ✅ **Cross-Platform**: iOS, Android, and Web support
- ✅ **Real-time Sync**: All data synchronized via Supabase
- ✅ **Secure Authentication**: Row-level security with Supabase Auth
- ✅ **Comprehensive Tracking**: Workouts, nutrition, hydration, sleep, steps, and weekly check-ins
- ✅ **Modern Stack**: React Native, TypeScript, Expo Router
- ✅ **Production Ready**: Docker support, CI/CD ready

---

## ✨ Features

### 🔐 Authentication & User Management
- Email/password authentication
- Secure session management with platform-specific storage
- User profile management with photo uploads
- Account deletion with cascading data cleanup

### 💪 Workout Tracking
- Log exercises with sets, reps, and weight
- Track workout regions, levels, and intensity
- Exercise history with date-based filtering
- Workout templates and categorization

### 🍎 Nutrition Tracking
- Detailed meal logging (Breakfast, Lunch, Dinner)
- Food database with search functionality
- Macro tracking (calories, protein, carbs, fats, fiber)
- Custom macro targets based on user profile
- Daily calorie budget calculation

### 💧 Hydration & Wellness
- Daily water intake tracking
- Creatine intake tracking
- Visual progress indicators
- Historical data visualization

### 😴 Sleep Tracking
- Sleep and wake time logging
- Automatic duration calculation
- Sleep quality rating (1-5 scale)
- Notes and history tracking

### 📊 Progress & Analytics
- Daily and weekly progress summaries
- Step count tracking
- Weekly body measurements check-ins
- Mood and energy level tracking
- Visual charts and graphs

### ⚙️ Settings & Customization
- Dark/Light theme support
- Profile image upload
- Data export (PDF)
- Privacy & security settings

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native 0.79.4 with Expo 53.0.12
- **Language**: TypeScript 5.3.3
- **Navigation**: Expo Router 5.1.0 (file-based routing)
- **State Management**: React Context API
- **UI Libraries**:
  - `react-native-circular-progress-indicator` - Progress rings
  - `react-native-chart-kit` - Charts and graphs
  - `@expo/vector-icons` - Icon library
  - `nativewind` - Tailwind CSS for React Native

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for profile images)
- **Real-time**: Supabase Realtime subscriptions
- **Security**: Row Level Security (RLS) policies

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (for web deployment)
- **Build System**: EAS Build (Expo Application Services)
- **Package Manager**: npm

### Development Tools
- **Linting**: ESLint (via Expo)
- **Testing**: Jest with jest-expo
- **Type Checking**: TypeScript
- **Version Control**: Git

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (comes with Node.js)
- **Expo CLI**: `npm install -g expo-cli` (optional, npx works too)
- **Supabase Account**: [Create one here](https://supabase.com)
- **Development Environment**:
  - For iOS: Xcode (macOS only) or Expo Go app
  - For Android: Android Studio or Expo Go app
  - For Web: Any modern browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SAIKRISHNA239/-FitVide-Fitness-Tracking-App.git
   cd "-FitVide-Fitness-Tracking-App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   # If you encounter peer dependency issues:
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file in the root directory
   touch .env
   ```
   
   Add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the `schema.sql` file
   - Create a storage bucket named `avatars` for profile images
   - Copy your project URL and anon key to `.env`

5. **Start the development server**
   ```bash
   npm start
   # Or for specific platforms:
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   npm run web      # Web browser
   ```

### First Run

1. Start the Expo dev server
2. Scan the QR code with Expo Go (mobile) or press `w` for web
3. Create an account or sign in
4. Complete your profile setup
5. Start tracking your fitness journey!

---

## 📁 Project Structure

```
FitVide-Fitness-Tracking-App/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx         # Root layout with auth guard
│   ├── index.tsx           # Home/Dashboard screen
│   ├── LoginScreen.tsx    # Authentication screen
│   ├── log.tsx            # Workout logging
│   ├── nutrition.tsx      # Nutrition tracking
│   ├── meals.tsx          # Meal addition
│   ├── hydration.tsx      # Hydration tracking
│   ├── sleep.tsx          # Sleep logging
│   ├── stepcount.tsx      # Step tracking
│   ├── week.tsx           # Weekly check-ins
│   ├── profile.tsx        # User profile
│   ├── progress.tsx       # Progress dashboard
│   └── settings.tsx       # App settings
├── assets/                 # Static assets
│   ├── images/           # Images and icons
│   └── fonts/            # Custom fonts
├── context/               # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── ThemeContext.tsx   # Theme management
│   ├── NutritionContext.tsx # Nutrition data
│   └── getCalorieBudget.tsx # Calorie calculations
├── data/                  # Static data and utilities
│   ├── exercise.json     # Exercise database
│   ├── foodDatabase.json # Food database
│   └── getLog.ts         # Data fetching utilities
├── lib/                   # Core libraries
│   └── supabase.ts       # Supabase client configuration
├── styles/                # Shared styles
├── schema.sql            # Database schema
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── nginx.conf           # Nginx configuration
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🔧 Configuration

### Environment Variables

See [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed environment variable documentation.

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### App Configuration

The `app.json` file contains platform-specific configurations:
- **iOS**: Bundle identifier, permissions, build number
- **Android**: Package name, permissions, version code
- **Web**: Favicon, bundler settings

---

## 📚 Documentation

- **[Architecture](./ARCHITECTURE.md)** - System architecture and design patterns
- **[API Documentation](./API.md)** - API endpoints and data models
- **[Database Schema](./DATABASE.md)** - Database structure and relationships
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[Environment Variables](./ENVIRONMENT.md)** - Environment configuration
- **[Contributing](./CONTRIBUTING.md)** - Contribution guidelines

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

---

## 🚢 Deployment

### Web Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Docker deployment:**
```bash
docker-compose up -d
```

### Mobile Deployment

1. **Build with EAS**
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

2. **Submit to stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sai Krishna**

- GitHub: [@SAIKRISHNA239](https://github.com/SAIKRISHNA239)
- Repository: [FitVide Fitness Tracking App](https://github.com/SAIKRISHNA239/-FitVide-Fitness-Tracking-App)

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Supabase](https://supabase.com/) for the backend infrastructure
- [React Native](https://reactnative.dev/) community for excellent libraries
- All contributors and users of this project

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Documentation](./ARCHITECTURE.md)
2. Search [existing issues](https://github.com/SAIKRISHNA239/-FitVide-Fitness-Tracking-App/issues)
3. Create a [new issue](https://github.com/SAIKRISHNA239/-FitVide-Fitness-Tracking-App/issues/new)

---

<div align="center">

**Made with ❤️ for fitness enthusiasts**

⭐ Star this repo if you find it helpful!

</div>
