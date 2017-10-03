import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Text,
    TouchableOpacity
} from 'react-native';
import RNAudioStreamer from 'react-native-audio-streamer';
import MusicControl from 'react-native-music-control';
import Icon from 'react-native-vector-icons/dist/FontAwesome';

export default class Player extends React.Component {
    render() {
        let icon = <Icon name="play" size={16} color="white"/>

        return (
            <View style={styles.container} pointerEvents='box-none'>
                <View style={styles.infoBox}>
                </View>
                <TouchableOpacity style={styles.playButton} onPress={() => {}}>
                    {icon}
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        height: 150,
        bottom: 0,
        right: 0,
        left: 0,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end'
    },
    infoBox: {
        height: 80,
        elevation: 10,        
        backgroundColor: 'white'        
    },
    playButton: {
        position: 'absolute',
        top: 35,
        left: 20,
        height: 70,
        width: 70,
        elevation: 15,        
        backgroundColor: '#E91E63',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 45
    }
});