import React from 'react';
import {
    StyleSheet,
    View,
    Slider,
    Text,
    TouchableOpacity,
    DeviceEventEmitter,
    ActivityIndicator,
    AsyncStorage,
    BackHandler,
    Alert,
    NativeModules
} from 'react-native';
import RNAudioStreamer from 'react-native-audio-streamer';
import MusicControl from 'react-native-music-control';
import Icon from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import RNExitApp from 'react-native-exit-app';
const { AudioFocusManager }  = NativeModules;

const statusMap = {
    PLAYING: MusicControl.STATE_PLAYING,
    PAUSED: MusicControl.STATE_PAUSED,
    BUFFERING: MusicControl.STATE_BUFFERING
};

const defaultState = {
    status: 'STOPPED',
    nowPlaying: '',
    duration: 0,
    currTime: 0
};

const PINK = '#E91E63';


export default class Player extends React.Component {
    state = defaultState;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        DeviceEventEmitter.addListener('RNAudioStreamerStatusChanged', this._audioStatus.bind(this));
        DeviceEventEmitter.addListener('WiredHeadset', this._headphonePlugged.bind(this));
        DeviceEventEmitter.addListener('onAudioFocusChange', this._audioFocusChanged.bind(this));
        BackHandler.addEventListener('hardwareBackPress', this._backPressed.bind(this));
        MusicControl.enableControl('play', true);
        MusicControl.enableControl('pause', true);
        MusicControl.enableBackgroundMode(true);
        MusicControl.enableControl('closeNotification', true, {when: 'always'});
        MusicControl.on('play', ()=> {
            RNAudioStreamer.play();
        });
        MusicControl.on('pause', ()=> {
            RNAudioStreamer.pause();
        });
        MusicControl.on('closeNotification', async ()=> {
            await this._saveStateAndExit();
        });
        this._checkSavedStateAndLoad();
    }

    componentWillUnmount() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }

    async _saveStateAndExit() {
        RNAudioStreamer.setUrl('');
        await AsyncStorage.setItem('saved', JSON.stringify(this.segment));
        MusicControl.resetNowPlaying();
        RNExitApp.exitApp();
    }

    _backPressed() {
        if (this.state.status === 'PLAYING') {
            Alert.alert(
                'בטוח לצאת?',
                'יציאה תפסיק את הנגינה',
                [
                    {text: 'בטל', onPress: () => {}},
                    {text: 'צא', onPress: () => {
                        this._saveStateAndExit();
                    }}
                ]
            );
        } else {
            this._saveStateAndExit();
        }

        return true;
    }

    async _checkSavedStateAndLoad() {
        let savedSegemnt = await AsyncStorage.getItem('saved');
        if (savedSegemnt) {
            savedSegemnt = JSON.parse(savedSegemnt);
            console.log('found saved state!!! ', savedSegemnt);
            this.playSegment(savedSegemnt);
            RNAudioStreamer.pause();
            let currTime = Math.max(0, savedSegemnt.currTime - 5);
            RNAudioStreamer.seekToTime(currTime);
            this.setState({
                currTime: currTime,
                duration: savedSegemnt.duration
            });
        }
    }

    _headphonePlugged(data) {
        if (this.state.status === 'PLAYING' && !data.isPlugged) {
            RNAudioStreamer.pause();
        }
    }

    _audioFocusChanged(data) {
        console.log('_audioFocusChanged: ', data);
        if (this.state.status === 'PLAYING' && !data.inFocus) {
            RNAudioStreamer.pause();
        } else if (this.state.status === 'PAUSED' && data.inFocus) {
            RNAudioStreamer.play();
        }
    }

    _audioStatus(status) {
        console.log(status);
        this.setState({status});
        if (status === 'PLAYING') {
            RNAudioStreamer.duration((err, duration) => {
                console.log(duration);
                this.setState({duration});
                this.segment.duration = duration;
            })
        }
        MusicControl.updatePlayback({
            state: statusMap[status]
        });
    }

    playSegment(segment) {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        this.segment = segment;
        RNAudioStreamer.setUrl(segment.url);
        this.setState({
            nowPlaying: segment.title,
            currTime: 0
        });
        RNAudioStreamer.play();
        MusicControl.setNowPlaying({
            title: segment.title,
            artwork: segment.image,
            color: 0xE91E63
        });
        AudioFocusManager.startListening();
        this.timeInterval = setInterval(() => {
            RNAudioStreamer.currentTime((err, currentTime) => {
                if (err) {
                    console.log(err);
                } else {
                    this.segment.currTime = currentTime;
                    if (!this.seeking) {
                        this.setState({currTime: currentTime});
                    }
                }
            })
        }, 1000);
    }

    _playPausePressed() {
        if (this.state.status === 'PLAYING') {
            RNAudioStreamer.pause();
        } else if (this.state.status === 'PAUSED') {
            RNAudioStreamer.play();
        }
    }

    _seekingComplete(value) {
        this.seeking = false;
        RNAudioStreamer.seekToTime(value);
    }

    _seek(value) {
        value = Math.floor(value);
        this.seeking = true;
        this.setState({currTime: value});
    }

    render() {
        let icon = null;
        if (this.state.status === 'PLAYING') {
            icon = <Icon name="pause" size={30} color={PINK}/>;
        } else if (this.state.status === 'PAUSED') {
            icon = <Icon name="play" size={30} color={PINK}/>;
        } else if (this.state.status === 'BUFFERING') {
            icon = <ActivityIndicator color={PINK}/>
        }

        return (
            <View style={styles.container}>
                <Text style={styles.title} lineNumber={1}>{this.state.nowPlaying}</Text>
                <View style={styles.playBox}>
                    <TouchableOpacity style={styles.playButton} onPress={this._playPausePressed.bind(this)}>
                        {icon}
                    </TouchableOpacity>
                    <View style={styles.slider}>
                        <Text>{secondsToTime(this.state.currTime)}</Text>
                        <Slider
                            style={{flex: 1}}
                            value={this.state.currTime}
                            maximumValue={this.state.duration}
                            onSlidingComplete={this._seekingComplete.bind(this)}
                            onValueChange={this._seek.bind(this)}
                            minimumTrackTintColor={PINK}
                            maximumTrackTintColor={PINK}
                            thumbTintColor={PINK}
                        />
                        <Text>{secondsToTime(this.state.duration)}</Text>
                    </View>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        // position: 'absolute',
        height: 100,
        // bottom: 0,
        // right: 0,
        // left: 0,
        elevation: 10,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    title: {
        flex: 1
    },
    playBox: {
        height: 50,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center'
    },
    playButton: {
        height: 50,
        width: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    slider: {
        flex: 1,
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center'
    }
});

function secondsToTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    minutes = ('0' + minutes).slice(-2);
    seconds = seconds % 60;
    seconds = ('0' + seconds).slice(-2);

    return `${minutes}:${seconds}`;
}