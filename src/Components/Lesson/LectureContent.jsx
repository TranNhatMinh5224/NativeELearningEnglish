import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { scale, verticalScale } from '../../Theme/responsive';
import colors from '../../Theme/colors';

const { width } = Dimensions.get('window');

const LectureContent = ({ lecture, onComplete }) => {
  const [videoRef, setVideoRef] = useState(null);
  const [soundRef, setSoundRef] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const lectureType = lecture?.Type || lecture?.type || 1;
  const title = lecture?.Title || lecture?.title || '';
  // Lấy HTML content từ nhiều nguồn có thể
  const htmlContent = lecture?.RenderedHtml || lecture?.renderedHtml || lecture?.RenderedHTML || '';
  // Fallback sang MarkdownContent nếu không có HTML
  const markdownContent = lecture?.MarkdownContent || lecture?.markdownContent || '';
  const mediaKey = lecture?.MediaKey || lecture?.mediaKey || lecture?.MediaUrl || lecture?.mediaUrl;
  const mediaType = lecture?.MediaType || lecture?.mediaType;
  
  // Debug log để kiểm tra
  useEffect(() => {
    if (lecture) {
      console.log('📄 LectureContent - Lecture data:', {
        hasRenderedHtml: !!(lecture.RenderedHtml || lecture.renderedHtml),
        hasMarkdownContent: !!(lecture.MarkdownContent || lecture.markdownContent),
        htmlContentLength: htmlContent?.length || 0,
        markdownContentLength: markdownContent?.length || 0,
        title,
        lectureType,
        lectureKeys: Object.keys(lecture),
      });
    }
  }, [lecture, htmlContent, markdownContent, title, lectureType]);

  // Render Content Type (Text/HTML)
  const renderContent = () => {
    // Nếu không có HTML content, hiển thị message
    if (!htmlContent && !markdownContent) {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.emptyContentText}>
            Nội dung bài học đang được cập nhật...
          </Text>
        </View>
      );
    }
    
    // Nếu có markdown nhưng không có HTML, hiển thị markdown dạng text
    if (!htmlContent && markdownContent) {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.markdownText}>{markdownContent}</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <RenderHTML
          contentWidth={width - scale(40)}
          source={{ html: htmlContent }}
          tagsStyles={{
            body: {
              fontSize: 15,
              lineHeight: 24,
              color: colors.text,
            },
            p: {
              marginBottom: 12,
            },
            h1: {
              fontSize: 22,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 12,
            },
            h2: {
              fontSize: 20,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 10,
            },
            h3: {
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            },
            ul: {
              marginLeft: 12,
              marginBottom: 12,
            },
            ol: {
              marginLeft: 12,
              marginBottom: 12,
            },
            li: {
              marginBottom: 8,
            },
            code: {
              backgroundColor: colors.backgroundLight,
              padding: 4,
              borderRadius: 4,
              fontFamily: 'monospace',
            },
            pre: {
              backgroundColor: colors.backgroundLight,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            },
            blockquote: {
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              paddingLeft: 12,
              fontStyle: 'italic',
              marginBottom: 12,
            },
            a: {
              color: colors.primary,
              textDecorationLine: 'underline',
            },
          }}
        />
      </View>
    );
  };

  // Render Video Type
  const renderVideo = () => {
    if (!mediaKey) return null;

    return (
      <View style={styles.videoContainer}>
        <Video
          ref={(ref) => setVideoRef(ref)}
          source={{ uri: mediaKey }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish && onComplete) {
                onComplete();
              }
            }
          }}
        />
      </View>
    );
  };

  // Render Audio Type
  const renderAudio = () => {
    if (!mediaKey) return null;

    const playAudio = async () => {
      try {
        setLoading(true);
        if (soundRef) {
          await soundRef.unloadAsync();
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaKey },
          { shouldPlay: true }
        );
        
        setSoundRef(sound);
        setIsPlaying(true);
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish && onComplete) {
              onComplete();
            }
          }
        });
      } catch (error) {
        console.error('Error playing audio:', error);
      } finally {
        setLoading(false);
      }
    };

    const pauseAudio = async () => {
      if (soundRef) {
        await soundRef.pauseAsync();
        setIsPlaying(false);
      }
    };

    return (
      <View style={styles.audioContainer}>
        <View style={styles.audioPlayer}>
          <TouchableOpacity
            style={styles.audioButton}
            onPress={isPlaying ? pauseAudio : playAudio}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={scale(32)}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioTitle}>{title}</Text>
            <Text style={styles.audioSubtitle}>
              {isPlaying ? 'Đang phát...' : 'Nhấn để phát'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Document Type
  const renderDocument = () => {
    if (!mediaKey) return null;

    return (
      <View style={styles.documentContainer}>
        <View style={styles.documentCard}>
          <Ionicons name="document-text" size={scale(48)} color={colors.primary} />
          <Text style={styles.documentTitle}>{title}</Text>
          <TouchableOpacity style={styles.documentButton}>
            <Ionicons name="download" size={scale(18)} color="#FFFFFF" />
            <Text style={styles.documentButtonText}>Tải xuống tài liệu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main Render based on lecture type
  const renderLectureByType = () => {
    switch (lectureType) {
      case 1: // Content
        return renderContent();
      case 2: // Video
        return (
          <>
            {renderVideo()}
            {renderContent()}
          </>
        );
      case 3: // Audio
        return (
          <>
            {renderAudio()}
            {renderContent()}
          </>
        );
      case 4: // Document
        return (
          <>
            {renderDocument()}
            {renderContent()}
          </>
        );
      case 5: // Interactive
        return renderContent();
      default:
        return renderContent();
    }
  };

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {renderLectureByType()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
  },
  contentContainer: {
    padding: scale(20),
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  audioContainer: {
    padding: scale(20),
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  audioButton: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  audioSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  documentContainer: {
    padding: scale(20),
  },
  documentCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: scale(16),
    padding: scale(24),
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: scale(8),
    gap: 8,
  },
  documentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContentText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: verticalScale(40),
    fontStyle: 'italic',
  },
  markdownText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },
});

export default LectureContent;
