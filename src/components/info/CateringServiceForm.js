import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import enquiryService from '../../services/enquiryService';

const eventTypes = [
  'Wedding',
  'Birthday Party',
  'Corporate Event',
  'Anniversary',
  'Festival Celebration',
  'House Warming',
  'Other',
];

export default function CateringServiceForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    guestCount: '',
    venue: '',
    menuPreferences: '',
    budget: '',
    message: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    {/* Clear error when user starts typing */}
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    if (!formData.guestCount.trim()) {
      newErrors.guestCount = 'Number of guests is required';
    } else if (isNaN(formData.guestCount) || parseInt(formData.guestCount) < 1) {
      newErrors.guestCount = 'Please enter a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const response = await enquiryService.submitCateringService(formData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Catering service enquiry submitted successfully! We\'ll contact you soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                {/* Reset form */}
                setFormData({
                  name: '',
                  phone: '',
                  eventType: '',
                  eventDate: '',
                  eventTime: '',
                  guestCount: '',
                  venue: '',
                  menuPreferences: '',
                  budget: '',
                  message: '',
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting catering service enquiry:', error);
      Alert.alert('Error', error.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Catering Service Enquiry</Text>
          <Text style={styles.description}>
            Planning an event? Let us handle the catering! Fill out the form below and we'll create a customized menu for your special occasion.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="John Doe"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="9876543210"
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Event Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.eventType && styles.inputError]}>
              <Picker
                selectedValue={formData.eventType}
                onValueChange={(value) => handleChange('eventType', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select event type" value="" />
                {eventTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
            {errors.eventType && <Text style={styles.errorText}>{errors.eventType}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Event Date <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.eventDate && styles.inputError]}
                placeholder="YYYY-MM-DD"
                value={formData.eventDate}
                onChangeText={(value) => handleChange('eventDate', value)}
              />
              {errors.eventDate && <Text style={styles.errorText}>{errors.eventDate}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Event Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={formData.eventTime}
                onChangeText={(value) => handleChange('eventTime', value)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Number of Guests <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.guestCount && styles.inputError]}
                placeholder="e.g., 50"
                value={formData.guestCount}
                onChangeText={(value) => handleChange('guestCount', value)}
                keyboardType="numeric"
              />
              {errors.guestCount && <Text style={styles.errorText}>{errors.guestCount}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Budget Range (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ₹50,000 - ₹1,00,000"
                value={formData.budget}
                onChangeText={(value) => handleChange('budget', value)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Venue</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ABC Banquet Hall, City Name"
              value={formData.venue}
              onChangeText={(value) => handleChange('venue', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Menu Preferences</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please specify your menu preferences (e.g., Vegetarian, Non-Vegetarian, Vegan, specific cuisines, dietary restrictions)"
              value={formData.menuPreferences}
              onChangeText={(value) => handleChange('menuPreferences', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special requirements, service preferences, or questions..."
              value={formData.message}
              onChangeText={(value) => handleChange('message', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Catering Enquiry</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting this form, you agree to our terms and conditions. We'll contact you within 24-48 hours with a customized quote.
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#e63946',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
