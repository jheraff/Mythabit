import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#6366f1" />
                </Pressable>
                <Text style={styles.headerTitle}>About</Text>
                <View style={styles.placeholder} />
            </View>
            
            <ScrollView 
                style={styles.contentContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.title}>About Mythabit</Text>
                <Text style={styles.text}>
                    Welcome to Mythabit! Mythabit is a gamified task management app designed to help you 
                    build better habits and improve your well-being—all while immersing yourself in an 
                    RPG-inspired experience. Complete daily tasks such as physical exercises, mental challenges, 
                    chores, and spiritual activities to earn experience points, upgrade your in-game avatar, 
                    and unlock exciting rewards!
                </Text>
                
                <Text style={styles.subtitle}>Our Mission</Text>
                <Text style={styles.text}>
                    We believe that self-improvement should be both engaging and rewarding. Mythabit encourages 
                    productivity and personal growth by combining real-life responsibilities with game mechanics 
                    that make progress fun and fulfilling.
                </Text>

                <Text style={styles.subtitle}>Meet the Developers</Text>
                <Text style={styles.text}>
                    - Jhermayne Abdon{"\n"}
                    - Daniel Bautista{"\n"}
                    - Kyle Deocampo{"\n"}
                    - Amgad Fahim{"\n"}
                    - Manolo Rodriguez
                </Text>

                <Text style={styles.subtitle}>Tools & Technologies</Text>
                <Text style={styles.text}>
                    - Development & Collaboration: Visual Studio Code, Git, GitHub, Firebase, Cloud Firestore{"\n"}
                    - Project Management & Design: Jira, Figma, Miro, Discord
                </Text>

                <Text style={styles.subtitle}>Legal & Licensing</Text>
                <Text style={styles.text}>
                    © 2025 Mythabit. All rights reserved.{"\n"}
                    For terms of service and privacy policy, visit: [Insert Link Here]
                </Text>

                <Text style={styles.subtitle}>Community & Support</Text>
                <Text style={styles.text}>
                    Have questions or feedback? Stay connected!{"\n"}
                    - Website: [Insert Link]{"\n"}
                    - Support: [Insert Email]{"\n"}
                    - Social Media: [Insert Links]
                </Text>
                
                {/* Add empty space at the bottom */}
                <View style={styles.bottomSpace}></View>
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
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 8,
        color: '#1f2937',
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4b5563',
    },
    bottomSpace: {
        height: 40, 
    }
});

export default AboutScreen;