import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { scale } from '../../Theme/responsive';
import { mochiWelcome } from '../../../assets/images';

const Logo = ({ size = scale(36), showText = true }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={mochiWelcome}
          style={[styles.logoImage, { width: size * 0.8, height: size * 0.8 }]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <View style={styles.textContainer}>
          {/* Text sẽ được render bên ngoài component này */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    borderRadius: scale(18),
  },
  textContainer: {
    marginLeft: 8,
  },
});

export default Logo;

