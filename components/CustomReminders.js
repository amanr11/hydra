// components/CustomReminders.js - Custom reminder configuration component
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Switch, Alert, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLOR } from './Theme';
import StorageService from '../services/StorageService';
import NotificationService from '../services/NotificationService';

const CustomReminders = ({ visible, onClose }) => {
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    time: new Date(),
    enabled: true,
    days: [1, 1, 1, 1, 1, 1, 1] // Mon-Sun
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (visible) {
      loadReminders();
    }
  }, [visible]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const settings = await StorageService.getSettings();
      setReminders(settings.customReminders || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReminders = async (updatedReminders) => {
    try {
      const settings = await StorageService.getSettings();
      const newSettings = {
        ...settings,
        customReminders: updatedReminders
      };
      await StorageService.setSettings(newSettings);
      
      // Reschedule notifications
      await NotificationService.scheduleCustomReminders(updatedReminders);
      
      return true;
    } catch (error) {
      console.error('Error saving reminders:', error);
      return false;
    }
  };

  const addReminder = async () => {
    if (!newReminder.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your reminder.');
      return;
    }

    const reminder = {
      id: Date.now().toString(),
      title: newReminder.title.trim(),
      message: newReminder.message.trim() || 'Time to drink water! 💧',
      hour: newReminder.time.getHours(),
      minute: newReminder.time.getMinutes(),
      enabled: newReminder.enabled,
      days: [...newReminder.days],
      createdAt: new Date().toISOString()
    };

    const updatedReminders = [...reminders, reminder];
    setReminders(updatedReminders);
    
    const success = await saveReminders(updatedReminders);
    if (success) {
      setShowAddForm(false);
      setNewReminder({
        title: '',
        message: '',
        time: new Date(),
        enabled: true,
        days: [1, 1, 1, 1, 1, 1, 1]
      });
      Alert.alert('Reminder Added', 'Your custom reminder has been created!');
    } else {
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    }
  };

  const toggleReminder = async (id, enabled) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled } : reminder
    );
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  const deleteReminder = (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedReminders = reminders.filter(reminder => reminder.id !== id);
            setReminders(updatedReminders);
            await saveReminders(updatedReminders);
          }
        }
      ]
    );
  };

  const formatTime = (hour, minute) => {
    const time = new Date();
    time.setHours(hour, minute);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysText = (days) => {
    if (days.every(day => day === 1)) return 'Every day';
    if (days.slice(0, 5).every(day => day === 1) && days.slice(5).every(day => day === 0)) return 'Weekdays';
    if (days.slice(0, 5).every(day => day === 0) && days.slice(5).every(day => day === 1)) return 'Weekends';
    
    const activeDays = days.map((active, index) => active ? dayNames[index] : null).filter(Boolean);
    return activeDays.join(', ');
  };

  const toggleDay = (dayIndex) => {
    const newDays = [...newReminder.days];
    newDays[dayIndex] = newDays[dayIndex] === 1 ? 0 : 1;
    setNewReminder({ ...newReminder, days: newDays });
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setNewReminder({ ...newReminder, time: selectedTime });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animatable.View 
          animation="slideInUp"
          duration={300}
          style={styles.modal}
        >
          <View style={styles.header}>
            <Text style={styles.title}>🔔 Custom Reminders</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading reminders...</Text>
              </View>
            ) : (
              <>
                {reminders.length > 0 ? (
                  <View style={styles.remindersList}>
                    {reminders.map((reminder) => (
                      <View key={reminder.id} style={styles.reminderItem}>
                        <View style={styles.reminderInfo}>
                          <View style={styles.reminderHeader}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            <Switch
                              value={reminder.enabled}
                              onValueChange={(enabled) => toggleReminder(reminder.id, enabled)}
                              trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                              thumbColor={reminder.enabled ? COLOR.white : COLOR.white}
                            />
                          </View>
                          <Text style={styles.reminderTime}>
                            🕐 {formatTime(reminder.hour, reminder.minute)}
                          </Text>
                          <Text style={styles.reminderDays}>
                            📅 {getDaysText(reminder.days)}
                          </Text>
                          {reminder.message && (
                            <Text style={styles.reminderMessage}>
                              💬 {reminder.message}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteReminder(reminder.id)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>📝 No custom reminders yet</Text>
                    <Text style={styles.emptySubtext}>
                      Create personalized reminders to stay hydrated throughout the day!
                    </Text>
                  </View>
                )}

                {!showAddForm ? (
                  <TouchableOpacity
                    onPress={() => setShowAddForm(true)}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>+ Add New Reminder</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addForm}>
                    <Text style={styles.formTitle}>✨ New Reminder</Text>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Title *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newReminder.title}
                        onChangeText={(text) => setNewReminder({ ...newReminder, title: text })}
                        placeholder="e.g., Morning Hydration"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        maxLength={50}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Message (Optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={newReminder.message}
                        onChangeText={(text) => setNewReminder({ ...newReminder, message: text })}
                        placeholder="Custom reminder message"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        maxLength={100}
                        multiline
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Time</Text>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(true)}
                        style={styles.timeButton}
                      >
                        <Text style={styles.timeButtonText}>
                          🕐 {formatTime(newReminder.time.getHours(), newReminder.time.getMinutes())}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Days</Text>
                      <View style={styles.daysContainer}>
                        {dayNames.map((day, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => toggleDay(index)}
                            style={[
                              styles.dayButton,
                              newReminder.days[index] === 1 && styles.dayButtonActive
                            ]}
                          >
                            <Text style={[
                              styles.dayButtonText,
                              newReminder.days[index] === 1 && styles.dayButtonTextActive
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formActions}>
                      <TouchableOpacity
                        onPress={() => setShowAddForm(false)}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={addReminder}
                        style={styles.saveButton}
                      >
                        <Text style={styles.saveButtonText}>Save Reminder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {showTimePicker && (
            <DateTimePicker
              value={newReminder.time}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLOR.deepNavy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR.white,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: COLOR.white,
    opacity: 0.7,
  },
  content: {
    maxHeight: 600,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLOR.white,
    fontSize: 16,
  },
  remindersList: {
    marginBottom: 20,
  },
  reminderItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.white,
    flex: 1,
    marginRight: 10,
  },
  reminderTime: {
    fontSize: 14,
    color: COLOR.aquaMint,
    marginBottom: 4,
  },
  reminderDays: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 10,
  },
  deleteText: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: COLOR.skyBlue,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: COLOR.white,
    fontWeight: '600',
    fontSize: 16,
  },
  addForm: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.white,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    color: COLOR.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timeButtonText: {
    color: COLOR.white,
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dayButtonActive: {
    backgroundColor: COLOR.skyBlue,
    borderColor: COLOR.skyBlue,
  },
  dayButtonText: {
    color: COLOR.white,
    fontSize: 12,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: COLOR.white,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLOR.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLOR.skyBlue,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: COLOR.white,
    fontWeight: '600',
    textAlign: 'center',
  },
};

CustomReminders.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CustomReminders;