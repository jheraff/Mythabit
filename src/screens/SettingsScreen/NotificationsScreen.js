import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
  // State for toggle switches
  const [dailyReminders, setDailyReminders] = useState(true);
  const [taskDeadlines, setTaskDeadlines] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [friendActivity, setFriendActivity] = useState(false);
  const [specialEvents, setSpecialEvents] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="calendar" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Daily Reminders</Text>
                <Text style={styles.optionDescription}>Receive daily reminders for your scheduled tasks</Text>
              </View>
            </View>
            <Switch
              value={dailyReminders}
              onValueChange={setDailyReminders}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={dailyReminders ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="alarm" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Task Deadlines</Text>
                <Text style={styles.optionDescription}>Get alerted when tasks are due soon</Text>
              </View>
            </View>
            <Switch
              value={taskDeadlines}
              onValueChange={setTaskDeadlines}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={taskDeadlines ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="trophy" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Achievements</Text>
                <Text style={styles.optionDescription}>Be notified when you earn new achievements</Text>
              </View>
            </View>
            <Switch
              value={achievements}
              onValueChange={setAchievements}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={achievements ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="people" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Friend Activity</Text>
                <Text style={styles.optionDescription}>Get updates on your friends' progress</Text>
              </View>
            </View>
            <Switch
              value={friendActivity}
              onValueChange={setFriendActivity}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={friendActivity ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="star" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Special Events</Text>
                <Text style={styles.optionDescription}>Get notified about app events and challenges</Text>
              </View>
            </View>
            <Switch
              value={specialEvents}
              onValueChange={setSpecialEvents}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={specialEvents ? '#6366f1' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          
          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="volume-high" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Sound</Text>
                <Text style={styles.optionDescription}>Enable notification sounds</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={soundEnabled ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="phone-portrait" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Vibration</Text>
                <Text style={styles.optionDescription}>Enable vibration for notifications</Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={vibrationEnabled ? '#6366f1' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Pressable style={styles.timeRangeContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="moon" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Do Not Disturb</Text>
                <Text style={styles.optionDescription}>Set a time range when notifications are muted</Text>
              </View>
            </View>
            <View style={styles.timeRangeValue}>
              <Text style={styles.timeText}>10:00 PM - 7:00 AM</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#6b7280" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Note: Make sure notifications are enabled in your device settings. Some features may require additional 
            permissions. Your notification preferences will be synced across all your devices.
          </Text>
        </View>

        {/* Space at the bottom for better scrolling */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeRangeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#6366f1',
    marginRight: 4,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    marginHorizontal: 16,
    flexDirection: 'row',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
    lineHeight: 18,
  },
  bottomSpace: {
    height: 40,
  }
});

export default NotificationsScreen;