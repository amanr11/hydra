// components/LoadingIndicator.js - Reusable loading component
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import { COLOR } from './Theme';
import * as Animatable from 'react-native-animatable';

const LoadingIndicator = ({ 
  size = 'large', 
  color = COLOR.skyBlue, 
  message = 'Loading...', 
  showMessage = true,
  style,
  containerStyle,
  overlay = false,
  transparent = false
}) => {
  const containerStyles = [
    styles.container,
    overlay && styles.overlay,
    transparent && styles.transparent,
    containerStyle
  ].filter(Boolean);

  return (
    <View style={containerStyles}>
      <Animatable.View 
        animation="fadeIn" 
        duration={500}
        style={[styles.content, style]}
      >
        <ActivityIndicator 
          size={size} 
          color={color} 
          style={styles.indicator}
        />
        {showMessage && (
          <Animatable.Text 
            animation="fadeIn" 
            delay={200}
            style={styles.message}
          >
            {message}
          </Animatable.Text>
        )}
      </Animatable.View>
    </View>
  );
};

const LoadingOverlay = ({ visible, message, children }) => {
  if (!visible) {
    return children;
  }

  return (
    <View style={styles.overlayContainer}>
      {children}
      <LoadingIndicator
        overlay
        message={message}
        containerStyle={styles.absoluteOverlay}
      />
    </View>
  );
};

const LoadingDots = ({ size = 8, color = COLOR.skyBlue, count = 3 }) => {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <Animatable.View
          key={index}
          animation="pulse"
          duration={1000}
          delay={index * 200}
          iterationCount="infinite"
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              backgroundColor: color,
              marginHorizontal: size / 4,
            }
          ]}
        />
      ))}
    </View>
  );
};

const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
  return (
    <Animatable.View
      animation="pulse"
      duration={1000}
      iterationCount="infinite"
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style
      ]}
    />
  );
};

const styles = {
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    minWidth: 120,
  },
  indicator: {
    marginBottom: 10,
  },
  message: {
    color: COLOR.white,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  dot: {
    borderRadius: 50,
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
};

LoadingIndicator.propTypes = {
  size: PropTypes.oneOf(['small', 'large']),
  color: PropTypes.string,
  message: PropTypes.string,
  showMessage: PropTypes.bool,
  style: PropTypes.object,
  containerStyle: PropTypes.object,
  overlay: PropTypes.bool,
  transparent: PropTypes.bool,
};

LoadingOverlay.propTypes = {
  visible: PropTypes.bool.isRequired,
  message: PropTypes.string,
  children: PropTypes.node,
};

LoadingDots.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  count: PropTypes.number,
};

SkeletonLoader.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.number,
  borderRadius: PropTypes.number,
  style: PropTypes.object,
};

export default LoadingIndicator;
export { LoadingOverlay, LoadingDots, SkeletonLoader };