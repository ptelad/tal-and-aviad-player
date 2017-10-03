import React from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    FlatList
} from 'react-native';
import { parseString } from 'react-native-xml2js';
import ItemCard from './components/ItemCard';
import Player from './components/Player';
import RNAudioStreamer from 'react-native-audio-streamer';

export default class TalAndAviad extends React.Component {
    state = {
        dataLoaded: false,
        data: null,
        url: ''
    };

    async componentDidMount() {
        let response = await fetch('http://eco99fm.maariv.co.il/onair/talAndAviadXml.aspx');
        let xml = await response.text();
        parseString(xml, (err, result) => {
            if (err) {
                console.error(err);
            } else {
                console.log(result.Segments.Segment);
                this.setState({
                    dataLoaded: true,
                    data: result.Segments.Segment
                })
            }
        })
    }

    _renderItem({item, index}) {
        return <ItemCard
            key={index}
            image={item.RecordedProgramsImg[0]}
            title={item.RecordedProgramsName[0]}
            url={item.RecordedProgramsDownloadFile[0]}
            onPress={this._playItem.bind(this)}
        />
    }

    _playItem(url) {
        console.log('will play: ', url);
        RNAudioStreamer.setUrl(url);
        RNAudioStreamer.play();
    }

    render() {
        if (!this.state.dataLoaded) {
            return (
                <View style={styles.container}>
                    <ActivityIndicator/>
                </View>
            )
        }

        return (
            <View style={styles.container}>
                <FlatList
                    syle={styles.list}
                    data={this.state.data}
                    renderItem={this._renderItem.bind(this)}
                />
                <Player/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    list: {
        flex: 1
    }
});

AppRegistry.registerComponent('TalAndAviad', () => TalAndAviad);