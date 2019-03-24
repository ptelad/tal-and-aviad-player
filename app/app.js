import React from 'react';
import {
    AppRegistry,
    StyleSheet,
    View,
    ActivityIndicator,
    FlatList
} from 'react-native';
import { parseString } from 'react-native-xml2js';
import ItemCard from './components/ItemCard';
import Player from './components/Player';

export default class TalAndAviad extends React.Component {
    state = {
        dataLoaded: false,
        data: null,
        refresh: false
    };

    componentDidMount() {
        this._fetchData();
    }

    async _fetchData() {
        this.setState({refresh: true});
        let response = await fetch('http://eco99fm.maariv.co.il/onair/talAndAviadXml.aspx');
        let xml = await response.text();
        parseString(xml, (err, result) => {
            if (err) {
                console.error(err);
            } else {
                console.log(result.Segments.Segment);
                this.setState({
                    dataLoaded: true,
                    refresh: false,
                    data: result.Segments.Segment
                })
            }
        });
    }

    _renderItem({item, index}) {
        return <ItemCard
            image={item.RecordedProgramsImg[0]}
            title={item.RecordedProgramsName[0]}
            url={/(.*\.mp3)/.exec(item.RecordedProgramsDownloadFile[0])[1]}
            onPress={this._playItem.bind(this)}
        />
    }

    _playItem(segment) {
        this.player && this.player.playSegment(segment);
    }

    _playerRef(p) {
        if (p) {
            this.player = p;
        }
    }

    render() {
        if (!this.state.dataLoaded) {
            return (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#E91E63"/>
                </View>
            );
        }


        return (
            <View style={styles.container}>
                <FlatList
                    syle={styles.list}
                    data={this.state.data}
                    keyExtractor={item => item.Pid[0]}
                    renderItem={this._renderItem.bind(this)}
                    refreshing={this.state.refresh}
                    onRefresh={this._fetchData.bind(this)}
                />
                <Player ref={this._playerRef.bind(this)}/>
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
