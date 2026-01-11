import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert, Dimensions, InteractionManager 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { LineChart } from 'react-native-chart-kit';
import { TextStyle, ViewStyle } from 'react-native';
import { darkStyles } from '../context/styles';
import Back from './back';
import { startOfWeek, formatISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

export default function WeeklyCheckIn() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const styles = darkStyles;
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [measurements, setMeasurements] = useState({
    weight: '', arms: '', chest: '', waist: '', hips: '', thighs: ''
  });
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [summary, setSummary] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width - 40;

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const getWeekStartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const sunday = startOfWeek(date, { weekStartsOn: 0 });
    return formatISO(sunday, { representation: 'date' });
  };
  
  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading check-ins:', error);
        return;
      }

      if (data) {
        // Group by week (Sunday) and keep only one check-in per week
        const weekMap: { [weekStart: string]: any } = {};

        data.forEach((entry: any) => {
          const weekStart = getWeekStartDate(entry.date);
          weekMap[weekStart] = entry; // Overwrite with latest entry per week
        });

        const weekWiseEntries = Object.entries(weekMap)
          .map(([weekStart, data]) => ({
            weekStart,
            ...data,
          }))
          .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

        setHistory(weekWiseEntries);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const [showForm, setShowForm] = useState(true);

  const saveCheckIn = async () => {
    if (!user) return;
    
    if (Object.values(measurements).some(val => val === '') || !mood || !energy) {
      Alert.alert('⚠️ Missing Fields', 'Please fill in all fields.');
      return;
    }
  
    const checkInDate = dayjs(date).format('YYYY-MM-DD');
    const entry = {
      user_id: user.id,
      date: checkInDate,
      measurements,
      mood: parseInt(mood),
      energy: parseInt(energy),
      notes: notes || '',
    };
  
    try {
      if (editingId) {
        // Update existing check-in
        const { error } = await supabase
          .from('weekly_checkins')
          .update(entry)
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new check-in (upsert to handle duplicates)
        const { error } = await supabase
          .from('weekly_checkins')
          .upsert(entry, {
            onConflict: 'user_id,date'
          });

        if (error) throw error;
      }

      Alert.alert('✅ Saved', 'Check-in submitted successfully!');
      generateSummary(entry);
  
      await loadHistory();
  
      setShowForm(false);
  
      // Reset state if not editing
      if (!isEditing) {
        setDate(new Date());
        setMeasurements({
          weight: '', arms: '', chest: '', waist: '', hips: '', thighs: ''
        });
        setMood('');
        setEnergy('');
        setNotes('');
      }
  
      setIsEditing(false);
      setEditingId(null);
  
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('❌ Error', error.message || 'Failed to save check-in.');
    }
  };
  

  const generateSummary = (current: any) => {
    const last = history[history.length - 1];
    let summary = '';
  
    if (last) {
      const weightDiff = parseFloat(current.measurements.weight) - parseFloat(last.measurements.weight);
      if (!isNaN(weightDiff)) summary += `Weight ${weightDiff >= 0 ? 'increased' : 'decreased'} by ${Math.abs(weightDiff)} kg. `;
  
      const armDiff = parseFloat(current.measurements.arms) - parseFloat(last.measurements.arms);
      if (!isNaN(armDiff)) summary += `Arms ${armDiff >= 0 ? 'up' : 'down'} ${Math.abs(armDiff)} cm.`;
    }
  
    setSummary(summary);
  };

  const getChartData = (field: keyof typeof measurements) => ({
    labels: history.map(h => h.date.slice(5)),
    datasets: [
      {
        data: history.map(h => parseFloat(h.measurements?.[field] || '0')),
        strokeWidth: 2,
      },
    ],
  });

  const StarRating = ({ rating, onRate }: { rating: number; onRate: (val: number) => void }) => (
    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
        <TouchableOpacity key={val} onPress={() => onRate(val)}>
          <Text style={{ fontSize: 22, marginHorizontal: 2 }}>{val <= rating ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // 📈 Charts
  const renderCharts = () => (
    <>
      <Text style={styles.section}>📈 Progress Charts</Text>
      {[ 'chest', 'waist', 'arms','weight'].map((field) => (
        <View key={field} style={{ marginBottom: 20 }}>
          <Text style={{ ...styles.label, marginBottom: 4 }}>{field.toUpperCase()}</Text>
          <LineChart
            data={getChartData(field as keyof typeof measurements)}
            width={screenWidth}
            height={180}
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#1f1f1f',
              backgroundGradientTo: '#1f1f1f',
              color: (opacity = 1) =>
                 `rgba(187, 134, 252, ${opacity})`,
              labelColor: (opacity = 1) =>
                  `rgba(255, 255, 255, ${opacity})`,
              strokeWidth: 2,
            }}
            bezier
          />
        </View>
      ))}
    </>
  );

  const handleEdit = (entry: any) => {
    setDate(new Date(entry.date));
    setMeasurements(entry.measurements);
    setMood(entry.mood.toString());
    setEnergy(entry.energy.toString());
    setNotes(entry.notes || '');
    setSummary('');
    setShowForm(true);
    setIsEditing(true);
    setEditingId(entry.id);
    InteractionManager.runAfterInteractions(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const handleDelete = async (entry: any) => {
    if (!user) return;
    
    Alert.alert("Confirm Delete", "Are you sure you want to delete this check-in?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('weekly_checkins')
              .delete()
              .eq('id', entry.id)
              .eq('user_id', user.id);

            if (error) throw error;

            await loadHistory();
          } catch (error: any) {
            console.error('Error deleting check-in:', error);
            Alert.alert('Error', 'Failed to delete check-in');
          }
        },
      },
    ]);
  };

  // 📚 Past Logs
  const renderPastLogs = () => (
    <>
      <Text style={styles.section}>📚 Past Check-Ins</Text>
      {history.map((entry, index) => {
        const isExpanded = expandedLogs.includes(index);
        return (
          <TouchableOpacity
            key={entry.id || index}
            onPress={() => {
              if (isExpanded) {
                setExpandedLogs(expandedLogs.filter((i) => i !== index));
              } else {
                setExpandedLogs([...expandedLogs, index]);
              }
            }}
            style={[styles.summaryBox, { padding: 12, marginBottom: 12 }]}
            activeOpacity={0.9}
          >
            <Text style={[styles.label, { marginBottom: 6 }]}>
              📅 {new Date(entry.date).toDateString()}
            </Text>

            {isExpanded && (
              <>
                {Object.entries(entry.measurements || {}).map(([k, v]) => (
                  <Text key={k} style={styles.summaryText}>
                    {`${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`}
                  </Text>
                ))}
                <Text style={styles.summaryText}>Mood: {entry.mood}/10</Text>
                <Text style={styles.summaryText}>Energy: {entry.energy}/10</Text>
                {entry.notes ? (
                  <Text style={styles.summaryText}>Notes: {entry.notes}</Text>
                ) : null}

                <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1, marginRight: 5 }]}
                    onPress={() => handleEdit(entry)}
                  >
                    <Text style={styles.buttonText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, { flex: 1, marginLeft: 5, backgroundColor: '#e74c3c' }]}
                    onPress={() => handleDelete(entry)}
                  >
                    <Text style={styles.buttonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <Back />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        <Text style={styles.header}>📅 Weekly Check-In</Text>
  
        {showForm && (
          <>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePicker}>
              <Text style={styles.label}>Date: {date.toDateString()}</Text>
            </TouchableOpacity>
  
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, selected) => {
                  setShowPicker(false);
                  if (selected) setDate(selected);
                }}
              />
            )}
  
            <Text style={styles.section}>📏 Body Measurements (cm/kg)</Text>
            {Object.keys(measurements).map((key) => (
              <TextInput
                key={key}
                placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} (${key === 'weight' ? 'kg' : 'cm'})`}
                keyboardType="numeric"
                style={styles.input}
                value={measurements[key as keyof typeof measurements]}
                onChangeText={(val) => setMeasurements({ ...measurements, [key]: val })}
              />
            ))}
  
            <Text style={styles.section}>📝 Progress Notes</Text>
            <TextInput
              placeholder="Any comments about your week..."
              style={styles.input}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
  
            <Text style={styles.section}>😄 Mood & ⚡ Energy Rating (1–10)</Text>
            <Text style={styles.label}>Mood</Text>
            <StarRating rating={+mood} onRate={(val) => setMood(val.toString())} />
            <Text style={styles.label}>Energy</Text>
            <StarRating rating={+energy} onRate={(val) => setEnergy(val.toString())} />
  
            <TouchableOpacity style={styles.button} onPress={saveCheckIn}>
              <Text style={styles.buttonText}>✅ Submit Check-In</Text>
            </TouchableOpacity>
          </>
        )}
  
        {summary !== '' && (
          <>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>🧠 Summary: {summary}</Text>
            </View>
  
            <View style={styles.summaryBox}>
              <Text style={styles.label}>✅ Submitted Log</Text>
              {Object.entries(measurements).map(([k, v]) => (
                <Text key={k} style={styles.summaryText}>
                  {`${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`}
                </Text>
              ))}
              <Text style={styles.summaryText}>Mood: {mood}/10</Text>
              <Text style={styles.summaryText}>Energy: {energy}/10</Text>
              {notes ? <Text style={styles.summaryText}>Notes: {notes}</Text> : null}
            </View>
  
            <TouchableOpacity
              style={[styles.button, { marginTop: 10 }]}
              onPress={() => {
                const next = new Date(date);
                next.setDate(date.getDate() + 7);
                setDate(next);
                setMeasurements({ weight: '', arms: '', chest: '', waist: '', hips: '', thighs: '' });
                setMood('');
                setEnergy('');
                setNotes('');
                setSummary('');
                setShowForm(true);
                setIsEditing(false);
                setEditingId(null);
              }}
            >
              <Text style={styles.buttonText}>🗓️ Log for Next Week</Text>
            </TouchableOpacity>
          </>
        )}
  
        {history.length > 1 && renderCharts()}
        {renderPastLogs()}
      </ScrollView>
    </View>
  );  
}
