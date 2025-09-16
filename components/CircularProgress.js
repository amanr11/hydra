import React from 'react';
import * as Progress from 'react-native-progress';

export default function CircularProgress({ progress }) {
  return (
    <Progress.Circle
  size={150}
  progress={total/dailyGoal}
  showsText={true}
  thickness={15}
  color="#ff6b6b"          // red/pink
  unfilledColor="#ffeaa7"  // light yellow
  borderWidth={0}
/>

  );
}
