import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';

const CalendarScreen = ({ navigation, extraData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [tasksByDate, setTasksByDate] = useState({});
  const [showingTasks, setShowingTasks] = useState([]);
  
  useEffect(() => {
    // Load tasks for the current user
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'activeTasks', userId), (snapshot) => {
      if (snapshot.exists()) {
        const { tasks } = snapshot.data();
        processTasks(tasks);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Update shown tasks when selected date changes
    if (tasksByDate[selectedDate]) {
      setShowingTasks(tasksByDate[selectedDate]);
    } else {
      setShowingTasks([]);
    }
  }, [selectedDate, tasksByDate]);

  const processTasks = (tasks) => {
    const marked = {};
    const taskMap = {};

    tasks.forEach(task => {
      // Only process in-progress tasks
      if (task.status === 'in-progress') {
        // Calculate due date based on task start time and duration
        const dueDate = calculateDueDate(task);
        if (!dueDate) return;
        
        const dateString = dueDate.toISOString().split('T')[0];
        
        // Mark the date
        marked[dateString] = { 
          selected: true,
          selectedColor: '#6366f1',
          marked: true
        };
        
        // Add task to the tasks by date
        if (!taskMap[dateString]) {
          taskMap[dateString] = [];
        }
        taskMap[dateString].push({
          ...task,
          dueDate: dueDate.toISOString()
        });
      }
    });

    setMarkedDates(marked);
    setTasksByDate(taskMap);
  };

  const calculateDueDate = (task) => {
    // Default to current time if we don't have a start time
    let startTime;
    
    // Check if task has a recorded start time
    if (task.acceptedAt) {
      startTime = new Date(task.acceptedAt);
    } else {
      // If no recorded start time, estimate based on remaining time
      startTime = new Date();
      if (task.timeRemaining && task.duration) {
        // Calculate how much time has already elapsed
        const totalSeconds = task.duration * 60; // Convert minutes to seconds
        const elapsedSeconds = totalSeconds - task.timeRemaining;
        
        // Subtract elapsed time from current time to get start time
        startTime = new Date(startTime.getTime() - (elapsedSeconds * 1000));
      }
    }
    
    // Calculate due date by adding the duration to the start time
    if (task.duration) {
      const dueDate = new Date(startTime.getTime() + (task.duration * 60 * 1000)); // duration in minutes
      return dueDate;
    }
    
    return null;
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#6366f1';
    }
  };

  // Format the duration from minutes to a readable format
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Format due date to a readable time
  const formatDueTime = (isoString) => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            current={selectedDate}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: markedDates[selectedDate]?.selectedColor || '#6366f1',
              }
            }}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6b7280',
              selectedDayBackgroundColor: '#6366f1',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#6366f1',
              dayTextColor: '#1f2937',
              arrowColor: '#6366f1',
              monthTextColor: '#1f2937',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
            }}
            onDayPress={handleDayPress}
          />
        </View>

        <View style={styles.tasksContainer}>
          <Text style={styles.dateTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {showingTasks.length > 0 ? (
            showingTasks.map((task, index) => (
              <View key={task.id || index} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskName}>{task.taskName}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty) }]}>
                    <Text style={styles.difficultyText}>{task.difficulty}</Text>
                  </View>
                </View>
                
                <View style={styles.taskDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="alarm-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Due at: {formatDueTime(task.dueDate)}
                    </Text>
                  </View>
                
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Time Remaining: {formatTime(task.timeRemaining)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="hourglass-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Duration: {formatDuration(task.duration)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="fitness-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Stat: {task.statType}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="star-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      XP: {task.xpReward}
                    </Text>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      Progress: {task.currentProgress || 0}/{task.taskAmount}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${Math.min(100, ((task.currentProgress || 0) / task.taskAmount) * 100)}%`,
                            backgroundColor: '#6366f1'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>In Progress</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noTasksContainer}>
              <Ionicons name="calendar-clear-outline" size={48} color="#d1d5db" />
              <Text style={styles.noTasksText}>No tasks due on this day</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollContainer: {
    flex: 1,
  },
  calendarContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tasksContainer: {
    padding: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  taskCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  taskDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  noTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noTasksText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default CalendarScreen;