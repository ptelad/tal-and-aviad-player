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
import AsyncLock from 'async-lock';
import Wakeful from 'react-native-wakeful';
const { AudioFocusManager, ExitApp }  = NativeModules;

const wakeful = new Wakeful();

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
const lock = new AsyncLock();

export default class Player extends React.Component {
    state = defaultState;

    constructor(props) {
        super(props);
        console.log('in ctor!!!');
    }

    componentDidMount() {
        console.log('in componentDidMount');
        DeviceEventEmitter.addListener('RNAudioStreamerStatusChanged', this._audioStatus.bind(this));
        DeviceEventEmitter.addListener('WiredHeadset', this._headphonePlugged.bind(this));
        DeviceEventEmitter.addListener('onAudioFocusChange', this._audioFocusChanged.bind(this));
        this.backSub = BackHandler.addEventListener('hardwareBackPress', this._backPressed.bind(this));
        MusicControl.enableControl('play', true);
        MusicControl.enableControl('pause', true);
        MusicControl.enableControl('nextTrack', true);
        MusicControl.enableControl('previousTrack', true);
        MusicControl.enableBackgroundMode(true);
        MusicControl.enableControl('closeNotification', true, {when: 'always'});
        MusicControl.on('play', ()=> {
            this._playPausePressed();
        });
        MusicControl.on('pause', ()=> {
            RNAudioStreamer.pause();
        });
        MusicControl.on('closeNotification', async ()=> {
            await this._saveStateAndExit();
        });
        MusicControl.on('nextTrack', ()=> {
            this._jumpForward();
        });
        MusicControl.on('previousTrack', ()=> {
            this._jumpBackwards();
        });
        this._checkSavedStateAndLoad();
    }

    componentWillUnmount() {
        console.log('in componentWillUnmount');
        DeviceEventEmitter.removeAllListeners('RNAudioStreamerStatusChanged');
        DeviceEventEmitter.removeAllListeners('WiredHeadset');
        DeviceEventEmitter.removeAllListeners('onAudioFocusChange');
        this.backSub && this.backSub.remove();
        this.backSub = null;
        wakeful.release();
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }

    async _saveState() {
        if (this.segment) {
            await this._getCurrentTime();
            await AsyncStorage.setItem('saved', JSON.stringify(this.segment));
        }
    }

    async _saveStateAndExit() {
        if (this.segment) {
            await this._saveState();
            RNAudioStreamer.stop();
            MusicControl.resetNowPlaying();
        }
        wakeful.release();
        ExitApp.finish();
    }

    _jumpForward() {
        lock.acquire('seek', done => {
            RNAudioStreamer.currentTime((err, currentTime) => {
                if (!err) {
                    let seek = Math.min(currentTime + 10, this.state.duration);
                    RNAudioStreamer.seekToTime(seek);
                    this.setState({currTime: seek});
                }
                done();
            });
        });
    }

    _jumpBackwards() {
        lock.acquire('seek', done => {
            RNAudioStreamer.currentTime((err, currentTime) => {
                if (!err) {
                    let seek = Math.max(currentTime - 10, 0);
                    RNAudioStreamer.seekToTime(seek);
                    this.setState({currTime: seek});
                }
                done();
            });
        });
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
            // this.playSegment(savedSegemnt);
            // RNAudioStreamer.pause();
            savedSegemnt.currTime = Math.max(0, savedSegemnt.currTime - 5);
            // RNAudioStreamer.seekToTime(currTime);
            this.savedSagment = savedSegemnt;
            this.setState({
                status: 'STANDBY',
                nowPlaying: savedSegemnt.title,
                currTime: savedSegemnt.currTime,
                duration: savedSegemnt.duration
            });
        }
    }

    _headphonePlugged(data) {
        if (!data.isPlugged) {
            if (this.state.status === 'PLAYING') {
                RNAudioStreamer.pause();
            }
            this._saveState();
        }
    }

    _audioFocusChanged(data) {
        console.log('_audioFocusChanged: ', data);
        if (this.state.status === 'PLAYING' && !data.inFocus) {
            RNAudioStreamer.pause();
            this.pausedFromFocusLoss = true;
        } else if (this.state.status === 'PAUSED' && data.inFocus && this.pausedFromFocusLoss) {
            RNAudioStreamer.play();
            this.pausedFromFocusLoss = false;
        }
    }

    _audioStatus(status) {
        console.log(status);
        if (status === 'PLAYING') {
            if (!this.state.duration) {
                RNAudioStreamer.duration((err, duration) => {
                    console.log(duration);
                    this.setState({duration});
                    this.segment.duration = duration;
                })
            }
            if (this.state.status !== 'BUFFERING') {
                MusicControl.updatePlayback({
                    state: MusicControl.STATE_PLAYING
                });
            }
        } else if (status === 'PAUSED') {
            MusicControl.updatePlayback({
                state: MusicControl.STATE_PAUSED
            });
        } else if (status === 'FINISHED') {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
            this.segment = null;
            AsyncStorage.removeItem('saved');
            MusicControl.resetNowPlaying();
            this.setState(defaultState);
            wakeful.release();
        } else if (status === 'STOPPED' && this.state.status !== 'STOPPED') {
            RNAudioStreamer.setUrl(this.segment.url);
            RNAudioStreamer.seekToTime(this.state.currTime);
            RNAudioStreamer.play();
        }

        if (status !== 'ERROR') {
            this.setState({status});
        }
    }

    playSegment(segment, play = true) {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        this.segment = segment;
        RNAudioStreamer.setUrl(segment.url);
        if (play) {
            this.setState({
                ...defaultState,
                nowPlaying: segment.title,
                currTime: 0
            });
            RNAudioStreamer.play();
        }
        MusicControl.setNowPlaying({
            title: segment.title,
            artwork: segment.image,
            color: 0xE91E63,
            notificationIcon: 'ic_radio'
        });
        AudioFocusManager.startListening();
        this.timeInterval = setInterval(this._getCurrentTime.bind(this), 1000);
        wakeful.acquire();
    }

    async _getCurrentTime() {
        return new Promise(resolve => {
            RNAudioStreamer.currentTime((err, currentTime) => {
                if (err) {
                    console.log(err);
                } else {
                    this.segment.currTime = currentTime;
                    if (!this.seeking) {
                        this.setState({currTime: currentTime});
                        MusicControl.updatePlayback({
                            elapsedTime: currentTime
                        });
                    }
                }
                resolve();
            })
        })
    }

    _playPausePressed() {
        if (this.state.status === 'PLAYING') {
            RNAudioStreamer.pause();
        } else if (this.state.status === 'PAUSED') {
            RNAudioStreamer.play();
        } else if (this.state.status === 'STANDBY') {
            this.playSegment(this.savedSagment, false);
            RNAudioStreamer.seekToTime(this.savedSagment.currTime);
            RNAudioStreamer.play();
            this.savedSagment = null;
        } else if (this.state.status === 'ERROR') {
            RNAudioStreamer.currentTime((err, currentTime) => {
                if (!err) {
                    RNAudioStreamer.setUrl(this.segment.url);
                    RNAudioStreamer.seekToTime(currentTime);
                    RNAudioStreamer.play();
                }
            });
        }
    }

    _seekingComplete(value) {
        this.seeking = false;
        this.segment && RNAudioStreamer.seekToTime(value);
    }

    _seek(value) {
        value = Math.floor(value);
        this.seeking = true;
        this.setState({currTime: value});
        this.savedSagment && (this.savedSagment.currTime = value);
    }

    render() {
        let icon = null;
        if (this.state.status === 'PLAYING') {
            icon = <Icon name="pause" size={30} color={PINK}/>;
        } else if (this.state.status === 'PAUSED' || this.state.status === 'STANDBY') {
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
                    <TouchableOpacity style={styles.playButton} onPress={this._jumpBackwards.bind(this)}>
                        <Icon name="rewind" size={30} color={PINK}/>
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
                        <Text>-{secondsToTime(this.state.duration - this.state.currTime)}</Text>
                        <TouchableOpacity style={styles.playButton} onPress={this._jumpForward.bind(this)}>
                            <Icon name="fast-forward" size={30} color={PINK}/>
                        </TouchableOpacity>
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
    let minutesStr = ('0' + minutes).slice(-2);
    seconds = seconds % 60;
    let secondsStr = ('0' + seconds).slice(-2);

    if (minutes / 60 > 1) {
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        minutesStr = ('0' + minutes).slice(-2);
        return `${hours}:${minutesStr}:${secondsStr}`;
    }

    return `${minutesStr}:${secondsStr}`;
}
