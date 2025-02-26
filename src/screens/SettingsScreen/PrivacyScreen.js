import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PrivacyScreen = ({ navigation }) => {
  // State for toggle switches
  const [profileVisibility, setProfileVisibility] = useState('Friends Only');
  const [activityVisible, setActivityVisible] = useState(true);
  const [showProgressStats, setShowProgressStats] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          
          <Pressable style={styles.selectionOption}>
            <View style={styles.optionInfo}>
              <Ionicons name="eye" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Profile Visibility</Text>
                <Text style={styles.optionDescription}>Who can see your profile</Text>
              </View>
            </View>
            <View style={styles.selectionValue}>
              <Text style={styles.selectionText}>{profileVisibility}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </Pressable>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="footsteps" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Activity Visibility</Text>
                <Text style={styles.optionDescription}>Allow others to see your activity</Text>
              </View>
            </View>
            <Switch
              value={activityVisible}
              onValueChange={setActivityVisible}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={activityVisible ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="stats-chart" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Progress Statistics</Text>
                <Text style={styles.optionDescription}>Show your progress stats to friends</Text>
              </View>
            </View>
            <Switch
              value={showProgressStats}
              onValueChange={setShowProgressStats}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={showProgressStats ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="radio" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Online Status</Text>
                <Text style={styles.optionDescription}>Show when you're active in the app</Text>
              </View>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={showOnlineStatus ? '#6366f1' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Settings</Text>
          
          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="person-add" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Friend Requests</Text>
                <Text style={styles.optionDescription}>Allow others to send you friend requests</Text>
              </View>
            </View>
            <Switch
              value={allowFriendRequests}
              onValueChange={setAllowFriendRequests}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={allowFriendRequests ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <Pressable style={styles.actionButton}>
            <View style={styles.optionInfo}>
              <Ionicons name="people" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Blocked Users</Text>
                <Text style={styles.optionDescription}>Manage your blocked users list</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Privacy</Text>
          
          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="analytics" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Usage Data Collection</Text>
                <Text style={styles.optionDescription}>Allow anonymous data collection to improve the app</Text>
              </View>
            </View>
            <Switch
              value={dataCollection}
              onValueChange={setDataCollection}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={dataCollection ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="location" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Location Services</Text>
                <Text style={styles.optionDescription}>Allow the app to access your location</Text>
              </View>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={setLocationTracking}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={locationTracking ? '#6366f1' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Data</Text>
          
          <Pressable style={styles.actionButton}>
            <View style={styles.optionInfo}>
              <Ionicons name="download" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Download Your Data</Text>
                <Text style={styles.optionDescription}>Get a copy of all your personal data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>

          <Pressable style={styles.actionButton}>
            <View style={styles.optionInfo}>
              <Ionicons name="trash" size={22} color="#ef4444" />
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: '#ef4444' }]}>Delete Account</Text>
                <Text style={styles.optionDescription}>Permanently delete your account and data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#6b7280" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Your privacy is important to us. We never share your personal information with third parties 
            without your consent. For more information, please review our Privacy Policy.
          </Text>
        </View>

        <Pressable style={styles.policyButton}>
          <Text style={styles.policyButtonText}>View Privacy Policy</Text>
        </Pressable>

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
  selectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#6366f1',
    marginRight: 4,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  policyButton: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  policyButtonText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  bottomSpace: {
    height: 40,
  }
});

export default PrivacyScreen;