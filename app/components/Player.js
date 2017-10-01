import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Text,
    TouchableNativeFeedback
} from 'react-native';
import RNAudioStreamer from 'react-native-audio-streamer';
import MusicControl from 'react-native-music-control';

export default class Player extends React.Component {
    render() {
        return (
            <View style={styles.container}>

            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        height: 270,
        margin: 20,
        // borderWidth: 1,
        borderRadius: 2,
        elevation: 10,
        backgroundColor: 'white'
    },
    image: {
        flex: 0.7,
        resizeMode: 'cover',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2
    },
    textContainer: {
        flex: 0.3,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16
    }
});