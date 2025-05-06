# Mythabit

**Level Up Your Life, One Task at a Time.**  
Mythabit is a gamified task management app designed to help you build better habits and improve your well-being—all while immersing yourself in an RPG-inspired experience. Complete daily tasks like physical exercises, mental challenges, chores, and spiritual activities to earn experience points, upgrade your avatar, and unlock exciting in-game rewards.

---

## 📌 Purpose

We believe that self-improvement should be both engaging and rewarding. Mythabit combines real-world productivity with the thrill of a role-playing game. Whether you're doing chores or tackling mental challenges, every action helps you grow your in-game character and your real-life self.

Target Audience: **Anyone** who wants to build better habits in a fun and interactive way.

---

## 🧩 Features

- ✅ **User Authentication:** Register/Login system
- 🧙 **Home Page:** Displays your avatar, stats, equipment, and currency
- 📅 **Calendar:** Track daily and weekly habits
- 🧭 **Quest Page:** Receive daily quests/tasks to complete
- 🗺️ **Action Page:** Go on adventures using a tower system
- 💰 **Marketplace:** Buy/sell items and manage your inventory
- ⚙️ **Settings:** Manage preferences, username, email, and password
- 🧑‍🤝‍🧑 **Social Features:** View other profiles, form guilds, send messages
- 🏆 **Achievements & Leaderboards:** Earn badges and compete with others
- 🤝 **Co-op Missions:** Team up with others (similar to Duolingo quests)

---

## 🚀 Tech Stack

- **Frontend:** React Native
- **Backend & Auth:** Firebase (Authentication, Firestore, Storage)
- **Storage:** AsyncStorage
- **Development Tools:** Visual Studio Code, Android Studio, Expo

---

## ⚙️ Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/mythabit.gi
npm install
npm install --save @react-native-firebase/app
npm install @react-native-async-storage/async-storage
npm install @react-navigation/bottom-tabs
npm install react-native-calendars
npm install expo-image-picker @expo/vector-icons
npx expo install expo-font
npx react-native-asset
npm install --save expo
```
You may need to install additional Expo packages depending on your development environment. Make sure to configure your Firebase project and add the google-services.json and/or GoogleService-Info.plist if building for Android/iOS.

---

## 🕹️ Usage

New Users: Start at the login screen, register an account, customize your avatar, and set your preferences.

Returning Users: Log in and tap "Start" to access the main app.

Home Page: View your stats, avatar, gear, an currency.

Explore: Navigate to other pages like quests, shop, calendar, and co-op missions.

---

## 📁 Project Structure (Simplified)

```bash
/src
  /components     → Reusable UI components
  /screens        → Individual app screens (Home, Login, Quests, etc.)
  /navigation     → Stack & Tab navigators
  /assets         → Fonts, icons, and images
App.js            → Main entry point with navigation & logic
```

---

## 🤝 Contributing

Feel free to fork the project and build your own version!

---

## 👥 Credits
Created by:

- Jhermayne Abdon

- Daniel Bautista

- Kyle Deocampo

- Gerard Gandionco

- Amgad Fahim

- Manolo Rodriguez

Shoutout to all open-source libraries and assets used throughout the project. Special thanks to the React Native and Firebase communities!

---

## 📄 License