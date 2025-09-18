// components/ErrorBoundary.js - Error boundary for better error handling
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { COLOR } from './Theme';
import * as Animatable from 'react-native-animatable';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console (in production, you might want to send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    const errorMessage = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack: ${this.state.error?.stack || 'No stack trace'}`;
    
    Alert.alert(
      'Report Error',
      'Would you like to copy the error details to share with support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy Error Details', 
          onPress: () => {
            // In a real app, you would copy to clipboard or send to error reporting service
            console.log('Error details:', errorMessage);
            Alert.alert('Error Details Copied', 'Error details have been logged to console.');
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Animatable.View 
            animation="fadeIn" 
            style={styles.errorContainer}
          >
            <Text style={styles.errorEmoji}>😵</Text>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.props.fallbackMessage || "We're sorry, but something unexpected happened. Please try restarting the app."}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.restartButton]} 
                onPress={this.handleRestart}
              >
                <Text style={styles.buttonText}>🔄 Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.reportButton]} 
                onPress={this.handleReportError}
              >
                <Text style={styles.buttonText}>📋 Report Issue</Text>
              </TouchableOpacity>
            </View>
            
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error?.toString()}
                </Text>
              </View>
            )}
          </Animatable.View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLOR.deepNavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR.white,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: COLOR.white,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  restartButton: {
    backgroundColor: COLOR.skyBlue,
  },
  reportButton: {
    backgroundColor: COLOR.coral,
  },
  buttonText: {
    color: COLOR.white,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    width: '100%',
  },
  debugTitle: {
    color: COLOR.amber,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    color: COLOR.white,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackMessage: PropTypes.string,
};

export default ErrorBoundary;